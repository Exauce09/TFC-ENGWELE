<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\AnalyseLaboratoire;
use App\Models\Diagnostic;
use App\Models\DossierMedical;
use App\Models\EpisodeSoin;
use App\Models\ExamenLabo;
use App\Models\Medecin;
use App\Models\Patient;
use App\Models\Prescription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DossierController extends Controller
{
    private const WITH = ['medecin.user', 'departement', 'diagnostics', 'prescriptions.medecin.user', 'prescriptions.medecin.departement', 'ouvertPar:id,name', 'episode'];

    public function monDossier(Request $request): JsonResponse
    {
        $patient = Patient::where('user_id', $request->user()->id)->firstOrFail();
        $dossiers = DossierMedical::with(self::WITH)
            ->where('patient_id', $patient->id)
            ->latest('date_consultation')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Dossier medical',
            'data' => [
                'patient' => $patient->load('user:id,name,email,phone'),
                'consultations' => $dossiers->items(),
            ],
            'meta' => [
                'total' => $dossiers->total(),
                'per_page' => $dossiers->perPage(),
                'current_page' => $dossiers->currentPage(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $medecin = Medecin::where('user_id', $request->user()->id)->first();
        // Dossiers ouverts à la réception (à compléter) + ceux du médecin
        $query = DossierMedical::with(['patient.user', 'departement', 'diagnostics', 'ouvertPar:id,name', 'episode'])
            ->where(function ($q) use ($medecin) {
                $q->whereIn('statut', ['ouvert', 'en_consultation']);
                if ($medecin) {
                    $q->orWhere('medecin_id', $medecin->id);
                }
            });

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        $dossiers = $query->latest('date_consultation')->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Liste des dossiers (ouverts à la réception)',
            'data' => $dossiers->items(),
            'meta' => [
                'total' => $dossiers->total(),
                'per_page' => $dossiers->perPage(),
                'current_page' => $dossiers->currentPage(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $dossier = DossierMedical::with([
            ...self::WITH,
            'patient.user',
            'patient.admissionActive',
            'prescriptions.medecin.user',
            'prescriptions.medecin.departement',
        ])->findOrFail($id);

        $data = $dossier->toArray();
        $data['admission_active'] = $dossier->patient?->admissionActive;

        return response()->json([
            'success' => true,
            'message' => 'Detail dossier',
            'data' => $data,
        ]);
    }

    /**
     * Le médecin ne crée PAS le dossier — il complète celui ouvert par la réception.
     */
    public function store(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Seul l\'accueil / réception crée le patient et ouvre le dossier. Utilisez « Compléter la consultation » sur un dossier existant.',
        ], 403);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $medecin = Medecin::where('user_id', $request->user()->id)->firstOrFail();
        $dossier = DossierMedical::findOrFail($id);

        $validated = $request->validate([
            'motif' => 'sometimes|string|max:500',
            'anamnese' => 'nullable|string',
            'examen_clinique' => 'nullable|string',
            'observations' => 'nullable|string',
            'diagnostic' => 'nullable|array',
            'diagnostic.libelle' => 'required_with:diagnostic|string|max:255',
            'diagnostic.code_cim10' => 'nullable|string|max:20',
            'diagnostic.description' => 'nullable|string',
            'cloturer' => 'nullable|boolean',
        ]);

        $dossier->update([
            'medecin_id' => $medecin->id,
            'motif' => $validated['motif'] ?? $dossier->motif,
            'anamnese' => $validated['anamnese'] ?? $dossier->anamnese,
            'examen_clinique' => $validated['examen_clinique'] ?? $dossier->examen_clinique,
            'observations' => $validated['observations'] ?? $dossier->observations,
            'statut' => !empty($validated['cloturer']) ? 'clos' : 'en_consultation',
        ]);

        if (!empty($validated['diagnostic']['libelle'])) {
            Diagnostic::create([
                'dossier_id' => $dossier->id,
                'medecin_id' => $medecin->id,
                'libelle' => $validated['diagnostic']['libelle'],
                'code_cim10' => $validated['diagnostic']['code_cim10'] ?? null,
                'description' => $validated['diagnostic']['description'] ?? null,
                'date_diagnostic' => now()->toDateString(),
            ]);
        }

        // Lier l'épisode actif à ce médecin et avancer vers décision si encore en consultation
        $episode = EpisodeSoin::where('dossier_id', $dossier->id)
            ->whereNotIn('etape', ['termine', 'sorti', 'suivi_post_sortie'])
            ->latest()
            ->first();

        if ($episode) {
            $episode->update([
                'medecin_id' => $medecin->id,
                'etape' => in_array($episode->etape, ['consultation', 'examens'], true)
                    ? 'decision'
                    : $episode->etape,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Consultation enregistrée sur le dossier ouvert à la réception',
            'data' => $dossier->fresh(self::WITH),
        ]);
    }

    public function patients(Request $request): JsonResponse
    {
        $q = trim((string) $request->get('q', ''));

        $patients = Patient::with([
            'user:id,name,email,phone',
            'dossiers.medecin.user:id,name',
            'dossiers.departement:id,nom',
            'admissionActive.departement:id,nom',
            'admissionActive.medecinReferent.user:id,name',
        ])
            ->when($q !== '', fn ($query) => $query->where(
                fn ($sub) => $sub->where('numero_patient', 'like', "%{$q}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")
                        ->orWhere('phone', 'like', "%{$q}%"))
            ))
            ->orderByDesc('id')
            ->limit(30)
            ->get()
            ->map(function (Patient $patient) {
                $dossier = $patient->dossiers->first();
                $admission = $patient->admissionActive;

                return [
                    'id' => $patient->id,
                    'numero_patient' => $patient->numero_patient,
                    'date_naissance' => $patient->date_naissance?->toDateString(),
                    'sexe' => $patient->sexe,
                    'commune' => $patient->commune,
                    'allergies' => $patient->allergies,
                    'antecedents_medicaux' => $patient->antecedents_medicaux,
                    'photo' => $patient->photo,
                    'user' => $patient->user,
                    'nombre_dossiers' => $patient->dossiers->count(),
                    'dossier' => $dossier ? [
                        'id' => $dossier->id,
                        'numero_dossier' => $dossier->numero_dossier,
                        'statut' => $dossier->statut,
                        'motif' => $dossier->motif,
                        'date_consultation' => $dossier->date_consultation?->toDateString(),
                        'departement' => $dossier->departement?->nom,
                    ] : null,
                    'medecin_en_charge' => $admission?->medecinReferent?->user?->name
                        ?? $dossier?->medecin?->user?->name,
                    'admission_active' => $admission ? [
                        'id' => $admission->id,
                        'numero_admission' => $admission->numero_admission,
                        'statut' => $admission->statut,
                        'statut_label' => $admission->statut_label,
                        'departement' => $admission->departement?->nom,
                    ] : null,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Patients',
            'data' => $patients,
        ]);
    }

    /**
     * Dossier longitudinal d'un patient pour le médecin :
     * identité + photo, dernière visite, historique admissions,
     * consultations, examens (parcours + analyses), ordonnances, diagnostics.
     */
    public function showPatient(int $id): JsonResponse
    {
        $patient = Patient::with([
            'user:id,name,email,phone',
            'admissionActive.departement:id,nom',
            'admissionActive.medecinReferent.user:id,name',
            'admissionActive.triage',
        ])->findOrFail($id);

        $admissions = Admission::with([
            'departement:id,nom',
            'medecinReferent.user:id,name',
            'triage',
            'consultations.medecin.user:id,name',
            'examensLabo.prescritPar:id,name',
            'examensLabo.laborantin:id,name',
            'prescriptions.medecin.user:id,name',
        ])
            ->where('patient_id', $patient->id)
            ->latest('arrivee_at')
            ->limit(20)
            ->get();

        $dossiers = DossierMedical::with([
            'medecin.user:id,name',
            'departement:id,nom',
            'diagnostics',
            'prescriptions.medecin.user:id,name',
        ])
            ->where('patient_id', $patient->id)
            ->latest('date_consultation')
            ->limit(20)
            ->get();

        $examensParcours = ExamenLabo::with(['prescritPar:id,name', 'laborantin:id,name', 'admission:id,numero_admission,arrivee_at'])
            ->whereHas('admission', fn ($q) => $q->where('patient_id', $patient->id))
            ->latest('prescrit_at')
            ->limit(30)
            ->get();

        $analyses = AnalyseLaboratoire::with(['laborantin:id,name', 'dossier:id,numero_dossier'])
            ->where('patient_id', $patient->id)
            ->latest('date_prelevement')
            ->limit(30)
            ->get();

        $ordonnances = Prescription::with(['medecin.user:id,name', 'medecin.departement:id,nom', 'dossier:id,numero_dossier'])
            ->where('patient_id', $patient->id)
            ->latest('date_prescription')
            ->limit(20)
            ->get();

        $derniereVisite = $admissions->first();
        $derniersResultats = $examensParcours
            ->filter(fn ($e) => in_array($e->statut, ['termine', 'resultat_disponible'], true))
            ->take(5)
            ->values()
            ->concat(
                $analyses
                    ->filter(fn ($a) => in_array($a->statut, ['termine', 'resultat_disponible'], true))
                    ->take(5)
            )
            ->sortByDesc(fn ($e) => $e->termine_at ?? $e->date_resultat ?? $e->prescrit_at)
            ->take(8)
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Dossier patient complet',
            'data' => [
                'patient' => $patient,
                'derniere_visite' => $derniereVisite,
                'admissions' => $admissions,
                'consultations' => $dossiers,
                'examens' => $examensParcours,
                'analyses' => $analyses,
                'derniers_resultats' => $derniersResultats,
                'ordonnances' => $ordonnances,
            ],
        ]);
    }
}
