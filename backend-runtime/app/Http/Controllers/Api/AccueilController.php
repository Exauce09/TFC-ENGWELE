<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemandeRdv;
use App\Models\Patient;
use App\Models\RendezVous;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccueilController extends Controller
{
    public function dashboard(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Dashboard accueil',
            'data' => [
                'demandes_nouvelles' => DemandeRdv::where('statut', 'nouvelle')->count(),
                'rdv_du_jour' => RendezVous::whereDate('date_rdv', now()->toDateString())->count(),
                'patients_total' => Patient::count(),
                'rdv_en_attente' => RendezVous::where('statut', 'en_attente')->whereDate('date_rdv', '>=', now())->count(),
            ],
        ]);
    }

    public function demandes(): JsonResponse
    {
        $items = DemandeRdv::with('departement')
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Demandes RDV',
            'data' => $items->items(),
            'meta' => ['total' => $items->total()],
        ]);
    }

    public function traiterDemande(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'statut' => 'required|in:nouvelle,traitee,annulee',
        ]);

        $demande = DemandeRdv::findOrFail($id);
        $demande->update(['statut' => $validated['statut']]);

        return response()->json([
            'success' => true,
            'message' => 'Demande mise a jour',
            'data' => $demande,
        ]);
    }

    public function rendezVous(): JsonResponse
    {
        $items = RendezVous::with(['patient.user', 'medecin.user', 'departement'])
            ->whereDate('date_rdv', now()->toDateString())
            ->orderBy('heure_rdv')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'RDV du jour',
            'data' => $items->items(),
            'meta' => ['total' => $items->total()],
        ]);
    }

    public function patients(Request $request): JsonResponse
    {
        $q = $request->get('q', '');
        $patients = Patient::with('user:id,name,email,phone')
            ->when($q, fn ($query) => $query->where('numero_patient', 'like', "%{$q}%")
                ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")))
            ->limit(30)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Patients',
            'data' => $patients,
        ]);
    }
}
