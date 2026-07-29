<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('prescriptions', function (Blueprint $table): void {
            $table->string('numero_ordonnance', 40)->nullable()->unique()->after('id');
            $table->text('diagnostic_motif')->nullable()->after('medicaments');
            $table->unsignedSmallInteger('validite_jours')->default(30)->after('date_expiration');
            $table->decimal('poids_kg', 5, 2)->nullable()->after('validite_jours');
        });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table): void {
            $table->dropColumn(['numero_ordonnance', 'diagnostic_motif', 'validite_jours', 'poids_kg']);
        });
    }
};
