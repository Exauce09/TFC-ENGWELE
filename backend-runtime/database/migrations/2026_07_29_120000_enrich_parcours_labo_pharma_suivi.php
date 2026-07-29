<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Enrichissement hôpital réel : labo (échantillon, priorite, résultats structurés),
 * pharmacie (lot, péremption, lignes délivrées), suivi (notes + résumé sortie).
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('examens_labo', function (Blueprint $table): void {
            if (! Schema::hasColumn('examens_labo', 'categorie')) {
                $table->string('categorie', 40)->default('biologie')->after('type_examen'); // biologie|imagerie|autre
            }
            if (! Schema::hasColumn('examens_labo', 'priorite')) {
                $table->string('priorite', 20)->default('routine')->after('urgent'); // routine|urgent|stat
            }
            if (! Schema::hasColumn('examens_labo', 'type_echantillon')) {
                $table->string('type_echantillon', 80)->nullable()->after('priorite');
            }
            if (! Schema::hasColumn('examens_labo', 'conditions_prelevement')) {
                $table->string('conditions_prelevement', 120)->nullable()->after('type_echantillon');
            }
            if (! Schema::hasColumn('examens_labo', 'numero_echantillon')) {
                $table->string('numero_echantillon', 60)->nullable()->after('conditions_prelevement');
            }
            if (! Schema::hasColumn('examens_labo', 'preleve_at')) {
                $table->timestamp('preleve_at')->nullable()->after('prescrit_at');
            }
            if (! Schema::hasColumn('examens_labo', 'recu_labo_at')) {
                $table->timestamp('recu_labo_at')->nullable()->after('preleve_at');
            }
            if (! Schema::hasColumn('examens_labo', 'technique')) {
                $table->string('technique', 120)->nullable()->after('interpretation');
            }
            if (! Schema::hasColumn('examens_labo', 'commentaire_medecin')) {
                $table->text('commentaire_medecin')->nullable()->after('technique');
            }
            if (! Schema::hasColumn('examens_labo', 'valide_par_medecin_at')) {
                $table->timestamp('valide_par_medecin_at')->nullable()->after('commentaire_medecin');
            }
        });

        Schema::table('parcours_prescriptions', function (Blueprint $table): void {
            if (! Schema::hasColumn('parcours_prescriptions', 'numero_ordonnance')) {
                $table->string('numero_ordonnance', 40)->nullable()->after('id');
            }
            if (! Schema::hasColumn('parcours_prescriptions', 'diagnostic_motif')) {
                $table->string('diagnostic_motif', 255)->nullable()->after('duree_jours');
            }
            if (! Schema::hasColumn('parcours_prescriptions', 'lignes_delivrance')) {
                $table->json('lignes_delivrance')->nullable()->after('medicaments');
            }
            if (! Schema::hasColumn('parcours_prescriptions', 'notes_pharmacien')) {
                $table->text('notes_pharmacien')->nullable()->after('delivree_at');
            }
            if (! Schema::hasColumn('parcours_prescriptions', 'allergies_signalees')) {
                $table->text('allergies_signalees')->nullable()->after('notes_pharmacien');
            }
        });

        Schema::table('admissions', function (Blueprint $table): void {
            if (! Schema::hasColumn('admissions', 'resume_sortie')) {
                $table->text('resume_sortie')->nullable()->after('consignes_sortie');
            }
            if (! Schema::hasColumn('admissions', 'rdv_suivi_id')) {
                $table->foreignId('rdv_suivi_id')->nullable()->after('date_suivi_prevue')
                    ->constrained('rendez_vous')->nullOnDelete();
            }
        });

        if (! Schema::hasTable('notes_suivi_ambulatoire')) {
            Schema::create('notes_suivi_ambulatoire', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
                $table->foreignId('auteur_id')->constrained('users')->cascadeOnDelete();
                $table->date('date_note');
                $table->text('evolution');
                $table->json('constantes')->nullable();
                $table->text('plan')->nullable();
                $table->timestamps();
                $table->index('admission_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('notes_suivi_ambulatoire');

        Schema::table('admissions', function (Blueprint $table): void {
            if (Schema::hasColumn('admissions', 'rdv_suivi_id')) {
                $table->dropConstrainedForeignId('rdv_suivi_id');
            }
            if (Schema::hasColumn('admissions', 'resume_sortie')) {
                $table->dropColumn('resume_sortie');
            }
        });

        Schema::table('parcours_prescriptions', function (Blueprint $table): void {
            foreach (['numero_ordonnance', 'diagnostic_motif', 'lignes_delivrance', 'notes_pharmacien', 'allergies_signalees'] as $col) {
                if (Schema::hasColumn('parcours_prescriptions', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('examens_labo', function (Blueprint $table): void {
            foreach ([
                'categorie', 'priorite', 'type_echantillon', 'conditions_prelevement', 'numero_echantillon',
                'preleve_at', 'recu_labo_at', 'technique', 'commentaire_medecin', 'valide_par_medecin_at',
            ] as $col) {
                if (Schema::hasColumn('examens_labo', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
