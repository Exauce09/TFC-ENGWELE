<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\RendezVous;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $patient = Patient::where('user_id', $request->user()->id)->first();
        $upcoming = $patient
            ? RendezVous::where('patient_id', $patient->id)->whereDate('date_rdv', '>=', now()->toDateString())->count()
            : 0;

        return response()->json([
            'success' => true,
            'message' => 'Dashboard patient',
            'data' => ['upcoming_rdv' => $upcoming],
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $q = $request->validate(['q' => 'required|string|min:2'])['q'];
        $results = Patient::with('user')
            ->where('numero_patient', 'like', "%{$q}%")
            ->orWhereHas('user', fn ($query) => $query->where('name', 'like', "%{$q}%"))
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Recherche patient',
            'data' => $results->items(),
            'meta' => [
                'total' => $results->total(),
                'per_page' => $results->perPage(),
                'current_page' => $results->currentPage(),
            ],
        ]);
    }
}
