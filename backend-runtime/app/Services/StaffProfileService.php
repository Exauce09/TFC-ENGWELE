<?php

namespace App\Services;

use App\Models\Medecin;
use App\Models\ProfilAdmin;
use App\Models\ProfilCaissier;
use App\Models\ProfilDirecteur;
use App\Models\ProfilGestionnaireAssurance;
use App\Models\ProfilInfirmier;
use App\Models\ProfilLaborantin;
use App\Models\ProfilPharmacien;
use App\Models\ProfilRadiologue;
use App\Models\ProfilReceptionniste;
use App\Models\ProfilResponsableChambres;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class StaffProfileService
{
    /** @return list<string> */
    public static function relationsForRole(string $role): array
    {
        $base = ['departement', 'superviseur'];

        return match (true) {
            self::isMedecinRole($role) => [...$base, 'medecin.departement'],
            $role === 'infirmier', $role === 'sage_femme' => [...$base, 'profilInfirmier'],
            $role === 'receptionniste' => [...$base, 'profilReceptionniste'],
            $role === 'laborantin' => [...$base, 'profilLaborantin'],
            $role === 'echographiste', $role === 'radiologue' => [...$base, 'profilRadiologue'],
            $role === 'pharmacien' => [...$base, 'profilPharmacien'],
            $role === 'caissier' => [...$base, 'profilCaissier'],
            $role === 'gestionnaire_assurance' => [...$base, 'profilGestionnaireAssurance'],
            $role === 'responsable_chambres' => [...$base, 'profilResponsableChambres'],
            $role === 'directeur_medical' => [...$base, 'profilDirecteur'],
            $role === 'admin' => [...$base, 'profilAdmin'],
            $role === 'patient' => ['patient.medecinTraitant'],
            default => $base,
        };
    }

    public static function isMedecinRole(string $role): bool
    {
        return in_array($role, [
            'medecin_generaliste', 'medecin_interne', 'pediatre', 'gynecologue',
            'ophtalmologue', 'urgentiste', 'chirurgien', 'anesthesiste', 'dentiste',
        ], true);
    }

    public static function loadFull(User $user): User
    {
        return $user->load(self::relationsForRole($user->role));
    }

    /**
     * Crée le profil métier vide s'il n'existe pas encore.
     */
    public static function ensureProfil(User $user): ?Model
    {
        return match (true) {
            self::isMedecinRole($user->role) => $user->medecin
                ?? Medecin::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'departement_id' => $user->departement_id ?? 1,
                        'specialite' => str_replace('_', ' ', $user->role),
                    ]
                ),
            $user->role === 'infirmier', $user->role === 'sage_femme' => ProfilInfirmier::firstOrCreate(['user_id' => $user->id]),
            $user->role === 'receptionniste' => ProfilReceptionniste::firstOrCreate(['user_id' => $user->id]),
            $user->role === 'laborantin' => ProfilLaborantin::firstOrCreate(['user_id' => $user->id]),
            $user->role === 'echographiste', $user->role === 'radiologue' => ProfilRadiologue::firstOrCreate(['user_id' => $user->id]),
            $user->role === 'pharmacien' => ProfilPharmacien::firstOrCreate(['user_id' => $user->id]),
            $user->role === 'caissier' => ProfilCaissier::firstOrCreate(['user_id' => $user->id]),
            $user->role === 'gestionnaire_assurance' => ProfilGestionnaireAssurance::firstOrCreate(['user_id' => $user->id]),
            $user->role === 'responsable_chambres' => ProfilResponsableChambres::firstOrCreate(['user_id' => $user->id]),
            $user->role === 'directeur_medical' => ProfilDirecteur::firstOrCreate(['user_id' => $user->id]),
            $user->role === 'admin' => ProfilAdmin::firstOrCreate(['user_id' => $user->id]),
            default => null,
        };
    }

    /** @param array<string, mixed> $payload */
    public static function updateMetier(User $user, array $payload): void
    {
        $profil = self::ensureProfil($user);
        if (! $profil) {
            return;
        }

        $key = match (true) {
            $profil instanceof Medecin => 'medecin',
            $profil instanceof ProfilInfirmier => 'profil_infirmier',
            $profil instanceof ProfilReceptionniste => 'profil_receptionniste',
            $profil instanceof ProfilLaborantin => 'profil_laborantin',
            $profil instanceof ProfilRadiologue => 'profil_radiologue',
            $profil instanceof ProfilPharmacien => 'profil_pharmacien',
            $profil instanceof ProfilCaissier => 'profil_caissier',
            $profil instanceof ProfilGestionnaireAssurance => 'profil_gestionnaire_assurance',
            $profil instanceof ProfilResponsableChambres => 'profil_responsable_chambres',
            $profil instanceof ProfilDirecteur => 'profil_directeur',
            $profil instanceof ProfilAdmin => 'profil_admin',
            default => null,
        };

        if (! $key || empty($payload[$key]) || ! is_array($payload[$key])) {
            return;
        }

        $data = $payload[$key];
        $fillable = $profil->getFillable();
        $filtered = array_intersect_key($data, array_flip(array_diff($fillable, ['user_id'])));

        // Listes envoyées en string CSV depuis le front
        foreach (['langues', 'equipements_habilites', 'habilitations', 'devises', 'compagnies_gerees', 'services_geres', 'departements_supervises', 'types_imagerie', 'etablissements_precedents', 'diplomes_liste', 'disponibilites'] as $jsonField) {
            if (! array_key_exists($jsonField, $filtered)) {
                continue;
            }
            $val = $filtered[$jsonField];
            if (is_string($val)) {
                $filtered[$jsonField] = array_values(array_filter(array_map('trim', explode(',', $val))));
            }
        }

        $profil->fill($filtered);
        $profil->save();
    }

    public static function syncDisplayName(User $user): void
    {
        $parts = array_filter([$user->prenom, $user->nom, $user->post_nom]);
        if ($parts !== []) {
            $user->name = implode(' ', $parts);
        }
    }
}
