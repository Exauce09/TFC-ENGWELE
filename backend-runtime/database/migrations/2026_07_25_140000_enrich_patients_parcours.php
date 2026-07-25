<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Enrichit la fiche patient (identité / urgence / assurance)
 * pour le module Parcours Patient.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table): void {
            if (!Schema::hasColumn('patients', 'lieu_naissance')) {
                $table->string('lieu_naissance', 100)->nullable()->after('date_naissance');
            }
            if (!Schema::hasColumn('patients', 'nationalite')) {
                $table->string('nationalite', 80)->nullable()->after('lieu_naissance');
            }
            if (!Schema::hasColumn('patients', 'profession')) {
                $table->string('profession', 100)->nullable()->after('nationalite');
            }
            if (!Schema::hasColumn('patients', 'etat_civil')) {
                $table->enum('etat_civil', ['celibataire', 'marie', 'divorce', 'veuf', 'autre'])->nullable()->after('profession');
            }
            if (!Schema::hasColumn('patients', 'contact_urgence_lien')) {
                $table->string('contact_urgence_lien', 80)->nullable()->after('contact_urgence_tel');
            }
            if (!Schema::hasColumn('patients', 'assurance_type')) {
                $table->string('assurance_type', 100)->nullable()->after('numero_mutuelle');
            }
            if (!Schema::hasColumn('patients', 'assurance_numero')) {
                $table->string('assurance_numero', 80)->nullable()->after('assurance_type');
            }
            if (!Schema::hasColumn('patients', 'assurance_expire_le')) {
                $table->date('assurance_expire_le')->nullable()->after('assurance_numero');
            }
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table): void {
            $cols = [
                'lieu_naissance', 'nationalite', 'profession', 'etat_civil',
                'contact_urgence_lien', 'assurance_type', 'assurance_numero', 'assurance_expire_le',
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('patients', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
