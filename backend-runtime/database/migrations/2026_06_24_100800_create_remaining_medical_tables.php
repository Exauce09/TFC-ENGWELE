<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('analyses_laboratoire', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('laborantin_id')->constrained('users');
            $table->foreignId('medecin_prescripteur_id')->nullable()->constrained('users');
            $table->foreignId('dossier_id')->nullable()->constrained('dossiers_medicaux');
            $table->foreignId('rendez_vous_id')->nullable()->constrained('rendez_vous');
            $table->date('date_prelevement');
            $table->date('date_resultat')->nullable();
            $table->string('type_analyse', 100);
            $table->json('resultats')->nullable();
            $table->text('interpretation')->nullable();
            $table->string('fichier_pdf')->nullable();
            $table->enum('statut', ['en_attente', 'en_cours', 'resultat_disponible'])->default('en_attente');
            $table->boolean('urgent')->default(false);
            $table->timestamps();
        });

        Schema::create('resultats_echographie', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('echographiste_id')->constrained('users');
            $table->foreignId('medecin_prescripteur_id')->nullable()->constrained('users');
            $table->foreignId('dossier_id')->nullable()->constrained('dossiers_medicaux');
            $table->date('date_examen');
            $table->string('type_echo', 100)->nullable();
            $table->string('organe_examine', 100)->nullable();
            $table->text('compte_rendu');
            $table->text('conclusion')->nullable();
            $table->json('images')->nullable();
            $table->enum('statut', ['en_attente', 'termine'])->default('en_attente');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('seances_kinesitherapie', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('kinesitherapeute_id')->constrained('users');
            $table->foreignId('dossier_id')->nullable()->constrained('dossiers_medicaux');
            $table->date('date_seance');
            $table->time('heure_debut')->nullable();
            $table->time('heure_fin')->nullable();
            $table->integer('numero_seance')->nullable();
            $table->integer('total_seances')->nullable();
            $table->text('techniques')->nullable();
            $table->text('observations')->nullable();
            $table->enum('evolution', ['amelioration', 'stable', 'deterioration'])->nullable();
            $table->enum('statut', ['planifiee', 'realisee', 'annulee'])->default('planifiee');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('soins_dentaires', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('dentiste_id')->constrained('users');
            $table->foreignId('dossier_id')->nullable()->constrained('dossiers_medicaux');
            $table->date('date_soin');
            $table->string('type_soin', 100)->nullable();
            $table->string('dents_traitees', 100)->nullable();
            $table->json('actes')->nullable();
            $table->boolean('anesthesie')->default(false);
            $table->string('type_anesthesie', 100)->nullable();
            $table->text('observations')->nullable();
            $table->date('prochain_rdv')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('operations_chirurgicales', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('chirurgien_id')->constrained('users');
            $table->foreignId('anesthesiste_id')->nullable()->constrained('users');
            $table->foreignId('dossier_id')->nullable()->constrained('dossiers_medicaux');
            $table->date('date_operation');
            $table->time('heure_debut')->nullable();
            $table->time('heure_fin')->nullable();
            $table->string('type_operation', 200);
            $table->enum('type_anesthesie', ['generale', 'locoreg', 'locale', 'sedation'])->nullable();
            $table->string('salle', 50)->nullable();
            $table->text('compte_rendu')->nullable();
            $table->text('complications')->nullable();
            $table->enum('statut', ['planifiee', 'en_cours', 'realisee', 'annulee'])->default('planifiee');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('suivis_maternite', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('sage_femme_id')->constrained('users');
            $table->foreignId('gynecologue_id')->nullable()->constrained('users');
            $table->date('date_dernieres_regles')->nullable();
            $table->date('date_accouchement_prevue')->nullable();
            $table->integer('numero_consultation')->default(1);
            $table->decimal('poids_kg', 5, 2)->nullable();
            $table->string('tension_arterielle', 20)->nullable();
            $table->decimal('hauteur_uterine_cm', 4, 1)->nullable();
            $table->integer('bruit_coeur_foetal')->nullable();
            $table->string('position_foetus', 100)->nullable();
            $table->text('observations')->nullable();
            $table->enum('type_visite', ['consultation_prenatale', 'accouchement', 'postnatal'])->nullable();
            $table->integer('grossesse_semaines')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('soins_infirmiers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('infirmier_id')->constrained('users');
            $table->foreignId('dossier_id')->nullable()->constrained('dossiers_medicaux');
            $table->dateTime('date_soin');
            $table->decimal('temperature', 4, 1)->nullable();
            $table->string('tension_arterielle', 20)->nullable();
            $table->integer('frequence_cardiaque')->nullable();
            $table->integer('frequence_respiratoire')->nullable();
            $table->integer('saturation_02')->nullable();
            $table->decimal('glycemie', 5, 2)->nullable();
            $table->decimal('poids_kg', 5, 2)->nullable();
            $table->text('actes_realises')->nullable();
            $table->json('medicaments_administres')->nullable();
            $table->text('observations')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('stock_medicaments', function (Blueprint $table): void {
            $table->id();
            $table->string('nom', 200);
            $table->string('dci', 200)->nullable();
            $table->string('forme', 100)->nullable();
            $table->string('dosage', 100)->nullable();
            $table->string('fabricant', 100)->nullable();
            $table->string('numero_lot', 100)->nullable();
            $table->date('date_expiration')->nullable();
            $table->integer('quantite_stock')->default(0);
            $table->integer('seuil_alerte')->default(10);
            $table->decimal('prix_unitaire', 10, 2)->nullable();
            $table->string('categorie', 100)->nullable();
            $table->boolean('ordonnance_requise')->default(true);
            $table->timestamps();
        });

        Schema::create('factures', function (Blueprint $table): void {
            $table->id();
            $table->string('numero_facture', 30)->unique();
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('rendez_vous_id')->nullable()->constrained('rendez_vous');
            $table->foreignId('caissier_id')->nullable()->constrained('users');
            $table->date('date_facture');
            $table->date('date_echeance')->nullable();
            $table->json('lignes');
            $table->decimal('sous_total', 12, 2);
            $table->decimal('remise', 12, 2)->default(0);
            $table->decimal('montant_total', 12, 2);
            $table->decimal('montant_paye', 12, 2)->default(0);
            $table->decimal('reste_a_payer', 12, 2)->nullable();
            $table->enum('statut', ['brouillon', 'emise', 'partiellement_payee', 'payee', 'annulee'])->default('emise');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('patient_id');
        });

        Schema::create('paiements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('facture_id')->constrained('factures');
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('caissier_id')->nullable()->constrained('users');
            $table->decimal('montant', 12, 2);
            $table->enum('mode_paiement', ['cash', 'airtel_money', 'mpesa', 'virement']);
            $table->string('reference_transaction', 100)->nullable();
            $table->dateTime('date_paiement');
            $table->enum('statut', ['en_attente', 'confirme', 'echoue', 'rembourse'])->default('confirme');
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('notifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('titre');
            $table->text('message');
            $table->enum('type', ['rdv_confirme', 'rdv_rappel', 'rdv_annule', 'resultat_disponible', 'prescription_nouvelle', 'paiement', 'urgence', 'system']);
            $table->json('data')->nullable();
            $table->enum('canal', ['app', 'push', 'sms', 'email'])->default('app');
            $table->boolean('lu')->default(false);
            $table->timestamp('lu_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('paiements');
        Schema::dropIfExists('factures');
        Schema::dropIfExists('stock_medicaments');
        Schema::dropIfExists('soins_infirmiers');
        Schema::dropIfExists('suivis_maternite');
        Schema::dropIfExists('operations_chirurgicales');
        Schema::dropIfExists('soins_dentaires');
        Schema::dropIfExists('seances_kinesitherapie');
        Schema::dropIfExists('resultats_echographie');
        Schema::dropIfExists('analyses_laboratoire');
    }
};
