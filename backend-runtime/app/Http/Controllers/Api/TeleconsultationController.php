<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medecin;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Services\JitsiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeleconsultationController extends Controller
{
    private const MEDECIN_ROLES = [
        'medecin_generaliste', 'medecin_interne', 'pediatre',
        'gynecologue', 'ophtalmologue', 'urgentiste',
        'chirurgien', 'anesthesiste', 'dentiste', 'sage_femme',
        'kinesitherapeute', 'echographiste', 'radiologue',
    ];

    public function __construct(private JitsiService $jitsi) {}

    public function mesSalles(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = RendezVous::with(['medecin.user', 'patient.user', 'departement'])
            ->where('type', 'teleconsultation')
            ->whereIn('statut', ['en_attente', 'confirme', 'en_cours'])
            ->whereDate('date_rdv', '>=', now()->toDateString());

        if ($user->role === 'patient') {
            $patientId = Patient::where('user_id', $user->id)->value('id');
            $query->where('patient_id', $patientId);
        } elseif (in_array($user->role, self::MEDECIN_ROLES, true)) {
            $medecinId = Medecin::where('user_id', $user->id)->value('id');
            $query->where('medecin_id', $medecinId);
        } else {
            return response()->json(['success' => false, 'message' => 'Accès refusé', 'errors' => []], 403);
        }

        $isMedecin = in_array($user->role, self::MEDECIN_ROLES, true);

        $rdvs = $query->orderBy('date_rdv')->orderBy('heure_rdv')->get()->map(function ($r) use ($user, $isMedecin) {
            $peutRejoindre = in_array($r->statut, ['confirme', 'en_cours'], true);
            $patientPaye = $r->paiement_statut === 'paye';
            // Ne pas exposer l'URL de salle au patient non payé (évite le contournement)
            $exposerSalle = $peutRejoindre && ($isMedecin || $patientPaye);

            $room = null;
            if ($exposerSalle || $isMedecin) {
                $room = $this->jitsi->ensureDedicatedRoom($r);
            }

            return [
                ...$r->fresh(['medecin.user', 'patient.user', 'departement'])->toArray(),
                'salle_url' => $exposerSalle
                    ? $this->jitsi->embedUrl($r->id, $user->name, $isMedecin)
                    : null,
                'room_name' => $exposerSalle ? ($room['room_name'] ?? null) : null,
                'salle_dediee' => (bool) $exposerSalle,
                'peut_rejoindre' => $exposerSalle,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Salles de téléconsultation',
            'data' => $rdvs,
        ]);
    }

    public function rejoindre(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $rdv = RendezVous::with(['medecin.user', 'patient.user', 'departement'])->findOrFail($id);

        if ($rdv->type !== 'teleconsultation') {
            return response()->json(['success' => false, 'message' => 'Ce rendez-vous n\'est pas une téléconsultation', 'errors' => []], 422);
        }

        $denied = $this->checkRdvAccess($user, $rdv);
        if ($denied) {
            return $denied;
        }

        $isPatient = $user->role === 'patient';
        $isMedecin = in_array($user->role, self::MEDECIN_ROLES, true);

        if (! in_array($rdv->statut, ['confirme', 'en_cours'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'La téléconsultation doit être confirmée avant d\'entrer dans la salle.',
                'errors' => [],
            ], 422);
        }

        if ($isPatient && $rdv->paiement_statut !== 'paye') {
            return response()->json([
                'success' => false,
                'message' => 'Paiement requis avant d\'entrer dans la salle.',
                'errors' => [],
            ], 422);
        }

        $room = $this->jitsi->ensureDedicatedRoom($rdv);

        if ($rdv->statut === 'confirme') {
            $rdv->update(['statut' => 'en_cours']);
        }

        $rdv = $rdv->fresh(['medecin.user', 'patient.user', 'departement']);

        return response()->json([
            'success' => true,
            'message' => 'Salle dédiée ouverte',
            'data' => [
                'rendez_vous' => $rdv,
                'room_url' => $this->jitsi->embedUrl($rdv->id, $user->name, $isMedecin),
                'room_name' => $room['room_name'],
                'jitsi_domain' => $this->jitsi->domain(),
                'salle_dediee' => true,
                'role_salle' => $isMedecin ? 'medecin' : 'patient',
            ],
        ]);
    }

    public function fermer(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $rdv = RendezVous::findOrFail($id);

        if ($rdv->type !== 'teleconsultation') {
            return response()->json(['success' => false, 'message' => 'Ce rendez-vous n\'est pas une téléconsultation', 'errors' => []], 422);
        }

        if (! in_array($user->role, self::MEDECIN_ROLES, true)) {
            return response()->json(['success' => false, 'message' => 'Seul le médecin peut clôturer la salle', 'errors' => []], 403);
        }

        $denied = $this->checkRdvAccess($user, $rdv);
        if ($denied) {
            return $denied;
        }

        $rdv->update(['statut' => 'termine']);

        return response()->json([
            'success' => true,
            'message' => 'Téléconsultation clôturée',
            'data' => $rdv->fresh(['medecin.user', 'patient.user', 'departement']),
        ]);
    }

    private function checkRdvAccess($user, RendezVous $rdv): ?JsonResponse
    {
        if ($user->role === 'patient') {
            $patientId = Patient::where('user_id', $user->id)->value('id');
            if ((int) $rdv->patient_id !== (int) $patientId) {
                return response()->json(['success' => false, 'message' => 'Accès refusé', 'errors' => []], 403);
            }
        } elseif (in_array($user->role, self::MEDECIN_ROLES, true)) {
            $medecinId = Medecin::where('user_id', $user->id)->value('id');
            if ((int) $rdv->medecin_id !== (int) $medecinId) {
                return response()->json(['success' => false, 'message' => 'Accès refusé', 'errors' => []], 403);
            }
        } else {
            return response()->json(['success' => false, 'message' => 'Accès refusé', 'errors' => []], 403);
        }

        return null;
    }
}
