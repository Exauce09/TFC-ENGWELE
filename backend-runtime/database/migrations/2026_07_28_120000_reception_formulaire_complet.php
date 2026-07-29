<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Formulaire d'accueil complet : identite, piece d'identite, photo,
 * informations administratives de la visite et triage rapide.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table): void {
            if (!Schema::hasColumn('patients', 'age_declare')) {
                $table->unsignedTinyInteger('age_declare')->nullable()->after('date_naissance');
            }
            if (!Schema::hasColumn('patients', 'ville')) {
                $table->string('ville', 80)->nullable()->after('commune');
            }
            if (!Schema::hasColumn('patients', 'piece_identite_type')) {
                $table->string('piece_identite_type', 40)->nullable()->after('profession');
            }
            if (!Schema::hasColumn('patients', 'piece_identite_numero')) {
                $table->string('piece_identite_numero', 60)->nullable()->after('piece_identite_type');
            }
            // Vignette encodee (data URL) : sert a eviter les doublons a l'accueil.
            if (!Schema::hasColumn('patients', 'photo')) {
                $table->text('photo')->nullable()->after('piece_identite_numero');
            }
        });

        Schema::table('admissions', function (Blueprint $table): void {
            if (!Schema::hasColumn('admissions', 'type_visite')) {
                $table->enum('type_visite', ['consultation', 'urgence', 'hospitalisation', 'suivi'])
                    ->default('consultation')->after('mode_arrivee');
            }
            if (!Schema::hasColumn('admissions', 'mode_paiement')) {
                $table->enum('mode_paiement', ['cash', 'assurance', 'mutuelle', 'employeur'])
                    ->default('cash')->after('type_visite');
            }
            // Triage rapide de l'accueil, distinct du triage infirmier.
            if (!Schema::hasColumn('admissions', 'niveau_urgence_accueil')) {
                $table->enum('niveau_urgence_accueil', ['leger', 'modere', 'urgent', 'critique'])
                    ->nullable()->after('mode_paiement');
            }
        });
    }

    public function down(): void
    {
        Schema::table('admissions', function (Blueprint $table): void {
            foreach (['type_visite', 'mode_paiement', 'niveau_urgence_accueil'] as $col) {
                if (Schema::hasColumn('admissions', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('patients', function (Blueprint $table): void {
            foreach (['age_declare', 'ville', 'piece_identite_type', 'piece_identite_numero', 'photo'] as $col) {
                if (Schema::hasColumn('patients', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
