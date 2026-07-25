<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('dossiers_medicaux', function (Blueprint $table): void {
            $table->dropForeign(['medecin_id']);
            $table->unsignedBigInteger('medecin_id')->nullable()->change();
            $table->foreign('medecin_id')->references('id')->on('medecins')->nullOnDelete();

            $table->foreignId('ouvert_par')->nullable()->after('patient_id')->constrained('users')->nullOnDelete();
            $table->string('numero_dossier', 30)->nullable()->unique()->after('id');
            $table->enum('statut', ['ouvert', 'en_consultation', 'clos'])->default('ouvert')->after('observations');
            $table->timestamp('ouvert_at')->nullable()->after('statut');
        });
    }

    public function down(): void
    {
        Schema::table('dossiers_medicaux', function (Blueprint $table): void {
            $table->dropForeign(['ouvert_par']);
            $table->dropColumn(['ouvert_par', 'numero_dossier', 'statut', 'ouvert_at']);
        });
    }
};
