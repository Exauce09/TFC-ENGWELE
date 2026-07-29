<?php

namespace App\Http\Controllers\Api;

use App\Support\PatientCredentials;
use App\Enums\AdmissionStatut;
use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\Consultation;
use App\Models\DossierMedical;
use App\Models\ExamenLabo;
use App\Models\Medecin;
use App\Models\NoteSuiviAmbulatoire;
use App\Models\ParcoursPrescription;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Models\StockMedicament;
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
use Illuminate\Validation\ValidationException;
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
        'examensLabo.prescritPar:id,name',
        'examensLabo.laborantin:id,name',
        'prescriptions.medecin.user:id,name',
        'prescriptions.pharmacien:id,name',
        'notesSuivi.auteur:id,name',
        'rdvSuivi',
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

    /** Champs de la fiche patient renseignes par l'accueil (les vides sont ignores). */
    private function champsPatient(array $validated): array
    {
        $champs = [
            'date_naissance', 'age_declare', 'sexe', 'etat_civil',
            'adresse', 'quartier', 'commune', 'ville',
            'piece_identite_type', 'piece_identite_numero', 'photo',
            'contact_urgence_nom', 'contact_urgence_tel', 'contact_urgence_lien',
            'assurance_type', 'assurance_numero',
            'allergies', 'antecedents_medicaux',
        ];

        return collect($champs)
            ->filter(fn (string $champ) => isset($validated[$champ]) && $validated[$champ] !== '')
            ->mapWithKeys(fn (string $champ) => [$champ => $validated[$champ]])
            ->all();
    }

    /** Étape 1 — Accueil (réceptionniste uniquement) → crée patient + dossier + identifiants espace patient */
    public function store(Request $request): JsonResponse
    {
        $this->assertRole($request, ['receptionniste']);

        $validated = $request->validate([
            // 1. Identification du patient
            'patient_id' => 'nullable|exists:patients,id',
            'name' => 'required_without:patient_id|string|max:100',
            'phone' => 'nullable|string|max:25',
            'email' => 'nullable|email|unique:users,email',
            'date_naissance' => 'nullable|date|before:today',
            'age_declare' => 'nullable|integer|min:0|max:120',
            'sexe' => 'nullable|in:M,F',
            'etat_civil' => 'nullable|in:celibataire,marie,divorce,veuf,autre',
            'adresse' => 'nullable|string|max:255',
            'quartier' => 'nullable|string|max:100',
            'commune' => 'nullable|string|max:100',
            'ville' => 'nullable|string|max:80',
            'piece_identite_type' => 'nullable|in:carte_electeur,carte_identite,passeport,permis_conduire,acte_naissance,carte_eleve,piece_tuteur,aucune,autre',
            'piece_identite_numero' => 'nullable|string|max:60',
            'photo' => 'nullable|string|max:900000',

            // 2. Informations administratives
            'type_visite' => 'nullable|in:consultation,urgence,hospitalisation,suivi',
            'departement_id' => 'required|exists:departements,id',
            'medecin_id' => 'nullable|exists:medecins,id',
            'mode_paiement' => 'nullable|in:cash,assurance,mutuelle,employeur',
            'assurance_type' => 'nullable|string|max:100',
            'assurance_numero' => 'nullable|string|max:80',
            'mode_arrivee' => 'nullable|in:walk_in,rdv,urgence,transfert',
            'arrivee_at' => 'nullable|date',

            // 3. Contact d'urgence
            'contact_urgence_nom' => 'nullable|string|max:100',
            'contact_urgence_lien' => 'nullable|string|max:80',
            'contact_urgence_tel' => 'nullable|string|max:25',

            // 4. Motif de la visite (triage rapide)
            'motif_arrivee' => 'required|string|max:255',
            'niveau_urgence_accueil' => 'nullable|in:leger,modere,urgent,critique',
            'allergies' => 'nullable|string|max:500',
            'antecedents_medicaux' => 'nullable|string|max:1000',
            'observations' => 'nullable|string',
        ]);

        // Le rendez-vous est reserve aux patients deja enregistres a l'hopital.
        if (empty($validated['patient_id']) && ($validated['mode_arrivee'] ?? null) === 'rdv') {
            throw ValidationException::withMessages([
                'mode_arrivee' => 'Le mode « rendez-vous » est reserve aux patients deja enregistres. Une premiere venue est enregistree sans rendez-vous.',
            ]);
        }

        $accesPatient = null;

        try {
            $admission = DB::transaction(function () use ($request, $validated, &$accesPatient) {
                if (! empty($validated['patient_id'])) {
                    $patient = Patient::findOrFail($validated['patient_id']);

                    // L'accueil peut corriger les informations d'un patient connu.
                    $misAJour = $this->champsPatient($validated);
                    if ($misAJour !== []) {
                        $patient->update($misAJour);
                    }
                    if (! empty($validated['phone'])) {
                        $patient->user?->update(['phone' => $validated['phone']]);
                    }
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

                    $patient = Patient::create(array_merge([
                        'user_id' => $user->id,
                        'numero_patient' => $numero,
                        'sexe' => $validated['sexe'] ?? 'M', // provisoire — patient complète
                        'commune' => $validated['commune'] ?? 'Matete',
                        'ville' => $validated['ville'] ?? 'Kinshasa',
                    ], $this->champsPatient($validated)));

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
                    'medecin_referent_id' => $validated['medecin_id'] ?? null,
                    'enregistre_par' => $request->user()->id,
                    'statut' => AdmissionStatut::Enregistre->value,
                    'mode_arrivee' => $validated['mode_arrivee'] ?? 'walk_in',
                    'type_visite' => $validated['type_visite'] ?? 'consultation',
                    'mode_paiement' => $validated['mode_paiement'] ?? 'cash',
                    'niveau_urgence_accueil' => $validated['niveau_urgence_accueil'] ?? null,
                    'motif_arrivee' => $validated['motif_arrivee'],
                    'observations' => $validated['observations'] ?? null,
                    'arrivee_at' => $validated['arrivee_at'] ?? now(),
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

                // Ouvre aussi un dossier médical (espace médecin / consultations)
                DossierMedical::create([
                    'numero_dossier' => DossierMedical::genererNumero(),
                    'patient_id' => $patient->id,
                    'ouvert_par' => $request->user()->id,
                    'medecin_id' => $validated['medecin_id'] ?? null,
                    'departement_id' => $validated['departement_id'],
                    'date_consultation' => now()->toDateString(),
                    'motif' => $validated['motif_arrivee'],
                    'statut' => 'ouvert',
                    'ouvert_at' => now(),
                ]);

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
            'examens' => 'nullable|array',
            'examens.*.type_examen' => 'required_with:examens|string|max:120',
            'examens.*.categorie' => 'nullable|in:biologie,imagerie,autre',
            'examens.*.indication' => 'nullable|string',
            'examens.*.priorite' => 'nullable|in:routine,urgent,stat',
            'examens.*.type_echantillon' => 'nullable|string|max:80',
            'examens.*.conditions_prelevement' => 'nullable|string|max:120',
        ]);

        if (! empty($validated['prescrire_examens']) && empty($validated['examens'])) {
            return response()->json([
                'success' => false,
                'message' => 'Indiquez au moins un examen à prescrire (type NFS, glycémie…).',
                'errors' => ['examens' => ['Au moins un examen est requis']],
            ], 422);
        }

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

                $prescrire = ! empty($validated['prescrire_examens']) && ! empty($validated['examens']);

                if ($prescrire) {
                    foreach ($validated['examens'] as $ex) {
                        $priorite = $ex['priorite'] ?? 'routine';
                        ExamenLabo::create([
                            'admission_id' => $admission->id,
                            'prescrit_par' => $request->user()->id,
                            'type_examen' => $ex['type_examen'],
                            'categorie' => $ex['categorie'] ?? 'biologie',
                            'indication' => $ex['indication'] ?? null,
                            'urgent' => $priorite !== 'routine',
                            'priorite' => $priorite,
                            'type_echantillon' => $ex['type_echantillon'] ?? null,
                            'conditions_prelevement' => $ex['conditions_prelevement'] ?? null,
                            'statut' => 'prescrit',
                            'prescrit_at' => now(),
                        ]);
                    }
                }

                $next = $prescrire
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
            'type_echantillon' => 'nullable|string|max:80',
            'conditions_prelevement' => 'nullable|string|max:120',
            'numero_echantillon' => 'nullable|string|max:60',
            'precisions_medecin' => 'nullable|string',
        ]);

        $admission = Admission::findOrFail($id);

        try {
            $result = DB::transaction(function () use ($request, $admission, $validated) {
                $typeEchantillon = $validated['type_echantillon']
                    ?? $validated['types_prelevement']
                    ?? null;
                $numero = $validated['numero_echantillon']
                    ?? ('ECH-'.now()->format('YmdHis').'-'.$admission->id);

                $obs = trim(implode("\n", array_filter([
                    $admission->observations,
                    $typeEchantillon ? 'Prélèvement : '.$typeEchantillon : null,
                    ($validated['conditions_prelevement'] ?? null)
                        ? 'Conditions : '.$validated['conditions_prelevement']
                        : null,
                    'N° échantillon : '.$numero,
                    $validated['precisions_medecin'] ?? null
                        ? 'Précisions médecin : '.$validated['precisions_medecin']
                        : null,
                    $validated['notes'] ?? null,
                ])));
                $admission->update(['observations' => $obs ?: $admission->observations]);

                // Enrichir les examens prescrits en attente
                $admission->examensLabo()
                    ->whereIn('statut', ['prescrit', 'en_cours'])
                    ->each(function (ExamenLabo $ex) use ($validated, $typeEchantillon, $numero) {
                        $ex->update([
                            'type_echantillon' => $typeEchantillon ?? $ex->type_echantillon,
                            'conditions_prelevement' => $validated['conditions_prelevement'] ?? $ex->conditions_prelevement,
                            'numero_echantillon' => $numero,
                            'preleve_at' => now(),
                            'statut' => 'en_cours',
                        ]);
                    });

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

    /** Étape 5 — Prescrire un examen (médecin) ou créer une analyse */
    public function examens(Request $request, int $id): JsonResponse
    {
        $this->assertRole($request, [...self::MEDECINS, 'laborantin', 'admin']);

        $validated = $request->validate([
            'type_examen' => 'required|string|max:120',
            'categorie' => 'nullable|in:biologie,imagerie,autre',
            'indication' => 'nullable|string',
            'urgent' => 'nullable|boolean',
            'priorite' => 'nullable|in:routine,urgent,stat',
            'type_echantillon' => 'nullable|string|max:80',
            'conditions_prelevement' => 'nullable|string|max:120',
            'resultats' => 'nullable|array',
            'resultats.*.parametre' => 'required_with:resultats|string',
            'resultats.*.valeur' => 'nullable|string',
            'resultats.*.unite' => 'nullable|string',
            'resultats.*.norme' => 'nullable|string',
            'resultats.*.ref_min' => 'nullable|numeric',
            'resultats.*.ref_max' => 'nullable|numeric',
            'resultats.*.flag' => 'nullable|in:N,H,L,critique',
            'interpretation' => 'nullable|string',
            'technique' => 'nullable|string|max:120',
            'statut' => 'nullable|in:prescrit,en_cours,termine,annule',
        ]);

        $admission = Admission::findOrFail($id);
        $isLabo = $request->user()->role === 'laborantin';
        $priorite = $validated['priorite']
            ?? (($validated['urgent'] ?? false) ? 'urgent' : 'routine');

        try {
            $result = DB::transaction(function () use ($request, $admission, $validated, $isLabo, $priorite) {
                $statut = $validated['statut']
                    ?? ($isLabo && ! empty($validated['resultats']) ? 'termine' : 'prescrit');

                $examen = ExamenLabo::create([
                    'admission_id' => $admission->id,
                    'prescrit_par' => $isLabo ? null : $request->user()->id,
                    'laborantin_id' => $isLabo ? $request->user()->id : null,
                    'type_examen' => $validated['type_examen'],
                    'categorie' => $validated['categorie'] ?? 'biologie',
                    'indication' => $validated['indication'] ?? null,
                    'urgent' => $priorite !== 'routine',
                    'priorite' => $priorite,
                    'type_echantillon' => $validated['type_echantillon'] ?? null,
                    'conditions_prelevement' => $validated['conditions_prelevement'] ?? null,
                    'statut' => $statut,
                    'resultats' => $validated['resultats'] ?? null,
                    'interpretation' => $validated['interpretation'] ?? null,
                    'technique' => $validated['technique'] ?? null,
                    'prescrit_at' => now(),
                    'recu_labo_at' => $isLabo ? now() : null,
                    'termine_at' => $statut === 'termine' ? now() : null,
                ]);

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

                if ($statut === 'termine') {
                    $this->maybeAdvanceAfterLabResults($admission, $request->user());
                }

                return [
                    'admission' => $admission->fresh(self::WITH),
                    'examen' => $examen->fresh(),
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

    /** Publier / mettre à jour les résultats d'un examen labo (laborantin) */
    public function updateExamen(Request $request, int $id, int $examenId): JsonResponse
    {
        $this->assertRole($request, ['laborantin', 'admin', ...self::MEDECINS]);

        $validated = $request->validate([
            'resultats' => 'nullable|array',
            'resultats.*.parametre' => 'required_with:resultats|string',
            'resultats.*.valeur' => 'nullable|string',
            'resultats.*.unite' => 'nullable|string',
            'resultats.*.norme' => 'nullable|string',
            'resultats.*.ref_min' => 'nullable|numeric',
            'resultats.*.ref_max' => 'nullable|numeric',
            'resultats.*.flag' => 'nullable|in:N,H,L,critique',
            'interpretation' => 'nullable|string',
            'technique' => 'nullable|string|max:120',
            'statut' => 'nullable|in:prescrit,en_cours,termine,annule',
            'numero_echantillon' => 'nullable|string|max:60',
            'recu_labo_at' => 'nullable|date',
            'commentaire_medecin' => 'nullable|string',
            'valider_lecture' => 'nullable|boolean',
        ]);

        $admission = Admission::findOrFail($id);
        $examen = ExamenLabo::where('admission_id', $admission->id)->findOrFail($examenId);
        $isLabo = $request->user()->role === 'laborantin';
        $isMedecin = in_array($request->user()->role, self::MEDECINS, true);

        try {
            $result = DB::transaction(function () use ($request, $admission, $examen, $validated, $isLabo, $isMedecin) {
                $data = [];

                if (array_key_exists('resultats', $validated)) {
                    $data['resultats'] = $validated['resultats'];
                }
                if (array_key_exists('interpretation', $validated)) {
                    $data['interpretation'] = $validated['interpretation'];
                }
                if (array_key_exists('technique', $validated)) {
                    $data['technique'] = $validated['technique'];
                }
                if (! empty($validated['numero_echantillon'])) {
                    $data['numero_echantillon'] = $validated['numero_echantillon'];
                }
                if (! empty($validated['recu_labo_at'])) {
                    $data['recu_labo_at'] = $validated['recu_labo_at'];
                } elseif ($isLabo && ! $examen->recu_labo_at) {
                    $data['recu_labo_at'] = now();
                }

                $statut = $validated['statut'] ?? null;
                if (! $statut && $isLabo && ! empty($validated['resultats'])) {
                    $statut = 'termine';
                }
                if ($statut) {
                    $data['statut'] = $statut;
                    if ($statut === 'termine') {
                        $data['termine_at'] = now();
                    }
                }

                if ($isLabo) {
                    $data['laborantin_id'] = $request->user()->id;
                }

                if ($isMedecin && ! empty($validated['valider_lecture'])) {
                    $data['commentaire_medecin'] = $validated['commentaire_medecin'] ?? $examen->commentaire_medecin;
                    $data['valide_par_medecin_at'] = now();
                } elseif ($isMedecin && array_key_exists('commentaire_medecin', $validated)) {
                    $data['commentaire_medecin'] = $validated['commentaire_medecin'];
                }

                $examen->update($data);

                if (($data['statut'] ?? null) === 'termine') {
                    $this->maybeAdvanceAfterLabResults($admission, $request->user());
                }

                return [
                    'admission' => $admission->fresh(self::WITH),
                    'examen' => $examen->fresh(['prescritPar', 'laborantin']),
                ];
            });
        } catch (InvalidArgumentException $e) {
            return $this->errorTransition($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Examen mis à jour',
            'data' => $result,
        ]);
    }

    /** Si tous les examens sont terminés et admission encore au labo → prêt pour diagnostic (reste sur examens_laboratoire, le médecin avance via diagnostic) */
    private function maybeAdvanceAfterLabResults(Admission $admission, User $user): void
    {
        $admission->refresh();
        if ($admission->statut !== AdmissionStatut::ExamensLaboratoire->value
            && $admission->statut !== AdmissionStatut::Prelevement->value) {
            return;
        }

        $pending = $admission->examensLabo()
            ->whereNotIn('statut', ['termine', 'annule'])
            ->exists();

        if ($pending) {
            return;
        }

        // Remonter au statut examens_laboratoire si encore en prélèvement
        if ($admission->statut === AdmissionStatut::Prelevement->value) {
            $this->stateMachine->transition(
                $admission,
                AdmissionStatut::ExamensLaboratoire,
                $user,
                'Tous les résultats labo disponibles'
            );
        }
        // Le médecin passe ensuite à diagnostic_prescription via PATCH diagnostic
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
                        'numero_ordonnance' => ParcoursPrescription::genererNumero(),
                        'medecin_id' => $medecin?->id ?? $admission->medecin_referent_id ?? Medecin::query()->value('id'),
                        'date_prescription' => now()->toDateString(),
                        'medicaments' => $validated['medicaments'],
                        'diagnostic_motif' => $validated['diagnostic_final'],
                        'statut' => 'active',
                        'allergies_signalees' => $admission->patient?->allergies,
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
            'prescription_id' => 'nullable|integer|exists:parcours_prescriptions,id',
            'medicaments' => 'nullable|array|min:1',
            'medicaments.*.nom' => 'required_with:medicaments|string',
            'medicaments.*.dosage' => 'nullable|string',
            'medicaments.*.frequence' => 'nullable|string',
            'medicaments.*.duree' => 'nullable|string',
            'medicaments.*.quantite' => 'nullable|integer|min:1',
            'posologie_generale' => 'nullable|string',
            'duree_jours' => 'nullable|integer|min:1|max:365',
            'delivrer' => 'nullable|boolean',
            'notes_pharmacien' => 'nullable|string',
            'lignes_delivrance' => 'nullable|array',
            'lignes_delivrance.*.medicament_nom' => 'required_with:lignes_delivrance|string',
            'lignes_delivrance.*.quantite' => 'nullable|integer|min:1',
            'lignes_delivrance.*.stock_medicament_id' => 'nullable|integer|exists:stock_medicaments,id',
            'lignes_delivrance.*.numero_lot' => 'nullable|string|max:100',
            'lignes_delivrance.*.date_expiration' => 'nullable|date',
            'lignes_delivrance.*.substitue' => 'nullable|boolean',
        ]);

        $admission = Admission::findOrFail($id);
        $medecin = Medecin::where('user_id', $request->user()->id)->first();
        $isPharmacien = $request->user()->role === 'pharmacien';
        $delivrer = $isPharmacien || ! empty($validated['delivrer']);

        if (! $delivrer && empty($validated['medicaments']) && empty($validated['prescription_id'])) {
            throw ValidationException::withMessages([
                'medicaments' => ['Médicaments requis pour une nouvelle prescription.'],
            ]);
        }

        try {
            $result = DB::transaction(function () use ($request, $admission, $validated, $medecin, $isPharmacien, $delivrer) {
                $prescription = null;

                if (! empty($validated['prescription_id'])) {
                    $prescription = ParcoursPrescription::where('admission_id', $admission->id)
                        ->findOrFail($validated['prescription_id']);
                } elseif ($delivrer && $isPharmacien) {
                    $prescription = $admission->prescriptions()
                        ->where('statut', 'active')
                        ->latest('id')
                        ->first();
                }

                if ($prescription && $delivrer) {
                    $lignes = $validated['lignes_delivrance'] ?? $this->buildLignesDelivrance($prescription->medicaments ?? []);
                    $this->appliquerStockDelivrance($lignes);

                    $prescription->update([
                        'pharmacien_id' => $isPharmacien ? $request->user()->id : $prescription->pharmacien_id,
                        'statut' => 'delivree',
                        'delivree_at' => now(),
                        'lignes_delivrance' => $lignes,
                        'notes_pharmacien' => $validated['notes_pharmacien'] ?? $prescription->notes_pharmacien,
                        'allergies_signalees' => $admission->patient?->allergies ?? $prescription->allergies_signalees,
                    ]);
                } elseif (! empty($validated['medicaments'])) {
                    $lignes = $delivrer
                        ? ($validated['lignes_delivrance'] ?? $this->buildLignesDelivrance($validated['medicaments']))
                        : null;
                    if ($delivrer && $lignes) {
                        $this->appliquerStockDelivrance($lignes);
                    }

                    $prescription = ParcoursPrescription::create([
                        'admission_id' => $admission->id,
                        'numero_ordonnance' => ParcoursPrescription::genererNumero(),
                        'medecin_id' => $medecin?->id ?? $admission->medecin_referent_id ?? Medecin::query()->value('id'),
                        'pharmacien_id' => $isPharmacien ? $request->user()->id : null,
                        'date_prescription' => now()->toDateString(),
                        'medicaments' => $validated['medicaments'],
                        'lignes_delivrance' => $lignes,
                        'posologie_generale' => $validated['posologie_generale'] ?? null,
                        'duree_jours' => $validated['duree_jours'] ?? null,
                        'statut' => $delivrer ? 'delivree' : 'active',
                        'delivree_at' => $delivrer ? now() : null,
                        'notes_pharmacien' => $validated['notes_pharmacien'] ?? null,
                        'allergies_signalees' => $admission->patient?->allergies,
                    ]);
                }

                if (! $prescription) {
                    throw ValidationException::withMessages([
                        'prescription_id' => ['Aucune ordonnance active à délivrer pour cette admission.'],
                    ]);
                }

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
                    'prescription' => $prescription->fresh(['medecin.user', 'pharmacien']),
                ];
            });
        } catch (InvalidArgumentException $e) {
            return $this->errorTransition($e);
        }

        return response()->json([
            'success' => true,
            'message' => $isPharmacien ? 'Délivrance enregistrée (lot / stock tracés)' : 'Prescription enregistrée',
            'data' => $result,
        ], 201);
    }

    /** @param list<array<string, mixed>> $medicaments */
    private function buildLignesDelivrance(array $medicaments): array
    {
        $lignes = [];
        foreach ($medicaments as $med) {
            $nom = $med['nom_dci'] ?? $med['nom'] ?? '';
            $qty = (int) ($med['quantite'] ?? 1);
            $stock = StockMedicament::where('nom', 'like', '%'.$nom.'%')
                ->orWhere('dci', 'like', '%'.$nom.'%')
                ->orderBy('date_expiration')
                ->first();

            $lignes[] = [
                'medicament_nom' => $nom,
                'quantite' => $qty,
                'stock_medicament_id' => $stock?->id,
                'numero_lot' => $stock?->numero_lot,
                'date_expiration' => $stock?->date_expiration?->toDateString(),
                'substitue' => false,
            ];
        }

        return $lignes;
    }

    /** @param list<array<string, mixed>> $lignes */
    private function appliquerStockDelivrance(array $lignes): void
    {
        foreach ($lignes as $ligne) {
            $qty = max(1, (int) ($ligne['quantite'] ?? 1));
            $stock = null;
            if (! empty($ligne['stock_medicament_id'])) {
                $stock = StockMedicament::find($ligne['stock_medicament_id']);
            } elseif (! empty($ligne['medicament_nom'])) {
                $stock = StockMedicament::where('nom', 'like', '%'.$ligne['medicament_nom'].'%')->first();
            }
            if ($stock && $stock->quantite_stock >= $qty) {
                $stock->decrement('quantite_stock', $qty);
            } elseif ($stock && $stock->quantite_stock > 0) {
                $stock->update(['quantite_stock' => 0]);
            }
        }
    }

    /** Étape 8 — Initiation du traitement (médecin) */
    public function initiation(Request $request, int $id): JsonResponse
    {
        $this->assertRole($request, [...self::MEDECINS, 'admin']);

        $validated = $request->validate([
            'notes_initiation' => 'nullable|string',
            'date_suivi_prevue' => 'nullable|date|after_or_equal:today',
            'education_therapeutique' => 'nullable|string',
            'vigilance' => 'nullable|string',
        ]);

        $admission = Admission::findOrFail($id);

        try {
            $result = DB::transaction(function () use ($request, $admission, $validated) {
                $notes = trim(implode("\n", array_filter([
                    $validated['notes_initiation'] ?? null,
                    ($validated['education_therapeutique'] ?? null)
                        ? 'Éducation thérapeutique : '.$validated['education_therapeutique']
                        : null,
                    ($validated['vigilance'] ?? null)
                        ? 'Vigilance : '.$validated['vigilance']
                        : null,
                ])));

                $this->stateMachine->transition(
                    $admission,
                    AdmissionStatut::InitiationTraitement,
                    $request->user(),
                    $notes !== '' ? $notes : 'Début supervisé du traitement'
                );

                $admission->update([
                    'date_suivi_prevue' => $validated['date_suivi_prevue'] ?? $admission->date_suivi_prevue,
                    'consignes_sortie' => $notes !== '' ? $notes : $admission->consignes_sortie,
                ]);

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

    /** Étape 9 — Suivi (RDV contrôle + notes) */
    public function suivi(Request $request, int $id): JsonResponse
    {
        $this->assertRole($request, [...self::MEDECINS, 'receptionniste', 'admin']);

        $validated = $request->validate([
            'date_suivi_prevue' => 'nullable|date',
            'heure_suivi' => 'nullable|date_format:H:i',
            'resume_sortie' => 'nullable|string',
            'consignes_sortie' => 'nullable|string',
            'note_evolution' => 'nullable|string',
            'constantes' => 'nullable|array',
            'plan_suivi' => 'nullable|string',
            'creer_rdv' => 'nullable|boolean',
        ]);

        $admission = Admission::findOrFail($id);

        try {
            $result = DB::transaction(function () use ($request, $admission, $validated) {
                $dateSuivi = $validated['date_suivi_prevue'] ?? $admission->date_suivi_prevue;
                $rdvId = $admission->rdv_suivi_id;

                if (! empty($validated['creer_rdv']) && $dateSuivi) {
                    $medecinId = $admission->medecin_referent_id
                        ?? Medecin::where('user_id', $request->user()->id)->value('id')
                        ?? Medecin::query()->value('id');

                    $rdv = RendezVous::create([
                        'patient_id' => $admission->patient_id,
                        'medecin_id' => $medecinId,
                        'departement_id' => $admission->departement_id,
                        'date_rdv' => $dateSuivi,
                        'heure_rdv' => $validated['heure_suivi'] ?? '09:00',
                        'motif' => 'Contrôle / suivi post-consultation — '.$admission->numero_admission,
                        'statut' => 'confirme',
                        'type' => 'presentiel',
                        'notes_rdv' => $validated['consignes_sortie'] ?? $admission->consignes_sortie,
                        'cree_par' => $request->user()->id,
                    ]);
                    $rdvId = $rdv->id;
                }

                if (! empty($validated['note_evolution'])) {
                    NoteSuiviAmbulatoire::create([
                        'admission_id' => $admission->id,
                        'auteur_id' => $request->user()->id,
                        'date_note' => now()->toDateString(),
                        'evolution' => $validated['note_evolution'],
                        'constantes' => $validated['constantes'] ?? null,
                        'plan' => $validated['plan_suivi'] ?? null,
                    ]);
                }

                $admission->update([
                    'sortie_at' => now(),
                    'date_suivi_prevue' => $dateSuivi,
                    'rdv_suivi_id' => $rdvId,
                    'resume_sortie' => $validated['resume_sortie'] ?? $admission->resume_sortie,
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
