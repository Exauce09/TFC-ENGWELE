<?php

namespace App\Http\Controllers\Api;

use App\Enums\AdmissionStatut;
use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\Patient;
use App\Models\SoinInfirmier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InfirmierController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $today = now()->toDateString();

        $fileTriage = Admission::with([
            'patient.user:id,name,phone',
            'departement:id,nom',
            'triage',
        ])
            ->where('statut', AdmissionStatut::Triage->value)
            ->latest('arrivee_at')
            ->limit(12)
            ->get();

        $filePrelevement = Admission::with([
            'patient.user:id,name',
            'departement:id,nom',
        ])
            ->where('statut', AdmissionStatut::Prelevement->value)
            ->latest('arrivee_at')
            ->limit(8)
            ->get();

        $constantesJour = SoinInfirmier::whereDate('date_soin', $today)->count();
        $mesConstantes = SoinInfirmier::where('infirmier_id', $request->user()->id)
            ->whereDate('date_soin', $today)
            ->count();

        $constantesRecentes = SoinInfirmier::with(['patient.user:id,name', 'infirmier:id,name'])
            ->latest('date_soin')
            ->limit(6)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Dashboard infirmier',
            'data' => [
                'file_triage' => $fileTriage,
                'file_triage_count' => Admission::where('statut', AdmissionStatut::Triage->value)->count(),
                'file_prelevement' => $filePrelevement,
                'file_prelevement_count' => Admission::where('statut', AdmissionStatut::Prelevement->value)->count(),
                'constantes_du_jour' => $constantesJour,
                'mes_constantes_du_jour' => $mesConstantes,
                'constantes_recentes' => $constantesRecentes,
            ],
        ]);
    }

    /** Patients en attente de triage (après accueil). */
    public function fileTriageAdmissions(): JsonResponse
    {
        $items = Admission::with([
            'patient.user:id,name,phone',
            'patient:id,user_id,numero_patient,sexe,date_naissance,allergies,photo',
            'departement:id,nom',
            'medecinReferent.user:id,name',
        ])
            ->where('statut', AdmissionStatut::Triage->value)
            ->orderByRaw("CASE niveau_urgence_accueil
                WHEN 'critique' THEN 1
                WHEN 'urgent' THEN 2
                WHEN 'modere' THEN 3
                WHEN 'leger' THEN 4
                ELSE 5 END")
            ->orderBy('arrivee_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'File de triage',
            'data' => $items,
        ]);
    }

    /** Patients en attente de prélèvement (après prescription d'examens). */
    public function filePrelevement(): JsonResponse
    {
        $items = Admission::with([
            'patient.user:id,name,phone',
            'patient:id,user_id,numero_patient,sexe,allergies,photo',
            'departement:id,nom',
            'medecinReferent.user:id,name',
            'examensLabo',
        ])
            ->where('statut', AdmissionStatut::Prelevement->value)
            ->orderBy('arrivee_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'File de prélèvement',
            'data' => $items,
        ]);
    }

    public function patients(Request $request): JsonResponse
    {
        $q = trim((string) $request->get('q', ''));

        $patients = Patient::with([
            'user:id,name,email,phone',
            'admissionActive.departement:id,nom',
            'admissionActive.triage',
        ])
            ->when($q !== '', fn ($query) => $query->where(
                fn ($sub) => $sub->where('numero_patient', 'like', "%{$q}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")
                        ->orWhere('phone', 'like', "%{$q}%"))
            ))
            ->orderByDesc('id')
            ->limit(40)
            ->get()
            ->map(fn (Patient $p) => [
                'id' => $p->id,
                'numero_patient' => $p->numero_patient,
                'date_naissance' => $p->date_naissance?->toDateString(),
                'sexe' => $p->sexe,
                'commune' => $p->commune,
                'allergies' => $p->allergies,
                'photo' => $p->photo,
                'user' => $p->user,
                'admission_active' => $p->admissionActive ? [
                    'id' => $p->admissionActive->id,
                    'numero_admission' => $p->admissionActive->numero_admission,
                    'statut' => $p->admissionActive->statut,
                    'statut_label' => $p->admissionActive->statut_label,
                    'departement' => $p->admissionActive->departement?->nom,
                    'niveau_urgence' => $p->admissionActive->triage?->niveau_urgence
                        ?? $p->admissionActive->niveau_urgence_accueil,
                ] : null,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Patients',
            'data' => $patients,
        ]);
    }

    public function constantes(Request $request): JsonResponse
    {
        $query = SoinInfirmier::with(['patient.user', 'infirmier:id,name'])
            ->latest('date_soin');

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        $items = $query->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Constantes vitales',
            'data' => $items->items(),
            'meta' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
            ],
        ]);
    }

    public function enregistrerConstantes(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'dossier_id' => 'nullable|exists:dossiers_medicaux,id',
            'date_soin' => 'nullable|date',
            'temperature' => 'nullable|numeric|min:30|max:45',
            'tension_arterielle' => 'nullable|string|max:20',
            'frequence_cardiaque' => 'nullable|integer|min:30|max:220',
            'frequence_respiratoire' => 'nullable|integer|min:5|max:60',
            'saturation_02' => 'nullable|integer|min:50|max:100',
            'glycemie' => 'nullable|numeric|min:0|max:30',
            'poids_kg' => 'nullable|numeric|min:1|max:300',
            'actes_realises' => 'nullable|string',
            'observations' => 'nullable|string',
        ]);

        $soin = SoinInfirmier::create([
            ...$validated,
            'infirmier_id' => $request->user()->id,
            'date_soin' => $validated['date_soin'] ?? now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Constantes enregistrées',
            'data' => $soin->load(['patient.user', 'infirmier:id,name']),
        ], 201);
    }
}
