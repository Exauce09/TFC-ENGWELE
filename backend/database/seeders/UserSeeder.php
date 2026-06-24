<?php

namespace Database\Seeders;

use App\Models\Departement;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@amen.cd'],
            [
                'name' => 'Admin Amen',
                'phone' => '+243000000001',
                'password' => Hash::make('Password@123'),
                'role' => 'admin',
                'is_active' => true,
            ]
        );

        $medDept = Departement::where('code', 'MED_GEN')->first();
        User::updateOrCreate(
            ['email' => 'medecin@amen.cd'],
            [
                'name' => 'Dr Medecin',
                'phone' => '+243000000002',
                'password' => Hash::make('Password@123'),
                'role' => 'medecin_generaliste',
                'departement_id' => $medDept?->id,
                'is_active' => true,
            ]
        );

        $patientUser = User::updateOrCreate(
            ['email' => 'patient@amen.cd'],
            [
                'name' => 'Patient Demo',
                'phone' => '+243000000003',
                'password' => Hash::make('Password@123'),
                'role' => 'patient',
                'is_active' => true,
            ]
        );

        Patient::updateOrCreate(
            ['user_id' => $patientUser->id],
            [
                'numero_patient' => 'PAT-00001',
                'date_naissance' => '1996-01-20',
                'sexe' => 'F',
                'commune' => 'Gombe',
            ]
        );
    }
}
