<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemandeRdv;
use App\Models\Departement;
use App\Models\Facture;
use App\Models\Medecin;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function stats(): JsonResponse
    {
        $rdvParStatut = RendezVous::select('statut', DB::raw('count(*) as total'))
            ->groupBy('statut')
            ->pluck('total', 'statut');

        $rdvParDepartement = RendezVous::query()
            ->select('departement_id', DB::raw('count(*) as total'))
            ->with('departement:id,nom')
            ->groupBy('departement_id')
            ->orderByDesc('total')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'departement' => $row->departement?->nom ?? 'Non assigne',
                'total' => (int) $row->total,
            ]);

        $rdvSemaine = collect(range(6, 0))->map(function (int $daysAgo): array {
            $date = now()->subDays($daysAgo);

            return [
                'jour' => $date->locale('fr')->isoFormat('ddd'),
                'date' => $date->toDateString(),
                'total' => RendezVous::whereDate('date_rdv', $date)->count(),
            ];
        });

        $topMedecins = Medecin::with(['user:id,name', 'departement:id,nom'])
            ->withCount(['rendezVous as consultations_total'])
            ->orderByDesc('consultations_total')
            ->limit(5)
            ->get()
            ->map(fn ($medecin) => [
                'id' => $medecin->id,
                'name' => $medecin->user?->name,
                'specialite' => $medecin->specialite,
                'departement' => $medecin->departement?->nom,
                'consultations' => $medecin->consultations_total,
            ]);

        $activiteRecente = Notification::with('user:id,name')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'titre' => $n->titre,
                'message' => $n->message,
                'type' => $n->type,
                'user' => $n->user?->name,
                'created_at' => $n->created_at,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Statistiques globales',
            'data' => [
                'users_total' => User::count(),
                'patients_total' => Patient::count(),
                'medecins_total' => Medecin::count(),
                'rdv_total' => RendezVous::count(),
                'rdv_du_jour' => RendezVous::whereDate('date_rdv', now()->toDateString())->count(),
                'rdv_en_attente' => RendezVous::where('statut', 'en_attente')->count(),
                'demandes_nouvelles' => DemandeRdv::where('statut', 'nouvelle')->count(),
                'factures_total' => Facture::count(),
                'montant_facture' => (float) Facture::sum('montant_total'),
                'montant_paye' => (float) Facture::sum('montant_paye'),
                'rdv_par_statut' => $rdvParStatut,
                'rdv_par_departement' => $rdvParDepartement,
                'rdv_semaine' => $rdvSemaine,
                'top_medecins' => $topMedecins,
                'activite_recente' => $activiteRecente,
            ],
        ]);
    }

    public function demandesRdv(): JsonResponse
    {
        $items = DemandeRdv::with('departement')
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Demandes de rendez-vous',
            'data' => $items->items(),
            'meta' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
            ],
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

    public function patients(Request $request): JsonResponse
    {
        $q = $request->get('q', '');
        $items = Patient::with('user:id,name,email,phone,is_active')
            ->when($q, fn ($query) => $query->where('numero_patient', 'like', "%{$q}%")
                ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")))
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Liste patients',
            'data' => $items->items(),
            'meta' => ['total' => $items->total(), 'per_page' => $items->perPage(), 'current_page' => $items->currentPage()],
        ]);
    }

    public function medecins(Request $request): JsonResponse
    {
        $q = $request->get('q', '');
        $items = Medecin::with(['user:id,name,email,phone,is_active', 'departement:id,nom'])
            ->when($q, fn ($query) => $query->where('specialite', 'like', "%{$q}%")
                ->orWhere('numero_ordre', 'like', "%{$q}%")
                ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")))
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Liste medecins',
            'data' => $items->items(),
            'meta' => ['total' => $items->total(), 'per_page' => $items->perPage(), 'current_page' => $items->currentPage()],
        ]);
    }

    public function departements(): JsonResponse
    {
        $items = Departement::withCount(['users', 'medecins'])->orderBy('nom')->get();

        return response()->json([
            'success' => true,
            'message' => 'Departements',
            'data' => $items,
        ]);
    }

    public function utilisateurs(Request $request): JsonResponse
    {
        $query = User::query()
            ->when($request->role, fn ($q, $r) => $q->where('role', $r))
            ->when($request->q, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"))
            ->latest();

        $items = $query->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateurs',
            'data' => $items->items(),
            'meta' => ['total' => $items->total(), 'per_page' => $items->perPage(), 'current_page' => $items->currentPage()],
        ]);
    }

    public function creerUtilisateur(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:25',
            'password' => 'required|string|min:8',
            'role' => 'required|string|max:50',
            'departement_id' => 'nullable|exists:departements,id',
        ]);

        $user = User::create([
            ...$validated,
            'password' => Hash::make($validated['password']),
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur cree',
            'data' => $user,
        ], 201);
    }

    public function updateUtilisateur(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'phone' => 'nullable|string|max:25',
            'role' => 'sometimes|string|max:50',
            'departement_id' => 'nullable|exists:departements,id',
        ]);

        $user->fill($validated);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur mis a jour',
            'data' => $user,
        ]);
    }

    public function toggleUtilisateur(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        if ($user->role === 'admin' && $user->is_active) {
            return response()->json(['success' => false, 'message' => 'Impossible de desactiver le dernier admin', 'errors' => []], 422);
        }
        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'success' => true,
            'message' => $user->is_active ? 'Utilisateur active' : 'Utilisateur desactive',
            'data' => $user,
        ]);
    }

    public function togglePatient(int $id): JsonResponse
    {
        $patient = Patient::with('user')->findOrFail($id);
        $user = $patient->user;
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Utilisateur patient introuvable', 'errors' => []], 404);
        }

        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'success' => true,
            'message' => $user->is_active ? 'Patient active' : 'Patient desactive',
            'data' => $patient->load('user:id,name,email,phone,is_active'),
        ]);
    }

    public function storeDepartement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'code' => 'required|string|max:20|unique:departements,code',
            'description' => 'nullable|string',
        ]);

        $departement = Departement::create([
            ...$validated,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Departement cree',
            'data' => $departement,
        ], 201);
    }

    public function updateDepartement(Request $request, int $id): JsonResponse
    {
        $departement = Departement::findOrFail($id);

        $validated = $request->validate([
            'nom' => 'sometimes|string|max:100',
            'code' => 'sometimes|string|max:20|unique:departements,code,'.$id,
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $departement->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Departement mis a jour',
            'data' => $departement->loadCount(['users', 'medecins']),
        ]);
    }

    public function facturation(Request $request): JsonResponse
    {
        $factures = Facture::with(['patient.user', 'paiements'])
            ->when($request->statut, fn ($q, $s) => $q->where('statut', $s))
            ->latest('date_facture')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Vue facturation',
            'data' => $factures->items(),
            'meta' => [
                'total' => $factures->total(),
                'montant_total' => (float) Facture::sum('montant_total'),
                'montant_paye' => (float) Facture::sum('montant_paye'),
                'montant_impaye' => (float) Facture::whereIn('statut', ['emise', 'partiellement_payee'])->sum('reste_a_payer'),
                'per_page' => $factures->perPage(),
                'current_page' => $factures->currentPage(),
            ],
        ]);
    }
}
