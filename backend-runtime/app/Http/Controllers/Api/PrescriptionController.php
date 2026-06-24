<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medecin;
use App\Models\Patient;
use App\Models\Prescription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrescriptionController extends Controller
{
    public function mesPrescriptions(Request $request): JsonResponse
    {
        $patient = Patient::where('user_id', $request->user()->id)->firstOrFail();
        $items = Prescription::with(['medecin.user', 'dossier.departement'])
            ->where('patient_id', $patient->id)
            ->latest('date_prescription')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Prescriptions',
            'data' => $items->items(),
            'meta' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $medecin = Medecin::where('user_id', $request->user()->id)->firstOrFail();

        $validated = $request->validate([
            'dossier_id' => 'required|exists:dossiers_medicaux,id',
            'patient_id' => 'required|exists:patients,id',
            'date_prescription' => 'required|date',
            'date_expiration' => 'nullable|date|after:date_prescription',
            'medicaments' => 'required|array|min:1',
            'medicaments.*.nom' => 'required|string|max:150',
            'medicaments.*.dosage' => 'required|string|max:100',
            'medicaments.*.frequence' => 'required|string|max:100',
            'medicaments.*.duree' => 'required|string|max:100',
            'instructions_generales' => 'nullable|string',
            'renouvellement' => 'nullable|boolean',
        ]);

        $prescription = Prescription::create([
            ...$validated,
            'medecin_id' => $medecin->id,
            'statut' => 'active',
            'renouvellement' => $validated['renouvellement'] ?? false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Prescription enregistree',
            'data' => $prescription->load(['medecin.user']),
        ], 201);
    }
}
