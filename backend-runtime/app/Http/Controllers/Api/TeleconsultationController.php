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
    public function __construct(private JitsiService $jitsi) {}

    public function mesSalles(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = RendezVous::with(['medecin.user', 'patient.user', 'departement'])
            ->where('type', 'teleconsultation')
            ->whereIn('statut', ['confirme', 'en_cours'])
            ->whereDate('date_rdv', '>=', now()->toDateString());

        if ($user->role === 'patient') {
            $patientId = Patient::where('user_id', $user->id)->value('id');
            $query->where('patient_id', $patientId);
        } elseif (in_array($user->role, ['medecin_generaliste', 'medecin_interne', 'pediatre', 'gynecologue', 'ophtalmologue', 'urgentiste'], true)) {
            $medecinId = Medecin::where('user_id', $user->id)->value('id');
            $query->where('medecin_id', $medecinId);
        } else {
            return response()->json(['success' => false, 'message' => 'Acces refuse', 'errors' => []], 403);
        }

        $rdvs = $query->orderBy('date_rdv')->orderBy('heure_rdv')->get()->map(fn ($r) => [
            ...$r->toArray(),
            'salle_url' => $r->lien_video ?: $this->jitsi->embedUrl($r->id, $user->name),
            'room_name' => $this->jitsi->roomName($r->id),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Salles de teleconsultation',
            'data' => $rdvs,
        ]);
    }

    public function rejoindre(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $rdv = RendezVous::with(['medecin.user', 'patient.user'])->findOrFail($id);

        if ($rdv->type !== 'teleconsultation') {
            return response()->json(['success' => false, 'message' => 'Ce rendez-vous n est pas une teleconsultation', 'errors' => []], 422);
        }

        $denied = $this->checkRdvAccess($user, $rdv);
        if ($denied) {
            return $denied;
        }

        if (!$rdv->lien_video) {
            $rdv->update(['lien_video' => $this->jitsi->embedUrl($rdv->id)]);
        }

        if ($rdv->statut === 'confirme') {
            $rdv->update(['statut' => 'en_cours']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Salle de teleconsultation',
            'data' => [
                'rendez_vous' => $rdv->fresh(['medecin.user', 'patient.user', 'departement']),
                'room_url' => $this->jitsi->embedUrl($rdv->id, $user->name),
                'room_name' => $this->jitsi->roomName($rdv->id),
                'jitsi_domain' => config('integrations.jitsi.domain'),
            ],
        ]);
    }

    private function checkRdvAccess($user, RendezVous $rdv): ?JsonResponse
    {
        if ($user->role === 'patient') {
            $patientId = Patient::where('user_id', $user->id)->value('id');
            if ($rdv->patient_id !== $patientId) {
                return response()->json(['success' => false, 'message' => 'Acces refuse', 'errors' => []], 403);
            }
        } elseif (in_array($user->role, ['medecin_generaliste', 'medecin_interne', 'pediatre', 'gynecologue', 'ophtalmologue', 'urgentiste'], true)) {
            $medecinId = Medecin::where('user_id', $user->id)->value('id');
            if ($rdv->medecin_id !== $medecinId) {
                return response()->json(['success' => false, 'message' => 'Acces refuse', 'errors' => []], 403);
            }
        }

        return null;
    }
}
