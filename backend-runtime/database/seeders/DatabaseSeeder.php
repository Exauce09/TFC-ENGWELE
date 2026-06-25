<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            DepartementSeeder::class,
            UserSeeder::class,
            MedecinSeeder::class,
            DossierSeeder::class,
            DepartementStaffSeeder::class,
            IntegrationSeeder::class,
            SpecialitesSeeder::class,
            FactureSeeder::class,
        ]);
    }
}
