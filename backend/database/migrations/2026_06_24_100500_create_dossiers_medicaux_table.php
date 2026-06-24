<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('dossiers_medicaux', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('medecin_id')->constrained('medecins');
            $table->foreignId('departement_id')->constrained('departements');
            $table->foreignId('rendez_vous_id')->nullable()->constrained('rendez_vous');
            $table->date('date_consultation');
            $table->text('motif')->nullable();
            $table->text('anamnese')->nullable();
            $table->text('examen_clinique')->nullable();
            $table->text('observations')->nullable();
            $table->timestamps();
            $table->index('patient_id');
            $table->index('medecin_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dossiers_medicaux');
    }
};
