<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tronc commun staff (users) + profils métier 1-1 + médecin enrichi + patient médecin traitant.
 * Le rôle reste l'enum/string users.role (pas Spatie pour l'instant).
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'nom')) {
                $table->string('nom', 80)->nullable()->after('name');
            }
            if (! Schema::hasColumn('users', 'post_nom')) {
                $table->string('post_nom', 80)->nullable()->after('nom');
            }
            if (! Schema::hasColumn('users', 'prenom')) {
                $table->string('prenom', 80)->nullable()->after('post_nom');
            }
            if (! Schema::hasColumn('users', 'sexe')) {
                $table->string('sexe', 1)->nullable()->after('avatar');
            }
            if (! Schema::hasColumn('users', 'date_naissance')) {
                $table->date('date_naissance')->nullable()->after('sexe');
            }
            if (! Schema::hasColumn('users', 'adresse')) {
                $table->text('adresse')->nullable()->after('date_naissance');
            }
            if (! Schema::hasColumn('users', 'piece_identite_numero')) {
                $table->string('piece_identite_numero', 80)->nullable()->after('adresse');
            }
            if (! Schema::hasColumn('users', 'date_embauche')) {
                $table->date('date_embauche')->nullable()->after('piece_identite_numero');
            }
            if (! Schema::hasColumn('users', 'statut')) {
                $table->string('statut', 20)->default('actif')->after('date_embauche');
            }
            if (! Schema::hasColumn('users', 'superviseur_id')) {
                $table->foreignId('superviseur_id')->nullable()->after('statut')->constrained('users')->nullOnDelete();
            }
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
                'patient','medecin_generaliste','medecin_interne','pediatre','gynecologue',
                'sage_femme','chirurgien','anesthesiste','ophtalmologue','laborantin',
                'echographiste','kinesitherapeute','dentiste','pharmacien','infirmier',
                'urgentiste','caissier','receptionniste','admin',
                'gestionnaire_assurance','responsable_chambres','directeur_medical','radiologue'
            ) NOT NULL");
        }

        if (Schema::hasColumn('users', 'statut')) {
            DB::table('users')->where('is_active', false)->update(['statut' => 'inactif']);
        }

        Schema::table('medecins', function (Blueprint $table): void {
            if (! Schema::hasColumn('medecins', 'annees_experience')) {
                $table->unsignedSmallInteger('annees_experience')->nullable()->after('bio');
            }
            if (! Schema::hasColumn('medecins', 'etablissements_precedents')) {
                $table->json('etablissements_precedents')->nullable()->after('annees_experience');
            }
            if (! Schema::hasColumn('medecins', 'signature_electronique')) {
                $table->longText('signature_electronique')->nullable()->after('etablissements_precedents');
            }
            if (! Schema::hasColumn('medecins', 'langues')) {
                $table->json('langues')->nullable()->after('signature_electronique');
            }
            if (! Schema::hasColumn('medecins', 'type_contrat')) {
                $table->string('type_contrat', 40)->nullable()->after('langues');
            }
            if (! Schema::hasColumn('medecins', 'diplomes_liste')) {
                $table->json('diplomes_liste')->nullable()->after('diplomes');
            }
        });

        if (! Schema::hasTable('profils_infirmiers')) {
            Schema::create('profils_infirmiers', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->string('numero_enregistrement', 80)->nullable();
                $table->string('specialisation', 120)->nullable();
                $table->string('diplome', 40)->nullable();
                $table->string('service_affectation', 120)->nullable();
                $table->string('poste_garde', 40)->nullable();
                $table->unsignedSmallInteger('annees_experience')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('profils_receptionnistes')) {
            Schema::create('profils_receptionnistes', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->string('poste_accueil', 120)->nullable();
                $table->json('langues')->nullable();
                $table->string('horaires_shift', 120)->nullable();
                $table->boolean('formation_logiciel')->default(false);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('profils_laborantins')) {
            Schema::create('profils_laborantins', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->string('specialisation', 120)->nullable();
                $table->string('diplome', 150)->nullable();
                $table->string('numero_agrement', 80)->nullable();
                $table->json('equipements_habilites')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('profils_radiologues')) {
            Schema::create('profils_radiologues', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->json('types_imagerie')->nullable();
                $table->string('diplome', 150)->nullable();
                $table->string('numero_agrement', 80)->nullable();
                $table->string('habilitation', 40)->default('technicien');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('profils_pharmaciens')) {
            Schema::create('profils_pharmaciens', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->string('numero_ordre', 80)->nullable();
                $table->string('diplome', 150)->nullable();
                $table->string('specialisation', 120)->nullable();
                $table->json('habilitations')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('profils_caissiers')) {
            Schema::create('profils_caissiers', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->string('guichet', 80)->nullable();
                $table->string('diplome', 150)->nullable();
                $table->decimal('plafond_transaction', 12, 2)->nullable();
                $table->json('devises')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('profils_gestionnaires_assurance')) {
            Schema::create('profils_gestionnaires_assurance', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->json('compagnies_gerees')->nullable();
                $table->string('diplome', 150)->nullable();
                $table->decimal('montant_max_approbation', 12, 2)->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('profils_responsables_chambres')) {
            Schema::create('profils_responsables_chambres', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->json('services_geres')->nullable();
                $table->string('diplome', 150)->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('profils_directeurs')) {
            Schema::create('profils_directeurs', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->string('numero_ordre', 80)->nullable();
                $table->json('departements_supervises')->nullable();
                $table->string('diplome', 150)->nullable();
                $table->string('niveau_autorite', 40)->default('direction');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('profils_admins')) {
            Schema::create('profils_admins', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->string('fonction', 40)->default('technique');
                $table->string('niveau_acces', 40)->default('total');
                $table->timestamps();
            });
        }

        if (Schema::hasTable('patients') && ! Schema::hasColumn('patients', 'medecin_traitant_id')) {
            Schema::table('patients', function (Blueprint $table): void {
                $table->foreignId('medecin_traitant_id')->nullable()->after('contact_urgence_lien')
                    ->constrained('medecins')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('patients', 'medecin_traitant_id')) {
            Schema::table('patients', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('medecin_traitant_id');
            });
        }

        Schema::dropIfExists('profils_admins');
        Schema::dropIfExists('profils_directeurs');
        Schema::dropIfExists('profils_responsables_chambres');
        Schema::dropIfExists('profils_gestionnaires_assurance');
        Schema::dropIfExists('profils_caissiers');
        Schema::dropIfExists('profils_pharmaciens');
        Schema::dropIfExists('profils_radiologues');
        Schema::dropIfExists('profils_laborantins');
        Schema::dropIfExists('profils_receptionnistes');
        Schema::dropIfExists('profils_infirmiers');

        Schema::table('medecins', function (Blueprint $table): void {
            foreach (['annees_experience', 'etablissements_precedents', 'signature_electronique', 'langues', 'type_contrat', 'diplomes_liste'] as $col) {
                if (Schema::hasColumn('medecins', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'superviseur_id')) {
                $table->dropConstrainedForeignId('superviseur_id');
            }
            foreach (['nom', 'post_nom', 'prenom', 'sexe', 'date_naissance', 'adresse', 'piece_identite_numero', 'date_embauche', 'statut'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
