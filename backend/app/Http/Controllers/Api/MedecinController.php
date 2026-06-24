<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medecin;
use App\Models\RendezVous;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedecinController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $medecin = Medecin::where('user_id', $request->user()->id)->first();
        $today = $medecin
            ? RendezVous::where('medecin_id', $medecin->id)->whereDate('date_rdv', now()->toDateString())->count()
            : 0;

        return response()->json([
            'success' => true,
            'message' => 'Dashboard medecin',
            'data' => ['rdv_du_jour' => $today],
        ]);
    }

    public function planning(Request $request): JsonResponse
    {
        $medecin = Medecin::where('user_id', $request->user()->id)->firstOrFail();
        $rdv = RendezVous::with('patient.user')
            ->where('medecin_id', $medecin->id)
            ->orderByDesc('date_rdv')
            ->paginate(15);

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
