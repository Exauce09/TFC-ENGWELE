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
use App\Services\StaffProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

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
            ->with([
                'departement:id,nom,code',
                'superviseur:id,name',
                'medecin',
                'profilInfirmier',
                'profilReceptionniste',
                'profilLaborantin',
                'profilRadiologue',
                'profilPharmacien',
                'profilCaissier',
                'profilAdmin',
            ])
            ->when($request->role, fn ($q, $r) => $q->where('role', $r))
            ->when($request->departement_id, fn ($q, $id) => $q->where('departement_id', $id))
            ->when($request->q, fn ($q, $s) => $q->where(function ($inner) use ($s) {
                $inner->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('nom', 'like', "%{$s}%")
                    ->orWhere('prenom', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%");
            }))
            ->latest();

        $items = $query->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateurs',
            'data' => $items->items(),
            'meta' => ['total' => $items->total(), 'per_page' => $items->perPage(), 'current_page' => $items->currentPage()],
        ]);
    }

    /** @return array<string, mixed> */
    private function utilisateurRules(bool $creating): array
    {
        $email = $creating
            ? 'required|email|unique:users,email'
            : 'sometimes|email|unique:users,email,'.$this->route('id');

        return [
            'name' => ($creating ? 'nullable' : 'sometimes').'|string|max:100',
            'nom' => ($creating ? 'required' : 'sometimes').'|string|max:80',
            'post_nom' => 'nullable|string|max:80',
            'prenom' => ($creating ? 'required' : 'sometimes').'|string|max:80',
            'email' => $email,
            'phone' => 'nullable|string|max:25',
            'password' => ($creating ? 'required' : 'nullable').'|string|min:8',
            'role' => ($creating ? 'required' : 'sometimes').'|string|max:50',
            'departement_id' => 'nullable|exists:departements,id',
            'sexe' => 'nullable|in:M,F',
            'date_naissance' => 'nullable|date',
            'adresse' => 'nullable|string|max:500',
            'piece_identite_numero' => 'nullable|string|max:80',
            'date_embauche' => 'nullable|date',
            'statut' => 'nullable|string|max:20',
            'superviseur_id' => 'nullable|exists:users,id',
            'must_change_password' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'medecin' => 'nullable|array',
            'medecin.numero_ordre' => 'nullable|string|max:80',
            'medecin.specialite' => 'nullable|string|max:120',
            'medecin.grade' => 'nullable|string|max:80',
            'medecin.diplomes' => 'nullable|string|max:500',
            'medecin.tarif_consultation' => 'nullable|numeric|min:0',
            'medecin.duree_consultation' => 'nullable|integer|min:5|max:240',
            'medecin.annees_experience' => 'nullable|integer|min:0|max:60',
            'medecin.type_contrat' => 'nullable|string|max:40',
            'medecin.bio' => 'nullable|string|max:2000',
            'medecin.langues' => 'nullable',
            'profil_infirmier' => 'nullable|array',
            'profil_infirmier.numero_enregistrement' => 'nullable|string|max:80',
            'profil_infirmier.specialisation' => 'nullable|string|max:120',
            'profil_infirmier.diplome' => 'nullable|string|max:80',
            'profil_infirmier.service_affectation' => 'nullable|string|max:120',
            'profil_infirmier.poste_garde' => 'nullable|string|max:40',
            'profil_infirmier.annees_experience' => 'nullable|integer|min:0|max:60',
            'profil_receptionniste' => 'nullable|array',
            'profil_receptionniste.poste_accueil' => 'nullable|string|max:120',
            'profil_receptionniste.langues' => 'nullable',
            'profil_receptionniste.horaires_shift' => 'nullable|string|max:120',
            'profil_laborantin' => 'nullable|array',
            'profil_laborantin.specialisation' => 'nullable|string|max:120',
            'profil_laborantin.diplome' => 'nullable|string|max:150',
            'profil_laborantin.numero_agrement' => 'nullable|string|max:80',
            'profil_pharmacien' => 'nullable|array',
            'profil_pharmacien.numero_ordre' => 'nullable|string|max:80',
            'profil_pharmacien.diplome' => 'nullable|string|max:150',
            'profil_pharmacien.specialisation' => 'nullable|string|max:120',
            'profil_caissier' => 'nullable|array',
            'profil_caissier.guichet' => 'nullable|string|max:80',
            'profil_caissier.diplome' => 'nullable|string|max:150',
            'profil_caissier.plafond_transaction' => 'nullable|numeric|min:0',
            'profil_radiologue' => 'nullable|array',
            'profil_radiologue.types_imagerie' => 'nullable',
            'profil_radiologue.diplome' => 'nullable|string|max:150',
            'profil_radiologue.numero_agrement' => 'nullable|string|max:80',
            'profil_radiologue.habilitation' => 'nullable|string|max:40',
        ];
    }

    /** @param array<string, mixed> $validated */
    private function applyDepartementRule(array &$validated, string $role): void
    {
        if (! StaffProfileService::requiresDepartement($role)) {
            return;
        }

        $deptId = StaffProfileService::resolveDepartementId(
            isset($validated['departement_id']) ? (int) $validated['departement_id'] : null,
            $role
        );
        if (! $deptId) {
            throw ValidationException::withMessages([
                'departement_id' => 'Créez d\'abord un département (Admin → Départements) avant d\'ajouter ce personnel.',
            ]);
        }
        $validated['departement_id'] = $deptId;
    }

    public function creerUtilisateur(Request $request): JsonResponse
    {
        $validated = $request->validate($this->utilisateurRules(true));
        $this->applyDepartementRule($validated, $validated['role']);

        $metierPayload = $request->only([
            'medecin',
            'profil_infirmier',
            'profil_receptionniste',
            'profil_laborantin',
            'profil_pharmacien',
            'profil_caissier',
            'profil_radiologue',
        ]);

        $displayParts = array_filter([
            $validated['prenom'] ?? null,
            $validated['nom'] ?? null,
            $validated['post_nom'] ?? null,
        ]);
        $validated['name'] = trim((string) ($validated['name'] ?? '')) !== ''
            ? $validated['name']
            : (implode(' ', $displayParts) ?: strstr($validated['email'], '@', true));

        try {
            $user = DB::transaction(function () use ($validated, $metierPayload) {
                $userData = collect($validated)->except([
                    'password',
                    'medecin',
                    'profil_infirmier',
                    'profil_receptionniste',
                    'profil_laborantin',
                    'profil_pharmacien',
                    'profil_caissier',
                    'profil_radiologue',
                ])->all();
                $user = User::create([
                    ...$userData,
                    'password' => $validated['password'],
                    'is_active' => $validated['is_active'] ?? true,
                    'statut' => $validated['statut'] ?? 'actif',
                    'must_change_password' => (bool) ($validated['must_change_password'] ?? true),
                    'profil_complet' => false,
                ]);

                StaffProfileService::ensureProfil($user->fresh());
                StaffProfileService::updateMetier($user->fresh(), $metierPayload);

                return $user->fresh();
            });
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages([
                'departement_id' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur cree',
            'data' => StaffProfileService::loadFull($user),
        ], 201);
    }

    public function updateUtilisateur(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate($this->utilisateurRules(false));
        $role = $validated['role'] ?? $user->role;

        if (array_key_exists('departement_id', $validated) || isset($validated['role'])) {
            $preferred = array_key_exists('departement_id', $validated)
                ? ($validated['departement_id'] !== null ? (int) $validated['departement_id'] : null)
                : ($user->departement_id ? (int) $user->departement_id : null);
            if (StaffProfileService::requiresDepartement($role)) {
                $deptId = StaffProfileService::resolveDepartementId($preferred, $role);
                if (! $deptId) {
                    throw ValidationException::withMessages([
                        'departement_id' => 'Créez d\'abord un département avant d\'assigner ce rôle.',
                    ]);
                }
                $validated['departement_id'] = $deptId;
            }
        }

        $metierPayload = $request->only([
            'medecin',
            'profil_infirmier',
            'profil_receptionniste',
            'profil_laborantin',
            'profil_pharmacien',
            'profil_caissier',
            'profil_radiologue',
        ]);

        try {
            DB::transaction(function () use ($user, $validated, $metierPayload) {
                $userData = collect($validated)
                    ->except(['password', 'medecin', 'profil_infirmier', 'profil_receptionniste', 'profil_laborantin', 'profil_pharmacien', 'profil_caissier', 'profil_radiologue'])
                    ->all();
                $user->fill($userData);
                if (! empty($validated['password'])) {
                    $user->password = $validated['password'];
                }
                StaffProfileService::syncDisplayName($user);
                $user->save();
                StaffProfileService::ensureProfil($user->fresh());
                StaffProfileService::updateMetier($user->fresh(), $metierPayload);
            });
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages([
                'departement_id' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur mis a jour',
            'data' => StaffProfileService::loadFull($user->fresh()),
        ]);
    }

    public function toggleUtilisateur(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        if ($user->role === 'admin' && $user->is_active) {
            $actifs = User::where('role', 'admin')->where('is_active', true)->count();
            if ($actifs <= 1) {
                return response()->json(['success' => false, 'message' => 'Impossible de desactiver le dernier admin', 'errors' => []], 422);
            }
        }
        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'success' => true,
            'message' => $user->is_active ? 'Utilisateur active' : 'Utilisateur desactive',
            'data' => $user,
        ]);
    }

    public function supprimerUtilisateur(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ((int) $request->user()->id === (int) $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas supprimer votre propre compte',
                'errors' => [],
            ], 422);
        }

        if ($user->role === 'admin') {
            $admins = User::where('role', 'admin')->count();
            if ($admins <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer le dernier administrateur',
                    'errors' => [],
                ], 422);
            }
        }

        try {
            DB::transaction(function () use ($user) {
                $user->tokens()->delete();
                $user->delete();
            });
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Suppression impossible : cet utilisateur a encore des donnees liees. Desactivez-le plutot.',
                'errors' => [],
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur supprime',
            'data' => null,
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
