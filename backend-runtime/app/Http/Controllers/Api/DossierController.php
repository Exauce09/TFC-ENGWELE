<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Diagnostic;
use App\Models\DossierMedical;
use App\Models\EpisodeSoin;
use App\Models\Medecin;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DossierController extends Controller
{
    private const WITH = ['medecin.user', 'departement', 'diagnostics', 'prescriptions', 'ouvertPar:id,name', 'episode'];

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
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail dossier',
            'data' => $dossier,
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
        $q = $request->get('q', '');
        $patients = Patient::with('user:id,name,email,phone')
            ->when($q, fn ($query) => $query->where('numero_patient', 'like', "%{$q}%")
                ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")))
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Patients',
            'data' => $patients,
        ]);
    }
}
