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
}
