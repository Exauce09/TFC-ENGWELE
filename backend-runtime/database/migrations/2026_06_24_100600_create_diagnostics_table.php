<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('diagnostics', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('dossier_id')->constrained('dossiers_medicaux');
            $table->foreignId('medecin_id')->constrained('medecins');
            $table->string('code_cim10', 20)->nullable();
            $table->string('libelle', 255);
            $table->text('description')->nullable();
            $table->enum('type', ['principal', 'associe', 'differentiel'])->default('principal');
            $table->date('date_diagnostic');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnostics');
    }
};
