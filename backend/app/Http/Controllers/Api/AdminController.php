<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminController extends Controller
{
    public function stats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Statistiques globales',
            'data' => [
                'users_total' => User::count(),
                'patients_total' => Patient::count(),
                'rdv_total' => RendezVous::count(),
                'rdv_du_jour' => RendezVous::whereDate('date_rdv', now()->toDateString())->count(),
                'factures_total' => Facture::count(),
                'montant_facture' => (float) Facture::sum('montant_total'),
                'montant_paye' => (float) Facture::sum('montant_paye'),
            ],
        ]);
    }
}
