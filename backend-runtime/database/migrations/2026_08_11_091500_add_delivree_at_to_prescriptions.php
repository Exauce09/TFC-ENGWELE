<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * prescriptions n'a pas de updated_at (timestamps partiels : created_at seul).
 * Ajoute delivree_at pour la délivrance pharmacie / stats du jour.
 */
return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('prescriptions')) {
            return;
        }

        Schema::table('prescriptions', function (Blueprint $table): void {
            if (! Schema::hasColumn('prescriptions', 'delivree_at')) {
                $table->timestamp('delivree_at')->nullable()->after('statut');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('prescriptions') || ! Schema::hasColumn('prescriptions', 'delivree_at')) {
            return;
        }

        Schema::table('prescriptions', function (Blueprint $table): void {
            $table->dropColumn('delivree_at');
        });
    }
};
