<?php

namespace App\Http\Controllers\Api;

use App\Enums\AdmissionStatut;
use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\DemandeRdv;
use App\Models\DossierMedical;
use App\Models\EpisodeSoin;
use App\Models\Medecin;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Services\CreneauService;
use App\Services\NotificationService;
use App\Services\Parcours\AdmissionStateMachine;
use App\Services\Parcours\FacturationParcoursService;
use App\Support\PatientCredentials;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccueilController extends Controller
{
    /** Un RDV valide est un RDV confirme (ou deja en cours / termine dans la journee). */
    private const STATUTS_RDV_CONFIRMES = ['confirme', 'en_cours', 'termine'];

    public function __construct(
        private AdmissionStateMachine $stateMachine,
        private FacturationParcoursService $facturation,
        private NotificationService $notifications,
        private CreneauService $creneaux,
    ) {}

    public function dashboard(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Dashboard accueil',
            'data' => [
                'demandes_nouvelles' => DemandeRdv::where('statut', 'nouvelle')->count()
                    + RendezVous::where('statut', 'en_attente')->whereDate('date_rdv', '>=', now()->toDateString())->count(),
                'rdv_du_jour' => RendezVous::whereDate('date_rdv', now()->toDateString())
                    ->whereIn('statut', [...self::STATUTS_RDV_CONFIRMES, 'en_attente'])
                    ->count(),
                'patients_total' => Patient::count(),
                'rdv_en_attente' => RendezVous::where('statut', 'en_attente')->whereDate('date_rdv', '>=', now())->count(),
                'en_attente_triage' => EpisodeSoin::whereIn('etape', ['enregistrement', 'triage'])->count(),
                'episodes_actifs' => EpisodeSoin::whereNotIn('etape', ['termine'])->count(),
            ],
        ]);
    }

    /**
     * Demandes à traiter :
     * - demandes_rdv (formulaire public / site)
     * - rendez_vous statut en_attente (créés depuis l'espace patient)
     */
    public function demandes(Request $request): JsonResponse
    {
        $statut = $request->get('statut', 'nouvelle');
        $items = collect();

        if (in_array($statut, ['nouvelle', 'toutes'], true)) {
            $publiques = DemandeRdv::with('departement')
                ->where('statut', 'nouvelle')
                ->orderBy('date_souhaitee')
                ->get()
                ->map(fn (DemandeRdv $d) => [
                    'id' => $d->id,
                    'source' => 'demande_publique',
                    'nom' => $d->nom,
                    'telephone' => $d->telephone,
                    'departement_id' => $d->departement_id,
                    'departement' => $d->departement,
                    'date_souhaitee' => $d->date_souhaitee,
                    'message' => $d->message,
                    'service_libelle' => $d->service_libelle,
                    'statut' => 'nouvelle',
                    'patient_id' => null,
                    'medecin_id' => null,
                    'heure_rdv' => null,
                ]);

            $rdvAttente = RendezVous::with(['patient.user', 'medecin.user', 'departement'])
                ->where('statut', 'en_attente')
                ->whereDate('date_rdv', '>=', now()->toDateString())
                ->orderBy('date_rdv')
                ->orderBy('heure_rdv')
                ->get()
                ->map(fn (RendezVous $r) => [
                    'id' => $r->id,
                    'source' => 'rendez_vous',
                    'nom' => $r->patient?->user?->name ?? 'Patient',
                    'telephone' => $r->patient?->user?->phone,
                    'departement_id' => $r->departement_id,
                    'departement' => $r->departement,
                    'date_souhaitee' => $r->date_rdv,
                    'heure_rdv' => $r->heure_rdv,
                    'message' => $r->motif,
                    'service_libelle' => $r->departement?->nom,
                    'statut' => 'nouvelle',
                    'patient_id' => $r->patient_id,
                    'medecin_id' => $r->medecin_id,
                    'medecin' => $r->medecin,
                    'patient' => $r->patient,
                    'numero_patient' => $r->patient?->numero_patient,
                ]);

            $items = $publiques->concat($rdvAttente)->sortBy('date_souhaitee')->values();
        }

        if ($statut === 'traitee') {
            $items = DemandeRdv::with('departement')
                ->where('statut', 'traitee')
                ->orderByDesc('updated_at')
                ->limit(30)
                ->get()
                ->map(fn (DemandeRdv $d) => [
                    'id' => $d->id,
                    'source' => 'demande_publique',
                    'nom' => $d->nom,
                    'telephone' => $d->telephone,
                    'departement' => $d->departement,
                    'date_souhaitee' => $d->date_souhaitee,
                    'message' => $d->message,
                    'statut' => 'traitee',
                ])
                ->concat(
                    RendezVous::with(['patient.user', 'medecin.user', 'departement'])
                        ->where('statut', 'confirme')
                        ->whereDate('date_rdv', '>=', now()->subDays(7)->toDateString())
                        ->orderByDesc('updated_at')
                        ->limit(30)
                        ->get()
                        ->map(fn (RendezVous $r) => [
                            'id' => $r->id,
                            'source' => 'rendez_vous',
                            'nom' => $r->patient?->user?->name,
                            'telephone' => $r->patient?->user?->phone,
                            'departement' => $r->departement,
                            'date_souhaitee' => $r->date_rdv,
                            'heure_rdv' => $r->heure_rdv,
                            'message' => $r->motif,
                            'statut' => 'traitee',
                            'medecin' => $r->medecin,
                        ])
                )
                ->values();
        }

        if ($statut === 'annulee') {
            $items = DemandeRdv::with('departement')
                ->where('statut', 'annulee')
                ->orderByDesc('updated_at')
                ->limit(30)
                ->get()
                ->map(fn (DemandeRdv $d) => [
                    'id' => $d->id,
                    'source' => 'demande_publique',
                    'nom' => $d->nom,
                    'telephone' => $d->telephone,
                    'departement' => $d->departement,
                    'date_souhaitee' => $d->date_souhaitee,
                    'message' => $d->message,
                    'statut' => 'annulee',
                ])
                ->concat(
                    RendezVous::with(['patient.user', 'departement'])
                        ->whereIn('statut', ['annule', 'absent'])
                        ->orderByDesc('updated_at')
                        ->limit(30)
                        ->get()
                        ->map(fn (RendezVous $r) => [
                            'id' => $r->id,
                            'source' => 'rendez_vous',
                            'nom' => $r->patient?->user?->name,
                            'telephone' => $r->patient?->user?->phone,
                            'departement' => $r->departement,
                            'date_souhaitee' => $r->date_rdv,
                            'message' => $r->motif,
                            'statut' => 'annulee',
                        ])
                )
                ->values();
        }

        return response()->json([
            'success' => true,
            'message' => 'Demandes de rendez-vous',
            'data' => $items,
            'meta' => [
                'total' => $items->count(),
                'a_confirmer' => DemandeRdv::where('statut', 'nouvelle')->count()
                    + RendezVous::where('statut', 'en_attente')->whereDate('date_rdv', '>=', now()->toDateString())->count(),
            ],
        ]);
    }

    /** Refus / remise en attente d'une demande (publique ou RDV patient). */
    public function traiterDemande(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'statut' => 'required|in:nouvelle,traitee,annulee',
            'source' => 'nullable|in:demande_publique,rendez_vous',
        ]);

        $source = $validated['source'] ?? 'demande_publique';

        if ($source === 'rendez_vous') {
            $rdv = RendezVous::findOrFail($id);
            $map = [
                'nouvelle' => 'en_attente',
                'traitee' => 'confirme',
                'annulee' => 'annule',
            ];
            $rdv->update(['statut' => $map[$validated['statut']]]);

            return response()->json([
                'success' => true,
                'message' => $validated['statut'] === 'annulee' ? 'Rendez-vous refusé' : 'Rendez-vous mis à jour',
                'data' => $rdv,
            ]);
        }

        $demande = DemandeRdv::findOrFail($id);
        $demande->update(['statut' => $validated['statut']]);

        return response()->json([
            'success' => true,
            'message' => $validated['statut'] === 'annulee' ? 'Demande refusee' : 'Demande mise a jour',
            'data' => $demande,
        ]);
    }

    /**
     * Confirmation d'une demande : cree / confirme un rendez-vous.
     */
    public function confirmerDemande(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'source' => 'nullable|in:demande_publique,rendez_vous',
            'patient_id' => 'nullable|exists:patients,id',
            'medecin_id' => 'nullable|exists:medecins,id',
            'date_rdv' => 'nullable|date|after_or_equal:today',
            'heure_rdv' => 'nullable|date_format:H:i',
            'motif' => 'nullable|string|max:255',
        ]);

        $source = $validated['source'] ?? 'demande_publique';

        if ($source === 'rendez_vous') {
            $rdv = RendezVous::with(['patient.user', 'medecin.user', 'departement'])->findOrFail($id);
            $medecinId = (int) ($validated['medecin_id'] ?? $rdv->medecin_id);
            $date = $validated['date_rdv'] ?? $rdv->date_rdv?->toDateString();
            $heure = isset($validated['heure_rdv'])
                ? Carbon::createFromFormat('H:i', $validated['heure_rdv'])->format('H:i')
                : Carbon::parse($rdv->heure_rdv)->format('H:i');

            if ($medecinId && $date && $heure
                && ! $this->creneaux->estDisponible($medecinId, $date, $heure, $rdv->id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce créneau n\'est pas disponible pour ce médecin.',
                ], 422);
            }

            $rdv->update([
                'statut' => 'confirme',
                'medecin_id' => $medecinId ?: $rdv->medecin_id,
                'date_rdv' => $date ?? $rdv->date_rdv,
                'heure_rdv' => $heure,
                'motif' => $validated['motif'] ?? $rdv->motif,
            ]);

            $fresh = $rdv->fresh(['patient.user', 'medecin.user', 'departement']);
            if ($fresh->medecin?->user) {
                $this->notifications->notify(
                    $fresh->medecin->user,
                    'Rendez-vous confirmé',
                    ($fresh->patient?->user?->name ?? 'Patient').' le '.($date ?? '').' à '.$heure,
                    'rdv_confirme',
                    ['rendez_vous_id' => $fresh->id],
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Rendez-vous patient confirmé — visible chez le médecin.',
                'data' => $fresh,
            ]);
        }

        $validatedFull = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'medecin_id' => 'required|exists:medecins,id',
            'date_rdv' => 'required|date|after_or_equal:today',
            'heure_rdv' => 'required|date_format:H:i',
            'motif' => 'nullable|string|max:255',
        ]);

        $heure = Carbon::createFromFormat('H:i', $validatedFull['heure_rdv'])->format('H:i');
        if (! $this->creneaux->estDisponible(
            (int) $validatedFull['medecin_id'],
            $validatedFull['date_rdv'],
            $heure,
        )) {
            return response()->json([
                'success' => false,
                'message' => 'Ce créneau n\'est pas disponible. Choisissez un autre horaire.',
            ], 422);
        }

        $demande = DemandeRdv::findOrFail($id);
        $medecin = Medecin::with('user')->findOrFail($validatedFull['medecin_id']);

        $rdv = RendezVous::create([
            'patient_id' => $validatedFull['patient_id'],
            'medecin_id' => $medecin->id,
            'departement_id' => $medecin->departement_id ?? $demande->departement_id,
            'date_rdv' => $validatedFull['date_rdv'],
            'heure_rdv' => $heure,
            'heure_fin' => Carbon::createFromFormat('H:i', $heure)
                ->addMinutes(CreneauService::DUREE_MINUTES)
                ->format('H:i'),
            'motif' => $validatedFull['motif'] ?? $demande->message ?? $demande->service_libelle,
            'statut' => 'confirme',
            'type' => 'presentiel',
            'cree_par' => $request->user()->id,
        ]);

        $demande->update(['statut' => 'traitee']);

        if ($medecin->user) {
            $patientName = Patient::with('user')->find($validatedFull['patient_id'])?->user?->name ?? 'Patient';
            $this->notifications->notify(
                $medecin->user,
                'Nouveau rendez-vous confirmé',
                "{$patientName} le {$validatedFull['date_rdv']} à {$heure}",
                'rdv_confirme',
                ['rendez_vous_id' => $rdv->id],
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous confirme. Visible dans le planning du medecin.',
            'data' => $rdv->load(['patient.user:id,name,phone', 'medecin.user:id,name', 'departement:id,nom']),
        ]);
    }

    /** Rendez-vous du jour (confirmés + en attente). */
    public function rendezVous(Request $request): JsonResponse
    {
        $date = $request->get('date', now()->toDateString());

        $items = RendezVous::with(['patient.user', 'medecin.user', 'departement'])
            ->whereDate('date_rdv', $date)
            ->whereIn('statut', [...self::STATUTS_RDV_CONFIRMES, 'en_attente'])
            ->orderBy('heure_rdv')
            ->paginate(50);

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous du jour',
            'data' => $items->items(),
            'meta' => ['total' => $items->total(), 'date' => $date],
        ]);
    }

    /** Liste / recherche patients (récents si q vide). */
    public function patients(Request $request): JsonResponse
    {
        $q = trim((string) $request->get('q', ''));

        $patients = Patient::with([
            'user:id,name,email,phone,login_identifiant,must_change_password',
            'dossiers.medecin.user:id,name',
            'dossiers.departement:id,nom',
            'admissionActive.departement:id,nom',
            'admissionActive.medecinReferent.user:id,name',
        ])
            ->when($q !== '', fn ($query) => $query->where(
                fn ($sub) => $sub->where('numero_patient', 'like', "%{$q}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")
                        ->orWhere('phone', 'like', "%{$q}%")
                        ->orWhere('login_identifiant', 'like', "%{$q}%"))
            ))
            ->orderByDesc('id')
            ->limit($q !== '' ? 30 : 50)
            ->get()
            ->map(function (Patient $patient) {
                $dossier = $patient->dossiers->first();
                $admission = $patient->admissionActive;

                return [
                    'id' => $patient->id,
                    'numero_patient' => $patient->numero_patient,
                    'date_naissance' => $patient->date_naissance?->toDateString(),
                    'age_declare' => $patient->age_declare,
                    'sexe' => $patient->sexe,
                    'etat_civil' => $patient->etat_civil,
                    'adresse' => $patient->adresse,
                    'quartier' => $patient->quartier,
                    'commune' => $patient->commune,
                    'ville' => $patient->ville,
                    'piece_identite_type' => $patient->piece_identite_type,
                    'piece_identite_numero' => $patient->piece_identite_numero,
                    'photo' => $patient->photo,
                    'contact_urgence_nom' => $patient->contact_urgence_nom,
                    'contact_urgence_lien' => $patient->contact_urgence_lien,
                    'contact_urgence_tel' => $patient->contact_urgence_tel,
                    'allergies' => $patient->allergies,
                    'antecedents_medicaux' => $patient->antecedents_medicaux,
                    'assurance_type' => $patient->assurance_type,
                    'assurance_numero' => $patient->assurance_numero,
                    'user' => $patient->user,
                    'acces' => PatientCredentials::accesPourStaff($patient->user),
                    'nombre_dossiers' => $patient->dossiers->count(),
                    'dossier' => $dossier ? [
                        'id' => $dossier->id,
                        'numero_dossier' => $dossier->numero_dossier,
                        'statut' => $dossier->statut,
                        'motif' => $dossier->motif,
                        'date_consultation' => $dossier->date_consultation?->toDateString(),
                        'departement' => $dossier->departement?->nom,
                    ] : null,
                    'medecin_en_charge' => $admission?->medecinReferent?->user?->name
                        ?? $dossier?->medecin?->user?->name,
                    'admission_active' => $admission ? [
                        'id' => $admission->id,
                        'numero_admission' => $admission->numero_admission,
                        'statut' => $admission->statut,
                        'statut_label' => $admission->statut_label,
                        'departement' => $admission->departement?->nom,
                    ] : null,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Patients',
            'data' => $patients,
        ]);
    }

    public function resetPatientPassword(int $id): JsonResponse
    {
        $patient = Patient::with('user')->findOrFail($id);
        $user = $patient->user;
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Compte patient introuvable',
            ], 404);
        }

        $acces = PatientCredentials::resetPassword($user);

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe réinitialisé. Remettez ces identifiants au patient.',
            'data' => ['acces' => $acces],
        ]);
    }

    /**
     * Jour J — patient présenté : convertit le RDV en admission (accueil)
     * et marque le RDV « terminé » (patient reçu).
     */
    public function convertirRdv(Request $request, int $id): JsonResponse
    {
        $rdv = RendezVous::with(['patient.user', 'medecin.user', 'departement'])->findOrFail($id);

        if (! in_array($rdv->statut, ['confirme', 'en_attente', 'en_cours'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Ce rendez-vous ne peut pas être converti (statut : '.$rdv->statut.')',
            ], 422);
        }

        if (Admission::where('rdv_id', $rdv->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Une admission existe déjà pour ce rendez-vous',
            ], 422);
        }

        $admission = DB::transaction(function () use ($request, $rdv) {
            $admission = Admission::create([
                'numero_admission' => Admission::genererNumero(),
                'patient_id' => $rdv->patient_id,
                'rdv_id' => $rdv->id,
                'departement_id' => $rdv->departement_id,
                'medecin_referent_id' => $rdv->medecin_id,
                'enregistre_par' => $request->user()->id,
                'statut' => AdmissionStatut::Enregistre->value,
                'mode_arrivee' => 'rdv',
                'type_visite' => 'consultation',
                'mode_paiement' => 'cash',
                'motif_arrivee' => $rdv->motif ?: 'Rendez-vous du jour',
                'arrivee_at' => now(),
                'facturation_ouverte' => true,
            ]);

            $admission->historiqueStatuts()->create([
                'statut_avant' => null,
                'statut_apres' => AdmissionStatut::Enregistre->value,
                'user_id' => $request->user()->id,
                'role_acteur' => $request->user()->role,
                'commentaire' => 'Conversion RDV #'.$rdv->id.' → accueil (patient reçu)',
            ]);

            $this->stateMachine->transition(
                $admission,
                AdmissionStatut::Triage,
                $request->user(),
                'Orienté vers le triage infirmier (depuis RDV)'
            );

            DossierMedical::create([
                'numero_dossier' => DossierMedical::genererNumero(),
                'patient_id' => $rdv->patient_id,
                'ouvert_par' => $request->user()->id,
                'medecin_id' => $rdv->medecin_id,
                'departement_id' => $rdv->departement_id,
                'date_consultation' => now()->toDateString(),
                'motif' => $rdv->motif ?: 'Rendez-vous du jour',
                'statut' => 'ouvert',
                'ouvert_at' => now(),
            ]);

            $this->facturation->facturerActe($admission, 'enregistrement');

            // Patient présenté : RDV reste visible chez le médecin (en cours).
            $rdv->update(['statut' => 'en_cours']);

            return $admission->fresh([
                'patient.user',
                'departement',
                'medecinReferent.user',
                'rendezVousOrigine',
            ]);
        });

        $rdv->load(['patient.user', 'medecin.user']);

        if ($rdv->patient?->user) {
            $this->notifications->notify(
                $rdv->patient->user,
                'Accueil enregistré',
                'Vous êtes enregistré à l\'accueil. Orientez-vous vers le triage.',
                'system',
                ['admission_id' => $admission->id, 'rendez_vous_id' => $rdv->id],
            );
        }

        if ($rdv->medecin?->user) {
            $this->notifications->notify(
                $rdv->medecin->user,
                'Patient arrivé',
                ($rdv->patient?->user?->name ?? 'Patient').' est à l\'accueil pour son RDV.',
                'rdv_confirme',
                ['rendez_vous_id' => $rdv->id, 'admission_id' => $admission->id],
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Patient reçu — admission créée, RDV visible chez le médecin',
            'data' => [
                'admission' => $admission,
                'rendez_vous' => $rdv->fresh(['patient.user', 'medecin.user', 'departement']),
            ],
        ], 201);
    }

    /** Jour J — non présenté : marque absent (créneau clos, plus réservable). */
    public function marquerAbsent(Request $request, int $id): JsonResponse
    {
        $rdv = RendezVous::with(['patient.user'])->findOrFail($id);

        if (! in_array($rdv->statut, ['confirme', 'en_attente'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les RDV en attente ou confirmés peuvent être marqués absents',
            ], 422);
        }

        $rdv->update(['statut' => 'absent']);

        if ($rdv->patient?->user) {
            $this->notifications->notify(
                $rdv->patient->user,
                'Absence enregistrée',
                'Vous ne vous êtes pas présenté à votre rendez-vous. Reprenez un créneau si besoin.',
                'rdv_annule',
                ['rendez_vous_id' => $rdv->id],
                sendSms: true,
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Patient marqué absent',
            'data' => $rdv->fresh(['patient.user', 'medecin.user', 'departement']),
        ]);
    }
}
