<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\SeanceKinesitherapie;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KinesitherapieController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $uid = $request->user()->id;

        return response()->json([
            'success' => true,
            'message' => 'Dashboard kinesitherapie',
            'data' => [
                'total' => SeanceKinesitherapie::where('kinesitherapeute_id', $uid)->count(),
                'planifiees' => SeanceKinesitherapie::where('kinesitherapeute_id', $uid)->where('statut', 'planifiee')->count(),
                'realisees' => SeanceKinesitherapie::where('kinesitherapeute_id', $uid)->where('statut', 'realisee')->count(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $items = SeanceKinesitherapie::with(['patient.user'])
            ->where('kinesitherapeute_id', $request->user()->id)
            ->latest('date_seance')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Seances kinesitherapie',
            'data' => $items->items(),
            'meta' => ['total' => $items->total()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'date_seance' => 'required|date',
            'numero_seance' => 'nullable|integer|min:1',
            'total_seances' => 'nullable|integer|min:1',
            'techniques' => 'nullable|string',
            'observations' => 'nullable|string',
            'evolution' => 'nullable|in:amelioration,stable,deterioration',
            'statut' => 'nullable|in:planifiee,realisee,annulee',
        ]);

        $seance = SeanceKinesitherapie::create([
            ...$validated,
            'kinesitherapeute_id' => $request->user()->id,
            'statut' => $validated['statut'] ?? 'realisee',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Seance enregistree',
            'data' => $seance->load('patient.user'),
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
