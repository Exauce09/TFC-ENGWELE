<?php

namespace Database\Seeders;

use App\Models\AnalyseLaboratoire;
use App\Models\Patient;
use App\Models\StockMedicament;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DepartementStaffSeeder extends Seeder
{
    public function run(): void
    {
        $laborantin = User::updateOrCreate(
            ['email' => 'laborantin@amen.cd'],
            [
                'name' => 'Laborantin Demo',
                'phone' => '+243000000005',
                'password' => Hash::make('Password@123'),
                'role' => 'laborantin',
                'is_active' => true,
            ]
        );

        $pharmacien = User::updateOrCreate(
            ['email' => 'pharmacien@amen.cd'],
            [
                'name' => 'Pharmacien Demo',
                'phone' => '+243000000006',
                'password' => Hash::make('Password@123'),
                'role' => 'pharmacien',
                'is_active' => true,
            ]
        );

        $patient = Patient::where('numero_patient', 'PAT-00001')->first();

        if ($patient) {
            AnalyseLaboratoire::updateOrCreate(
                ['patient_id' => $patient->id, 'type_analyse' => 'NFS - Numération formule sanguine'],
                [
                    'laborantin_id' => $laborantin->id,
                    'date_prelevement' => '2026-06-20',
                    'date_resultat' => '2026-06-21',
                    'statut' => 'resultat_disponible',
                    'resultats' => [
                        ['parametre' => 'Globules rouges', 'valeur' => '4.5 M/µL', 'norme' => '4.0-5.5'],
                        ['parametre' => 'Hémoglobine', 'valeur' => '13.2 g/dL', 'norme' => '12-16'],
                        ['parametre' => 'Leucocytes', 'valeur' => '7200 /µL', 'norme' => '4000-10000'],
                    ],
                    'interpretation' => 'Numération dans les normes. Pas d anomalie significative.',
                ]
            );

            AnalyseLaboratoire::updateOrCreate(
                ['patient_id' => $patient->id, 'type_analyse' => 'Glycémie à jeun'],
                [
                    'laborantin_id' => $laborantin->id,
                    'date_prelevement' => now()->toDateString(),
                    'statut' => 'en_attente',
                    'urgent' => false,
                ]
            );
        }

        $medicaments = [
            ['nom' => 'Amoxicilline', 'dci' => 'Amoxicilline', 'forme' => 'Comprimé', 'dosage' => '500mg', 'quantite_stock' => 120, 'seuil_alerte' => 20, 'prix_unitaire' => 2500, 'categorie' => 'Antibiotique'],
            ['nom' => 'Paracétamol', 'dci' => 'Paracétamol', 'forme' => 'Comprimé', 'dosage' => '1000mg', 'quantite_stock' => 8, 'seuil_alerte' => 15, 'prix_unitaire' => 500, 'categorie' => 'Antalgique'],
            ['nom' => 'Ibuprofène', 'dci' => 'Ibuprofène', 'forme' => 'Comprimé', 'dosage' => '400mg', 'quantite_stock' => 45, 'seuil_alerte' => 10, 'prix_unitaire' => 800, 'categorie' => 'Anti-inflammatoire'],
            ['nom' => 'Artéméther-Luméfantrine', 'dci' => 'Artéméther', 'forme' => 'Comprimé', 'dosage' => '20/120mg', 'quantite_stock' => 60, 'seuil_alerte' => 15, 'prix_unitaire' => 3500, 'categorie' => 'Antipaludéen'],
            ['nom' => 'Oméprazole', 'dci' => 'Oméprazole', 'forme' => 'Gélule', 'dosage' => '20mg', 'quantite_stock' => 5, 'seuil_alerte' => 10, 'prix_unitaire' => 1200, 'categorie' => 'Gastro'],
        ];

        foreach ($medicaments as $m) {
            StockMedicament::updateOrCreate(['nom' => $m['nom']], $m);
        }
    }
}
