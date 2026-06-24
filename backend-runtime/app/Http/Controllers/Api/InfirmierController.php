<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\SoinInfirmier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InfirmierController extends Controller
{
    public function patients(Request $request): JsonResponse
    {
        $q = $request->get('q', '');
        $patients = Patient::with('user:id,name')
            ->when($q, fn ($query) => $query->where('numero_patient', 'like', "%{$q}%")
                ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")))
            ->limit(30)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Patients',
            'data' => $patients,
        ]);
    }

    public function constantes(Request $request): JsonResponse
    {
        $query = SoinInfirmier::with(['patient.user', 'infirmier:id,name'])
            ->latest('date_soin');

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        $items = $query->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Constantes vitales',
            'data' => $items->items(),
            'meta' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
            ],
        ]);
    }

    public function enregistrerConstantes(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'dossier_id' => 'nullable|exists:dossiers_medicaux,id',
            'date_soin' => 'nullable|date',
            'temperature' => 'nullable|numeric|min:30|max:45',
            'tension_arterielle' => 'nullable|string|max:20',
            'frequence_cardiaque' => 'nullable|integer|min:30|max:220',
            'frequence_respiratoire' => 'nullable|integer|min:5|max:60',
            'saturation_02' => 'nullable|integer|min:50|max:100',
            'glycemie' => 'nullable|numeric|min:0|max:30',
            'poids_kg' => 'nullable|numeric|min:1|max:300',
            'actes_realises' => 'nullable|string',
            'observations' => 'nullable|string',
        ]);

        $soin = SoinInfirmier::create([
            ...$validated,
            'infirmier_id' => $request->user()->id,
            'date_soin' => $validated['date_soin'] ?? now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Constantes enregistrees',
            'data' => $soin->load(['patient.user', 'infirmier:id,name']),
        ], 201);
    }
}
