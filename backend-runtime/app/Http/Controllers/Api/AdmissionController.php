<?php

namespace App\Http\Controllers\Api;

use App\Support\PatientCredentials;
use App\Enums\AdmissionStatut;
use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\Consultation;
use App\Models\ExamenLabo;
use App\Models\Medecin;
use App\Models\ParcoursPrescription;
use App\Models\Patient;
use App\Models\Triage;
use App\Models\User;
use App\Services\Parcours\AdmissionStateMachine;
use App\Services\Parcours\FacturationParcoursService;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * Parcours 9 étapes :
 * enregistre → triage → consultation_medicale
 *   → (opt) prelevement → examens_laboratoire
 *   → diagnostic_prescription → delivrance_medicaments
 *   → initiation_traitement → suivi
 */
class AdmissionController extends Controller
{
    private const WITH = [
        'patient.user:id,name,email,phone',
        'departement:id,nom,code',
        'enregistreur:id,name',
        'medecinReferent.user:id,name',
        'triage.infirmier:id,name',
        'consultations.medecin.user:id,name',
        'examensLabo',
        'prescriptions.medecin.user:id,name',
        'historiqueStatuts.user:id,name',
        'factureLignes',
    ];

    private const MEDECINS = [
        'medecin_generaliste', 'medecin_interne', 'pediatre',
        'gynecologue', 'ophtalmologue', 'urgentiste',
    ];

    public function __construct(
        private readonly AdmissionStateMachine $stateMachine,
        private readonly FacturationParcoursService $facturation,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Admission::with([
            'patient.user:id,name,phone',
            'departement:id,nom',
            'triage',
            'medecinReferent.user:id,name',
        ])->latest();

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }
        if ($request->boolean('actifs')) {
            $query->whereNotIn('statut', AdmissionStatut::statutsClotures());
        }

