<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\Paiement;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CaisseController extends Controller
{
    public function mesFactures(Request $request): JsonResponse
    {
        $patient = Patient::where('user_id', $request->user()->id)->firstOrFail();
        $factures = Facture::where('patient_id', $patient->id)->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Factures patient',
            'data' => $factures->items(),
            'meta' => [
                'total' => $factures->total(),
                'per_page' => $factures->perPage(),
                'current_page' => $factures->currentPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'rendez_vous_id' => 'nullable|exists:rendez_vous,id',
            'lignes' => 'required|array|min:1',
            'lignes.*.description' => 'required|string',
            'lignes.*.quantite' => 'required|numeric|min:1',
            'lignes.*.prix_unitaire' => 'required|numeric|min:0',
            'remise' => 'nullable|numeric|min:0',
        ]);

        $sousTotal = collect($validated['lignes'])->sum(
            fn ($line) => ((float) $line['quantite']) * ((float) $line['prix_unitaire'])
        );
        $remise = (float) ($validated['remise'] ?? 0);
        $total = max(0, $sousTotal - $remise);

        $facture = Facture::create([
            'numero_facture' => 'FAC-'.now()->format('Y').'-'.Str::padLeft((string) random_int(1, 99999), 5, '0'),
            'patient_id' => $validated['patient_id'],
            'rendez_vous_id' => $validated['rendez_vous_id'] ?? null,
            'caissier_id' => $request->user()->id,
            'date_facture' => now()->toDateString(),
            'lignes' => $validated['lignes'],
            'sous_total' => $sousTotal,
            'remise' => $remise,
            'montant_total' => $total,
            'montant_paye' => 0,
            'reste_a_payer' => $total,
            'statut' => 'emise',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Facture creee',
            'data' => $facture,
        ], 201);
    }

    public function enregistrerPaiement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'facture_id' => 'required|exists:factures,id',
            'montant' => 'required|numeric|min:1',
            'mode_paiement' => 'required|in:cash,airtel_money,mpesa,virement',
            'reference_transaction' => 'nullable|string|max:100',
        ]);

        $facture = Facture::findOrFail($validated['facture_id']);

        $paiement = Paiement::create([
            'facture_id' => $facture->id,
            'patient_id' => $facture->patient_id,
            'caissier_id' => $request->user()->id,
            'montant' => $validated['montant'],
            'mode_paiement' => $validated['mode_paiement'],
            'reference_transaction' => $validated['reference_transaction'] ?? null,
            'date_paiement' => now(),
            'statut' => 'confirme',
        ]);

        $newPaid = (float) $facture->montant_paye + (float) $validated['montant'];
        $reste = max(0, (float) $facture->montant_total - $newPaid);

        $facture->update([
            'montant_paye' => $newPaid,
            'reste_a_payer' => $reste,
            'statut' => $reste <= 0 ? 'payee' : 'partiellement_payee',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Paiement enregistre',
            'data' => $paiement,
        ], 201);
    }
}
