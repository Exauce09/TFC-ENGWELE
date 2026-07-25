<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module Parcours Patient — tables centrées sur l'admission.
 * Statuts : enregistre, triage, consultation, examens_labo, diagnostic,
 * pharmacie_ambulatoire, hospitalisation, sortie, suivi_post_sortie.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('admissions', function (Blueprint $table): void {
            $table->id();
            $table->string('numero_admission', 30)->unique();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('departement_id')->nullable()->constrained('departements')->nullOnDelete();
            $table->foreignId('enregistre_par')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('medecin_referent_id')->nullable()->constrained('medecins')->nullOnDelete();

            $table->enum('statut', [
                'enregistre',
                'triage',
                'consultation',
                'examens_labo',
                'diagnostic',
                'pharmacie_ambulatoire',
                'hospitalisation',
                'sortie',
                'suivi_post_sortie',
            ])->default('enregistre');

            $table->enum('mode_arrivee', ['walk_in', 'rdv', 'urgence', 'transfert'])->default('walk_in');
            $table->string('motif_arrivee', 255);
            $table->enum('circuit', ['ambulatoire', 'hospitalisation'])->nullable();
            $table->text('observations')->nullable();
            $table->timestamp('arrivee_at')->useCurrent();
            $table->timestamp('sortie_at')->nullable();
            $table->date('date_suivi_prevue')->nullable();
            $table->text('consignes_sortie')->nullable();
            $table->boolean('facturation_ouverte')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['statut', 'created_at']);
            $table->index(['patient_id', 'statut']);
        });

        Schema::create('admission_statut_historique', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
            $table->string('statut_avant', 40)->nullable();
            $table->string('statut_apres', 40);
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('role_acteur', 50)->nullable();
            $table->text('commentaire')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['admission_id', 'created_at']);
        });

        Schema::create('triages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
            $table->foreignId('infirmier_id')->constrained('users');
            $table->enum('niveau_urgence', ['critique', 'urgent', 'moins_urgent', 'non_urgent']);
            $table->decimal('temperature', 4, 1)->nullable();
            $table->string('tension_arterielle', 20)->nullable();
            $table->unsignedSmallInteger('frequence_cardiaque')->nullable();
            $table->unsignedSmallInteger('frequence_respiratoire')->nullable();
            $table->unsignedTinyInteger('saturation_02')->nullable();
            $table->decimal('glycemie', 5, 2)->nullable();
            $table->decimal('poids_kg', 5, 2)->nullable();
            $table->decimal('taille_cm', 5, 1)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('triage_at')->useCurrent();
            $table->timestamps();

            $table->unique('admission_id');
        });

        Schema::create('consultations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
            $table->foreignId('medecin_id')->constrained('medecins');
            $table->dateTime('date_consultation')->useCurrent();
            $table->text('motif')->nullable();
            $table->text('anamnese')->nullable();
            $table->text('examen_clinique')->nullable();
            $table->text('diagnostic_provisoire')->nullable();
            $table->text('diagnostic_final')->nullable();
            $table->string('code_cim10', 20)->nullable();
            $table->text('decision')->nullable();
            $table->enum('type_diagnostic', ['provisoire', 'final'])->default('provisoire');
            $table->text('observations')->nullable();
            $table->timestamps();

            $table->index('admission_id');
        });

        Schema::create('examens_labo', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
            $table->foreignId('prescrit_par')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('laborantin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type_examen', 120);
            $table->text('indication')->nullable();
            $table->enum('statut', ['prescrit', 'en_cours', 'termine', 'annule'])->default('prescrit');
            $table->boolean('urgent')->default(false);
            $table->json('resultats')->nullable();
            $table->text('interpretation')->nullable();
            $table->timestamp('prescrit_at')->useCurrent();
            $table->timestamp('termine_at')->nullable();
            $table->timestamps();

            $table->index(['admission_id', 'statut']);
        });

        Schema::create('parcours_prescriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
            $table->foreignId('medecin_id')->constrained('medecins');
            $table->foreignId('pharmacien_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('date_prescription');
            $table->json('medicaments');
            $table->text('posologie_generale')->nullable();
            $table->unsignedSmallInteger('duree_jours')->nullable();
            $table->enum('statut', ['active', 'delivree', 'annulee'])->default('active');
            $table->timestamp('delivree_at')->nullable();
            $table->timestamps();

            $table->index(['admission_id', 'statut']);
        });

        Schema::create('hospitalisations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
            $table->foreignId('medecin_id')->nullable()->constrained('medecins')->nullOnDelete();
            $table->foreignId('service_id')->nullable()->constrained('departements')->nullOnDelete();
            $table->string('service_libelle', 120)->nullable();
            $table->string('lit', 40)->nullable();
            $table->string('chambre', 40)->nullable();
            $table->enum('statut', ['admise', 'en_cours', 'sortie'])->default('admise');
            $table->timestamp('date_entree')->useCurrent();
            $table->timestamp('date_sortie')->nullable();
            $table->text('motif_admission')->nullable();
            $table->text('diagnostic_entree')->nullable();
            $table->text('resume_sortie')->nullable();
            $table->timestamps();

            $table->unique('admission_id');
        });

        Schema::create('notes_evolution', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hospitalisation_id')->constrained('hospitalisations')->cascadeOnDelete();
            $table->foreignId('auteur_id')->constrained('users');
            $table->date('date_note');
            $table->time('heure_note')->nullable();
            $table->enum('type', ['evolution', 'soin', 'visite_medecin', 'incident', 'autre'])->default('evolution');
            $table->text('contenu');
            $table->json('constantes')->nullable();
            $table->timestamps();

            $table->index(['hospitalisation_id', 'date_note']);
        });

        Schema::create('facture_lignes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();
            $table->foreignId('admission_id')->nullable()->constrained('admissions')->nullOnDelete();
            $table->string('etape', 40)->nullable();
            $table->string('acte_code', 40)->nullable();
            $table->string('description', 255);
            $table->unsignedInteger('quantite')->default(1);
            $table->decimal('prix_unitaire', 12, 2);
            $table->decimal('montant', 12, 2);
            $table->timestamps();

            $table->index(['admission_id', 'etape']);
        });

        Schema::table('factures', function (Blueprint $table): void {
            if (!Schema::hasColumn('factures', 'admission_id')) {
                $table->foreignId('admission_id')->nullable()->after('patient_id')->constrained('admissions')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('factures', function (Blueprint $table): void {
            if (Schema::hasColumn('factures', 'admission_id')) {
                $table->dropConstrainedForeignId('admission_id');
            }
        });

        Schema::dropIfExists('facture_lignes');
        Schema::dropIfExists('notes_evolution');
        Schema::dropIfExists('hospitalisations');
        Schema::dropIfExists('parcours_prescriptions');
        Schema::dropIfExists('examens_labo');
        Schema::dropIfExists('consultations');
        Schema::dropIfExists('triages');
        Schema::dropIfExists('admission_statut_historique');
        Schema::dropIfExists('admissions');
    }
};