        $items = $query->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Liste des admissions',
            'data' => $items->items(),
            'meta' => [
                'total' => $items->total(),
                'statuts' => AdmissionStatut::labels(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Dossier parcours patient',
            'data' => Admission::with(self::WITH)->findOrFail($id),
        ]);
    }

    /** Étape 1 — Accueil (réceptionniste uniquement) → crée patient + dossier + identifiants espace patient */
    public function store(Request $request): JsonResponse
    {
        $this->assertRole($request, ['receptionniste']);

        $validated = $request->validate([
            'patient_id' => 'nullable|exists:patients,id',
            'name' => 'required_without:patient_id|string|max:100',
            'phone' => 'nullable|string|max:25',
            'email' => 'nullable|email|unique:users,email',
            'date_naissance' => 'nullable|date',
            'sexe' => 'nullable|in:M,F',
            'adresse' => 'nullable|string',
            'commune' => 'nullable|string|max:100',
            'contact_urgence_nom' => 'nullable|string|max:100',
            'contact_urgence_tel' => 'nullable|string|max:25',
            'contact_urgence_lien' => 'nullable|string|max:80',
            'assurance_type' => 'nullable|string|max:100',
            'assurance_numero' => 'nullable|string|max:80',
            'motif_arrivee' => 'required|string|max:255',
            'mode_arrivee' => 'nullable|in:walk_in,rdv,urgence,transfert',
            'departement_id' => 'required|exists:departements,id',
            'observations' => 'nullable|string',
        ]);

        $accesPatient = null;

        try {
            $admission = DB::transaction(function () use ($request, $validated, &$accesPatient) {
                if (! empty($validated['patient_id'])) {
                    $patient = Patient::findOrFail($validated['patient_id']);
                } else {
                    // 1re connexion : nom.prenom + mot de passe par défaut
                    $login = PatientCredentials::loginFromName($validated['name']);
                    $plainPassword = PatientCredentials::DEFAULT_PASSWORD;

                    $user = User::create([
                        'name' => $validated['name'],
                        'login_identifiant' => $login,
                        'email' => $validated['email'] ?? PatientCredentials::emailFromLogin($login),
                        'phone' => $validated['phone'] ?? null,
                        'password' => $plainPassword, // cast hashed
                        'role' => 'patient',
                        'is_active' => true,
                        'must_change_password' => true,
                        'profil_complet' => false,
                    ]);

                    $numero = 'PAT-'.str_pad((string) $user->id, 5, '0', STR_PAD_LEFT);

                    $patient = Patient::create([
                        'user_id' => $user->id,
                        'numero_patient' => $numero,
                        'date_naissance' => $validated['date_naissance'] ?? null,
                        'sexe' => $validated['sexe'] ?? 'M', // provisoire — patient complète
                        'adresse' => $validated['adresse'] ?? null,
                        'commune' => $validated['commune'] ?? 'Matete',
                        'contact_urgence_nom' => $validated['contact_urgence_nom'] ?? null,
                        'contact_urgence_tel' => $validated['contact_urgence_tel'] ?? null,
                        'contact_urgence_lien' => $validated['contact_urgence_lien'] ?? null,
                        'assurance_type' => $validated['assurance_type'] ?? null,
                        'assurance_numero' => $validated['assurance_numero'] ?? null,
                    ]);

                    $accesPatient = [
                        'numero_patient' => $numero,
                        'login' => $login,
                        'nom_complet' => $validated['name'],
                        'password' => $plainPassword,
                        'message' => '1re connexion : utilisez le nom (ou login) + mot de passe par défaut. Le patient complète son profil et change le mot de passe.',
                    ];
                }

                $admission = Admission::create([
                    'numero_admission' => Admission::genererNumero(),
                    'patient_id' => $patient->id,
                    'departement_id' => $validated['departement_id'],
                    'enregistre_par' => $request->user()->id,
                    'statut' => AdmissionStatut::Enregistre->value,
                    'mode_arrivee' => $validated['mode_arrivee'] ?? 'walk_in',
                    'motif_arrivee' => $validated['motif_arrivee'],
                    'observations' => $validated['observations'] ?? null,
                    'arrivee_at' => now(),
                    'facturation_ouverte' => true,
                ]);

                $admission->historiqueStatuts()->create([
                    'statut_avant' => null,
                    'statut_apres' => AdmissionStatut::Enregistre->value,
                    'user_id' => $request->user()->id,
                    'role_acteur' => $request->user()->role,
                    'commentaire' => 'Accueil : identification + motif — prise en charge',
                ]);

                $this->stateMachine->transition(
                    $admission,
                    AdmissionStatut::Triage,
                    $request->user(),
                    'Orienté vers le triage infirmier'
                );

                $this->facturation->facturerActe($admission, 'enregistrement');

                return $admission->fresh(self::WITH);
            });
        } catch (InvalidArgumentException $e) {
            return $this->errorTransition($e);
        }

        return response()->json([
            'success' => true,
            'message' => $accesPatient
                ? 'Patient et dossier créés — remettez les identifiants au patient'
                : 'Admission créée pour patient existant — orienté vers le triage',
            'data' => $admission,
            'acces_patient' => $accesPatient,
        ], 201);
    }

    /** Étape 2 — Triage (infirmier) → consultation médicale */
    public function triage(Request $request, int $id): JsonResponse
    {
        $this->assertRole($request, ['infirmier', 'admin']);

        $validated = $request->validate([
            'niveau_urgence' => 'required|in:critique,urgent,moins_urgent,non_urgent',
            'temperature' => 'nullable|numeric|min:30|max:45',
            'tension_arterielle' => 'nullable|string|max:20',
            'frequence_cardiaque' => 'nullable|integer|min:30|max:220',
            'frequence_respiratoire' => 'nullable|integer|min:5|max:60',
            'saturation_02' => 'nullable|integer|min:50|max:100',
            'glycemie' => 'nullable|numeric|min:0|max:30',
            'poids_kg' => 'nullable|numeric|min:1|max:400',
            'taille_cm' => 'nullable|numeric|min:30|max:250',
            'notes' => 'nullable|string',
        ]);

        $admission = Admission::findOrFail($id);

        try {
            $result = DB::transaction(function () use ($request, $admission, $validated) {
                Triage::updateOrCreate(
                    ['admission_id' => $admission->id],
                    [
                        ...$validated,
                        'infirmier_id' => $request->user()->id,
                        'triage_at' => now(),
                    ]
                );

                $this->stateMachine->transition(
                    $admission,
                    AdmissionStatut::ConsultationMedicale,
                    $request->user(),
                    'Triage terminé ('.$validated['niveau_urgence'].') — orienté médecin'
                );

                $this->facturation->facturerActe($admission, 'triage');

                return $admission->fresh(self::WITH);
            });
        } catch (InvalidArgumentException $e) {
            return $this->errorTransition($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Triage enregistré — orienté vers le médecin',
            'data' => $result,
        ]);
    }

    /** Étape 3 — Consultation médicale → prélèvement OU diagnostic direct */
    public function consultation(Request $request, int $id): JsonResponse
    {
        $this->assertRole($request, [...self::MEDECINS, 'admin']);

        $medecin = Medecin::where('user_id', $request->user()->id)->first();
        if (! $medecin && $request->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Profil médecin introuvable'], 422);
        }

        $validated = $request->validate([
            'motif' => 'nullable|string',
            'anamnese' => 'nullable|string',
            'examen_clinique' => 'nullable|string',
            'diagnostic_provisoire' => 'nullable|string',
            'observations' => 'nullable|string',
            'prescrire_examens' => 'nullable|boolean',
        ]);

        $admission = Admission::findOrFail($id);
        $medecinId = $medecin?->id ?? Medecin::query()->value('id');

        try {
            $result = DB::transaction(function () use ($request, $admission, $validated, $medecinId) {
                Consultation::create([
                    'admission_id' => $admission->id,
                    'medecin_id' => $medecinId,
                    'date_consultation' => now(),
                    'motif' => $validated['motif'] ?? $admission->motif_arrivee,
                    'anamnese' => $validated['anamnese'] ?? null,
                    'examen_clinique' => $validated['examen_clinique'] ?? null,
                    'diagnostic_provisoire' => $validated['diagnostic_provisoire'] ?? null,
                    'type_diagnostic' => 'provisoire',
                    'observations' => $validated['observations'] ?? null,
                ]);

                $admission->update(['medecin_referent_id' => $medecinId]);

                $next = ! empty($validated['prescrire_examens'])
                    ? AdmissionStatut::Prelevement
                    : AdmissionStatut::DiagnosticPrescription;

                $this->stateMachine->transition(
                    $admission,
                    $next,
                    $request->user(),
                    $next === AdmissionStatut::Prelevement
                        ? 'Examens prescrits — orienté prélèvement infirmier'
                        : 'Passage direct au diagnostic / prescription'
                );

                $this->facturation->facturerActe($admission, 'consultation');

                return $admission->fresh(self::WITH);
            });
        } catch (InvalidArgumentException $e) {
            return $this->errorTransition($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Consultation enregistrée',
            'data' => $result,
        ]);
    }

    /** Étape 4 — Prélèvement (infirmier) → laboratoire */
    public function prelevement(Request $request, int $id): JsonResponse
    {
        $this->assertRole($request, ['infirmier', 'admin', ...self::MEDECINS]);

        $validated = $request->validate([
            'notes' => 'nullable|string',
            'types_prelevement' => 'nullable|string|max:255',
            'precisions_medecin' => 'nullable|string',
        ]);

        $admission = Admission::findOrFail($id);

        try {
            $result = DB::transaction(function () use ($request, $admission, $validated) {
                $obs = trim(implode("\n", array_filter([
                    $admission->observations,
                    $validated['types_prelevement'] ?? null
                        ? 'Prélèvement : '.$validated['types_prelevement']
                        : null,
                    $validated['precisions_medecin'] ?? null
                        ? 'Précisions médecin : '.$validated['precisions_medecin']
                        : null,
                    $validated['notes'] ?? null,
                ])));
                $admission->update(['observations' => $obs ?: $admission->observations]);

                $this->stateMachine->transition(
                    $admission,
                    AdmissionStatut::ExamensLaboratoire,
                    $request->user(),
                    'Prélèvement effectué — transmis au laboratoire'
                );

                $this->facturation->facturerActe($admission, 'triage', 'Prélèvement infirmier', 2000);

                return $admission->fresh(self::WITH);
            });
        } catch (InvalidArgumentException $e) {
            return $this->errorTransition($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Prélèvement enregistré — transmis au labo',
            'data' => $result,
        ]);
    }

    /** Étape 5 — Analyses labo (laborantin) ; résultats → dossier pour le médecin */
    public function examens(Request $request, int $id): JsonResponse
    {
        $this->assertRole($request, [...self::MEDECINS, 'laborantin', 'admin']);

        $validated = $request->validate([
            'type_examen' => 'required|string|max:120',
            'indication' => 'nullable|string',
            'urgent' => 'nullable|boolean',
            'resultats' => 'nullable|array',
            'interpretation' => 'nullable|string',
            'statut' => 'nullable|in:prescrit,en_cours,termine,annule',
        ]);

        $admission = Admission::findOrFail($id);
        $isLabo = $request->user()->role === 'laborantin';

        try {
            $result = DB::transaction(function () use ($request, $admission, $validated, $isLabo) {
                $statut = $validated['statut']
                    ?? ($isLabo && ! empty($validated['resultats']) ? 'termine' : 'prescrit');

                $examen = ExamenLabo::create([
                    'admission_id' => $admission->id,
                    'prescrit_par' => $isLabo ? null : $request->user()->id,
                    'laborantin_id' => $isLabo ? $request->user()->id : null,
                    'type_examen' => $validated['type_examen'],
                    'indication' => $validated['indication'] ?? null,
                    'urgent' => $validated['urgent'] ?? false,
                    'statut' => $statut,
                    'resultats' => $validated['resultats'] ?? null,
                    'interpretation' => $validated['interpretation'] ?? null,
                    'prescrit_at' => now(),
                    'termine_at' => $statut === 'termine' ? now() : null,
                ]);

                // Médecin prescrit depuis consultation → prélèvement
                if ($admission->statut === AdmissionStatut::ConsultationMedicale->value) {
                    $this->stateMachine->transition(
                        $admission,
                        AdmissionStatut::Prelevement,
                        $request->user(),
                        'Examen prescrit : '.$validated['type_examen']
                    );
                    $admission->refresh();
                }

                $this->facturation->facturerActe(
                    $admission,
                    'examens_labo',
                    'Examen labo : '.$validated['type_examen']
                );

                return [
                    'admission' => $admission->fresh(self::WITH),
                    'examen' => $examen,
                ];
            });
        } catch (InvalidArgumentException $e) {
            return $this->errorTransition($e);
        }

        return response()->json([
            'success' => true,
            'message' => $isLabo && ($validated['statut'] ?? '') === 'termine'
                ? 'Résultats transmis au médecin'
                : 'Examen enregistré',
            'data' => $result,
        ], 201);
    }

    /** Étape 6 — Diagnostic + prescription (médecin) */
    public function diagnostic(Request $request, int $id): JsonResponse
    {
        $this->assertRole($request, [...self::MEDECINS, 'admin']);

        $validated = $request->validate([
            'diagnostic_final' => 'required|string',
            'code_cim10' => 'nullable|string|max:20',
            'decision' => 'nullable|string',
            'observations' => 'nullable|string',
            'medicaments' => 'nullable|array',
            'medicaments.*.nom' => 'required_with:medicaments|string',
            'medicaments.*.dosage' => 'nullable|string',
            'medicaments.*.frequence' => 'nullable|string',
            'medicaments.*.duree' => 'nullable|string',
        ]);

        $admission = Admission::findOrFail($id);
        $medecin = Medecin::where('user_id', $request->user()->id)->first();

        try {
            $result = DB::transaction(function () use ($request, $admission, $validated, $medecin) {
                $consultation = $admission->consultations()->latest()->first();
                if ($consultation) {
                    $consultation->update([
                        'diagnostic_final' => $validated['diagnostic_final'],
                        'code_cim10' => $validated['code_cim10'] ?? null,
                        'decision' => $validated['decision'] ?? $consultation->decision,
                        'type_diagnostic' => 'final',
                        'observations' => $validated['observations'] ?? $consultation->observations,
                    ]);
                } else {
                    Consultation::create([
                        'admission_id' => $admission->id,
                        'medecin_id' => $medecin?->id ?? Medecin::query()->value('id'),
                        'date_consultation' => now(),
                        'motif' => $admission->motif_arrivee,
                        'diagnostic_final' => $validated['diagnostic_final'],
                        'code_cim10' => $validated['code_cim10'] ?? null,
                        'decision' => $validated['decision'] ?? null,
                        'type_diagnostic' => 'final',
                        'observations' => $validated['observations'] ?? null,
                    ]);
                }

                if (! empty($validated['medicaments'])) {
                    ParcoursPrescription::create([
                        'admission_id' => $admission->id,
                        'medecin_id' => $medecin?->id ?? $admission->medecin_referent_id ?? Medecin::query()->value('id'),
                        'date_prescription' => now()->toDateString(),
                        'medicaments' => $validated['medicaments'],
                        'statut' => 'active',
                    ]);
                }

                // Depuis labo ou déjà en diagnostic_prescription (mise à jour)
                if (in_array($admission->statut, [
                    AdmissionStatut::ExamensLaboratoire->value,
                    AdmissionStatut::ConsultationMedicale->value,
                    AdmissionStatut::Prelevement->value,
                ], true)) {
                    if ($admission->statut === AdmissionStatut::ConsultationMedicale->value) {
                        $this->stateMachine->transition(
                            $admission,
                            AdmissionStatut::DiagnosticPrescription,
                            $request->user(),
                            'Diagnostic & prescription (sans examens)'
                        );
                    } elseif ($admission->statut === AdmissionStatut::Prelevement->value) {
                        $this->stateMachine->transition($admission, AdmissionStatut::ExamensLaboratoire, $request->user(), 'Labo considéré');
                        $admission->refresh();
                        $this->stateMachine->transition(
                            $admission,
                            AdmissionStatut::DiagnosticPrescription,
                            $request->user(),
                            'Interprétation résultats + prescription'
                        );
                    } else {
                        $this->stateMachine->transition(
                            $admission,
                            AdmissionStatut::DiagnosticPrescription,
                            $request->user(),
                            'Interprétation résultats + prescription'
                        );
                    }
                }

                $this->facturation->facturerActe($admission, 'diagnostic');

                return $admission->fresh(self::WITH);
            });
        } catch (InvalidArgumentException $e) {
            return $this->errorTransition($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Diagnostic & prescription enregistrés — orienté pharmacie',
            'data' => $result,
        ]);
    }

    /** Étape 7 — Délivrance (pharmacien) → initiation traitement */
    public function prescription(Request $request, int $id): JsonResponse
    {
        $this->assertRole($request, [...self::MEDECINS, 'pharmacien', 'admin']);

        $validated = $request->validate([
            'medicaments' => 'required|array|min:1',
            'medicaments.*.nom' => 'required|string',
            'medicaments.*.dosage' => 'nullable|string',
            'medicaments.*.frequence' => 'nullable|string',
            'medicaments.*.duree' => 'nullable|string',
            'posologie_generale' => 'nullable|string',
            'duree_jours' => 'nullable|integer|min:1|max:365',
            'delivrer' => 'nullable|boolean',
        ]);

        $admission = Admission::findOrFail($id);
        $medecin = Medecin::where('user_id', $request->user()->id)->first();
        $isPharmacien = $request->user()->role === 'pharmacien';

        try {
            $result = DB::transaction(function () use ($request, $admission, $validated, $medecin, $isPharmacien) {
                $delivrer = $isPharmacien || ! empty($validated['delivrer']);

                $prescription = ParcoursPrescription::create([
                    'admission_id' => $admission->id,
                    'medecin_id' => $medecin?->id ?? $admission->medecin_referent_id ?? Medecin::query()->value('id'),
                    'pharmacien_id' => $isPharmacien ? $request->user()->id : null,
                    'date_prescription' => now()->toDateString(),
                    'medicaments' => $validated['medicaments'],
                    'posologie_generale' => $validated['posologie_generale'] ?? null,
                    'duree_jours' => $validated['duree_jours'] ?? null,
                    'statut' => $delivrer ? 'delivree' : 'active',
                    'delivree_at' => $delivrer ? now() : null,
                ]);

                if ($delivrer && $admission->statut === AdmissionStatut::DiagnosticPrescription->value) {
                    $this->stateMachine->transition(
                        $admission,
                        AdmissionStatut::DelivranceMedicaments,
                        $request->user(),
                        'Médicaments délivrés — retour médecin pour initiation'
                    );
                    $this->facturation->facturerActe($admission, 'pharmacie_ambulatoire');
                } elseif (! $delivrer) {
                    $this->facturation->facturerActe($admission, 'pharmacie_ambulatoire', 'Prescription (en attente)', 1000);
                }

                return [
                    'admission' => $admission->fresh(self::WITH),
                    'prescription' => $prescription,
                ];
            });
        } catch (InvalidArgumentException $e) {
            return $this->errorTransition($e);
        }

        return response()->json([
            'success' => true,
            'message' => $isPharmacien ? 'Délivrance enregistrée' : 'Prescription enregistrée',
            'data' => $result,
        ], 201);
    }

    /** Étape 8 — Initiation du traitement (médecin) */
    public function initiation(Request $request, int $id): JsonResponse
    {
        $this->assertRole($request, [...self::MEDECINS, 'admin']);

        $validated = $request->validate([
            'notes_initiation' => 'nullable|string',
            'date_suivi_prevue' => 'nullable|date|after_or_equal:today',
        ]);

        $admission = Admission::findOrFail($id);

        try {
            $result = DB::transaction(function () use ($request, $admission, $validated) {
                $this->stateMachine->transition(
                    $admission,
                    AdmissionStatut::InitiationTraitement,
                    $request->user(),
                    $validated['notes_initiation'] ?? 'Début supervisé du traitement'
                );

                if (! empty($validated['date_suivi_prevue'])) {
                    $admission->update([
                        'date_suivi_prevue' => $validated['date_suivi_prevue'],
                        'consignes_sortie' => $validated['notes_initiation'] ?? $admission->consignes_sortie,
                    ]);
                } elseif (! empty($validated['notes_initiation'])) {
                    $admission->update(['consignes_sortie' => $validated['notes_initiation']]);
                }

                $this->facturation->facturerActe($admission, 'consultation', 'Initiation du traitement', 5000);

                return $admission->fresh(self::WITH);
            });
        } catch (InvalidArgumentException $e) {
            return $this->errorTransition($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Traitement initié',
            'data' => $result,
        ]);
    }

    /** Étape 9 — Suivi (RDV contrôle) */
    public function suivi(Request $request, int $id): JsonResponse
    {
        $this->assertRole($request, [...self::MEDECINS, 'receptionniste', 'admin']);

        $validated = $request->validate([
            'date_suivi_prevue' => 'nullable|date',
            'resume_sortie' => 'nullable|string',
            'consignes_sortie' => 'nullable|string',
        ]);

        $admission = Admission::findOrFail($id);

        try {
            $result = DB::transaction(function () use ($request, $admission, $validated) {
                $admission->update([
                    'sortie_at' => now(),
                    'date_suivi_prevue' => $validated['date_suivi_prevue'] ?? $admission->date_suivi_prevue,
                    'resume_sortie' => $validated['resume_sortie'] ?? null,
                    'consignes_sortie' => $validated['consignes_sortie'] ?? $admission->consignes_sortie,
                    'facturation_ouverte' => false,
                ]);

                $this->stateMachine->transition(
                    $admission,
                    AdmissionStatut::Suivi,
                    $request->user(),
                    'Suivi / contrôle planifié'
                );

                $this->facturation->facturerActe($admission, 'sortie');

                return $admission->fresh(self::WITH);
            });
        } catch (InvalidArgumentException $e) {
            return $this->errorTransition($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Passage en suivi',
            'data' => $result,
        ]);
    }

    /** @param list<string> $roles */
    private function assertRole(Request $request, array $roles): void
    {
        if (! in_array($request->user()->role, $roles, true)) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Accès refusé pour le rôle '.$request->user()->role,
            ], 403));
        }
    }

    private function errorTransition(InvalidArgumentException $e): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
        ], 422);
    }
}
