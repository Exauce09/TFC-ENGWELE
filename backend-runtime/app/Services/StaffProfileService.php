<?php

namespace App\Services;

use App\Models\Departement;
use App\Models\Medecin;
use App\Models\Patient;
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
use InvalidArgumentException;

class StaffProfileService
{
    /**
     * Rôles rattachés à un service (users.departement_id obligatoire).
     * Admin / directeur / assurance / chambres / patient : département optionnel (global).
     *
     * @var list<string>
     */
    public const ROLES_REQUIRING_DEPARTEMENT = [
        'infirmier',
        'sage_femme',
        'receptionniste',
        'laborantin',
        'pharmacien',
        'caissier',
        'echographiste',
        'radiologue',
        'kinesitherapeute',
    ];

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

    public static function requiresDepartement(string $role): bool
    {
        return self::isMedecinRole($role)
            || in_array($role, self::ROLES_REQUIRING_DEPARTEMENT, true);
    }

    public static function loadFull(User $user): User
    {
        return $user->load(self::relationsForRole($user->role));
    }

    /**
     * Code département préféré selon le métier (services actifs du seeder).
     */
    public static function defaultDepartementCodeForRole(string $role): ?string
    {
        return match (true) {
            $role === 'laborantin', $role === 'echographiste', $role === 'radiologue' => 'LAB',
            $role === 'pharmacien' => 'PHARM',
            $role === 'sage_femme', $role === 'gynecologue' => 'MAT',
            $role === 'pediatre' => 'PED',
            $role === 'urgentiste' => 'URG',
            $role === 'chirurgien', $role === 'anesthesiste' => 'CHIR',
            $role === 'dentiste' => 'DENT',
            $role === 'ophtalmologue' => 'OPHT',
            $role === 'kinesitherapeute' => 'KINE',
            self::requiresDepartement($role) => 'MED_GEN',
            default => null,
        };
    }

    /**
     * Résout un département : préférence explicite → code métier → premier actif.
     */
    public static function resolveDepartementId(?int $preferredId = null, ?string $role = null): ?int
    {
        // Uniquement les départements actifs (ceux listés à la réception).
        if ($preferredId) {
            $exists = Departement::query()
                ->whereKey($preferredId)
                ->where('is_active', true)
                ->exists();
            if ($exists) {
                return $preferredId;
            }
        }

        if ($role) {
            $code = self::defaultDepartementCodeForRole($role);
            if ($code) {
                $byCode = Departement::query()
                    ->where('code', $code)
                    ->where('is_active', true)
                    ->value('id');
                if ($byCode) {
                    return (int) $byCode;
                }
            }
        }

        return Departement::query()->where('is_active', true)->orderBy('id')->value('id')
            ?? Departement::query()->orderBy('id')->value('id');
    }

    /**
     * Assigne users.departement_id si le rôle l'exige et qu'il est manquant.
     * Synchronise medecins.departement_id pour les médecins.
     */
    public static function ensureDepartement(User $user): void
    {
        if (! self::requiresDepartement($user->role)) {
            return;
        }

        $departementId = self::resolveDepartementId(
            $user->departement_id ? (int) $user->departement_id : null,
            $user->role
        );

        if (! $departementId) {
            throw new InvalidArgumentException(
                'Aucun département disponible. Créez un département avant d\'ajouter ce personnel.'
            );
        }

        if ((int) $user->departement_id !== (int) $departementId) {
            $user->forceFill(['departement_id' => $departementId])->save();
        }

        if (self::isMedecinRole($user->role) && $user->medecin) {
            if ((int) $user->medecin->departement_id !== (int) $departementId) {
                $user->medecin->update(['departement_id' => $departementId]);
            }
        }
    }

