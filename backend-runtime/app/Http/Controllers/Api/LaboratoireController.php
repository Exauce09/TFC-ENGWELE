<?php

namespace App\Http\Controllers\Api;

use App\Enums\AdmissionStatut;
use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\ExamenLabo;
use App\Models\Patient;
use App\Services\Parcours\AdmissionStateMachine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Laboratoire branché sur le parcours Admission (examens_labo),
 * avec données hôpital : priorité, échantillon, résultats structurés.
 */
class LaboratoireController extends Controller
{
    public function __construct(
        private readonly AdmissionStateMachine $stateMachine,
    ) {}

    public function dashboard(Request $request): JsonResponse
    {
        $uid = $request->user()->id;

        return response()->json([
            'success' => true,
            'message' => 'Dashboard laboratoire',
            'data' => [
                'en_attente' => ExamenLabo::whereIn('statut', ['prescrit', 'en_cours'])->whereNull('resultats')->count(),
                'en_cours' => ExamenLabo::where('statut', 'en_cours')->count(),
                'disponibles' => ExamenLabo::where('statut', 'termine')->whereDate('termine_at', today())->count(),
                'mes_analyses' => ExamenLabo::where('laborantin_id', $uid)->count(),
                'file_admissions' => Admission::whereIn('statut', [
                    AdmissionStatut::Prelevement->value,
                    AdmissionStatut::ExamensLaboratoire->value,
                ])->count(),
                'urgents' => ExamenLabo::whereIn('statut', ['prescrit', 'en_cours'])
                    ->where(fn ($q) => $q->where('urgent', true)->orWhereIn('priorite', ['urgent', 'stat']))
                    ->count(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = ExamenLabo::with([
            'admission.patient.user:id,name,phone',
            'admission.departement:id,nom',
            'prescritPar:id,name',
            'laborantin:id,name',
        ])
            ->when($request->statut, fn ($q, $s) => $q->where('statut', $s))
            ->when($request->priorite, fn ($q, $p) => $q->where('priorite', $p))
            ->latest('prescrit_at');

        $items = $query->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Examens laboratoire (parcours)',
            'data' => $items->items(),
            'meta' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
            ],
        ]);
    }

    public function patients(Request $request): JsonResponse
    {
        $q = trim((string) $request->get('q', ''));

        if ($q !== '') {
            $patients = Patient::with('user:id,name,phone')
                ->where(function ($query) use ($q) {
                    $query->where('numero_patient', 'like', "%{$q}%")
                        ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")
                            ->orWhere('phone', 'like', "%{$q}%"));
                })
                ->limit(30)
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Patients trouvés',
                'data' => $patients,
            ]);
        }

        $admissions = Admission::with([
            'patient.user:id,name,phone',
            'departement:id,nom',
            'examensLabo',
            'triage',
        ])
            ->whereIn('statut', [
                AdmissionStatut::Prelevement->value,
                AdmissionStatut::ExamensLaboratoire->value,
            ])
            ->orderByRaw("CASE WHEN EXISTS (
                SELECT 1 FROM examens_labo el
                WHERE el.admission_id = admissions.id AND (el.urgent = 1 OR el.priorite IN ('urgent','stat'))
            ) THEN 0 ELSE 1 END")
            ->latest('arrivee_at')
            ->limit(40)
            ->get();

        $data = $admissions->map(function (Admission $a) {
            $patient = $a->patient;
            if (! $patient) {
                return null;
            }

            return [
                'id' => $patient->id,
                'numero_patient' => $patient->numero_patient,
                'user' => $patient->user,
                'admission_id' => $a->id,
                'numero_admission' => $a->numero_admission,
                'statut' => $a->statut,
                'statut_label' => $a->statut_label,
                'motif_arrivee' => $a->motif_arrivee,
                'niveau_urgence' => $a->triage?->niveau_urgence ?? $a->niveau_urgence_accueil,
                'departement' => $a->departement?->nom,
                'examens' => $a->examensLabo,
                'priorite_examens' => true,
            ];
        })->filter()->values();

        return response()->json([
            'success' => true,
            'message' => 'Patients en file laboratoire (admissions)',
            'data' => $data,
        ]);
    }

    public function fileExamens(): JsonResponse
    {
        $items = ExamenLabo::with([
            'admission.patient.user:id,name,phone',
            'admission.departement:id,nom',
            'admission.triage',
            'prescritPar:id,name',
        ])
            ->whereIn('statut', ['prescrit', 'en_cours'])
            ->orderByRaw("CASE priorite WHEN 'stat' THEN 1 WHEN 'urgent' THEN 2 ELSE 3 END")
            ->orderBy('prescrit_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'File examens laboratoire',
            'data' => $items,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'admission_id' => 'required|exists:admissions,id',
            'type_examen' => 'required|string|max:120',
            'categorie' => 'nullable|in:biologie,imagerie,autre',
            'indication' => 'nullable|string',
            'priorite' => 'nullable|in:routine,urgent,stat',
            'type_echantillon' => 'nullable|string|max:80',
            'conditions_prelevement' => 'nullable|string|max:120',
            'urgent' => 'nullable|boolean',
        ]);

        $admission = Admission::findOrFail($validated['admission_id']);
        $priorite = $validated['priorite']
            ?? (($validated['urgent'] ?? false) ? 'urgent' : 'routine');

        $examen = ExamenLabo::create([
            'admission_id' => $admission->id,
            'prescrit_par' => null,
            'laborantin_id' => $request->user()->id,
            'type_examen' => $validated['type_examen'],
            'categorie' => $validated['categorie'] ?? 'biologie',
            'indication' => $validated['indication'] ?? null,
            'priorite' => $priorite,
            'urgent' => $priorite !== 'routine',
            'type_echantillon' => $validated['type_echantillon'] ?? null,
            'conditions_prelevement' => $validated['conditions_prelevement'] ?? null,
            'statut' => 'en_cours',
            'prescrit_at' => now(),
            'recu_labo_at' => now(),
            'numero_echantillon' => 'ECH-'.now()->format('YmdHis').'-'.$admission->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Analyse enregistrée sur le parcours admission',
            'data' => $examen->load(['admission.patient.user', 'laborantin']),
        ], 201);
    }

    public function publierResultat(Request $request, int $id): JsonResponse
    {
        $payload = $request->all();
        if (isset($payload['resultats']) && is_array($payload['resultats'])) {
            $payload['resultats'] = array_map(static function ($ligne) {
                foreach (['ref_min', 'ref_max'] as $key) {
                    if (! array_key_exists($key, $ligne)) {
                        continue;
                    }
                    if ($ligne[$key] === '' || $ligne[$key] === null) {
                        $ligne[$key] = null;
                    } elseif (is_numeric($ligne[$key])) {
                        $ligne[$key] = $ligne[$key] + 0;
                    }
                }

                return $ligne;
            }, $payload['resultats']);
            $request->merge($payload);
        }

        $validated = $request->validate([
            'resultats' => 'required|array|min:1',
            'resultats.*.parametre' => 'required|string',
            'resultats.*.valeur' => 'nullable|string',
            'resultats.*.unite' => 'nullable|string',
            'resultats.*.norme' => 'nullable|string',
            'resultats.*.ref_min' => 'nullable|numeric',
            'resultats.*.ref_max' => 'nullable|numeric',
            'resultats.*.flag' => 'nullable|in:N,H,L,critique',
            'interpretation' => 'nullable|string',
            'technique' => 'nullable|string|max:120',
            'statut' => 'nullable|in:en_cours,termine',
        ]);

        $examen = ExamenLabo::with('admission')->findOrFail($id);

        try {
            DB::transaction(function () use ($request, $examen, $validated) {
                $statut = $validated['statut'] ?? 'termine';
                $examen->update([
                    'resultats' => $validated['resultats'],
                    'interpretation' => $validated['interpretation'] ?? null,
                    'technique' => $validated['technique'] ?? null,
                    'statut' => $statut,
                    'laborantin_id' => $request->user()->id,
                    'recu_labo_at' => $examen->recu_labo_at ?? now(),
                    'termine_at' => $statut === 'termine' ? now() : null,
                ]);

                $admission = $examen->admission;
                if ($admission && $statut === 'termine'
                    && $admission->statut === AdmissionStatut::Prelevement->value) {
                    $pending = $admission->examensLabo()
                        ->whereNotIn('statut', ['termine', 'annule'])
                        ->exists();
                    if (! $pending) {
                        $this->stateMachine->transition(
                            $admission,
                            AdmissionStatut::ExamensLaboratoire,
                            $request->user(),
                            'Résultats labo disponibles'
                        );
                    }
                }
            });
        } catch (InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Résultats publiés — visibles dans le dossier médecin',
            'data' => $examen->fresh(['admission.patient.user', 'laborantin', 'prescritPar']),
        ]);
    }
}
