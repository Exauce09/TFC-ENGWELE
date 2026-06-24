<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('prescriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('dossier_id')->constrained('dossiers_medicaux');
            $table->foreignId('medecin_id')->constrained('medecins');
            $table->foreignId('patient_id')->constrained('patients');
            $table->date('date_prescription');
            $table->date('date_expiration')->nullable();
            $table->json('medicaments');
            $table->text('instructions_generales')->nullable();
            $table->boolean('renouvellement')->default(false);
            $table->enum('statut', ['active', 'delivree', 'expiree', 'annulee'])->default('active');
            $table->timestamp('created_at')->useCurrent();
            $table->index('patient_id');
            $table->index('medecin_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
