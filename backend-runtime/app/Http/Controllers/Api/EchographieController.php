<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\ResultatEchographie;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EchographieController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $uid = $request->user()->id;

        return response()->json([
            'success' => true,
            'message' => 'Dashboard echographie',
            'data' => [
                'total' => ResultatEchographie::where('echographiste_id', $uid)->count(),
                'en_attente' => ResultatEchographie::where('echographiste_id', $uid)->where('statut', 'en_attente')->count(),
                'termines' => ResultatEchographie::where('echographiste_id', $uid)->where('statut', 'termine')->count(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $items = ResultatEchographie::with(['patient.user'])
            ->where('echographiste_id', $request->user()->id)
            ->latest('date_examen')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Examens echographiques',
            'data' => $items->items(),
            'meta' => ['total' => $items->total()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'date_examen' => 'required|date',
            'type_echo' => 'nullable|string|max:100',
            'organe_examine' => 'nullable|string|max:100',
            'compte_rendu' => 'required|string',
            'conclusion' => 'nullable|string',
            'statut' => 'nullable|in:en_attente,termine',
        ]);

        $examen = ResultatEchographie::create([
            ...$validated,
            'echographiste_id' => $request->user()->id,
            'statut' => $validated['statut'] ?? 'termine',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Examen enregistre',
            'data' => $examen->load('patient.user'),
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
