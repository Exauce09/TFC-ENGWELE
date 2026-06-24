<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DossierMedical;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DossierController extends Controller
{
    public function monDossier(Request $request): JsonResponse
    {
        $patient = Patient::where('user_id', $request->user()->id)->firstOrFail();
        $dossiers = DossierMedical::where('patient_id', $patient->id)->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Dossier medical',
            'data' => $dossiers->items(),
            'meta' => [
                'total' => $dossiers->total(),
                'per_page' => $dossiers->perPage(),
                'current_page' => $dossiers->currentPage(),
            ],
        ]);
    }

    public function index(): JsonResponse
    {
        $dossiers = DossierMedical::latest()->paginate(15);

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
}
