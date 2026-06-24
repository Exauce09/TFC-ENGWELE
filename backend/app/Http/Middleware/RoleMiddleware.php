<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles, true)) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Acces refuse. Vous n\'avez pas les droits necessaires.',
                'errors' => [
                    'required_roles' => $roles,
                    'your_role' => $user?->role,
                ],
            ], 403);
        }

        return $next($request);
    }
}
