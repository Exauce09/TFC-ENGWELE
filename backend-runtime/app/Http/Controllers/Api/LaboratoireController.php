<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalyseLaboratoire;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LaboratoireController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $uid = $request->user()->id;
        return response()->json([
            'success' => true,
            'message' => 'Dashboard laboratoire',
            'data' => [
                'en_attente' => AnalyseLaboratoire::where('statut', 'en_attente')->count(),
                'en_cours' => AnalyseLaboratoire::where('statut', 'en_cours')->count(),
                'disponibles' => AnalyseLaboratoire::where('statut', 'resultat_disponible')->count(),
                'mes_analyses' => AnalyseLaboratoire::where('laborantin_id', $uid)->count(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = AnalyseLaboratoire::with(['patient.user'])
            ->when($request->statut, fn ($q, $s) => $q->where('statut', $s))
            ->latest('date_prelevement');

        $items = $query->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Analyses laboratoire',
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
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'type_analyse' => 'required|string|max:100',
            'date_prelevement' => 'required|date',
            'urgent' => 'nullable|boolean',
        ]);

        $analyse = AnalyseLaboratoire::create([
            ...$validated,
            'laborantin_id' => $request->user()->id,
            'statut' => 'en_attente',
            'urgent' => $validated['urgent'] ?? false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Analyse enregistree',
            'data' => $analyse->load('patient.user'),
        ], 201);
    }

    public function publierResultat(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'resultats' => 'required|array',
            'interpretation' => 'nullable|string',
            'statut' => 'nullable|in:en_cours,resultat_disponible',
        ]);

        $analyse = AnalyseLaboratoire::findOrFail($id);
        $analyse->update([
            'resultats' => $validated['resultats'],
            'interpretation' => $validated['interpretation'] ?? null,
            'statut' => $validated['statut'] ?? 'resultat_disponible',
            'date_resultat' => now()->toDateString(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Resultats publies',
            'data' => $analyse->load('patient.user'),
        ]);
    }

    public function patients(Request $request): JsonResponse
    {
        $q = $request->get('q', '');
        $patients = Patient::with('user:id,name')
            ->when($q, fn ($query) => $query->where('numero_patient', 'like', "%{$q}%")
                ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")))
            ->limit(20)->get();

        return response()->json(['success' => true, 'message' => 'Patients', 'data' => $patients]);
    }
}
