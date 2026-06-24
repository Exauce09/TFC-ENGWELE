<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use App\Models\StockMedicament;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PharmacieController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $stockBas = StockMedicament::whereColumn('quantite_stock', '<=', 'seuil_alerte')->count();

        return response()->json([
            'success' => true,
            'message' => 'Dashboard pharmacie',
            'data' => [
                'medicaments_total' => StockMedicament::count(),
                'stock_bas' => $stockBas,
                'ordonnances_actives' => Prescription::where('statut', 'active')->count(),
                'ordonnances_delivrees' => Prescription::where('statut', 'delivree')->count(),
            ],
        ]);
    }

    public function stock(Request $request): JsonResponse
    {
        $query = StockMedicament::query()
            ->when($request->q, fn ($q, $s) => $q->where('nom', 'like', "%{$s}%")->orWhere('dci', 'like', "%{$s}%"))
            ->when($request->alerte, fn ($q) => $q->whereColumn('quantite_stock', '<=', 'seuil_alerte'))
            ->orderBy('nom');

        $items = $query->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Stock medicaments',
            'data' => $items->items(),
            'meta' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
            ],
        ]);
    }

    public function storeStock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:200',
            'dci' => 'nullable|string|max:200',
            'forme' => 'nullable|string|max:100',
            'dosage' => 'nullable|string|max:100',
            'fabricant' => 'nullable|string|max:100',
            'numero_lot' => 'nullable|string|max:100',
            'date_expiration' => 'nullable|date',
            'quantite_stock' => 'required|integer|min:0',
            'seuil_alerte' => 'nullable|integer|min:0',
            'prix_unitaire' => 'nullable|numeric|min:0',
            'categorie' => 'nullable|string|max:100',
        ]);

        $med = StockMedicament::create([
            ...$validated,
            'seuil_alerte' => $validated['seuil_alerte'] ?? 10,
            'ordonnance_requise' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Medicament ajoute au stock',
            'data' => $med,
        ], 201);
    }

    public function updateStock(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'quantite_stock' => 'sometimes|integer|min:0',
            'seuil_alerte' => 'sometimes|integer|min:0',
            'prix_unitaire' => 'nullable|numeric|min:0',
        ]);

        $med = StockMedicament::findOrFail($id);
        $med->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Stock mis a jour',
            'data' => $med,
        ]);
    }

    public function ordonnances(): JsonResponse
    {
        $items = Prescription::with(['patient.user', 'medecin.user'])
            ->whereIn('statut', ['active', 'delivree'])
            ->latest('date_prescription')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Ordonnances',
            'data' => $items->items(),
            'meta' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
            ],
        ]);
    }

    public function delivrer(int $id): JsonResponse
    {
        $prescription = Prescription::where('statut', 'active')->findOrFail($id);
        $prescription->update(['statut' => 'delivree']);

        foreach ($prescription->medicaments ?? [] as $med) {
            $stock = StockMedicament::where('nom', 'like', '%'.$med['nom'].'%')->first();
            if ($stock && $stock->quantite_stock > 0) {
                $stock->decrement('quantite_stock');
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Ordonnance delivree',
            'data' => $prescription->load(['patient.user', 'medecin.user']),
        ]);
    }
}
