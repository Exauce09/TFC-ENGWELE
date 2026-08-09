<?php

namespace App\Http\Controllers\Api;

use App\Enums\AdmissionStatut;
use App\Http\Controllers\Controller;
use App\Models\ParcoursPrescription;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\RendezVous;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $patient = Patient::with([
            'admissionActive.departement:id,nom',
            'admissionActive.triage',
        ])->where('user_id', $user->id)->first();

        $upcoming = $patient
            ? RendezVous::where('patient_id', $patient->id)->whereDate('date_rdv', '>=', now()->toDateString())->count()
            : 0;

        $admission = $patient?->admissionActive;
        $creeLe = $patient?->created_at;

        $delivrees = [];
        if ($patient) {
            $parcours = ParcoursPrescription::query()
                ->whereHas('admission', fn ($q) => $q->where('patient_id', $patient->id))
                ->where('statut', 'delivree')
                ->latest('delivree_at')
                ->limit(5)
                ->get(['id', 'numero_ordonnance', 'statut', 'delivree_at', 'updated_at']);

            $dossiers = Prescription::query()
                ->where('patient_id', $patient->id)
                ->where('statut', 'delivree')
                ->latest('updated_at')
                ->limit(5)
                ->get(['id', 'numero_ordonnance', 'statut', 'updated_at']);

            $delivrees = $parcours->concat($dossiers)
                ->sortByDesc(fn ($p) => $p->delivree_at ?? $p->updated_at)
                ->take(5)
                ->values()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'numero_ordonnance' => $p->numero_ordonnance,
                    'delivree_at' => optional($p->delivree_at ?? $p->updated_at)?->toIso8601String(),
                ])
                ->all();
        }

        return response()->json([
            'success' => true,
            'message' => 'Dashboard patient',
            'data' => [
                'upcoming_rdv' => $upcoming,
                'compte_cree' => (bool) $patient,
                'numero_patient' => $patient?->numero_patient,
                'cree_le' => optional($creeLe)?->toIso8601String(),
                'message_creation' => $patient
                    ? 'Votre dossier patient a été créé à la réception du Centre Médical AMEN.'
                    : null,
                'admission_en_cours' => $admission ? [
                    'numero_admission' => $admission->numero_admission,
                    'statut' => $admission->statut,
                    'statut_label' => AdmissionStatut::tryFrom($admission->statut)?->label() ?? $admission->statut,
                    'motif' => $admission->motif_arrivee,
                    'service' => $admission->departement?->nom,
                    'arrivee_at' => optional($admission->arrivee_at)?->toIso8601String(),
                ] : null,
                'ordonnances_delivrees' => $delivrees,
            ],
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $q = $request->validate(['q' => 'required|string|min:2'])['q'];
        $results = Patient::with('user')
            ->where('numero_patient', 'like', "%{$q}%")
            ->orWhereHas('user', fn ($query) => $query->where('name', 'like', "%{$q}%"))
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Recherche patient',
            'data' => $results->items(),
            'meta' => [
                'total' => $results->total(),
                'per_page' => $results->perPage(),
                'current_page' => $results->currentPage(),
            ],
        ]);
    }
}
