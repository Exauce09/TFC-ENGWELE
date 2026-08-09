<?php

use App\Http\Controllers\Api\AccueilController;
use App\Http\Controllers\Api\AdmissionController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CaisseController;
use App\Http\Controllers\Api\ChirurgieController;
use App\Http\Controllers\Api\DentisterieController;
use App\Http\Controllers\Api\DossierController;
use App\Http\Controllers\Api\EchographieController;
use App\Http\Controllers\Api\EpisodeSoinController;
use App\Http\Controllers\Api\InfirmierController;
use App\Http\Controllers\Api\KinesitherapieController;
use App\Http\Controllers\Api\LaboratoireController;
use App\Http\Controllers\Api\MaterniteController;
use App\Http\Controllers\Api\MedecinController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PharmacieController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\TeleconsultationController;
use App\Http\Controllers\Api\RendezVousController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/departements', [PublicController::class, 'departements']);
    Route::get('/medecins', [PublicController::class, 'medecins']);
    Route::post('/rendez-vous/demande', [RendezVousController::class, 'demandePublique'])->middleware('throttle:30,1');

    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:60,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:60,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:60,1');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/patient/premiere-connexion', [AuthController::class, 'completeOnboarding']);

        Route::prefix('admissions')->group(function (): void {
            $staff = 'role:receptionniste,infirmier,laborantin,pharmacien,caissier,admin,medecin_generaliste,medecin_interne,pediatre,gynecologue,ophtalmologue,urgentiste';

            Route::get('/', [AdmissionController::class, 'index'])->middleware($staff);
            Route::post('/', [AdmissionController::class, 'store'])->middleware('role:receptionniste');
            Route::get('/{id}', [AdmissionController::class, 'show'])->middleware($staff);
            Route::patch('/{id}/triage', [AdmissionController::class, 'triage'])->middleware('role:infirmier,admin');
            Route::patch('/{id}/consultation', [AdmissionController::class, 'consultation'])->middleware('role:medecin_generaliste,medecin_interne,pediatre,gynecologue,ophtalmologue,urgentiste,admin');
            Route::patch('/{id}/prelevement', [AdmissionController::class, 'prelevement'])->middleware('role:infirmier,admin,medecin_generaliste,medecin_interne,pediatre,gynecologue,ophtalmologue,urgentiste');
            Route::post('/{id}/examens', [AdmissionController::class, 'examens'])->middleware('role:medecin_generaliste,medecin_interne,pediatre,gynecologue,ophtalmologue,urgentiste,laborantin,admin');
            Route::put('/{id}/examens/{examenId}', [AdmissionController::class, 'updateExamen'])->middleware('role:medecin_generaliste,medecin_interne,pediatre,gynecologue,ophtalmologue,urgentiste,laborantin,admin');
            Route::patch('/{id}/diagnostic', [AdmissionController::class, 'diagnostic'])->middleware('role:medecin_generaliste,medecin_interne,pediatre,gynecologue,ophtalmologue,urgentiste,admin');
            Route::post('/{id}/prescription', [AdmissionController::class, 'prescription'])->middleware('role:medecin_generaliste,medecin_interne,pediatre,gynecologue,ophtalmologue,urgentiste,pharmacien,admin');
            Route::patch('/{id}/initiation', [AdmissionController::class, 'initiation'])->middleware('role:medecin_generaliste,medecin_interne,pediatre,gynecologue,ophtalmologue,urgentiste,admin');
            Route::patch('/{id}/suivi', [AdmissionController::class, 'suivi'])->middleware('role:medecin_generaliste,medecin_interne,pediatre,gynecologue,ophtalmologue,urgentiste,receptionniste,admin');
        });

        Route::middleware('role:patient')->prefix('patient')->group(function (): void {
            Route::get('/dashboard', [PatientController::class, 'dashboard']);
            Route::get('/rendez-vous', [RendezVousController::class, 'mesRendezVous']);
            Route::get('/creneaux', [RendezVousController::class, 'creneaux']);
            Route::post('/rendez-vous', [RendezVousController::class, 'prendre']);
            Route::put('/rendez-vous/{id}/reporter', [RendezVousController::class, 'reporter']);
            Route::post('/rendez-vous/{id}/paiement', [RendezVousController::class, 'payer']);
            Route::delete('/rendez-vous/{id}', [RendezVousController::class, 'annuler']);
            Route::get('/dossier', [DossierController::class, 'monDossier']);
            Route::get('/prescriptions', [PrescriptionController::class, 'mesPrescriptions']);
            Route::get('/factures', [CaisseController::class, 'mesFactures']);
            Route::get('/factures/{id}', [CaisseController::class, 'mesFactureDetail']);
            Route::post('/factures/{id}/paiement', [CaisseController::class, 'payerFacture']);
        });

        Route::middleware('role:medecin_generaliste,medecin_interne,pediatre,gynecologue,ophtalmologue,urgentiste')
            ->prefix('medecin')->group(function (): void {
                Route::get('/dashboard', [MedecinController::class, 'dashboard']);
                Route::get('/planning', [MedecinController::class, 'planning']);
                Route::get('/patients', [DossierController::class, 'patients']);
                Route::get('/patients/{id}', [DossierController::class, 'showPatient']);
                Route::get('/dossiers', [DossierController::class, 'index']);
                Route::get('/dossiers/{id}', [DossierController::class, 'show']);
                Route::post('/dossiers', [DossierController::class, 'store']);
                Route::put('/dossiers/{id}', [DossierController::class, 'update']);
                Route::post('/prescriptions', [PrescriptionController::class, 'store']);
                Route::get('/prescriptions/{id}', [PrescriptionController::class, 'show']);
                Route::put('/prescriptions/{id}', [PrescriptionController::class, 'update']);
                Route::put('/prescriptions/{id}/annuler', [PrescriptionController::class, 'annuler']);
                Route::put('/rendez-vous/{id}/statut', [RendezVousController::class, 'updateStatut']);
                Route::get('/file-consultation', [EpisodeSoinController::class, 'fileConsultation']);
                Route::post('/episodes/{id}/decision', [EpisodeSoinController::class, 'decision']);
                Route::put('/episodes/{id}/avancer', [EpisodeSoinController::class, 'avancer']);
            });

        Route::middleware('role:infirmier')->prefix('infirmier')->group(function (): void {
            Route::get('/dashboard', [InfirmierController::class, 'dashboard']);
            Route::get('/patients', [InfirmierController::class, 'patients']);
            Route::get('/constantes', [InfirmierController::class, 'constantes']);
            Route::post('/constantes', [InfirmierController::class, 'enregistrerConstantes']);
            Route::get('/file-triage', [InfirmierController::class, 'fileTriageAdmissions']);
            Route::get('/file-prelevement', [InfirmierController::class, 'filePrelevement']);
            Route::get('/file-triage-episodes', [EpisodeSoinController::class, 'fileTriage']);
            Route::post('/episodes/{id}/triage', [EpisodeSoinController::class, 'triage']);
        });

        Route::middleware('role:laborantin')->prefix('laboratoire')->group(function (): void {
            Route::get('/dashboard', [LaboratoireController::class, 'dashboard']);
            Route::get('/analyses', [LaboratoireController::class, 'index']);
            Route::post('/analyses', [LaboratoireController::class, 'store']);
            Route::put('/analyses/{id}/resultats', [LaboratoireController::class, 'publierResultat']);
            Route::get('/patients', [LaboratoireController::class, 'patients']);
            Route::get('/file-examens', [LaboratoireController::class, 'fileExamens']);
        });

        Route::middleware('role:pharmacien')->prefix('pharmacie')->group(function (): void {
            Route::get('/dashboard', [PharmacieController::class, 'dashboard']);
            Route::get('/stock', [PharmacieController::class, 'stock']);
            Route::post('/stock', [PharmacieController::class, 'storeStock']);
            Route::put('/stock/{id}', [PharmacieController::class, 'updateStock']);
            Route::get('/ordonnances', [PharmacieController::class, 'ordonnances']);
            Route::put('/ordonnances/{id}/delivrer', [PharmacieController::class, 'delivrer']);
        });

        Route::middleware('role:caissier')->prefix('caisse')->group(function (): void {
            Route::get('/dashboard', [CaisseController::class, 'dashboard']);
            Route::get('/patients', [CaisseController::class, 'patients']);
            Route::get('/factures', [CaisseController::class, 'index']);
            Route::get('/factures/{id}', [CaisseController::class, 'show']);
            Route::post('/factures', [CaisseController::class, 'store']);
            Route::put('/factures/{id}/annuler', [CaisseController::class, 'annuler']);
            Route::get('/paiements', [CaisseController::class, 'paiements']);
            Route::post('/paiements', [CaisseController::class, 'enregistrerPaiement']);
        });

        Route::middleware('role:admin')->prefix('admin')->group(function (): void {
            Route::get('/dashboard/stats', [AdminController::class, 'stats']);
            Route::get('/patients', [AdminController::class, 'patients']);
            Route::get('/medecins', [AdminController::class, 'medecins']);
            Route::get('/departements', [AdminController::class, 'departements']);
            Route::post('/departements', [AdminController::class, 'storeDepartement']);
            Route::put('/departements/{id}', [AdminController::class, 'updateDepartement']);
            Route::get('/utilisateurs', [AdminController::class, 'utilisateurs']);
            Route::post('/utilisateurs', [AdminController::class, 'creerUtilisateur']);
            Route::put('/utilisateurs/{id}', [AdminController::class, 'updateUtilisateur']);
            Route::put('/utilisateurs/{id}/toggle', [AdminController::class, 'toggleUtilisateur']);
            Route::put('/patients/{id}/toggle', [AdminController::class, 'togglePatient']);
            Route::get('/rendez-vous', [RendezVousController::class, 'indexAdmin']);
            Route::put('/rendez-vous/{id}/statut', [RendezVousController::class, 'updateStatut']);
            Route::get('/demandes-rdv', [AdminController::class, 'demandesRdv']);
            Route::put('/demandes-rdv/{id}', [AdminController::class, 'traiterDemande']);
            Route::get('/facturation', [AdminController::class, 'facturation']);
        });

        Route::middleware('role:receptionniste')->prefix('accueil')->group(function (): void {
            Route::get('/dashboard', [AccueilController::class, 'dashboard']);
            Route::get('/demandes', [AccueilController::class, 'demandes']);
            Route::put('/demandes/{id}', [AccueilController::class, 'traiterDemande']);
            Route::post('/demandes/{id}/confirmer', [AccueilController::class, 'confirmerDemande']);
            Route::get('/rendez-vous', [AccueilController::class, 'rendezVous']);
            Route::post('/rendez-vous/{id}/convertir', [AccueilController::class, 'convertirRdv']);
            Route::post('/rendez-vous/{id}/absent', [AccueilController::class, 'marquerAbsent']);
            Route::get('/patients', [AccueilController::class, 'patients']);
            Route::get('/creneaux', [RendezVousController::class, 'creneaux']);
            Route::get('/episodes', [EpisodeSoinController::class, 'index']);
            Route::post('/episodes/arrivee', [EpisodeSoinController::class, 'enregistrerArrivee']);
            Route::get('/episodes/{id}', [EpisodeSoinController::class, 'show']);
        });

        Route::middleware('role:sage_femme')->prefix('maternite')->group(function (): void {
            Route::get('/dashboard', [MaterniteController::class, 'dashboard']);
            Route::get('/suivis', [MaterniteController::class, 'index']);
            Route::post('/suivis', [MaterniteController::class, 'store']);
            Route::get('/patients', [MaterniteController::class, 'patients']);
        });

        Route::middleware('role:chirurgien,anesthesiste')->prefix('chirurgie')->group(function (): void {
            Route::get('/dashboard', [ChirurgieController::class, 'dashboard']);
            Route::get('/operations', [ChirurgieController::class, 'index']);
            Route::post('/operations', [ChirurgieController::class, 'store']);
            Route::put('/operations/{id}/statut', [ChirurgieController::class, 'updateStatut']);
            Route::get('/patients', [ChirurgieController::class, 'patients']);
        });

        Route::middleware('role:echographiste')->prefix('echographie')->group(function (): void {
            Route::get('/dashboard', [EchographieController::class, 'dashboard']);
            Route::get('/examens', [EchographieController::class, 'index']);
            Route::post('/examens', [EchographieController::class, 'store']);
            Route::get('/patients', [EchographieController::class, 'patients']);
        });

        Route::middleware('role:kinesitherapeute')->prefix('kinesitherapie')->group(function (): void {
            Route::get('/dashboard', [KinesitherapieController::class, 'dashboard']);
            Route::get('/seances', [KinesitherapieController::class, 'index']);
            Route::post('/seances', [KinesitherapieController::class, 'store']);
            Route::get('/patients', [KinesitherapieController::class, 'patients']);
        });

        Route::middleware('role:dentiste')->prefix('dentisterie')->group(function (): void {
            Route::get('/dashboard', [DentisterieController::class, 'dashboard']);
            Route::get('/soins', [DentisterieController::class, 'index']);
            Route::post('/soins', [DentisterieController::class, 'store']);
            Route::get('/patients', [DentisterieController::class, 'patients']);
        });

        Route::get('/integrations/status', [IntegrationController::class, 'status']);
        Route::post('/integrations/fcm-token', [IntegrationController::class, 'registerFcmToken']);
        Route::get('/teleconsultation', [TeleconsultationController::class, 'mesSalles']);
        Route::post('/teleconsultation/{id}/rejoindre', [TeleconsultationController::class, 'rejoindre']);
        Route::post('/teleconsultation/{id}/fermer', [TeleconsultationController::class, 'fermer']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::put('/notifications/{id}/lu', [NotificationController::class, 'marquerLu']);
        Route::put('/notifications/tout-lire', [NotificationController::class, 'toutLire']);
    });
});
