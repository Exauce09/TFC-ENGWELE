<?php

namespace Database\Seeders;

use App\Models\ProfilAdmin;
use App\Models\ProfilCaissier;
use App\Models\ProfilInfirmier;
use App\Models\ProfilLaborantin;
use App\Models\ProfilPharmacien;
use App\Models\ProfilRadiologue;
use App\Models\ProfilReceptionniste;
use App\Models\User;
use App\Services\StaffProfileService;
use Illuminate\Database\Seeder;

class ProfilsActeursSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@amen.cd')->first();
        if ($admin) {
            $admin->update([
                'nom' => 'Admin',
                'prenom' => 'Système',
                'statut' => 'actif',
                'date_embauche' => '2024-01-01',
            ]);
            StaffProfileService::syncDisplayName($admin);
            $admin->save();
            ProfilAdmin::updateOrCreate(
                ['user_id' => $admin->id],
                ['fonction' => 'technique', 'niveau_acces' => 'total']
            );
        }

        $med = User::where('email', 'medecin@amen.cd')->first();
        if ($med) {
            $med->update([
                'nom' => 'Mukendi',
                'post_nom' => 'Kalala',
                'prenom' => 'Jean',
                'sexe' => 'M',
                'phone' => '+243810000001',
                'statut' => 'actif',
                'date_embauche' => '2022-03-15',
                'superviseur_id' => $admin?->id,
            ]);
            StaffProfileService::syncDisplayName($med);
            $med->save();
            if ($med->medecin) {
                $med->medecin->update([
                    'annees_experience' => 8,
                    'langues' => ['français', 'lingala'],
                    'type_contrat' => 'permanent',
                    'etablissements_precedents' => ['Clinique Ngaliema'],
                ]);
            }
        }

        $inf = User::where('email', 'infirmier@amen.cd')->first();
        if ($inf) {
            $inf->update([
                'nom' => 'Tshibangu',
                'prenom' => 'Grace',
                'sexe' => 'F',
                'statut' => 'actif',
                'date_embauche' => '2023-06-01',
                'superviseur_id' => $med?->id,
            ]);
            StaffProfileService::syncDisplayName($inf);
            $inf->save();
            ProfilInfirmier::updateOrCreate(
                ['user_id' => $inf->id],
                [
                    'specialisation' => 'soins généraux',
                    'diplome' => 'A1',
                    'poste_garde' => 'rotation',
                    'annees_experience' => 4,
                    'service_affectation' => 'Urgences',
                ]
            );
        }

        $rec = User::where('email', 'receptionniste@amen.cd')->first();
        if ($rec) {
            $rec->update([
                'nom' => 'Ilunga',
                'prenom' => 'Sarah',
                'sexe' => 'F',
                'statut' => 'actif',
                'date_embauche' => '2024-02-01',
            ]);
            StaffProfileService::syncDisplayName($rec);
            $rec->save();
            ProfilReceptionniste::updateOrCreate(
                ['user_id' => $rec->id],
                [
                    'poste_accueil' => 'Guichet principal',
                    'langues' => ['français', 'lingala', 'swahili'],
                    'horaires_shift' => '07h–15h',
                    'formation_logiciel' => true,
                ]
            );
        }

        $lab = User::where('email', 'laborantin@amen.cd')->first();
        if ($lab) {
            ProfilLaborantin::updateOrCreate(
                ['user_id' => $lab->id],
                [
                    'specialisation' => 'biochimie',
                    'diplome' => 'Technicien de laboratoire',
                    'equipements_habilites' => ['analyseur biochimique', 'centrifugeuse'],
                ]
            );
        }

        $ph = User::where('email', 'pharmacien@amen.cd')->first();
        if ($ph) {
            ProfilPharmacien::updateOrCreate(
                ['user_id' => $ph->id],
                [
                    'specialisation' => 'gestion de stock',
                    'habilitations' => ['délivrance courante'],
                ]
            );
        }

        $caisse = User::where('email', 'caissier@amen.cd')->first();
        if ($caisse) {
            ProfilCaissier::updateOrCreate(
                ['user_id' => $caisse->id],
                [
                    'guichet' => 'Caisse 1',
                    'devises' => ['CDF', 'USD'],
                    'plafond_transaction' => 5000000,
                ]
            );
        }

        $echo = User::where('email', 'echographiste@amen.cd')->first();
        if ($echo) {
            ProfilRadiologue::updateOrCreate(
                ['user_id' => $echo->id],
                [
                    'types_imagerie' => ['échographie'],
                    'habilitation' => 'technicien',
                ]
            );
        }

        // S'assurer qu'un profil métier existe pour tous les staff connus
        User::where('role', '!=', 'patient')->each(function (User $u) {
            StaffProfileService::ensureProfil($u);
        });

        StaffProfileService::backfillMissingDepartements();
    }
}
