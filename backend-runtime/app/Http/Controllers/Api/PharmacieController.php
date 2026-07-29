<?php

namespace App\Http\Controllers\Api;

use App\Enums\AdmissionStatut;
use App\Http\Controllers\Controller;
use App\Models\ParcoursPrescription;
use App\Models\Prescription;
use App\Models\StockMedicament;
use App\Services\Parcours\AdmissionStateMachine;
use App\Services\Parcours\FacturationParcoursService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Pharmacie : stock + ordonnances parcours (admissions) + legacy prescriptions.
 */
class PharmacieController extends Controller
{
    public function __construct(
        private readonly AdmissionStateMachine $stateMachine,
        private readonly FacturationParcoursService $facturation,
    ) {}

    public function dashboard(): JsonResponse
    {
        $stockBas = StockMedicament::whereColumn('quantite_stock', '<=', 'seuil_alerte')->count();

        return response()->json([
            'success' => true,
            'message' => 'Dashboard pharmacie',
            'data' => [
                'medicaments_total' => StockMedicament::count(),
                'stock_bas' => $stockBas,
                'ordonnances_actives' => ParcoursPrescription::where('statut', 'active')->count()
                    + Prescription::where('statut', 'active')->count(),
                'ordonnances_delivrees' => ParcoursPrescription::where('statut', 'delivree')->whereDate('delivree_at', today())->count()
                    + Prescription::where('statut', 'delivree')->whereDate('updated_at', today())->count(),
                'file_admissions' => \App\Models\Admission::where('statut', AdmissionStatut::DiagnosticPrescription->value)->count(),
            ],
        ]);
    }

