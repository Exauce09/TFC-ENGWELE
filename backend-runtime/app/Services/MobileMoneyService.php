<?php

namespace App\Services;

use App\Models\RendezVous;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MobileMoneyService
{
    public function initierPaiement(RendezVous $rdv, string $mode, string $phone, float $montant): array
    {
        if (!in_array($mode, ['airtel_money', 'mpesa'], true)) {
            throw new \InvalidArgumentException('Mode de paiement invalide');
        }

        $reference = 'AMEN-'.strtoupper(Str::random(10));

        if (config('integrations.mobile_money.mock_mode', true)) {
            Log::info('[Mobile Money mock]', compact('mode', 'phone', 'montant', 'reference'));

            $rdv->update([
                'montant' => $montant,
                'paiement_mode' => $mode,
                'paiement_statut' => 'paye',
            ]);

            return [
                'success' => true,
                'mock' => true,
                'reference' => $reference,
                'statut' => 'confirme',
                'message' => 'Paiement simule avec succes (mode demo).',
            ];
        }

        return [
            'success' => false,
            'reference' => $reference,
            'statut' => 'en_attente',
            'message' => 'Integration production non configuree.',
        ];
    }

    public function initierPaiementFacture(\App\Models\Facture $facture, string $mode, string $phone, float $montant): array
    {
        if (!in_array($mode, ['airtel_money', 'mpesa'], true)) {
            throw new \InvalidArgumentException('Mode de paiement invalide');
        }

        $reference = 'AMEN-FAC-'.strtoupper(Str::random(8));

        if (!config('integrations.mobile_money.mock_mode', true)) {
            return [
                'success' => false,
                'reference' => $reference,
                'statut' => 'en_attente',
                'message' => 'Integration production non configuree.',
            ];
        }

        Log::info('[Mobile Money facture mock]', compact('mode', 'phone', 'montant', 'reference'));

        \App\Models\Paiement::create([
            'facture_id' => $facture->id,
            'patient_id' => $facture->patient_id,
            'caissier_id' => null,
            'montant' => $montant,
            'mode_paiement' => $mode,
            'reference_transaction' => $reference,
            'date_paiement' => now(),
            'statut' => 'confirme',
            'notes' => "Mobile Money {$phone}",
        ]);

        $newPaid = (float) $facture->montant_paye + $montant;
        $reste = max(0, (float) $facture->montant_total - $newPaid);

        $facture->update([
            'montant_paye' => $newPaid,
            'reste_a_payer' => $reste,
            'statut' => $reste <= 0 ? 'payee' : 'partiellement_payee',
        ]);

        return [
            'success' => true,
            'mock' => true,
            'reference' => $reference,
            'statut' => 'confirme',
            'message' => 'Paiement simule avec succes (mode demo).',
        ];
    }
}
