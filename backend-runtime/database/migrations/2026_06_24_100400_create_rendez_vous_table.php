<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rendez_vous', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('medecin_id')->constrained('medecins');
            $table->foreignId('departement_id')->constrained('departements');
            $table->date('date_rdv');
            $table->time('heure_rdv');
            $table->time('heure_fin')->nullable();
            $table->text('motif')->nullable();
            $table->enum('statut', ['en_attente', 'confirme', 'en_cours', 'termine', 'annule', 'absent'])->default('en_attente');
            $table->enum('type', ['presentiel', 'teleconsultation'])->default('presentiel');
            $table->string('lien_video')->nullable();
            $table->enum('priorite', ['normal', 'urgent', 'tres_urgent'])->default('normal');
            $table->text('notes_rdv')->nullable();
            $table->decimal('montant', 10, 2)->nullable();
            $table->enum('paiement_statut', ['non_paye', 'paye', 'rembourse'])->default('non_paye');
            $table->enum('paiement_mode', ['cash', 'airtel_money', 'mpesa'])->nullable();
            $table->boolean('rappel_24h_envoye')->default(false);
            $table->boolean('rappel_1h_envoye')->default(false);
            $table->foreignId('cree_par')->nullable()->constrained('users');
            $table->timestamps();
            $table->index('patient_id');
            $table->index('medecin_id');
            $table->index('date_rdv');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rendez_vous');
    }
};
