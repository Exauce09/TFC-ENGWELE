<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:25',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:patient',
            'date_naissance' => 'required|date',
            'sexe' => 'required|in:M,F',
            'adresse' => 'nullable|string',
            'commune' => 'nullable|string|max:100',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => 'patient',
        ]);

        Patient::create([
            'user_id' => $user->id,
            'numero_patient' => 'PAT-'.str_pad((string) $user->id, 5, '0', STR_PAD_LEFT),
            'date_naissance' => $validated['date_naissance'],
            'sexe' => $validated['sexe'],
            'adresse' => $validated['adresse'] ?? null,
            'commune' => $validated['commune'] ?? null,
        ]);

        $token = $user->createToken('auth_token', ['*'], now()->addDay())->plainTextToken;

        return new JsonResponse([
            'success' => true,
            'message' => 'Compte cree avec succes',
            'data' => [
                'token' => $token,
                'user' => $user->load('patient'),
                'role' => $user->role,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect',
                'errors' => [],
            ], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        if (!$user->is_active) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Votre compte a ete desactive. Contactez l\'administration.',
                'errors' => [],
            ], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token', ['*'], now()->addDay())->plainTextToken;

        return new JsonResponse([
            'success' => true,
            'message' => 'Connexion reussie',
            'data' => [
                'token' => $token,
                'user' => $user,
                'role' => $user->role,
                'redirect' => $this->getRedirectByRole($user->role),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return new JsonResponse([
            'success' => true,
            'message' => 'Profil recupere',
            'data' => $user,
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
        $request->validate(['email' => 'required|email']);

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
            'phone' => 'sometimes|nullable|string|max:25',
            'avatar' => 'sometimes|nullable|string|max:255',
            'fcm_token' => 'sometimes|nullable|string|max:500',
        ]);

        /** @var User $user */
        $user = $request->user();
        $user->fill($validated);
        $user->save();

        return new JsonResponse([
            'success' => true,
            'message' => 'Profil mis a jour',
            'data' => $user,
        ]);
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
            default => '/',
        };
    }
}
