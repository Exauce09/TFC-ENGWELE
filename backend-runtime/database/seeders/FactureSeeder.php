<?php

namespace Database\Seeders;

use App\Models\Facture;
use App\Models\Patient;
use App\Models\Paiement;
use App\Models\RendezVous;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class FactureSeeder extends Seeder
{
    public function run(): void
    {
        $caissier = User::updateOrCreate(
            ['email' => 'caissier@amen.cd'],
            [
                'name' => 'Caissier Demo',
                'phone' => '+243000000007',
                'password' => Hash::make('Password@123'),
                'role' => 'caissier',
                'is_active' => true,
            ]
        );

        $patient = Patient::where('numero_patient', 'PAT-00001')->first();
        if (!$patient) {
            return;
        }

        $rdvTele = RendezVous::where('patient_id', $patient->id)
            ->where('type', 'teleconsultation')
            ->first();

        $facturePayee = Facture::updateOrCreate(
            ['numero_facture' => 'FAC-2026-00001'],
            [
                'patient_id' => $patient->id,
                'rendez_vous_id' => null,
                'caissier_id' => $caissier->id,
                'date_facture' => '2026-06-15',
                'lignes' => [
                    ['description' => 'Consultation Medecine generale', 'quantite' => 1, 'prix_unitaire' => 25000],
                    ['description' => 'Frais administratifs', 'quantite' => 1, 'prix_unitaire' => 5000],
                ],
                'sous_total' => 30000,
                'remise' => 5000,
                'montant_total' => 25000,
                'montant_paye' => 25000,
                'reste_a_payer' => 0,
                'statut' => 'payee',
            ]
        );

        Paiement::updateOrCreate(
            ['facture_id' => $facturePayee->id, 'reference_transaction' => 'CASH-DEMO-001'],
            [
                'patient_id' => $patient->id,
                'caissier_id' => $caissier->id,
                'montant' => 25000,
                'mode_paiement' => 'cash',
                'date_paiement' => '2026-06-15 10:30:00',
                'statut' => 'confirme',
            ]
        );

        $factureImpayee = Facture::updateOrCreate(
            ['numero_facture' => 'FAC-2026-00002'],
            [
                'patient_id' => $patient->id,
                'rendez_vous_id' => null,
                'caissier_id' => $caissier->id,
                'date_facture' => now()->toDateString(),
                'lignes' => [
                    ['description' => 'NFS - Numération formule sanguine', 'quantite' => 1, 'prix_unitaire' => 35000],
                    ['description' => 'Glycémie à jeun', 'quantite' => 1, 'prix_unitaire' => 15000],
                    ['description' => 'Consultation laboratoire', 'quantite' => 1, 'prix_unitaire' => 10000],
                ],
                'sous_total' => 60000,
                'remise' => 0,
                'montant_total' => 60000,
                'montant_paye' => 0,
                'reste_a_payer' => 60000,
                'statut' => 'emise',
            ]
        );

        $facturePartielle = Facture::updateOrCreate(
            ['numero_facture' => 'FAC-2026-00003'],
            [
                'patient_id' => $patient->id,
                'rendez_vous_id' => $rdvTele?->id,
                'caissier_id' => $caissier->id,
                'date_facture' => now()->subDays(2)->toDateString(),
                'lignes' => [
                    ['description' => 'Teleconsultation', 'quantite' => 1, 'prix_unitaire' => 15000],
                ],
                'sous_total' => 15000,
                'remise' => 0,
                'montant_total' => 15000,
                'montant_paye' => 5000,
                'reste_a_payer' => 10000,
                'statut' => 'partiellement_payee',
            ]
        );

        Paiement::updateOrCreate(
            ['facture_id' => $facturePartielle->id, 'reference_transaction' => 'MPESA-DEMO-002'],
            [
                'patient_id' => $patient->id,
                'caissier_id' => $caissier->id,
                'montant' => 5000,
                'mode_paiement' => 'mpesa',
                'date_paiement' => now()->subDays(2),
                'statut' => 'confirme',
            ]
        );

        if ($rdvTele && $rdvTele->paiement_statut === 'paye' && !Facture::where('rendez_vous_id', $rdvTele->id)->exists()) {
            $seq = Facture::max('id') + 1;
            $numero = 'FAC-'.now()->format('Y').'-'.Str::padLeft((string) $seq, 5, '0');
            Facture::create([
                'numero_facture' => $numero,
                'patient_id' => $patient->id,
                'rendez_vous_id' => $rdvTele->id,
                'caissier_id' => $caissier->id,
                'date_facture' => $rdvTele->date_rdv,
                'lignes' => [['description' => 'Teleconsultation', 'quantite' => 1, 'prix_unitaire' => 15000]],
                'sous_total' => 15000,
                'remise' => 0,
                'montant_total' => 15000,
                'montant_paye' => 15000,
                'reste_a_payer' => 0,
                'statut' => 'payee',
            ]);
        }
    }
}
