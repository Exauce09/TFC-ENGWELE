<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\User;
use App\Services\StaffProfileService;
use App\Support\PatientCredentials;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        return new JsonResponse([
            'success' => false,
            'message' => 'La création du patient et l\'ouverture du dossier se font uniquement à la réception de l\'hôpital (Accueil). Présentez-vous à l\'Avenue Vitamine 1, Matete.',
            'errors' => [],
        ], 403);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|string|max:120',
            'password' => 'required|string',
        ]);

        $identifiant = trim($request->input('email'));
        $password = $request->input('password');
        $user = $this->resolveUserByIdentifiant($identifiant);

        if (! $user || ! Hash::check($password, $user->password)) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Identifiant ou mot de passe incorrect',
                'errors' => [],
            ], 401);
        }

        if (! $user->is_active) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Votre compte a ete desactive. Contactez l\'administration.',
                'errors' => [],
            ], 403);
        }

        Auth::login($user);
        $user->tokens()->delete();
        $token = $user->createToken('auth_token', ['*'], now()->addDay())->plainTextToken;

        $redirect = $user->needs_onboarding && $user->role === 'patient'
            ? '/patient/premiere-connexion'
            : $this->getRedirectByRole($user->role);

        return new JsonResponse([
            'success' => true,
            'message' => 'Connexion reussie',
            'data' => [
                'token' => $token,
                'user' => StaffProfileService::loadFull($user->fresh()),
                'role' => $user->role,
                'redirect' => $redirect,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        StaffProfileService::ensureProfil($user);

        return new JsonResponse([
            'success' => true,
            'message' => 'Profil recupere',
            'data' => StaffProfileService::loadFull($user->fresh()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return new JsonResponse([
            'success' => true,
            'message' => 'Deconnecte avec succes',
            'data' => null,
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|string']);

        return new JsonResponse([
            'success' => true,
            'message' => 'Si ce compte existe, un email de reinitialisation sera envoye.',
            'data' => null,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'nom' => 'sometimes|nullable|string|max:80',
            'post_nom' => 'sometimes|nullable|string|max:80',
            'prenom' => 'sometimes|nullable|string|max:80',
            'phone' => 'sometimes|nullable|string|max:25',
            'avatar' => 'sometimes|nullable|string',
            'sexe' => 'sometimes|nullable|in:M,F',
            'date_naissance' => 'sometimes|nullable|date|before:today',
            'adresse' => 'sometimes|nullable|string',
            'piece_identite_numero' => 'sometimes|nullable|string|max:80',
            'departement_id' => 'sometimes|nullable|integer|exists:departements,id',
            'date_embauche' => 'sometimes|nullable|date',
            'statut' => 'sometimes|nullable|in:actif,inactif,suspendu,en_conge',
            'superviseur_id' => 'sometimes|nullable|integer|exists:users,id',
            'fcm_token' => 'sometimes|nullable|string|max:500',
            'medecin' => 'sometimes|array',
            'profil_infirmier' => 'sometimes|array',
            'profil_receptionniste' => 'sometimes|array',
            'profil_laborantin' => 'sometimes|array',
            'profil_radiologue' => 'sometimes|array',
            'profil_pharmacien' => 'sometimes|array',
            'profil_caissier' => 'sometimes|array',
            'profil_gestionnaire_assurance' => 'sometimes|array',
            'profil_responsable_chambres' => 'sometimes|array',
            'profil_directeur' => 'sometimes|array',
            'profil_admin' => 'sometimes|array',
        ]);

        /** @var User $user */
        $user = $request->user();

        $userFields = collect($validated)->only([
            'name', 'nom', 'post_nom', 'prenom', 'phone', 'avatar', 'sexe',
            'date_naissance', 'adresse', 'piece_identite_numero', 'departement_id',
            'date_embauche', 'statut', 'superviseur_id', 'fcm_token',
        ])->all();

        $user->fill($userFields);

        if (array_key_exists('statut', $userFields)) {
            $user->is_active = in_array($userFields['statut'], ['actif', 'en_conge'], true);
        }

        StaffProfileService::syncDisplayName($user);
        $user->save();

        StaffProfileService::updateMetier($user, $validated);

        return new JsonResponse([
            'success' => true,
            'message' => 'Profil mis a jour',
            'data' => StaffProfileService::loadFull($user->fresh()),
        ]);
    }

    /**
     * Première connexion patient : complète le profil + change le mot de passe.
     */
    public function completeOnboarding(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->role !== 'patient') {
            return new JsonResponse([
                'success' => false,
                'message' => 'Réservé aux patients',
            ], 403);
        }

        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'required|string|max:25',
            'date_naissance' => 'nullable|date|before:today|required_without:age_declare',
            'age_declare' => 'nullable|integer|min:0|max:120|required_without:date_naissance',
            'sexe' => 'required|in:M,F',
            'etat_civil' => 'nullable|in:celibataire,marie,divorce,veuf,autre',
            'adresse' => 'nullable|string|max:255',
            'quartier' => 'nullable|string|max:100',
            'commune' => 'nullable|string|max:100',
            'ville' => 'nullable|string|max:80',
            'piece_identite_type' => 'nullable|string|max:40',
            'piece_identite_numero' => 'nullable|string|max:60',
            'contact_urgence_nom' => 'nullable|string|max:100',
            'contact_urgence_tel' => 'nullable|string|max:25',
            'contact_urgence_lien' => 'nullable|string|max:80',
            'groupe_sanguin' => 'nullable|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'allergies' => 'nullable|string|max:500',
            'antecedents_medicaux' => 'nullable|string|max:1000',
        ]);

        // L'identité (nom / n° patient) reste figée — créée à la réception uniquement.
        $user->update([
            'phone' => $validated['phone'],
            'password' => $validated['password'], // cast hashed
            'must_change_password' => false,
            'profil_complet' => true,
        ]);

        $patient = $user->patient;
        if ($patient) {
            $patient->update([
                'date_naissance' => $validated['date_naissance'] ?? $patient->date_naissance,
                'age_declare' => array_key_exists('age_declare', $validated) ? $validated['age_declare'] : $patient->age_declare,
                'sexe' => $validated['sexe'],
                'etat_civil' => $validated['etat_civil'] ?? $patient->etat_civil,
                'adresse' => $validated['adresse'] ?? $patient->adresse,
                'quartier' => $validated['quartier'] ?? $patient->quartier,
                'commune' => $validated['commune'] ?? $patient->commune,
                'ville' => $validated['ville'] ?? $patient->ville,
                'piece_identite_type' => $validated['piece_identite_type'] ?? $patient->piece_identite_type,
                'piece_identite_numero' => $validated['piece_identite_numero'] ?? $patient->piece_identite_numero,
                'contact_urgence_nom' => $validated['contact_urgence_nom'] ?? $patient->contact_urgence_nom,
                'contact_urgence_tel' => $validated['contact_urgence_tel'] ?? $patient->contact_urgence_tel,
                'contact_urgence_lien' => $validated['contact_urgence_lien'] ?? $patient->contact_urgence_lien,
                'groupe_sanguin' => $validated['groupe_sanguin'] ?? $patient->groupe_sanguin,
                'allergies' => $validated['allergies'] ?? $patient->allergies,
                'antecedents_medicaux' => $validated['antecedents_medicaux'] ?? $patient->antecedents_medicaux,
            ]);
        }

        return new JsonResponse([
            'success' => true,
            'message' => 'Profil complété. Bienvenue dans votre espace patient.',
            'data' => StaffProfileService::loadFull($user->fresh()),
            'redirect' => '/patient/dashboard',
        ]);
    }

    private function resolveUserByIdentifiant(string $identifiant): ?User
    {
        // Email exact
        $user = User::where('email', $identifiant)->first();
        if ($user) {
            return $user;
        }

        // N° patient PAT-00012
        if (preg_match('/^PAT-\d+$/i', $identifiant)) {
            $patient = Patient::where('numero_patient', strtoupper($identifiant))->first();

            return $patient?->user;
        }

        // Nom et prénom → marie.kalala  ou login_identifiant direct
        $slug = (string) Str::of($identifiant)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '.')
            ->trim('.');

        if ($slug !== '') {
            $user = User::where('login_identifiant', $slug)->first()
                ?? User::where('email', PatientCredentials::emailFromLogin($slug))->first();
            if ($user) {
                return $user;
            }
        }

        // Correspondance sur le nom complet (insensible à la casse)
        return User::where('role', 'patient')
            ->whereRaw('LOWER(name) = ?', [mb_strtolower(trim($identifiant))])
            ->first();
    }

    private function getRedirectByRole(string $role): string
    {
        return match ($role) {
            'patient' => '/patient/dashboard',
            'medecin_generaliste', 'medecin_interne', 'pediatre', 'gynecologue', 'ophtalmologue', 'urgentiste' => '/medecin/dashboard',
            'sage_femme' => '/maternite/dashboard',
            'chirurgien', 'anesthesiste' => '/chirurgie/dashboard',
            'laborantin' => '/laboratoire/dashboard',
            'echographiste' => '/echographie/dashboard',
            'kinesitherapeute' => '/kinesitherapie/dashboard',
            'dentiste' => '/dentisterie/dashboard',
            'pharmacien' => '/pharmacie/dashboard',
            'infirmier' => '/infirmier/dashboard',
            'caissier' => '/caisse/dashboard',
            'receptionniste' => '/accueil/dashboard',
            'admin' => '/admin/dashboard',
            'gestionnaire_assurance' => '/admin/dashboard',
            'responsable_chambres' => '/admin/dashboard',
            'directeur_medical' => '/admin/dashboard',
            'radiologue' => '/echographie/dashboard',
            default => '/',
        };
    }
}
