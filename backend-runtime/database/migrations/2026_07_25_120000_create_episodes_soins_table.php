<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('episodes_soins', function (Blueprint $table): void {
            $table->id();
            $table->string('numero_episode', 30)->unique();
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('enregistre_par')->nullable()->constrained('users');
            $table->foreignId('triage_par')->nullable()->constrained('users');
            $table->foreignId('medecin_id')->nullable()->constrained('medecins');
            $table->foreignId('dossier_id')->nullable()->constrained('dossiers_medicaux');
            $table->foreignId('departement_id')->nullable()->constrained('departements');

            // Étape actuelle du parcours d'arrivée
            $table->enum('etape', [
                'enregistrement',
                'triage',
                'consultation',
                'examens',
                'decision',
                'ambulatoire',
                'hospitalisation',
                'sorti',
                'suivi_post_sortie',
                'termine',
            ])->default('enregistrement');

            $table->string('motif_arrivee', 255)->nullable();
            $table->enum('mode_arrivee', ['walk_in', 'rdv', 'urgence', 'transfert'])->default('walk_in');

            // Triage
            $table->enum('niveau_urgence', ['critique', 'urgent', 'moins_urgent', 'non_urgent'])->nullable();
            $table->text('notes_triage')->nullable();
            $table->timestamp('triage_at')->nullable();

            // Décision médicale
            $table->enum('circuit', ['ambulatoire', 'hospitalisation'])->nullable();
            $table->text('decision_medicale')->nullable();
            $table->timestamp('decision_at')->nullable();

            // Hospitalisation
            $table->string('service_hospitalisation', 100)->nullable();
            $table->string('lit', 30)->nullable();
            $table->timestamp('admission_at')->nullable();
            $table->timestamp('sortie_at')->nullable();

            // Suivi post-sortie
            $table->date('date_suivi_prevue')->nullable();
            $table->text('consignes_sortie')->nullable();

            $table->boolean('facturation_ouverte')->default(true);
            $table->text('observations')->nullable();
            $table->timestamps();

            $table->index(['etape', 'created_at']);
            $table->index(['patient_id', 'etape']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('episodes_soins');
    }
};
