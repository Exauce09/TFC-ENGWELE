<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('numero_patient', 20)->unique()->nullable();
            $table->date('date_naissance')->nullable();
            $table->enum('sexe', ['M', 'F']);
            $table->text('adresse')->nullable();
            $table->string('commune', 100)->nullable();
            $table->string('quartier', 100)->nullable();
            $table->enum('groupe_sanguin', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])->nullable();
            $table->text('allergies')->nullable();
            $table->text('antecedents_medicaux')->nullable();
            $table->text('antecedents_familiaux')->nullable();
            $table->string('mutuelle', 100)->nullable();
            $table->string('numero_mutuelle', 50)->nullable();
            $table->string('contact_urgence_nom', 100)->nullable();
            $table->string('contact_urgence_tel', 25)->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
