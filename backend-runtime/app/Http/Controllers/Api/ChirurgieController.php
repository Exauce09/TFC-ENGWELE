<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OperationChirurgicale;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChirurgieController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $uid = $request->user()->id;
        $query = OperationChirurgicale::query()
            ->where(function ($q) use ($uid) {
                $q->where('chirurgien_id', $uid)->orWhere('anesthesiste_id', $uid);
            });

        return response()->json([
            'success' => true,
            'message' => 'Dashboard chirurgie',
            'data' => [
                'total' => (clone $query)->count(),
                'planifiees' => (clone $query)->where('statut', 'planifiee')->count(),
                'en_cours' => (clone $query)->where('statut', 'en_cours')->count(),
                'realisees' => (clone $query)->where('statut', 'realisee')->count(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $uid = $request->user()->id;
        $items = OperationChirurgicale::with(['patient.user', 'chirurgien:id,name'])
            ->where(function ($q) use ($uid) {
                $q->where('chirurgien_id', $uid)->orWhere('anesthesiste_id', $uid);
            })
            ->latest('date_operation')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Operations chirurgicales',
            'data' => $items->items(),
            'meta' => ['total' => $items->total()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'date_operation' => 'required|date',
            'type_operation' => 'required|string|max:200',
            'type_anesthesie' => 'nullable|in:generale,locoreg,locale,sedation',
            'salle' => 'nullable|string|max:50',
            'statut' => 'nullable|in:planifiee,en_cours,realisee,annulee',
            'compte_rendu' => 'nullable|string',
        ]);

        $op = OperationChirurgicale::create([
            ...$validated,
            'chirurgien_id' => $request->user()->role === 'chirurgien' ? $request->user()->id : ($validated['chirurgien_id'] ?? $request->user()->id),
            'anesthesiste_id' => $request->user()->role === 'anesthesiste' ? $request->user()->id : null,
            'statut' => $validated['statut'] ?? 'planifiee',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Operation enregistree',
            'data' => $op->load('patient.user'),
        ], 201);
    }

    public function updateStatut(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'statut' => 'required|in:planifiee,en_cours,realisee,annulee',
        ]);

        $op = OperationChirurgicale::findOrFail($id);
        $op->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Statut mis a jour',
            'data' => $op,
        ]);
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
