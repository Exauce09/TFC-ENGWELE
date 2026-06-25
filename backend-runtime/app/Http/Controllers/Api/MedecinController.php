<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DossierMedical;
use App\Models\Medecin;
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
            ->orderBy('heure_rdv')
            ->get();

        $dossiersRecents = DossierMedical::with(['patient.user', 'departement', 'diagnostics'])
            ->where('medecin_id', $medecin->id)
            ->latest('date_consultation')
            ->limit(5)
            ->get();

        $dossiersSemaine = DossierMedical::where('medecin_id', $medecin->id)
            ->where('date_consultation', '>=', now()->startOfWeek())
            ->count();

        return response()->json([
            'success' => true,
            'message' => 'Dashboard medecin',
            'data' => [
                'rdv_du_jour' => $rdvToday->count(),
                'rdv_en_attente' => $rdvToday->whereIn('statut', ['en_attente', 'confirme'])->count(),
                'rdv_termines' => $rdvToday->where('statut', 'termine')->count(),
                'rdv_en_cours' => $rdvToday->firstWhere('statut', 'en_cours'),
                'planning_du_jour' => $rdvToday->values(),
                'dossiers_recents' => $dossiersRecents,
                'dossiers_semaine' => $dossiersSemaine,
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
