<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Corrige le CHECK/ENUM SQLite-MySQL sur admissions.statut (parcours 9 étapes)
 * et garantit la table notes_suivi_ambulatoire.
 */
return new class extends Migration {
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            $this->rebuildAdmissionsSqlite();
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE admissions MODIFY COLUMN statut VARCHAR(40) NOT NULL DEFAULT 'enregistre'");
        }

        if (! Schema::hasTable('notes_suivi_ambulatoire')) {
            Schema::create('notes_suivi_ambulatoire', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
                $table->foreignId('auteur_id')->constrained('users')->cascadeOnDelete();
                $table->date('date_note');
                $table->text('evolution');
                $table->json('constantes')->nullable();
                $table->text('plan')->nullable();
                $table->timestamps();
                $table->index('admission_id');
            });
        }

        if (Schema::hasTable('admissions') && ! Schema::hasColumn('admissions', 'resume_sortie')) {
            Schema::table('admissions', function (Blueprint $table): void {
                $table->text('resume_sortie')->nullable();
            });
        }
    }

    private function rebuildAdmissionsSqlite(): void
    {
        if (! Schema::hasTable('admissions')) {
            return;
        }

        $sql = DB::selectOne("SELECT sql FROM sqlite_master WHERE type='table' AND name='admissions'")?->sql ?? '';
        // Déjà sans CHECK enum ancien → rien à faire
        if ($sql !== '' && ! preg_match("/check\s*\(\s*[\"']?statut/i", $sql)) {
            return;
        }

        Schema::disableForeignKeyConstraints();

        DB::statement('ALTER TABLE admissions RENAME TO admissions_old_check');

        Schema::create('admissions', function (Blueprint $table): void {
            $table->id();
            $table->string('numero_admission', 30)->unique();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('departement_id')->nullable()->constrained('departements')->nullOnDelete();
            $table->foreignId('enregistre_par')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('medecin_referent_id')->nullable()->constrained('medecins')->nullOnDelete();
            $table->string('statut', 40)->default('enregistre');
            $table->string('mode_arrivee', 40)->default('walk_in');
            $table->string('type_visite', 40)->default('consultation');
            $table->string('mode_paiement', 40)->default('cash');
            $table->string('niveau_urgence_accueil', 40)->nullable();
            $table->string('motif_arrivee', 255);
            $table->string('circuit', 40)->nullable();
            $table->text('observations')->nullable();
            $table->timestamp('arrivee_at')->useCurrent();
            $table->timestamp('sortie_at')->nullable();
            $table->date('date_suivi_prevue')->nullable();
            $table->unsignedBigInteger('rdv_suivi_id')->nullable();
            $table->text('consignes_sortie')->nullable();
            $table->text('resume_sortie')->nullable();
            $table->boolean('facturation_ouverte')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['statut', 'created_at']);
            $table->index(['patient_id', 'statut']);
        });

        $cols = collect(DB::select('PRAGMA table_info(admissions_old_check)'))->pluck('name')->all();
        $target = [
            'id', 'numero_admission', 'patient_id', 'departement_id', 'enregistre_par', 'medecin_referent_id',
            'statut', 'mode_arrivee', 'type_visite', 'mode_paiement', 'niveau_urgence_accueil', 'motif_arrivee',
            'circuit', 'observations', 'arrivee_at', 'sortie_at', 'date_suivi_prevue', 'rdv_suivi_id',
            'consignes_sortie', 'resume_sortie', 'facturation_ouverte', 'created_at', 'updated_at', 'deleted_at',
        ];
        $common = array_values(array_intersect($target, $cols));
        $list = implode(', ', array_map(fn ($c) => '"'.$c.'"', $common));

        DB::statement("INSERT INTO admissions ({$list}) SELECT {$list} FROM admissions_old_check");
        DB::statement('DROP TABLE admissions_old_check');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // Irreversible volontairement (suppression CHECK)
    }
};
