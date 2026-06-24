<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('demandes_rdv', function (Blueprint $table): void {
            $table->id();
            $table->string('nom', 100);
            $table->string('telephone', 25);
            $table->foreignId('departement_id')->nullable()->constrained('departements');
            $table->string('service_libelle', 150)->nullable();
            $table->date('date_souhaitee');
            $table->text('message')->nullable();
            $table->enum('statut', ['nouvelle', 'traitee', 'annulee'])->default('nouvelle');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demandes_rdv');
    }
};
