<?php

namespace App\Http\Controllers\Api;

use App\Enums\AdmissionStatut;
use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\DossierMedical;
use App\Models\ExamenLabo;
use App\Models\Medecin;
use App\Models\ParcoursPrescription;
use App\Models\Prescription;
use App\Models\RendezVous;
use App\Services\StaffProfileService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class MedecinController extends Controller
{
    /** Statuts visibles dans la file médecin (triage orienté + après triage). */
    private const STATUTS_FILE = [
        AdmissionStatut::Triage->value,
        AdmissionStatut::ConsultationMedicale->value,
    ];

    /**
     * Profil médecin si le rôle en a un ; sinon null (ex. sage-femme / kiné → filtre par département).
     */
    private function resolveMedecin(Request $request): ?Medecin
    {
        $user = $request->user();
        StaffProfileService::ensureProfil($user->fresh());

        return Medecin::where('user_id', $user->id)->first();
    }

    /** Scope RDV : assignés au clinicien, sinon RDV du département du service. */
    private function scopeRendezVousPourClinicien($query, Request $request, ?Medecin $medecin)
    {
        if ($medecin) {
            return $query->where('medecin_id', $medecin->id);
        }

        $deptId = $request->user()->departement_id;
        if ($deptId) {
            return $query->where('departement_id', $deptId);
        }

        return $query->whereRaw('1 = 0');
    }

    /**
     * File de consultation : UNIQUEMENT les patients affectés à CE médecin.
     * Sources d'affectation (OR) :
     *  - admissions.medecin_referent_id
     *  - RDV d'origine (rendez_vous.medecin_id)
     *  - dossier médical ouvert du même patient (dossiers_medicaux.medecin_id)
     *
     * Un confrère ne voit jamais un patient déjà affecté à un autre médecin.
     */
    private function scopeAdmissionsAssigneesAuMedecin(Builder $query, Medecin $medecin): Builder
    {
        return $query->where(function (Builder $q) use ($medecin) {
            $q->where('medecin_referent_id', $medecin->id)
                ->orWhereHas(
                    'rendezVousOrigine',
                    fn (Builder $r) => $r->where('medecin_id', $medecin->id)
                )
                ->orWhereExists(function ($sub) use ($medecin) {
                    $sub->selectRaw('1')
                        ->from('dossiers_medicaux')
                        ->whereColumn('dossiers_medicaux.patient_id', 'admissions.patient_id')
                        ->where('dossiers_medicaux.medecin_id', $medecin->id)
                        ->whereIn('dossiers_medicaux.statut', ['ouvert', 'en_consultation']);
                });
        });
    }

    /**
     * Répare medecin_referent_id manquant si le RDV / dossier pointe déjà vers ce médecin.
     */
    private function reparerAffectationsManquantes(Medecin $medecin): int
    {
        return Admission::query()
            ->whereNull('medecin_referent_id')
            ->whereIn('statut', self::STATUTS_FILE)
            ->where(function (Builder $q) use ($medecin) {
                $q->whereHas(
                    'rendezVousOrigine',
                    fn (Builder $r) => $r->where('medecin_id', $medecin->id)
                )->orWhereExists(function ($sub) use ($medecin) {
                    $sub->selectRaw('1')
                        ->from('dossiers_medicaux')
                        ->whereColumn('dossiers_medicaux.patient_id', 'admissions.patient_id')
                        ->where('dossiers_medicaux.medecin_id', $medecin->id)
                        ->whereIn('dossiers_medicaux.statut', ['ouvert', 'en_consultation']);
                });
            })
            ->update(['medecin_referent_id' => $medecin->id]);
    }

    /** @return Collection<int, Admission> */
    private function fileConsultationPourMedecin(Medecin $medecin): Collection
    {
        $this->reparerAffectationsManquantes($medecin);

        return Admission::with([
            'patient.user:id,name,phone',
            'departement:id,nom',
            'triage',
            'medecinReferent.user:id,name',
            'rendezVousOrigine',
        ])
            ->whereIn('statut', self::STATUTS_FILE)
            ->where(function (Builder $q) use ($medecin) {
                $this->scopeAdmissionsAssigneesAuMedecin($q, $medecin);
            })
            ->orderByRaw("CASE niveau_urgence_accueil
                WHEN 'critique' THEN 1
                WHEN 'urgent' THEN 2
                WHEN 'modere' THEN 3
                WHEN 'leger' THEN 4
                ELSE 5 END")
            ->orderBy('arrivee_at')
            ->limit(40)
            ->get();
    }

    public function dashboard(Request $request): JsonResponse
    {
        $medecin = $this->resolveMedecin($request);
        $today = now()->toDateString();

        $rdvTodayQuery = RendezVous::with(['patient.user', 'patient', 'departement'])
            ->whereDate('date_rdv', $today)
            ->whereIn('statut', ['confirme', 'en_cours', 'en_attente', 'termine']);
        $this->scopeRendezVousPourClinicien($rdvTodayQuery, $request, $medecin);
        $rdvToday = $rdvTodayQuery->orderBy('heure_rdv')->get();

        // File : uniquement le médecin affecté (pas de partage départemental).
        $fileConsultation = $medecin
            ? $this->fileConsultationPourMedecin($medecin)
            : collect();

        $examensEnAttente = 0;
        $ordonnancesActives = 0;
        $dossiersRecents = collect();
        $examensDisponibles = collect();
        $dossiersSemaine = 0;
        $dossiersMois = 0;

        if ($medecin) {
            $examensEnAttente = ExamenLabo::whereHas(
                'admission',
                fn ($q) => $q->where('medecin_referent_id', $medecin->id)
            )
                ->whereIn('statut', ['prescrit', 'en_cours'])
                ->count();

            $ordonnancesActives = Prescription::where('medecin_id', $medecin->id)
                ->where('statut', 'active')
                ->count()
                + ParcoursPrescription::where('medecin_id', $medecin->id)
                    ->where('statut', 'active')
                    ->count();

            $dossiersRecents = DossierMedical::with(['patient.user', 'departement', 'diagnostics'])
                ->where('medecin_id', $medecin->id)
                ->latest('date_consultation')
                ->limit(5)
                ->get();

            $examensDisponibles = ExamenLabo::with([
                'admission.patient.user:id,name',
                'admission:id,patient_id,numero_admission',
            ])
                ->whereHas(
                    'admission',
                    fn ($q) => $q->where('medecin_referent_id', $medecin->id)
                )
                ->where('statut', 'termine')
                ->latest('termine_at')
                ->limit(8)
                ->get();

            $dossiersSemaine = DossierMedical::where('medecin_id', $medecin->id)
                ->where('date_consultation', '>=', now()->startOfWeek())
                ->count();
            $dossiersMois = DossierMedical::where('medecin_id', $medecin->id)
                ->where('date_consultation', '>=', now()->startOfMonth())
                ->count();
        }

        $prochainRdv = $rdvToday->first(fn ($r) => in_array($r->statut, ['confirme', 'en_attente', 'en_cours'], true));
        $prochainFile = $fileConsultation->first();

        $prochainsQuery = RendezVous::with(['patient.user', 'departement'])
            ->whereDate('date_rdv', '>', $today)
            ->whereIn('statut', ['confirme', 'en_attente', 'en_cours']);
        $this->scopeRendezVousPourClinicien($prochainsQuery, $request, $medecin);
        $prochainsRdv = $prochainsQuery->orderBy('date_rdv')->orderBy('heure_rdv')->limit(8)->get();

        return response()->json([
            'success' => true,
            'message' => 'Dashboard medecin',
            'data' => [
                'rdv_du_jour' => $rdvToday->whereIn('statut', ['confirme', 'en_cours', 'en_attente'])->count(),
                'rdv_en_attente' => $rdvToday->whereIn('statut', ['en_attente', 'confirme'])->count(),
                'rdv_termines' => $rdvToday->where('statut', 'termine')->count(),
                'rdv_restants' => $rdvToday->whereIn('statut', ['confirme', 'en_attente', 'en_cours'])->count(),
                'rdv_en_cours' => $rdvToday->firstWhere('statut', 'en_cours'),
                'planning_du_jour' => $rdvToday->values(),
                'prochains_rdv' => $prochainsRdv,
                'prochain_rdv' => $prochainRdv ?? $prochainsRdv->first(),
                'prochain_file' => $prochainFile,
                'file_consultation' => $fileConsultation->values(),
                'file_count' => $fileConsultation->count(),
                'medecin_id' => $medecin?->id,
                'examens_en_attente' => $examensEnAttente,
                'examens_disponibles' => $examensDisponibles,
                'ordonnances_actives' => $ordonnancesActives,
                'dossiers_recents' => $dossiersRecents,
                'dossiers_semaine' => $dossiersSemaine,
                'dossiers_mois' => $dossiersMois,
            ],
        ]);
    }

    /**
     * File de consultation (admissions affectées au médecin connecté).
     * Remplace l'ancien endpoint EpisodeSoin non filtré.
     */
    public function fileConsultation(Request $request): JsonResponse
    {
        $medecin = $this->resolveMedecin($request);

        if (! $medecin) {
            return response()->json([
                'success' => false,
                'message' => 'Profil médecin introuvable. Vérifiez le rattachement utilisateur → profil médecin (Admin).',
                'data' => [],
                'meta' => [
                    'file_count' => 0,
                    'medecin_id' => null,
                ],
            ], 422);
        }

        $file = $this->fileConsultationPourMedecin($medecin);

        return response()->json([
            'success' => true,
            'message' => 'File de consultation',
            'data' => $file->values(),
            'meta' => [
                'file_count' => $file->count(),
                'medecin_id' => $medecin->id,
                'filtre' => 'medecin_assigne',
                'statuts' => self::STATUTS_FILE,
            ],
        ]);
    }

    public function planning(Request $request): JsonResponse
    {
        $medecin = $this->resolveMedecin($request);

        $query = RendezVous::with(['patient.user', 'departement', 'medecin.user'])
            ->whereIn('statut', ['confirme', 'en_attente', 'en_cours', 'termine', 'absent']);
        $this->scopeRendezVousPourClinicien($query, $request, $medecin);

        if ($request->filled('date')) {
            $query->whereDate('date_rdv', $request->date);
        } else {
            $query->whereDate('date_rdv', '>=', now()->toDateString());
        }

        $rdv = $query->orderBy('date_rdv')->orderBy('heure_rdv')->paginate(30);

        return response()->json([
            'success' => true,
            'message' => 'Planning medecin',
            'data' => $rdv->items(),
            'meta' => [
                'total' => $rdv->total(),
                'per_page' => $rdv->perPage(),
                'current_page' => $rdv->currentPage(),
                'filtre' => $medecin ? 'medecin' : 'departement',
            ],
        ]);
    }
}
