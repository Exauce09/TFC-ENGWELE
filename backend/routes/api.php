<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CaisseController;
use App\Http\Controllers\Api\DossierController;
use App\Http\Controllers\Api\MedecinController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\RendezVousController;
use App\Http\Controllers\Api\AdminController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:60,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:60,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:60,1');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);

        Route::middleware('role:patient')->prefix('patient')->group(function (): void {
            Route::get('/dashboard', [PatientController::class, 'dashboard']);
            Route::get('/rendez-vous', [RendezVousController::class, 'mesRendezVous']);
            Route::post('/rendez-vous', [RendezVousController::class, 'prendre']);
            Route::delete('/rendez-vous/{id}', [RendezVousController::class, 'annuler']);
            Route::get('/dossier', [DossierController::class, 'monDossier']);
            Route::get('/factures', [CaisseController::class, 'mesFactures']);
        });

        Route::middleware('role:medecin_generaliste,medecin_interne,pediatre,gynecologue,ophtalmologue,urgentiste')
            ->prefix('medecin')
            ->group(function (): void {
                Route::get('/dashboard', [MedecinController::class, 'dashboard']);
                Route::get('/planning', [MedecinController::class, 'planning']);
                Route::get('/dossiers', [DossierController::class, 'index']);
                Route::put('/rendez-vous/{id}/statut', [RendezVousController::class, 'updateStatut']);
            });

        Route::middleware('role:caissier')->prefix('caisse')->group(function (): void {
            Route::post('/factures', [CaisseController::class, 'store']);
            Route::post('/paiements', [CaisseController::class, 'enregistrerPaiement']);
        });

        Route::middleware('role:admin')->prefix('admin')->group(function (): void {
            Route::get('/dashboard/stats', [AdminController::class, 'stats']);
        });

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::put('/notifications/{id}/lu', [NotificationController::class, 'marquerLu']);
        Route::put('/notifications/tout-lire', [NotificationController::class, 'toutLire']);
    });
});