    public function stock(Request $request): JsonResponse
    {
        $query = StockMedicament::query()
            ->when($request->q, fn ($q, $s) => $q->where('nom', 'like', "%{$s}%")->orWhere('dci', 'like', "%{$s}%"))
            ->when($request->alerte, fn ($q) => $q->whereColumn('quantite_stock', '<=', 'seuil_alerte'))
            ->orderBy('nom');

        $items = $query->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Stock medicaments',
            'data' => $items->items(),
            'meta' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
            ],
        ]);
    }

    public function storeStock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:200',
            'dci' => 'nullable|string|max:200',
            'forme' => 'nullable|string|max:100',
            'dosage' => 'nullable|string|max:100',
            'fabricant' => 'nullable|string|max:100',
            'numero_lot' => 'nullable|string|max:100',
            'date_expiration' => 'nullable|date',
            'quantite_stock' => 'required|integer|min:0',
            'seuil_alerte' => 'nullable|integer|min:0',
            'prix_unitaire' => 'nullable|numeric|min:0',
            'categorie' => 'nullable|string|max:100',
        ]);

        $med = StockMedicament::create([
            ...$validated,
            'seuil_alerte' => $validated['seuil_alerte'] ?? 10,
            'ordonnance_requise' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Medicament ajoute au stock',
            'data' => $med,
        ], 201);
    }

    public function updateStock(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'quantite_stock' => 'sometimes|integer|min:0',
            'seuil_alerte' => 'sometimes|integer|min:0',
            'prix_unitaire' => 'nullable|numeric|min:0',
            'numero_lot' => 'nullable|string|max:100',
            'date_expiration' => 'nullable|date',
        ]);

        $med = StockMedicament::findOrFail($id);
        $med->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Stock mis a jour',
            'data' => $med,
        ]);
    }

    public function ordonnances(): JsonResponse
    {
        $parcours = ParcoursPrescription::with([
            'admission.patient.user:id,name,phone',
            'admission.patient',
            'admission.departement:id,nom',
            'medecin.user:id,name',
            'pharmacien:id,name',
        ])
            ->whereIn('statut', ['active', 'delivree'])
            ->latest('date_prescription')
            ->limit(50)
            ->get()
            ->map(function (ParcoursPrescription $p) {
                return [
                    'id' => $p->id,
                    'source' => 'parcours',
                    'admission_id' => $p->admission_id,
                    'numero_ordonnance' => $p->numero_ordonnance ?: 'ORD-P-'.$p->id,
                    'date_prescription' => $p->date_prescription,
                    'medicaments' => $p->medicaments,
                    'lignes_delivrance' => $p->lignes_delivrance,
                    'posologie_generale' => $p->posologie_generale,
                    'diagnostic_motif' => $p->diagnostic_motif,
                    'statut' => $p->statut,
                    'statut_label' => $p->statut_label,
                    'notes_pharmacien' => $p->notes_pharmacien,
                    'allergies_signalees' => $p->allergies_signalees ?: $p->admission?->patient?->allergies,
                    'patient' => $p->admission?->patient,
                    'medecin' => $p->medecin,
                    'numero_admission' => $p->admission?->numero_admission,
                    'departement' => $p->admission?->departement?->nom,
                    'delivree_at' => $p->delivree_at,
                ];
            });

        $legacy = Prescription::with(['patient.user', 'medecin.user', 'medecin.departement', 'dossier:id,numero_dossier,motif'])
            ->whereIn('statut', ['active', 'delivree'])
            ->latest('date_prescription')
            ->limit(30)
            ->get()
            ->map(function (Prescription $p) {
                return [
                    'id' => $p->id,
                    'source' => 'dossier',
                    'admission_id' => null,
                    'numero_ordonnance' => $p->numero_ordonnance ?: 'ORD-'.$p->id,
                    'date_prescription' => $p->date_prescription,
                    'medicaments' => $p->medicaments,
                    'lignes_delivrance' => null,
                    'posologie_generale' => null,
                    'diagnostic_motif' => $p->diagnostic_motif ?? $p->dossier?->motif,
                    'statut' => $p->statut,
                    'statut_label' => $p->statut === 'active' ? 'En attente de délivrance' : 'Délivrée',
                    'notes_pharmacien' => null,
                    'allergies_signalees' => $p->patient?->allergies,
                    'patient' => $p->patient,
                    'medecin' => $p->medecin,
                    'numero_admission' => $p->dossier?->numero_dossier,
                    'departement' => $p->medecin?->departement?->nom,
                    'delivree_at' => $p->statut === 'delivree' ? $p->updated_at : null,
                    'poids_kg' => $p->poids_kg ?? null,
                ];
            });

        $items = $parcours->concat($legacy)
            ->sortByDesc(fn ($i) => (string) ($i['date_prescription'] ?? ''))
            ->values()
            ->take(40);

        return response()->json([
            'success' => true,
            'message' => 'Ordonnances (parcours + dossiers)',
            'data' => $items,
        ]);
    }

    public function delivrer(Request $request, int $id): JsonResponse
    {
        $source = $request->input('source', 'parcours');
        $validated = $request->validate([
            'source' => 'nullable|in:parcours,dossier',
            'notes_pharmacien' => 'nullable|string',
            'lignes_delivrance' => 'nullable|array',
            'lignes_delivrance.*.medicament_nom' => 'required_with:lignes_delivrance|string',
            'lignes_delivrance.*.quantite' => 'nullable|integer|min:1',
            'lignes_delivrance.*.stock_medicament_id' => 'nullable|integer|exists:stock_medicaments,id',
            'lignes_delivrance.*.numero_lot' => 'nullable|string|max:100',
            'lignes_delivrance.*.date_expiration' => 'nullable|date',
        ]);

        if (($validated['source'] ?? $source) === 'dossier') {
            return $this->delivrerLegacy($id);
        }

        $prescription = ParcoursPrescription::where('statut', 'active')->findOrFail($id);

        try {
            $result = DB::transaction(function () use ($request, $prescription, $validated) {
                $medicaments = $prescription->medicaments ?? [];
                $lignes = $validated['lignes_delivrance'] ?? [];

                if ($lignes === []) {
                    foreach ($medicaments as $med) {
                        $nom = $med['nom_dci'] ?? $med['nom'] ?? '';
                        $qty = (int) ($med['quantite'] ?? 1);
                        $stock = StockMedicament::where('nom', 'like', '%'.$nom.'%')
                            ->orWhere('dci', 'like', '%'.$nom.'%')
                            ->orderBy('date_expiration')
                            ->first();
                        $lignes[] = [
                            'medicament_nom' => $nom,
                            'quantite' => $qty,
                            'stock_medicament_id' => $stock?->id,
                            'numero_lot' => $stock?->numero_lot,
                            'date_expiration' => $stock?->date_expiration?->toDateString(),
                            'substitue' => false,
                        ];
                    }
                }

                foreach ($lignes as $ligne) {
                    $qty = max(1, (int) ($ligne['quantite'] ?? 1));
                    $stock = ! empty($ligne['stock_medicament_id'])
                        ? StockMedicament::find($ligne['stock_medicament_id'])
                        : StockMedicament::where('nom', 'like', '%'.($ligne['medicament_nom'] ?? '').'%')->first();
                    if ($stock && $stock->quantite_stock >= $qty) {
                        $stock->decrement('quantite_stock', $qty);
                    } elseif ($stock && $stock->quantite_stock > 0) {
                        $stock->update(['quantite_stock' => 0]);
                    }
                }

                $prescription->update([
                    'statut' => 'delivree',
                    'delivree_at' => now(),
                    'pharmacien_id' => $request->user()->id,
                    'lignes_delivrance' => $lignes,
                    'notes_pharmacien' => $validated['notes_pharmacien'] ?? null,
                    'allergies_signalees' => $prescription->admission?->patient?->allergies,
                ]);

                $admission = $prescription->admission;
                if ($admission && $admission->statut === AdmissionStatut::DiagnosticPrescription->value) {
                    $this->stateMachine->transition(
                        $admission,
                        AdmissionStatut::DelivranceMedicaments,
                        $request->user(),
                        'Médicaments délivrés — retour médecin pour initiation'
                    );
                    $this->facturation->facturerActe($admission, 'pharmacie_ambulatoire');
                }

                return $prescription->fresh([
                    'admission.patient.user',
                    'medecin.user',
                    'pharmacien',
                ]);
            });
        } catch (InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Ordonnance délivrée — parcours avancé vers initiation',
            'data' => [
                'id' => $result->id,
                'source' => 'parcours',
                'admission_id' => $result->admission_id,
                'numero_ordonnance' => $result->numero_ordonnance,
                'statut' => $result->statut,
                'lignes_delivrance' => $result->lignes_delivrance,
                'patient' => $result->admission?->patient,
                'medecin' => $result->medecin,
            ],
        ]);
    }

    private function delivrerLegacy(int $id): JsonResponse
    {
        $prescription = Prescription::where('statut', 'active')->findOrFail($id);
        $prescription->update(['statut' => 'delivree']);

        foreach ($prescription->medicaments ?? [] as $med) {
            $nom = $med['nom_dci'] ?? $med['nom'] ?? '';
            $qty = max(1, (int) ($med['quantite'] ?? 1));
            $stock = StockMedicament::where('nom', 'like', '%'.$nom.'%')->first();
            if ($stock && $stock->quantite_stock >= $qty) {
                $stock->decrement('quantite_stock', $qty);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Ordonnance dossier délivrée',
            'data' => $prescription->load(['patient.user', 'medecin.user']),
        ]);
    }
}
