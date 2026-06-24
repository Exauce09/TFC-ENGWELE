<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemandeRdv;
use App\Models\Departement;
use App\Models\Facture;
use App\Models\Medecin;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
                'rdv_en_attente' => RendezVous::where('statut', 'en_attente')->count(),
                'demandes_nouvelles' => DemandeRdv::where('statut', 'nouvelle')->count(),
                'factures_total' => Facture::count(),
                'montant_facture' => (float) Facture::sum('montant_total'),
                'montant_paye' => (float) Facture::sum('montant_paye'),
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

    public function patients(): JsonResponse
    {
        $items = Patient::with('user:id,name,email,phone,is_active')
            ->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Liste patients',
            'data' => $items->items(),
            'meta' => ['total' => $items->total(), 'per_page' => $items->perPage(), 'current_page' => $items->currentPage()],
        ]);
    }

    public function medecins(): JsonResponse
    {
        $items = Medecin::with(['user:id,name,email,phone,is_active', 'departement:id,nom'])
            ->latest()->paginate(15);

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
