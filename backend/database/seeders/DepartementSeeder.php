<?php

namespace Database\Seeders;

use App\Models\Departement;
use Illuminate\Database\Seeder;

/**
 * Miroir de backend-runtime — 6 services pour la présentation AMEN.
 */
class DepartementSeeder extends Seeder
{
    public const ACTIFS = [
        'MED_GEN',
        'URG',
        'PED',
        'MAT',
        'LAB',
        'PHARM',
    ];

    public function run(): void
    {
        $departements = [
            [
                'nom' => 'Médecine générale',
                'code' => 'MED_GEN',
                'description' => 'Consultations générales et orientation du parcours patient.',
                'is_active' => true,
            ],
            [
                'nom' => 'Urgences',
                'code' => 'URG',
                'description' => 'Prise en charge immédiate des cas urgents et critiques.',
                'is_active' => true,
            ],
            [
                'nom' => 'Pédiatrie',
                'code' => 'PED',
                'description' => 'Soins aux enfants, de la naissance à l’adolescence.',
                'is_active' => true,
            ],
            [
                'nom' => 'Maternité / Gynécologie',
                'code' => 'MAT',
                'description' => 'Suivi de grossesse, accouchement et santé de la femme.',
                'is_active' => true,
            ],
            [
                'nom' => 'Laboratoire',
                'code' => 'LAB',
                'description' => 'Analyses biologiques et examens de laboratoire.',
                'is_active' => true,
            ],
            [
                'nom' => 'Pharmacie',
                'code' => 'PHARM',
                'description' => 'Dispensation des médicaments sur ordonnance.',
                'is_active' => true,
            ],
        ];

        foreach ($departements as $departement) {
            Departement::updateOrCreate(
                ['code' => $departement['code']],
                $departement
            );
        }

        Departement::query()
            ->whereNotIn('code', self::ACTIFS)
            ->update(['is_active' => false]);
    }
}
