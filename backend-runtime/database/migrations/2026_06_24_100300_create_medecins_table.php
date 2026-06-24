<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('medecins', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('departement_id')->constrained('departements');
            $table->string('numero_ordre', 50)->unique()->nullable();
            $table->string('specialite', 100);
            $table->string('grade', 100)->nullable();
            $table->text('diplomes')->nullable();
            $table->json('disponibilites')->nullable();
            $table->decimal('tarif_consultation', 10, 2)->nullable();
            $table->integer('duree_consultation')->default(30);
            $table->text('bio')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('user_id');
            $table->index('departement_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medecins');
    }
};