    /**
     * Backfill : tous les users dont le rôle exige un département.
     * Réassigne aussi les rattachements vers un département inactif (invisible à la réception).
     */
    public static function backfillMissingDepartements(): int
    {
        $count = 0;

        User::query()
            ->whereNull('departement_id')
            ->orderBy('id')
            ->each(function (User $user) use (&$count): void {
                if (! self::requiresDepartement($user->role)) {
                    return;
                }
                self::ensureDepartement($user);
                $count++;
            });

        // Users / médecins sur département inactif → service actif (sinon invisibles à la réception)
        User::query()
            ->whereNotNull('departement_id')
            ->with(['departement', 'medecin'])
            ->orderBy('id')
            ->each(function (User $user) use (&$count): void {
                if (! self::requiresDepartement($user->role)) {
                    return;
                }
                $dept = $user->departement;
                if ($dept && $dept->is_active) {
                    return;
                }
                $newId = self::resolveDepartementId(null, $user->role);
                if (! $newId || (int) $user->departement_id === (int) $newId) {
                    return;
                }
                $user->forceFill(['departement_id' => $newId])->save();
                if ($user->medecin) {
                    $user->medecin->update(['departement_id' => $newId]);
                }
                $count++;
            });

        // Médecins : aligner medecins.departement_id sur users.departement_id
        User::query()
            ->whereNotNull('departement_id')
            ->whereHas('medecin')
            ->with('medecin')
            ->each(function (User $user): void {
                if ($user->medecin && (int) $user->medecin->departement_id !== (int) $user->departement_id) {
                    $user->medecin->update(['departement_id' => $user->departement_id]);
                }
            });

        return $count;
    }

    /**
     * Crée le profil métier vide s'il n'existe pas encore.
     */
    public static function ensureProfil(User $user): ?Model
    {
        $profil = match (true) {
            self::isMedecinRole($user->role) => self::ensureMedecinProfil($user),
            $user->role === 'patient' => self::ensurePatientProfil($user),
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

        if ($profil && self::requiresDepartement($user->role) && ! self::isMedecinRole($user->role)) {
            self::ensureDepartement($user->fresh());
        }

        return $profil;
    }

    protected static function ensureMedecinProfil(User $user): Medecin
    {
        $departementId = self::resolveDepartementId(
            $user->departement_id ? (int) $user->departement_id : null,
            $user->role
        );
        if (! $departementId) {
            throw new InvalidArgumentException(
                'Aucun département disponible. Créez un département avant d\'ajouter un médecin.'
            );
        }

        if ((int) $user->departement_id !== (int) $departementId) {
            $user->forceFill(['departement_id' => $departementId])->save();
        }

        $medecin = Medecin::firstOrCreate(
            ['user_id' => $user->id],
            [
                'departement_id' => $departementId,
                'specialite' => str_replace('_', ' ', $user->role),
            ]
        );

        if ((int) $medecin->departement_id !== (int) $departementId) {
            $medecin->update(['departement_id' => $departementId]);
        }

        return $medecin->fresh();
    }

    protected static function ensurePatientProfil(User $user): Patient
    {
        if ($user->patient) {
            return $user->patient;
        }

        $numero = 'PAT-'.str_pad((string) $user->id, 5, '0', STR_PAD_LEFT);

        return Patient::firstOrCreate(
            ['user_id' => $user->id],
            ['numero_patient' => $numero]
        );
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

        // Si le département métier médecin change, garder users.departement_id aligné
        if ($profil instanceof Medecin && array_key_exists('departement_id', $filtered) && $filtered['departement_id']) {
            $deptId = (int) $filtered['departement_id'];
            if ((int) $user->departement_id !== $deptId) {
                $user->forceFill(['departement_id' => $deptId])->save();
            }
        }
    }

    public static function syncDisplayName(User $user): void
    {
        $parts = array_filter([$user->prenom, $user->nom, $user->post_nom]);
        if ($parts !== []) {
            $user->name = implode(' ', $parts);
        }
    }

    /**
     * Remplit prenom/nom depuis `name` si absents (comptes seed / imports).
     */
    public static function hydrateIdentityFromName(User $user): bool
    {
        if (($user->prenom && $user->nom) || ! $user->name) {
            return false;
        }

        $parts = preg_split('/\s+/', trim((string) $user->name), 2) ?: [];
        $prenom = $parts[0] ?? '';
        $nom = $parts[1] ?? ($parts[0] ?? '');
        if ($prenom === '' && $nom === '') {
            return false;
        }

        $user->forceFill([
            'prenom' => $user->prenom ?: $prenom,
            'nom' => $user->nom ?: $nom,
        ])->save();

        return true;
    }
}
