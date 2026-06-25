<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\SuiviMaternite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaterniteController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $uid = $request->user()->id;

        return response()->json([
            'success' => true,
            'message' => 'Dashboard maternite',
            'data' => [
                'total_suivis' => SuiviMaternite::where('sage_femme_id', $uid)->count(),
                'prenatales' => SuiviMaternite::where('sage_femme_id', $uid)->where('type_visite', 'consultation_prenatale')->count(),
                'accouchements' => SuiviMaternite::where('sage_femme_id', $uid)->where('type_visite', 'accouchement')->count(),
                'postnatales' => SuiviMaternite::where('sage_femme_id', $uid)->where('type_visite', 'postnatal')->count(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $items = SuiviMaternite::with(['patient.user'])
            ->where('sage_femme_id', $request->user()->id)
            ->latest('created_at')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Suivis maternite',
            'data' => $items->items(),
            'meta' => ['total' => $items->total()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'type_visite' => 'required|in:consultation_prenatale,accouchement,postnatal',
            'grossesse_semaines' => 'nullable|integer|min:1|max:45',
            'poids_kg' => 'nullable|numeric',
            'tension_arterielle' => 'nullable|string|max:20',
            'hauteur_uterine_cm' => 'nullable|numeric',
            'observations' => 'nullable|string',
            'date_accouchement_prevue' => 'nullable|date',
        ]);

        $suivi = SuiviMaternite::create([
            ...$validated,
            'sage_femme_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Suivi enregistre',
            'data' => $suivi->load('patient.user'),
        ], 201);
    }

    public function patients(Request $request): JsonResponse
    {
        $q = $request->get('q', '');
        $patients = Patient::with('user:id,name')
            ->when($q, fn ($query) => $query->where('numero_patient', 'like', "%{$q}%")
                ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")))
            ->limit(30)->get();

        return response()->json(['success' => true, 'message' => 'Patients', 'data' => $patients]);
    }
}
