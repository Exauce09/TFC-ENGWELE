<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medecin;
use App\Models\Patient;
use App\Models\RendezVous;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RendezVousController extends Controller
{
    public function mesRendezVous(Request $request): JsonResponse
    {
        $patient = Patient::where('user_id', $request->user()->id)->firstOrFail();
        $rdv = RendezVous::with(['medecin.user', 'patient.user'])
            ->where('patient_id', $patient->id)
            ->orderByDesc('date_rdv')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Liste des rendez-vous',
            'data' => $rdv->items(),
            'meta' => [
                'total' => $rdv->total(),
                'per_page' => $rdv->perPage(),
                'current_page' => $rdv->currentPage(),
            ],
        ]);
    }

    public function prendre(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'nullable|exists:patients,id',
            'medecin_id' => 'required|exists:medecins,id',
            'departement_id' => 'required|exists:departements,id',
            'date_rdv' => 'required|date|after_or_equal:today',
            'heure_rdv' => 'required|date_format:H:i',
            'motif' => 'nullable|string',
            'type' => 'nullable|in:presentiel,teleconsultation',
            'priorite' => 'nullable|in:normal,urgent,tres_urgent',
        ]);

        $patientId = $validated['patient_id'] ?? Patient::where('user_id', $request->user()->id)->value('id');

        $rdv = RendezVous::create([
            'patient_id' => $patientId,
            'medecin_id' => $validated['medecin_id'],
            'departement_id' => $validated['departement_id'],
            'date_rdv' => $validated['date_rdv'],
            'heure_rdv' => $validated['heure_rdv'],
            'motif' => $validated['motif'] ?? null,
            'type' => $validated['type'] ?? 'presentiel',
            'priorite' => $validated['priorite'] ?? 'normal',
            'cree_par' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous enregistre',
            'data' => $rdv,
        ], 201);
    }

    public function annuler(int $id): JsonResponse
    {
        $rdv = RendezVous::findOrFail($id);
        $rdv->update(['statut' => 'annule']);

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous annule',
            'data' => $rdv,
        ]);
    }

    public function updateStatut(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate(['statut' => 'required|in:confirme,en_cours,termine,annule,absent']);
        $rdv = RendezVous::findOrFail($id);
        $rdv->update(['statut' => $validated['statut']]);

        return response()->json([
            'success' => true,
            'message' => 'Statut mis a jour',
            'data' => $rdv,
        ]);
    }
}
