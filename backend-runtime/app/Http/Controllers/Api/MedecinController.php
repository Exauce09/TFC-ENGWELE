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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedecinController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $medecin = Medecin::where('user_id', $request->user()->id)->firstOrFail();
        $today = now()->toDateString();

        $rdvToday = RendezVous::with(['patient.user', 'patient', 'departement'])
            ->where('medecin_id', $medecin->id)
            ->whereDate('date_rdv', $today)
            ->whereIn('statut', ['confirme', 'en_cours', 'en_attente', 'termine'])
            ->orderBy('heure_rdv')
            ->get();

        // Patients orientés vers le médecin (après triage / en consultation)
        $fileConsultation = Admission::with([
            'patient.user:id,name,phone',
            'departement:id,nom',
            'triage',
            'medecinReferent.user:id,name',
        ])
            // Uniquement après triage — prêts pour consultation
            ->where('statut', AdmissionStatut::ConsultationMedicale->value)
            ->where(function ($q) use ($medecin) {
                $q->where('medecin_referent_id', $medecin->id)
                    ->orWhere(function ($sub) use ($medecin) {
                        $sub->whereNull('medecin_referent_id')
                            ->where('departement_id', $medecin->departement_id);
                    });
            })
            ->latest('arrivee_at')
            ->limit(20)
            ->get();

        $examensEnAttente = ExamenLabo::whereHas('admission', function ($q) use ($medecin) {
            $q->where('medecin_referent_id', $medecin->id)
                ->orWhere('departement_id', $medecin->departement_id);
        })
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
            ->whereHas('admission', function ($q) use ($medecin) {
                $q->where('medecin_referent_id', $medecin->id)
                    ->orWhere('departement_id', $medecin->departement_id);
            })
            ->where('statut', 'termine')
            ->latest('termine_at')
            ->limit(8)
            ->get();

        $prochainRdv = $rdvToday->first(fn ($r) => in_array($r->statut, ['confirme', 'en_attente', 'en_cours'], true));
        $prochainFile = $fileConsultation->first();

        return response()->json([
            'success' => true,
            'message' => 'Dashboard medecin',
            'data' => [
                'rdv_du_jour' => $rdvToday->whereIn('statut', ['confirme', 'en_cours', 'en_attente'])->count(),
                'rdv_en_attente' => $rdvToday->whereIn('statut', ['en_attente', 'confirme'])->count(),
                'rdv_termines' => $rdvToday->where('statut', 'termine')->count(),
                'rdv_restants' => $rdvToday->whereIn('statut', ['confirme', 'en_attente'])->count(),
                'rdv_en_cours' => $rdvToday->firstWhere('statut', 'en_cours'),
                'planning_du_jour' => $rdvToday->values(),
                'prochain_rdv' => $prochainRdv,
                'prochain_file' => $prochainFile,
                'file_consultation' => $fileConsultation,
                'file_count' => $fileConsultation->count(),
                'examens_en_attente' => $examensEnAttente,
                'examens_disponibles' => $examensDisponibles,
                'ordonnances_actives' => $ordonnancesActives,
                'dossiers_recents' => $dossiersRecents,
                'dossiers_semaine' => DossierMedical::where('medecin_id', $medecin->id)
                    ->where('date_consultation', '>=', now()->startOfWeek())
                    ->count(),
                'dossiers_mois' => DossierMedical::where('medecin_id', $medecin->id)
                    ->where('date_consultation', '>=', now()->startOfMonth())
                    ->count(),
            ],
        ]);
    }

    public function planning(Request $request): JsonResponse
    {
        $medecin = Medecin::where('user_id', $request->user()->id)->firstOrFail();

        $query = RendezVous::with(['patient.user', 'departement'])
            ->where('medecin_id', $medecin->id);

        if ($request->filled('date')) {
            $query->whereDate('date_rdv', $request->date);
        } else {
            $query->whereDate('date_rdv', '>=', now()->toDateString());
        }

        $rdv = $query->orderBy('date_rdv')->orderBy('heure_rdv')->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Planning medecin',
            'data' => $rdv->items(),
            'meta' => [
                'total' => $rdv->total(),
                'per_page' => $rdv->perPage(),
                'current_page' => $rdv->currentPage(),
            ],
        ]);
    }
}
