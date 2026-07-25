<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalyseLaboratoire;
use App\Models\DossierMedical;
use App\Models\EpisodeSoin;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LaboratoireController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $uid = $request->user()->id;

        return response()->json([
            'success' => true,
            'message' => 'Dashboard laboratoire',
            'data' => [
                'en_attente' => AnalyseLaboratoire::where('statut', 'en_attente')->count(),
                'en_cours' => AnalyseLaboratoire::where('statut', 'en_cours')->count(),
                'disponibles' => AnalyseLaboratoire::where('statut', 'resultat_disponible')->count(),
                'mes_analyses' => AnalyseLaboratoire::where('laborantin_id', $uid)->count(),
                'patients_parcours' => EpisodeSoin::whereIn('etape', ['examens', 'consultation', 'decision', 'triage'])
                    ->whereNotNull('dossier_id')
                    ->count(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = AnalyseLaboratoire::with(['patient.user', 'dossier'])
            ->when($request->statut, fn ($q, $s) => $q->where('statut', $s))
            ->latest('date_prelevement');

        $items = $query->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Analyses laboratoire',
            'data' => $items->items(),
            'meta' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
            ],
        ]);
    }

    /**
     * Patients du parcours (ouverts à la réception) visibles au labo.
     * - Sans q : file des épisodes actifs (surtout examens) + dossiers ouverts récents
     * - Avec q : recherche sur tous les patients
     */
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

        // Patients issus du parcours réception (épisodes actifs liés à un dossier)
        $episodes = EpisodeSoin::with([
            'patient.user:id,name,phone',
            'dossier:id,numero_dossier,motif,statut,patient_id',
        ])
            ->whereNotNull('dossier_id')
            ->whereNotIn('etape', ['termine', 'sorti', 'suivi_post_sortie'])
            ->orderByRaw("CASE etape WHEN 'examens' THEN 1 WHEN 'consultation' THEN 2 WHEN 'decision' THEN 3 WHEN 'triage' THEN 4 ELSE 5 END")
            ->orderByDesc('created_at')
            ->limit(40)
            ->get();

        $data = $episodes->map(function (EpisodeSoin $ep) {
            $patient = $ep->patient;
            if (!$patient) {
                return null;
            }

            return [
                'id' => $patient->id,
                'numero_patient' => $patient->numero_patient,
                'user' => $patient->user,
                'episode_id' => $ep->id,
                'numero_episode' => $ep->numero_episode,
                'etape' => $ep->etape,
                'etape_label' => $ep->etape_label,
                'niveau_urgence' => $ep->niveau_urgence,
                'motif_arrivee' => $ep->motif_arrivee,
                'dossier_id' => $ep->dossier_id,
                'numero_dossier' => $ep->dossier?->numero_dossier,
                'priorite_examens' => $ep->etape === 'examens',
            ];
        })->filter()->values();

        return response()->json([
            'success' => true,
            'message' => 'Patients du parcours (créés / ouverts à la réception)',
            'data' => $data,
        ]);
    }

    /** File dédiée : patients orientés vers examens (étape 4). */
    public function fileExamens(): JsonResponse
    {
        $items = EpisodeSoin::with([
            'patient.user:id,name,phone',
            'dossier:id,numero_dossier,motif,statut',
            'medecin.user:id,name',
        ])
            ->where('etape', 'examens')
            ->orderByRaw("CASE niveau_urgence WHEN 'critique' THEN 1 WHEN 'urgent' THEN 2 WHEN 'moins_urgent' THEN 3 ELSE 4 END")
            ->orderBy('created_at')
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
            'patient_id' => 'required|exists:patients,id',
            'dossier_id' => 'nullable|exists:dossiers_medicaux,id',
            'episode_id' => 'nullable|exists:episodes_soins,id',
            'type_analyse' => 'required|string|max:100',
            'date_prelevement' => 'required|date',
            'urgent' => 'nullable|boolean',
        ]);

        $dossierId = $validated['dossier_id'] ?? null;

        if (!$dossierId && !empty($validated['episode_id'])) {
            $dossierId = EpisodeSoin::find($validated['episode_id'])?->dossier_id;
        }

        if (!$dossierId) {
            $dossierId = DossierMedical::where('patient_id', $validated['patient_id'])
                ->whereIn('statut', ['ouvert', 'en_consultation'])
                ->latest('ouvert_at')
                ->value('id');
        }

        $analyse = AnalyseLaboratoire::create([
            'patient_id' => $validated['patient_id'],
            'dossier_id' => $dossierId,
            'laborantin_id' => $request->user()->id,
            'type_analyse' => $validated['type_analyse'],
            'date_prelevement' => $validated['date_prelevement'],
            'statut' => 'en_attente',
            'urgent' => $validated['urgent'] ?? false,
        ]);

        if (!empty($validated['episode_id'])) {
            EpisodeSoin::where('id', $validated['episode_id'])
                ->where('etape', '!=', 'examens')
                ->update(['etape' => 'examens']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Analyse enregistrée et liée au dossier',
            'data' => $analyse->load(['patient.user', 'dossier']),
        ], 201);
    }

    public function publierResultat(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'resultats' => 'required|array',
            'interpretation' => 'nullable|string',
            'statut' => 'nullable|in:en_cours,resultat_disponible',
        ]);

        $analyse = AnalyseLaboratoire::findOrFail($id);
        $analyse->update([
            'resultats' => $validated['resultats'],
            'interpretation' => $validated['interpretation'] ?? null,
            'statut' => $validated['statut'] ?? 'resultat_disponible',
            'date_resultat' => now()->toDateString(),
        ]);

        // Retour médecin : si résultats dispo, avancer l'épisode lié vers décision
        if (($validated['statut'] ?? 'resultat_disponible') === 'resultat_disponible' && $analyse->dossier_id) {
            EpisodeSoin::where('dossier_id', $analyse->dossier_id)
                ->where('etape', 'examens')
                ->update(['etape' => 'decision']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Résultats publiés — retour médecin',
            'data' => $analyse->load(['patient.user', 'dossier']),
        ]);
    }
}
