<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\SoinDentaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DentisterieController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $uid = $request->user()->id;

        return response()->json([
            'success' => true,
            'message' => 'Dashboard dentisterie',
            'data' => [
                'total' => SoinDentaire::where('dentiste_id', $uid)->count(),
                'ce_mois' => SoinDentaire::where('dentiste_id', $uid)
                    ->whereMonth('date_soin', now()->month)
                    ->whereYear('date_soin', now()->year)
                    ->count(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $items = SoinDentaire::with(['patient.user'])
            ->where('dentiste_id', $request->user()->id)
            ->latest('date_soin')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Soins dentaires',
            'data' => $items->items(),
            'meta' => ['total' => $items->total()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'date_soin' => 'required|date',
            'type_soin' => 'nullable|string|max:100',
            'dents_traitees' => 'nullable|string|max:100',
            'observations' => 'nullable|string',
            'prochain_rdv' => 'nullable|date',
            'anesthesie' => 'nullable|boolean',
        ]);

        $soin = SoinDentaire::create([
            ...$validated,
            'dentiste_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Soin enregistre',
            'data' => $soin->load('patient.user'),
        ], 201);
    }

    public function patients(Request $request): JsonResponse
    {
        $q = $request->get('q', '');
        $patients = Patient::with('user:id,name')
            ->when($q, fn ($query) => $query->where('numero_patient', 'like', "%{$q}%")
                ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")))
            ->limit(30)->get();

        return response()->json(['success' => true, 'message' => 'Patients', 'data' => $patients]);
    }
}
