<?php

use App\Services\StaffProfileService;
use Illuminate\Database\Migrations\Migration;

/**
 * Relie les utilisateurs métier existants à un département (users.departement_id).
 * Admin / directeur / patient / rôles transverses restent sans département si déjà null.
 */
return new class extends Migration {
    public function up(): void
    {
        StaffProfileService::backfillMissingDepartements();
    }

    public function down(): void
    {
        // Données métier : pas de rollback automatique.
    }
};
