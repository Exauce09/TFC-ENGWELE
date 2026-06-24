<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medecin;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Models\DemandeRdv;
use App\Http\Controllers\Api\CaisseController;
use App\Services\JitsiService;
use App\Services\MobileMoneyService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RendezVousController extends Controller
{
    public function __construct(
        private NotificationService $notifications,
        private JitsiService $jitsi,
        private MobileMoneyService $mobileMoney,
    ) {}

    public function indexAdmin(Request $request): JsonResponse
    {
        $rdv = RendezVous::with(['medecin.user', 'patient.user', 'departement'])
            ->when($request->statut, fn ($q, $s) => $q->where('statut', $s))
            ->when($request->date, fn ($q, $d) => $q->whereDate('date_rdv', $d))
            ->orderByDesc('date_rdv')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Liste globale des rendez-vous',
            'data' => $rdv->items(),
            'meta' => [
                'total' => $rdv->total(),
                'per_page' => $rdv->perPage(),
                'current_page' => $rdv->currentPage(),
            ],
        ]);
    }

    public function mesRendezVous(Request $request): JsonResponse
    {
        $patient = Patient::where('user_id', $request->user()->id)->firstOrFail();
        $rdv = RendezVous::with(['medecin.user', 'departement'])
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
            'motif' => 'nullable|string|max:500',
            'type' => 'nullable|in:presentiel,teleconsultation',
            'priorite' => 'nullable|in:normal,urgent,tres_urgent',
        ]);

        $patientId = $validated['patient_id']
            ?? Patient::where('user_id', $request->user()->id)->value('id');

        if (!$patientId) {
            return response()->json([
                'success' => false,
                'message' => 'Profil patient introuvable',
                'errors' => [],
            ], 422);
        }

        $type = $validated['type'] ?? 'presentiel';
        $medecin = Medecin::with('user')->find($validated['medecin_id']);
        $patient = Patient::with('user')->find($patientId);

        $rdv = RendezVous::create([
            'patient_id' => $patientId,
            'medecin_id' => $validated['medecin_id'],
            'departement_id' => $validated['departement_id'],
            'date_rdv' => $validated['date_rdv'],
            'heure_rdv' => $validated['heure_rdv'],
            'motif' => $validated['motif'] ?? null,
            'type' => $type,
            'priorite' => $validated['priorite'] ?? 'normal',
            'statut' => 'en_attente',
            'cree_par' => $request->user()->id,
            'montant' => $type === 'teleconsultation' ? 15000 : null,
            'lien_video' => $type === 'teleconsultation' ? $this->jitsi->embedUrl(0) : null,
        ]);

        if ($type === 'teleconsultation') {
            $rdv->update(['lien_video' => $this->jitsi->embedUrl($rdv->id)]);
        }

        $rdv = $rdv->load(['medecin.user', 'departement']);

        if ($patient?->user) {
            $this->notifications->notify(
                $patient->user,
                'Rendez-vous enregistre',
                "Votre demande du {$validated['date_rdv']} a {$validated['heure_rdv']} est en attente de confirmation.",
                'rdv_confirme',
                ['rendez_vous_id' => $rdv->id],
                sendSms: true,
            );
        }

        if ($medecin?->user) {
            $this->notifications->notify(
                $medecin->user,
                'Nouveau rendez-vous',
                "Demande de RDV de {$patient?->user?->name} le {$validated['date_rdv']}.",
                'rdv_confirme',
                ['rendez_vous_id' => $rdv->id],
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous enregistre',
            'data' => $rdv,
        ], 201);
    }

    public function payer(Request $request, int $id): JsonResponse
    {
        $patient = Patient::where('user_id', $request->user()->id)->firstOrFail();
        $rdv = RendezVous::where('patient_id', $patient->id)->findOrFail($id);

        $validated = $request->validate([
            'mode' => 'required|in:airtel_money,mpesa',
            'telephone' => 'required|string|max:25',
            'montant' => 'nullable|numeric|min:1000',
        ]);

        $montant = $validated['montant'] ?? (float) ($rdv->montant ?? 15000);
        $result = $this->mobileMoney->initierPaiement($rdv, $validated['mode'], $validated['telephone'], $montant);

        if ($result['success']) {
            $facture = CaisseController::creerFactureRdv($rdv, $montant);
            $this->mobileMoney->initierPaiementFacture($facture, $validated['mode'], $validated['telephone'], $montant);

            $this->notifications->notify(
                $request->user(),
                'Paiement confirme',
                "Votre paiement de {$montant} FC pour le RDV #{$rdv->id} a ete enregistre.",
                'paiement',
                ['rendez_vous_id' => $rdv->id, 'reference' => $result['reference']],
                sendSms: true,
            );
        }

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'data' => array_merge($result, ['rendez_vous' => $rdv->fresh()]),
        ]);
    }

    public function demandePublique(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'telephone' => 'required|string|max:25',
            'departement_id' => 'nullable|exists:departements,id',
            'service' => 'nullable|string|max:150',
            'date_souhaitee' => 'required|date|after_or_equal:today',
            'message' => 'nullable|string|max:1000',
        ]);

        $demande = DemandeRdv::create([
            'nom' => $validated['nom'],
            'telephone' => $validated['telephone'],
            'departement_id' => $validated['departement_id'] ?? null,
            'service_libelle' => $validated['service'] ?? null,
            'date_souhaitee' => $validated['date_souhaitee'],
            'message' => $validated['message'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Demande de rendez-vous envoyee. Notre equipe vous contactera sous peu.',
            'data' => $demande,
        ], 201);
    }

    public function annuler(Request $request, int $id): JsonResponse
    {
        $patient = Patient::where('user_id', $request->user()->id)->firstOrFail();
        $rdv = RendezVous::where('patient_id', $patient->id)->findOrFail($id);

        if (in_array($rdv->statut, ['termine', 'annule'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Ce rendez-vous ne peut plus etre annule',
                'errors' => [],
            ], 422);
        }

        $rdv->update(['statut' => 'annule']);

        $this->notifications->notify(
            $request->user(),
            'Rendez-vous annule',
            "Votre rendez-vous du {$rdv->date_rdv} a ete annule.",
            'rdv_annule',
            ['rendez_vous_id' => $rdv->id],
            sendSms: true,
        );

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous annule',
            'data' => $rdv,
        ]);
    }

    public function updateStatut(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'statut' => 'required|in:en_attente,confirme,en_cours,termine,annule,absent',
        ]);

        $medecin = Medecin::where('user_id', $request->user()->id)->first();
        $rdv = RendezVous::with('patient.user')->findOrFail($id);

        if ($medecin && $rdv->medecin_id !== $medecin->id && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Acces refuse',
                'errors' => [],
            ], 403);
        }

        $rdv->update(['statut' => $validated['statut']]);

        if ($validated['statut'] === 'confirme' && $rdv->patient?->user) {
            $msg = "Votre RDV du {$rdv->date_rdv} a {$rdv->heure_rdv} est confirme.";
            if ($rdv->type === 'teleconsultation') {
                $msg .= ' Lien video disponible dans Teleconsultation.';
            }
            $this->notifications->notify(
                $rdv->patient->user,
                'Rendez-vous confirme',
                $msg,
                'rdv_confirme',
                ['rendez_vous_id' => $rdv->id],
                sendSms: true,
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Statut mis a jour',
            'data' => $rdv->load(['patient.user', 'departement']),
        ]);
    }
}
