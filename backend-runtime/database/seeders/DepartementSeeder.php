<?php

namespace Database\Seeders;

use App\Models\Departement;
use Illuminate\Database\Seeder;

class DepartementSeeder extends Seeder
{
    public function run(): void
    {
        $departements = [
            ['nom' => 'Maternite', 'code' => 'MAT'],
            ['nom' => 'Laboratoire', 'code' => 'LAB'],
            ['nom' => 'Echographie', 'code' => 'ECH'],
            ['nom' => 'Kinesitherapie', 'code' => 'KIN'],
            ['nom' => 'Medecine interne', 'code' => 'MED_INT'],
            ['nom' => 'Medecine generale', 'code' => 'MED_GEN'],
            ['nom' => 'Gynecologie obstetrique', 'code' => 'GYN'],
            ['nom' => 'Pharmacie interne', 'code' => 'PHARM'],
            ['nom' => 'Pediatrie', 'code' => 'PED'],
            ['nom' => 'Chirurgie', 'code' => 'CHIR'],
            ['nom' => 'Ophtalmologie', 'code' => 'OPHT'],
            ['nom' => 'Dentisterie', 'code' => 'DENT'],
            ['nom' => 'Urgence medicale', 'code' => 'URG'],
        ];

        foreach ($departements as $departement) {
            Departement::updateOrCreate(['code' => $departement['code']], $departement);
        }
    }
}
