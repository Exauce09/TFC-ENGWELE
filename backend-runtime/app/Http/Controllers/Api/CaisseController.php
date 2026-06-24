<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\Paiement;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Services\MobileMoneyService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CaisseController extends Controller
{
    public function __construct(
        private NotificationService $notifications,
        private MobileMoneyService $mobileMoney,
    ) {}

    public function dashboard(): JsonResponse
    {
        $today = now()->toDateString();

        return response()->json([
            'success' => true,
            'message' => 'Tableau de bord caisse',
            'data' => [
                'factures_du_jour' => Facture::whereDate('date_facture', $today)->count(),
                'montant_du_jour' => (float) Facture::whereDate('date_facture', $today)->sum('montant_total'),
                'paiements_du_jour' => (float) Paiement::whereDate('date_paiement', $today)->where('statut', 'confirme')->sum('montant'),
                'impayees' => Facture::whereIn('statut', ['emise', 'partiellement_payee'])->count(),
                'montant_impaye' => (float) Facture::whereIn('statut', ['emise', 'partiellement_payee'])->sum('reste_a_payer'),
                'factures_payees' => Facture::where('statut', 'payee')->count(),
            ],
        ]);
    }

    public function patients(): JsonResponse
    {
        $items = Patient::with('user:id,name,email,phone')
            ->orderBy('id')
            ->get(['id', 'user_id', 'numero_patient']);

        return response()->json([
            'success' => true,
            'message' => 'Patients',
            'data' => $items,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $factures = Facture::with(['patient.user', 'paiements'])
            ->when($request->statut, fn ($q, $s) => $q->where('statut', $s))
            ->when($request->patient_id, fn ($q, $p) => $q->where('patient_id', $p))
            ->when($request->date, fn ($q, $d) => $q->whereDate('date_facture', $d))
            ->latest('date_facture')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Liste des factures',
            'data' => $factures->items(),
            'meta' => [
                'total' => $factures->total(),
                'per_page' => $factures->perPage(),
                'current_page' => $factures->currentPage(),
            ],
        ]);
    }

    public function paiements(Request $request): JsonResponse
    {
        $paiements = Paiement::with(['facture', 'patient.user'])
            ->when($request->date, fn ($q, $d) => $q->whereDate('date_paiement', $d))
            ->latest('date_paiement')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Historique des paiements',
            'data' => $paiements->items(),
            'meta' => [
                'total' => $paiements->total(),
                'per_page' => $paiements->perPage(),
                'current_page' => $paiements->currentPage(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $facture = Facture::with(['patient.user', 'paiements', 'rendezVous'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail facture',
            'data' => $facture,
        ]);
    }

    public function mesFactures(Request $request): JsonResponse
    {
        $patient = Patient::where('user_id', $request->user()->id)->firstOrFail();
        $factures = Facture::with(['paiements'])
            ->where('patient_id', $patient->id)
            ->where('statut', '!=', 'annulee')
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Factures patient',
            'data' => $factures->items(),
            'meta' => [
                'total' => $factures->total(),
                'impayees' => Facture::where('patient_id', $patient->id)
                    ->whereIn('statut', ['emise', 'partiellement_payee'])
                    ->count(),
                'per_page' => $factures->perPage(),
                'current_page' => $factures->currentPage(),
            ],
        ]);
    }

    public function mesFactureDetail(Request $request, int $id): JsonResponse
    {
        $patient = Patient::where('user_id', $request->user()->id)->firstOrFail();
        $facture = Facture::with(['paiements'])
            ->where('patient_id', $patient->id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail facture',
            'data' => $facture,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'rendez_vous_id' => 'nullable|exists:rendez_vous,id',
            'lignes' => 'required|array|min:1',
            'lignes.*.description' => 'required|string',
            'lignes.*.quantite' => 'required|numeric|min:1',
            'lignes.*.prix_unitaire' => 'required|numeric|min:0',
            'remise' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $sousTotal = collect($validated['lignes'])->sum(
            fn ($line) => ((float) $line['quantite']) * ((float) $line['prix_unitaire'])
        );
        $remise = (float) ($validated['remise'] ?? 0);
        $total = max(0, $sousTotal - $remise);

        $facture = Facture::create([
            'numero_facture' => $this->nextNumero(),
            'patient_id' => $validated['patient_id'],
            'rendez_vous_id' => $validated['rendez_vous_id'] ?? null,
            'caissier_id' => $request->user()->id,
            'date_facture' => now()->toDateString(),
            'lignes' => $validated['lignes'],
            'sous_total' => $sousTotal,
            'remise' => $remise,
            'montant_total' => $total,
            'montant_paye' => 0,
            'reste_a_payer' => $total,
            'statut' => 'emise',
            'notes' => $validated['notes'] ?? null,
        ]);

        $patient = Patient::with('user')->find($validated['patient_id']);
        if ($patient?->user) {
            $this->notifications->notify(
                $patient->user,
                'Nouvelle facture',
                "Facture {$facture->numero_facture} de {$total} FC emise.",
                'paiement',
                ['facture_id' => $facture->id],
                sendSms: true,
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Facture creee',
            'data' => $facture->load(['patient.user']),
        ], 201);
    }

    public function enregistrerPaiement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'facture_id' => 'required|exists:factures,id',
            'montant' => 'required|numeric|min:1',
            'mode_paiement' => 'required|in:cash,airtel_money,mpesa,virement',
            'reference_transaction' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        $facture = Facture::with('patient.user')->findOrFail($validated['facture_id']);

        if ($facture->statut === 'annulee') {
            return response()->json(['success' => false, 'message' => 'Facture annulee', 'errors' => []], 422);
        }

        $reste = (float) $facture->reste_a_payer;
        if ((float) $validated['montant'] > $reste + 0.01) {
            return response()->json([
                'success' => false,
                'message' => "Montant superieur au reste a payer ({$reste} FC)",
                'errors' => [],
            ], 422);
        }

        $paiement = DB::transaction(function () use ($validated, $facture, $request) {
            $paiement = Paiement::create([
                'facture_id' => $facture->id,
                'patient_id' => $facture->patient_id,
                'caissier_id' => $request->user()->id,
                'montant' => $validated['montant'],
                'mode_paiement' => $validated['mode_paiement'],
                'reference_transaction' => $validated['reference_transaction'] ?? null,
                'date_paiement' => now(),
                'statut' => 'confirme',
                'notes' => $validated['notes'] ?? null,
            ]);

            $newPaid = (float) $facture->montant_paye + (float) $validated['montant'];
            $reste = max(0, (float) $facture->montant_total - $newPaid);

            $facture->update([
                'montant_paye' => $newPaid,
                'reste_a_payer' => $reste,
                'statut' => $reste <= 0 ? 'payee' : 'partiellement_payee',
            ]);

            return $paiement;
        });

        if ($facture->patient?->user) {
            $this->notifications->notify(
                $facture->patient->user,
                'Paiement recu',
                "Paiement de {$validated['montant']} FC enregistre pour {$facture->numero_facture}.",
                'paiement',
                ['facture_id' => $facture->id, 'paiement_id' => $paiement->id],
                sendSms: true,
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Paiement enregistre',
            'data' => [
                'paiement' => $paiement,
                'facture' => $facture->fresh(['patient.user', 'paiements']),
            ],
        ], 201);
    }

    public function payerFacture(Request $request, int $id): JsonResponse
    {
        $patient = Patient::with('user')->where('user_id', $request->user()->id)->firstOrFail();
        $facture = Facture::where('patient_id', $patient->id)->findOrFail($id);

        if (in_array($facture->statut, ['payee', 'annulee'], true)) {
            return response()->json(['success' => false, 'message' => 'Cette facture ne peut pas etre payee', 'errors' => []], 422);
        }

        $validated = $request->validate([
            'mode' => 'required|in:airtel_money,mpesa',
            'telephone' => 'required|string|max:25',
            'montant' => 'nullable|numeric|min:1000',
        ]);

        $montant = (float) ($validated['montant'] ?? $facture->reste_a_payer);
        if ($montant > (float) $facture->reste_a_payer + 0.01) {
            return response()->json(['success' => false, 'message' => 'Montant trop eleve', 'errors' => []], 422);
        }

        $mmResult = $this->mobileMoney->initierPaiementFacture(
            $facture,
            $validated['mode'],
            $validated['telephone'],
            $montant,
        );

        if (!$mmResult['success']) {
            return response()->json([
                'success' => false,
                'message' => $mmResult['message'],
                'errors' => [],
            ], 422);
        }

        if ($patient->user) {
            $this->notifications->notify(
                $patient->user,
                'Paiement confirme',
                "Votre paiement de {$montant} FC pour {$facture->numero_facture} est confirme.",
                'paiement',
                ['facture_id' => $facture->id],
                sendSms: true,
            );
        }

        return response()->json([
            'success' => true,
            'message' => $mmResult['message'],
            'data' => [
                'reference' => $mmResult['reference'],
                'facture' => $facture->fresh(['paiements']),
            ],
        ]);
    }

    public function annuler(Request $request, int $id): JsonResponse
    {
        $facture = Facture::with('patient.user')->findOrFail($id);

        if ($facture->statut === 'payee') {
            return response()->json(['success' => false, 'message' => 'Facture deja payee', 'errors' => []], 422);
        }

        $facture->update(['statut' => 'annulee', 'reste_a_payer' => 0]);

        if ($facture->patient?->user) {
            $this->notifications->notify(
                $facture->patient->user,
                'Facture annulee',
                "La facture {$facture->numero_facture} a ete annulee.",
                'paiement',
                ['facture_id' => $facture->id],
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Facture annulee',
            'data' => $facture,
        ]);
    }

    public static function creerFactureRdv(RendezVous $rdv, float $montant, ?int $caissierId = null): Facture
    {
        $existing = Facture::where('rendez_vous_id', $rdv->id)->first();
        if ($existing) {
            return $existing;
        }

        $description = $rdv->type === 'teleconsultation'
            ? 'Teleconsultation'
            : 'Consultation medicale';

        $controller = app(self::class);

        return Facture::create([
            'numero_facture' => $controller->nextNumero(),
            'patient_id' => $rdv->patient_id,
            'rendez_vous_id' => $rdv->id,
            'caissier_id' => $caissierId,
            'date_facture' => now()->toDateString(),
            'lignes' => [['description' => $description, 'quantite' => 1, 'prix_unitaire' => $montant]],
            'sous_total' => $montant,
            'remise' => 0,
            'montant_total' => $montant,
            'montant_paye' => 0,
            'reste_a_payer' => $montant,
            'statut' => 'emise',
        ]);
    }

    private function nextNumero(): string
    {
        $seq = (Facture::max('id') ?? 0) + 1;

        return 'FAC-'.now()->format('Y').'-'.Str::padLeft((string) $seq, 5, '0');
    }
}
