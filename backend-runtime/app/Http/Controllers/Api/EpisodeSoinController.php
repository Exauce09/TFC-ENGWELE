<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DossierMedical;
use App\Models\EpisodeSoin;
use App\Models\Facture;
use App\Models\Patient;
use App\Models\User;
use App\Support\PatientCredentials;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EpisodeSoinController extends Controller
{
    private const WITH = [
        'patient.user:id,name,email,phone',
        'enregistreur:id,name',
        'triageur:id,name',
        'medecin.user:id,name',
        'dossier',
        'departement:id,nom,code',
    ];

    /** Liste des épisodes (file d'attente selon rôle / filtre). */
    public function index(Request $request): JsonResponse
    {
        $query = EpisodeSoin::with(self::WITH)->latest();

        if ($request->filled('etape')) {
            $query->where('etape', $request->etape);
        }
        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }
        if ($request->boolean('actifs', false)) {
            $query->whereNotIn('etape', ['termine']);
        }

        $items = $query->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Épisodes de soins',
            'data' => $items->items(),
            'meta' => [
                'total' => $items->total(),
                'etapes' => EpisodeSoin::LABELS,
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $episode = EpisodeSoin::with(self::WITH)->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Détail épisode',
            'data' => $episode,
        ]);
    }

    /**
     * Étape 1 — Accueil / Enregistrement à l'arrivée.
     * Seule la réception crée le patient (si nouveau) et ouvre le dossier médical.
     * Tout le parcours (triage, consultation, labo, caisse) est lié à ce dossier.
     */
    public function enregistrerArrivee(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'nullable|exists:patients,id',
            'name' => 'required_without:patient_id|string|max:100',
            'phone' => 'nullable|string|max:25',
            'email' => 'nullable|email|unique:users,email',
            'date_naissance' => 'nullable|date',
            'sexe' => 'nullable|in:M,F',
            'adresse' => 'nullable|string|max:255',
            'commune' => 'nullable|string|max:100',
            'motif_arrivee' => 'required|string|max:255',
            'mode_arrivee' => 'nullable|in:walk_in,rdv,urgence,transfert',
            'departement_id' => 'required|exists:departements,id',
            'observations' => 'nullable|string',
        ]);

        $result = DB::transaction(function () use ($request, $validated) {
            $nouveauPatient = false;
            $accesPatient = null;

            if (!empty($validated['patient_id'])) {
                $patient = Patient::findOrFail($validated['patient_id']);
            } else {
                $nouveauPatient = true;
                $login = PatientCredentials::loginFromName($validated['name']);
                $plainPassword = PatientCredentials::DEFAULT_PASSWORD;
                $user = User::create([
                    'name' => $validated['name'],
                    'login_identifiant' => $login,
                    'email' => $validated['email'] ?? PatientCredentials::emailFromLogin($login),
                    'phone' => $validated['phone'] ?? null,
                    'password' => $plainPassword,
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
                    'sexe' => $validated['sexe'] ?? 'M',
                    'adresse' => $validated['adresse'] ?? null,
                    'commune' => $validated['commune'] ?? 'Matete',
                ]);
                $accesPatient = [
                    'numero_patient' => $numero,
                    'login' => $login,
                    'nom_complet' => $validated['name'],
                    'password' => $plainPassword,
                    'message' => '1re connexion : nom (ou login) + mot de passe par défaut. Le patient complète son profil et change le mot de passe.',
                ];
            }

            $dossier = DossierMedical::create([
                'numero_dossier' => DossierMedical::genererNumero(),
                'patient_id' => $patient->id,
                'ouvert_par' => $request->user()->id,
                'medecin_id' => null,
                'departement_id' => $validated['departement_id'],
                'date_consultation' => now()->toDateString(),
                'motif' => $validated['motif_arrivee'],
                'observations' => $validated['observations'] ?? null,
                'statut' => 'ouvert',
                'ouvert_at' => now(),
            ]);

            $episode = EpisodeSoin::create([
                'numero_episode' => EpisodeSoin::genererNumero(),
                'patient_id' => $patient->id,
                'dossier_id' => $dossier->id,
                'enregistre_par' => $request->user()->id,
                'departement_id' => $validated['departement_id'],
                'etape' => 'triage',
                'motif_arrivee' => $validated['motif_arrivee'],
                'mode_arrivee' => $validated['mode_arrivee'] ?? 'walk_in',
                'observations' => $validated['observations'] ?? null,
                'facturation_ouverte' => true,
            ]);

            $this->creerLigneFacture($patient->id, $episode->id, 'Frais d\'accueil / ouverture dossier', 5000);

            return [
                'episode' => $episode->load(self::WITH),
                'nouveau_patient' => $nouveauPatient,
                'acces_patient' => $accesPatient,
            ];
        });

        $msg = ($result['nouveau_patient'] ? 'Patient créé. ' : 'Patient existant. ')
            .'Dossier '.$result['episode']->dossier?->numero_dossier.' ouvert — orienté vers le triage.';

        return response()->json([
            'success' => true,
            'message' => $msg,
            'data' => $result['episode'],
            'acces_patient' => $result['acces_patient'] ?? null,
        ], 201);
    }

    /**
     * Étape 2 — Triage infirmier (constantes + niveau d'urgence).
     */
    public function triage(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'niveau_urgence' => 'required|in:critique,urgent,moins_urgent,non_urgent',
            'notes_triage' => 'nullable|string',
            'temperature' => 'nullable|numeric|min:30|max:45',
            'tension_arterielle' => 'nullable|string|max:20',
            'frequence_cardiaque' => 'nullable|integer|min:30|max:220',
            'frequence_respiratoire' => 'nullable|integer|min:5|max:60',
            'saturation_02' => 'nullable|integer|min:50|max:100',
            'glycemie' => 'nullable|numeric|min:0|max:30',
            'poids_kg' => 'nullable|numeric|min:1|max:300',
            'observations' => 'nullable|string',
        ]);

        $episode = EpisodeSoin::findOrFail($id);

        if (!in_array($episode->etape, ['enregistrement', 'triage'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Cet épisode n\'est plus à l\'étape triage',
            ], 422);
        }

        DB::transaction(function () use ($request, $episode, $validated) {
            $episode->update([
                'etape' => 'consultation',
                'niveau_urgence' => $validated['niveau_urgence'],
                'notes_triage' => $validated['notes_triage'] ?? null,
                'triage_par' => $request->user()->id,
                'triage_at' => now(),
            ]);

            \App\Models\SoinInfirmier::create([
                'patient_id' => $episode->patient_id,
                'infirmier_id' => $request->user()->id,
                'dossier_id' => $episode->dossier_id,
                'date_soin' => now(),
                'temperature' => $validated['temperature'] ?? null,
                'tension_arterielle' => $validated['tension_arterielle'] ?? null,
                'frequence_cardiaque' => $validated['frequence_cardiaque'] ?? null,
                'frequence_respiratoire' => $validated['frequence_respiratoire'] ?? null,
                'saturation_02' => $validated['saturation_02'] ?? null,
                'glycemie' => $validated['glycemie'] ?? null,
                'poids_kg' => $validated['poids_kg'] ?? null,
                'observations' => $validated['observations'] ?? ('Triage: '.$validated['niveau_urgence']),
                'actes_realises' => 'Triage à l\'arrivée',
            ]);

            if ($episode->dossier_id) {
                DossierMedical::where('id', $episode->dossier_id)->update([
                    'statut' => 'en_consultation',
                ]);
            }

            $this->creerLigneFacture($episode->patient_id, $episode->id, 'Triage / constantes vitales', 3000);
        });

        return response()->json([
            'success' => true,
            'message' => 'Triage terminé — patient orienté vers consultation',
            'data' => $episode->fresh(self::WITH),
        ]);
    }

    /**
     * Étape 5 — Décision médicale (ambulatoire ou hospitalisation).
     */
    public function decision(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'circuit' => 'required|in:ambulatoire,hospitalisation',
            'decision_medicale' => 'required|string',
            'service_hospitalisation' => 'required_if:circuit,hospitalisation|nullable|string|max:100',
            'lit' => 'nullable|string|max:30',
            'consignes_sortie' => 'nullable|string',
            'date_suivi_prevue' => 'nullable|date',
            'dossier_id' => 'nullable|exists:dossiers_medicaux,id',
        ]);

        $episode = EpisodeSoin::findOrFail($id);

        $updates = [
            'circuit' => $validated['circuit'],
            'decision_medicale' => $validated['decision_medicale'],
            'decision_at' => now(),
            'dossier_id' => $validated['dossier_id'] ?? $episode->dossier_id,
            'etape' => $validated['circuit'] === 'hospitalisation' ? 'hospitalisation' : 'ambulatoire',
        ];

        if ($validated['circuit'] === 'hospitalisation') {
            $updates['service_hospitalisation'] = $validated['service_hospitalisation'] ?? null;
            $updates['lit'] = $validated['lit'] ?? null;
            $updates['admission_at'] = now();
            $this->creerLigneFacture($episode->patient_id, $episode->id, 'Admission hospitalisation', 25000);
        } else {
            $updates['consignes_sortie'] = $validated['consignes_sortie'] ?? null;
            $updates['date_suivi_prevue'] = $validated['date_suivi_prevue'] ?? null;
            $this->creerLigneFacture($episode->patient_id, $episode->id, 'Consultation / circuit ambulatoire', 15000);
        }

        $episode->update($updates);

        return response()->json([
            'success' => true,
            'message' => 'Décision enregistrée — circuit '.$validated['circuit'],
            'data' => $episode->fresh(self::WITH),
        ]);
    }

    /** Avancer vers examens / décision / sortie / suivi. */
    public function avancer(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'etape' => 'required|in:examens,decision,ambulatoire,hospitalisation,sorti,suivi_post_sortie,termine',
            'consignes_sortie' => 'nullable|string',
            'date_suivi_prevue' => 'nullable|date',
            'dossier_id' => 'nullable|exists:dossiers_medicaux,id',
        ]);

        $episode = EpisodeSoin::findOrFail($id);
        $updates = ['etape' => $validated['etape']];

        if (!empty($validated['dossier_id'])) {
            $updates['dossier_id'] = $validated['dossier_id'];
        }
        if ($validated['etape'] === 'sorti') {
            $updates['sortie_at'] = now();
            $updates['consignes_sortie'] = $validated['consignes_sortie'] ?? $episode->consignes_sortie;
            $updates['date_suivi_prevue'] = $validated['date_suivi_prevue'] ?? $episode->date_suivi_prevue;
            if ($updates['date_suivi_prevue'] ?? null) {
                $updates['etape'] = 'suivi_post_sortie';
            }
        }
        if ($validated['etape'] === 'termine') {
            $updates['facturation_ouverte'] = false;
        }

        $episode->update($updates);

        return response()->json([
            'success' => true,
            'message' => 'Étape mise à jour',
            'data' => $episode->fresh(self::WITH),
        ]);
    }

    /** File triage (infirmier). */
    public function fileTriage(): JsonResponse
    {
        $items = EpisodeSoin::with(self::WITH)
            ->whereIn('etape', ['enregistrement', 'triage'])
            ->orderByRaw("CASE niveau_urgence WHEN 'critique' THEN 1 WHEN 'urgent' THEN 2 WHEN 'moins_urgent' THEN 3 ELSE 4 END")
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'File de triage',
            'data' => $items,
        ]);
    }

    /** File consultation (médecin). */
    public function fileConsultation(): JsonResponse
    {
        $items = EpisodeSoin::with(self::WITH)
            ->whereIn('etape', ['consultation', 'examens', 'decision'])
            ->orderByRaw("CASE niveau_urgence WHEN 'critique' THEN 1 WHEN 'urgent' THEN 2 WHEN 'moins_urgent' THEN 3 ELSE 4 END")
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'File de consultation',
            'data' => $items,
        ]);
    }

    private function creerLigneFacture(int $patientId, int $episodeId, string $libelle, float $montant): void
    {
        $numero = 'FAC-EPS-'.$episodeId.'-'.now()->format('His');
        Facture::create([
            'numero_facture' => $numero,
            'patient_id' => $patientId,
            'caissier_id' => null,
            'date_facture' => now()->toDateString(),
            'lignes' => [
                [
                    'description' => $libelle.' (épisode #'.$episodeId.')',
                    'quantite' => 1,
                    'prix_unitaire' => $montant,
                    'montant' => $montant,
                ],
            ],
            'sous_total' => $montant,
            'remise' => 0,
            'montant_total' => $montant,
            'montant_paye' => 0,
            'reste_a_payer' => $montant,
            'statut' => 'emise',
        ]);
    }
}
