<?php

namespace Database\Seeders;

use App\Models\Departement;
use App\Models\Medecin;
use App\Models\User;
use Illuminate\Database\Seeder;

class MedecinSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'medecin@amen.cd')->first();
        $departement = Departement::where('code', 'MED_GEN')->first();

        if (!$user || !$departement) {
            return;
        }

        Medecin::updateOrCreate(
            ['user_id' => $user->id],
            [
                'departement_id' => $departement->id,
                'numero_ordre' => 'ORD-0001',
                'specialite' => 'Medecine generale',
                'grade' => 'Dr',
                'duree_consultation' => 30,
                'tarif_consultation' => 25000,
            ]
        );
    }
}
