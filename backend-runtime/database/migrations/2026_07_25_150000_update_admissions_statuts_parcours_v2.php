<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Remappe les anciens codes statut vers le parcours patient v2.
 * (SQLite stocke déjà les enums Laravel en VARCHAR — pas de ALTER nécessaire.)
 */
return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('admissions')) {
            return;
        }

        $map = [
            'examens_labo' => 'examens_prescrits',
            'pharmacie_ambulatoire' => 'prescription_delivree',
            'hospitalisation' => 'hospitalise',
            'sortie' => 'sortie_ambulatoire',
        ];

        foreach ($map as $from => $to) {
            DB::table('admissions')->where('statut', $from)->update(['statut' => $to]);

            if (Schema::hasTable('admission_statut_historique')) {
                DB::table('admission_statut_historique')->where('statut_avant', $from)->update(['statut_avant' => $to]);
                DB::table('admission_statut_historique')->where('statut_apres', $from)->update(['statut_apres' => $to]);
            }
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('admissions')) {
            return;
        }

        $map = [
            'examens_prescrits' => 'examens_labo',
            'examens_en_cours' => 'examens_labo',
            'examens_termines' => 'examens_labo',
            'decision_therapeutique' => 'diagnostic',
            'prescription_delivree' => 'pharmacie_ambulatoire',
            'sortie_ambulatoire' => 'sortie',
            'hospitalise' => 'hospitalisation',
            'suivi_en_cours' => 'hospitalisation',
            'pret_pour_sortie' => 'hospitalisation',
            'sortie_hospitalisation' => 'sortie',
            'transfert' => 'sortie',
            'chirurgie' => 'hospitalisation',
        ];

        foreach ($map as $from => $to) {
            DB::table('admissions')->where('statut', $from)->update(['statut' => $to]);
        }
    }
};
