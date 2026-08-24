<?php

namespace App\Http\Controllers\Api;

use App\Enums\AdmissionStatut;
use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\Medecin;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Models\SoinDentaire;
use App\Services\StaffProfileService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Dentisterie : file des patients affectés au dentiste (comme le médecin)
 * + soins dentaires enregistrés.
 */
class DentisterieController extends Controller
{
    private const STATUTS_FILE = [
        AdmissionStatut::Triage->value,
        AdmissionStatut::ConsultationMedicale->value,
    ];

    private function resolveMedecin(Request $request): ?Medecin
    {
        $user = $request->user();
        StaffProfileService::ensureProfil($user->fresh());

        return Medecin::with('departement:id,nom,code')->where('user_id', $user->id)->first();
    }

    private function scopeAssigneAuDentiste(Builder $query, Medecin $medecin): Builder
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

    /** @return \Illuminate\Support\Collection<int, Admission> */
    private function filePourDentiste(Medecin $medecin)
    {
        // Réparer affectation manquante si RDV / dossier pointe déjà ici
        Admission::query()
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

        return Admission::with([
            'patient.user:id,name,phone',
            'departement:id,nom,code',
            'triage',
            'medecinReferent.user:id,name',
            'rendezVousOrigine',
        ])
            ->whereIn('statut', self::STATUTS_FILE)
            ->where(function (Builder $q) use ($medecin) {
                $this->scopeAssigneAuDentiste($q, $medecin);
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
        $uid = $request->user()->id;
        $medecin = $this->resolveMedecin($request);

        $file = $medecin ? $this->filePourDentiste($medecin) : collect();

        $rdvToday = 0;
        if ($medecin) {
            $rdvToday = RendezVous::where('medecin_id', $medecin->id)
                ->whereDate('date_rdv', today())
                ->whereIn('statut', ['confirme', 'en_cours', 'en_attente'])
                ->count();
        } elseif ($request->user()->departement_id) {
            $rdvToday = RendezVous::where('departement_id', $request->user()->departement_id)
                ->whereDate('date_rdv', today())
                ->whereIn('statut', ['confirme', 'en_cours', 'en_attente'])
                ->count();
        }

        return response()->json([
            'success' => true,
            'message' => 'Dashboard dentisterie',
            'data' => [
                'file_count' => $file->count(),
                'file_consultation' => $file->values(),
                'rdv_du_jour' => $rdvToday,
                'total' => SoinDentaire::where('dentiste_id', $uid)->count(),
                'ce_mois' => SoinDentaire::where('dentiste_id', $uid)
                    ->whereMonth('date_soin', now()->month)
                    ->whereYear('date_soin', now()->year)
                    ->count(),
                'medecin_id' => $medecin?->id,
                'departement' => $medecin?->departement?->nom
                    ?? $request->user()->departement?->nom,
            ],
        ]);
    }

    public function fileConsultation(Request $request): JsonResponse
    {
        $medecin = $this->resolveMedecin($request);

        if (! $medecin) {
            return response()->json([
                'success' => false,
                'message' => 'Profil dentiste introuvable. Vérifiez le rattachement Admin (rôle dentiste → service Dentisterie).',
                'data' => [],
                'meta' => ['file_count' => 0, 'medecin_id' => null],
            ], 422);
        }

        $file = $this->filePourDentiste($medecin);

        return response()->json([
            'success' => true,
            'message' => 'File dentisterie (patients assignés)',
            'data' => $file->values(),
            'meta' => [
                'file_count' => $file->count(),
                'medecin_id' => $medecin->id,
                'filtre' => 'medecin_assigne',
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $items = SoinDentaire::with(['patient.user'])
            ->where('dentiste_id', $request->user()->id)
            ->latest('date_soin')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Soins dentaires',
            'data' => $items->items(),
            'meta' => ['total' => $items->total()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'date_soin' => 'required|date',
            'type_soin' => 'nullable|string|max:100',
            'dents_traitees' => 'nullable|string|max:100',
            'observations' => 'nullable|string',
            'prochain_rdv' => 'nullable|date',
            'anesthesie' => 'nullable|boolean',
        ]);

        $soin = SoinDentaire::create([
            ...$validated,
            'dentiste_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Soin enregistré',
            'data' => $soin->load('patient.user'),
        ], 201);
    }

    /**
     * Patients affectés à CE dentiste (admissions / dossiers / RDV) — pas toute la patientèle.
     * Recherche (q) : restreint à ces patients assignés.
     */
    public function patients(Request $request): JsonResponse
    {
        $medecin = $this->resolveMedecin($request);
        $q = trim((string) $request->get('q', ''));

        if (! $medecin) {
            return response()->json([
                'success' => false,
                'message' => 'Profil dentiste introuvable',
                'data' => [],
            ], 422);
        }

        $patients = Patient::with([
            'user:id,name,email,phone',
            'dossiers.medecin.user:id,name',
            'admissionActive.departement:id,nom',
            'admissionActive.medecinReferent.user:id,name',
        ])
            ->where(function ($query) use ($medecin) {
                $query->whereHas('dossiers', fn ($d) => $d->where('medecin_id', $medecin->id))
                    ->orWhereHas('admissions', fn ($a) => $a->where('medecin_referent_id', $medecin->id))
                    ->orWhereHas('rendezVous', fn ($r) => $r->where('medecin_id', $medecin->id));
            })
            ->when($q !== '', fn ($query) => $query->where(
                fn ($sub) => $sub->where('numero_patient', 'like', "%{$q}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")
                        ->orWhere('phone', 'like', "%{$q}%"))
            ))
            ->orderByDesc('id')
            ->limit(40)
            ->get()
            ->map(function (Patient $patient) {
                $dossier = $patient->dossiers->first();
                $admission = $patient->admissionActive;

                return [
                    'id' => $patient->id,
                    'numero_patient' => $patient->numero_patient,
                    'user' => $patient->user,
                    'allergies' => $patient->allergies,
                    'dossier' => $dossier ? [
                        'id' => $dossier->id,
                        'numero_dossier' => $dossier->numero_dossier,
                        'statut' => $dossier->statut,
                        'motif' => $dossier->motif,
                    ] : null,
                    'admission_active' => $admission ? [
                        'id' => $admission->id,
                        'numero_admission' => $admission->numero_admission,
                        'statut' => $admission->statut,
                        'statut_label' => $admission->statut_label,
                        'departement' => $admission->departement?->nom,
                    ] : null,
                    'medecin_en_charge' => $admission?->medecinReferent?->user?->name
                        ?? $dossier?->medecin?->user?->name,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Patients assignés à la dentisterie',
            'data' => $patients,
        ]);
    }
}
