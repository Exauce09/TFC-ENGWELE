<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Str;

/**
 * Identifiants de première connexion patient :
 * login = nom.prenom normalisé, mot de passe par défaut fixe.
 */
final class PatientCredentials
{
    public const DEFAULT_PASSWORD = 'Amen2026';

    /** "Marie Kalala" → "marie.kalala" */
    public static function loginFromName(string $fullName): string
    {
        $slug = Str::of($fullName)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '.')
            ->trim('.');

        $base = (string) $slug;
        if ($base === '') {
            $base = 'patient';
        }

        $candidate = $base;
        $i = 2;
        while (
            User::where('login_identifiant', $candidate)->exists()
            || User::where('email', $candidate.'@patient.amen.cd')->exists()
        ) {
            $candidate = $base.$i;
            $i++;
        }

        return $candidate;
    }

    public static function emailFromLogin(string $login): string
    {
        return $login.'@patient.amen.cd';
    }

    /** Fiche staff : login + mot de passe par défaut tant que le patient ne l’a pas changé. */
    public static function accesPourStaff(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        $pending = (bool) $user->must_change_password;

        return [
            'login' => $user->login_identifiant,
            'email' => $user->email,
            'password' => $pending ? self::DEFAULT_PASSWORD : null,
            'must_change_password' => $pending,
            'message' => $pending
                ? 'Remettez ces identifiants au patient. Il changera le mot de passe à la 1re connexion.'
                : 'Le patient a déjà changé son mot de passe. Réinitialisez-le pour lui renvoyer Amen2026.',
        ];
    }

    public static function resetPassword(User $user): array
    {
        $user->password = self::DEFAULT_PASSWORD;
        $user->must_change_password = true;
        $user->save();
        $user->tokens()->delete();

        return self::accesPourStaff($user->fresh()) ?? [];
    }
}
