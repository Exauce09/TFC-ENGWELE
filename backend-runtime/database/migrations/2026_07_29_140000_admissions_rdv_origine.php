<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('admissions', function (Blueprint $table): void {
            if (! Schema::hasColumn('admissions', 'rdv_id')) {
                $table->foreignId('rdv_id')
                    ->nullable()
                    ->after('patient_id')
                    ->constrained('rendez_vous')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('admissions', function (Blueprint $table): void {
            if (Schema::hasColumn('admissions', 'rdv_id')) {
                $table->dropConstrainedForeignId('rdv_id');
            }
        });
    }
};
