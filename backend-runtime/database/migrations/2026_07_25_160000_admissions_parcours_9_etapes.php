<?php

use App\Enums\AdmissionStatut;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Remappe tous les anciens statuts vers le parcours 9 étapes. */
return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('admissions')) {
            return;
        }

        $rows = DB::table('admissions')->select('id', 'statut')->get();
        foreach ($rows as $row) {
            $nouveau = AdmissionStatut::mapAncien($row->statut);
            if ($nouveau !== $row->statut) {
                DB::table('admissions')->where('id', $row->id)->update(['statut' => $nouveau]);
            }
        }

        if (Schema::hasTable('admission_statut_historique')) {
            foreach (DB::table('admission_statut_historique')->select('id', 'statut_avant', 'statut_apres')->get() as $h) {
                $updates = [];
                if ($h->statut_avant) {
                    $updates['statut_avant'] = AdmissionStatut::mapAncien($h->statut_avant);
                }
                $updates['statut_apres'] = AdmissionStatut::mapAncien($h->statut_apres);
                DB::table('admission_statut_historique')->where('id', $h->id)->update($updates);
            }
        }
    }

    public function down(): void
    {
        // irreversible intentional
    }
};
