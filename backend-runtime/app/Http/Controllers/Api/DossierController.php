<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Diagnostic;
use App\Models\DossierMedical;
use App\Models\Medecin;
use App\Models\Patient;
use App\Models\Prescription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DossierController extends Controller
{
    private const WITH = ['medecin.user', 'departement', 'diagnostics', 'prescriptions'];

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
        $query = DossierMedical::with(['patient.user', 'departement', 'diagnostics']);

        if ($medecin) {
            $query->where('medecin_id', $medecin->id);
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        $dossiers = $query->latest('date_consultation')->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Liste des dossiers',
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

    public function store(Request $request): JsonResponse
    {
        $medecin = Medecin::where('user_id', $request->user()->id)->firstOrFail();

        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'departement_id' => 'required|exists:departements,id',
            'rendez_vous_id' => 'nullable|exists:rendez_vous,id',
            'date_consultation' => 'required|date',
            'motif' => 'required|string|max:500',
            'anamnese' => 'nullable|string',
            'examen_clinique' => 'nullable|string',
            'observations' => 'nullable|string',
            'diagnostic' => 'nullable|array',
            'diagnostic.libelle' => 'required_with:diagnostic|string|max:255',
            'diagnostic.code_cim10' => 'nullable|string|max:20',
            'diagnostic.description' => 'nullable|string',
        ]);

        $dossier = DossierMedical::create([
            'patient_id' => $validated['patient_id'],
            'medecin_id' => $medecin->id,
            'departement_id' => $validated['departement_id'],
            'rendez_vous_id' => $validated['rendez_vous_id'] ?? null,
            'date_consultation' => $validated['date_consultation'],
            'motif' => $validated['motif'],
            'anamnese' => $validated['anamnese'] ?? null,
            'examen_clinique' => $validated['examen_clinique'] ?? null,
            'observations' => $validated['observations'] ?? null,
        ]);

        if (!empty($validated['diagnostic']['libelle'])) {
            Diagnostic::create([
                'dossier_id' => $dossier->id,
                'medecin_id' => $medecin->id,
                'libelle' => $validated['diagnostic']['libelle'],
                'code_cim10' => $validated['diagnostic']['code_cim10'] ?? null,
                'description' => $validated['diagnostic']['description'] ?? null,
                'date_diagnostic' => $validated['date_consultation'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Dossier cree',
            'data' => $dossier->load(self::WITH),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $medecin = Medecin::where('user_id', $request->user()->id)->firstOrFail();
        $dossier = DossierMedical::where('medecin_id', $medecin->id)->findOrFail($id);

        $validated = $request->validate([
            'motif' => 'sometimes|string|max:500',
            'anamnese' => 'nullable|string',
            'examen_clinique' => 'nullable|string',
            'observations' => 'nullable|string',
        ]);

        $dossier->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Dossier mis a jour',
            'data' => $dossier->load(self::WITH),
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
