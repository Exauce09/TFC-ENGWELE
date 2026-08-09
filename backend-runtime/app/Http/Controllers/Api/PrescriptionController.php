<?php

namespace App\Http\Controllers\Api;

use App\Enums\AdmissionStatut;
use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\DossierMedical;
use App\Models\Medecin;
use App\Models\ParcoursPrescription;
use App\Models\Patient;
use App\Models\Prescription;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrescriptionController extends Controller
{
    private const WITH = [
        'medecin.user:id,name',
        'medecin.departement:id,nom',
        'patient.user:id,name,phone',
        'dossier:id,numero_dossier,motif,departement_id',
        'dossier.departement:id,nom',
    ];

    public function mesPrescriptions(Request $request): JsonResponse
    {
        $patient = Patient::where('user_id', $request->user()->id)->firstOrFail();

        $legacy = Prescription::with(self::WITH)
            ->where('patient_id', $patient->id)
            ->latest('date_prescription')
            ->get()
            ->map(fn (Prescription $p) => array_merge($p->toArray(), ['source' => 'dossier']));

        $parcours = ParcoursPrescription::with([
            'medecin.user:id,name',
            'admission:id,numero_admission,patient_id',
        ])
            ->whereHas('admission', fn ($q) => $q->where('patient_id', $patient->id))
            ->latest('date_prescription')
            ->get()
            ->map(fn (ParcoursPrescription $p) => [
                'id' => $p->id,
                'source' => 'parcours',
                'numero_ordonnance' => $p->numero_ordonnance,
                'date_prescription' => $p->date_prescription?->toDateString(),
                'medicaments' => $p->medicaments,
                'statut' => $p->statut,
                'statut_label' => $p->statut_label,
                'diagnostic_motif' => $p->diagnostic_motif,
                'instructions_generales' => $p->posologie_generale,
                'medecin' => $p->medecin,
                'admission' => $p->admission,
            ]);

        $items = $legacy->concat($parcours)
            ->sortByDesc(fn ($row) => $row['date_prescription'] ?? '')
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Prescriptions',
            'data' => $items,
            'meta' => ['total' => $items->count()],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $prescription = Prescription::with(self::WITH)->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Détail ordonnance',
            'data' => $prescription,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $medecin = Medecin::with('departement')->where('user_id', $request->user()->id)->firstOrFail();

        $validated = $request->validate([
            'dossier_id' => 'required|exists:dossiers_medicaux,id',
            'patient_id' => 'required|exists:patients,id',
            'date_prescription' => 'required|date',
            'validite_jours' => 'nullable|integer|min:1|max:365',
            'date_expiration' => 'nullable|date|after_or_equal:date_prescription',
            'poids_kg' => 'nullable|numeric|min:0.5|max:400',
            'diagnostic_motif' => 'nullable|string|max:1000',
            'medicaments' => 'required|array|min:1',
            'medicaments.*.nom' => 'nullable|string|max:150',
            'medicaments.*.nom_dci' => 'nullable|string|max:150',
            'medicaments.*.nom_commercial' => 'nullable|string|max:150',
            'medicaments.*.dosage' => 'required|string|max:100',
            'medicaments.*.forme' => 'nullable|string|max:80',
            'medicaments.*.posologie' => 'nullable|string|max:150',
            'medicaments.*.frequence' => 'nullable|string|max:100',
            'medicaments.*.duree' => 'required|string|max:100',
            'medicaments.*.quantite' => 'nullable|string|max:80',
            'medicaments.*.instructions' => 'nullable|string|max:500',
            'instructions_generales' => 'nullable|string|max:2000',
            'renouvellement' => 'nullable|boolean',
        ]);

        $dossier = DossierMedical::findOrFail($validated['dossier_id']);
        if ((int) $dossier->patient_id !== (int) $validated['patient_id']) {
            return response()->json([
                'success' => false,
                'message' => 'Le patient ne correspond pas au dossier.',
            ], 422);
        }

        $medicaments = [];
        foreach ($validated['medicaments'] as $m) {
            $nom = trim((string) ($m['nom'] ?? ''));
            $dci = trim((string) ($m['nom_dci'] ?? ''));
            $commercial = trim((string) ($m['nom_commercial'] ?? ''));
            if ($nom === '') {
                $nom = trim($dci.($commercial !== '' ? ' ('.$commercial.')' : ''));
            }
            if ($nom === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'Chaque ligne doit avoir un nom (DCI ou commercial).',
                ], 422);
            }

            $posologie = $m['posologie'] ?? $m['frequence'] ?? '';

            $medicaments[] = [
                'nom' => $nom,
                'nom_dci' => $dci ?: null,
                'nom_commercial' => $commercial ?: null,
                'dosage' => $m['dosage'],
                'forme' => $m['forme'] ?? null,
                'posologie' => $posologie,
                'frequence' => $posologie,
                'duree' => $m['duree'],
                'quantite' => $m['quantite'] ?? null,
                'instructions' => $m['instructions'] ?? null,
            ];
        }

        $admission = Admission::where('patient_id', $validated['patient_id'])
            ->whereNotIn('statut', AdmissionStatut::statutsClotures())
            ->latest('id')
            ->first();

        $validite = (int) ($validated['validite_jours'] ?? 30);
        $datePrescription = Carbon::parse($validated['date_prescription'])->startOfDay();
        $dateExpiration = ! empty($validated['date_expiration'])
            ? Carbon::parse($validated['date_expiration'])->startOfDay()
            : $datePrescription->copy()->addDays($validite);

        $numero = Prescription::genererNumero();

        // Toujours enregistrer sur le dossier médical (affichage médecin / patient)
        $prescription = Prescription::create([
            'numero_ordonnance' => $numero,
            'dossier_id' => $validated['dossier_id'],
            'patient_id' => $validated['patient_id'],
            'medecin_id' => $medecin->id,
            'date_prescription' => $datePrescription->toDateString(),
            'date_expiration' => $dateExpiration->toDateString(),
            'validite_jours' => $validite,
            'poids_kg' => $validated['poids_kg'] ?? null,
            'medicaments' => $medicaments,
            'diagnostic_motif' => $validated['diagnostic_motif'] ?? $dossier->motif,
            'instructions_generales' => $validated['instructions_generales'] ?? null,
            'renouvellement' => $validated['renouvellement'] ?? false,
            'statut' => 'active',
        ]);

        // En phase labo / diagnostic → aussi visible pharmacie (parcours)
        if ($admission && in_array($admission->statut, [
            AdmissionStatut::ExamensLaboratoire->value,
            AdmissionStatut::DiagnosticPrescription->value,
        ], true)) {
            ParcoursPrescription::create([
                'admission_id' => $admission->id,
                'numero_ordonnance' => $numero,
                'medecin_id' => $medecin->id,
                'date_prescription' => $validated['date_prescription'],
                'medicaments' => $medicaments,
                'posologie_generale' => $validated['instructions_generales'] ?? null,
                'diagnostic_motif' => $validated['diagnostic_motif'] ?? $dossier->motif,
                'statut' => 'active',
                'allergies_signalees' => $admission->patient?->allergies,
            ]);
        }

        if (! $dossier->medecin_id) {
            $dossier->update(['medecin_id' => $medecin->id, 'statut' => 'en_consultation']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Ordonnance émise',
            'data' => $prescription->load(self::WITH),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $medecin = Medecin::where('user_id', $request->user()->id)->firstOrFail();
        $prescription = Prescription::where('medecin_id', $medecin->id)->findOrFail($id);

        if ($prescription->statut !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Ordonnance déjà validée ou délivrée — créez une correction plutôt que de modifier.',
            ], 422);
        }

        $validated = $request->validate([
            'validite_jours' => 'nullable|integer|min:1|max:365',
            'poids_kg' => 'nullable|numeric|min:0.5|max:400',
            'diagnostic_motif' => 'nullable|string|max:1000',
            'medicaments' => 'sometimes|array|min:1',
            'medicaments.*.nom' => 'nullable|string|max:150',
            'medicaments.*.nom_dci' => 'nullable|string|max:150',
            'medicaments.*.nom_commercial' => 'nullable|string|max:150',
            'medicaments.*.dosage' => 'required_with:medicaments|string|max:100',
            'medicaments.*.forme' => 'nullable|string|max:80',
            'medicaments.*.posologie' => 'nullable|string|max:150',
            'medicaments.*.frequence' => 'nullable|string|max:100',
            'medicaments.*.duree' => 'required_with:medicaments|string|max:100',
            'medicaments.*.quantite' => 'nullable|string|max:80',
            'medicaments.*.instructions' => 'nullable|string|max:500',
            'instructions_generales' => 'nullable|string|max:2000',
            'renouvellement' => 'nullable|boolean',
        ]);

        if (isset($validated['medicaments'])) {
            $validated['medicaments'] = collect($validated['medicaments'])->map(function (array $m) {
                $nom = trim((string) ($m['nom'] ?? ''));
                $dci = trim((string) ($m['nom_dci'] ?? ''));
                $commercial = trim((string) ($m['nom_commercial'] ?? ''));
                if ($nom === '') {
                    $nom = trim($dci.($commercial !== '' ? ' ('.$commercial.')' : ''));
                }
                $posologie = $m['posologie'] ?? $m['frequence'] ?? '';

                return [
                    'nom' => $nom,
                    'nom_dci' => $dci ?: null,
                    'nom_commercial' => $commercial ?: null,
                    'dosage' => $m['dosage'],
                    'forme' => $m['forme'] ?? null,
                    'posologie' => $posologie,
                    'frequence' => $posologie,
                    'duree' => $m['duree'],
                    'quantite' => $m['quantite'] ?? null,
                    'instructions' => $m['instructions'] ?? null,
                ];
            })->values()->all();
        }

        if (isset($validated['validite_jours'])) {
            $validated['date_expiration'] = Carbon::parse($prescription->date_prescription)
                ->addDays((int) $validated['validite_jours'])
                ->toDateString();
        }

        $prescription->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Ordonnance mise à jour',
            'data' => $prescription->fresh()->load(self::WITH),
        ]);
    }

    public function annuler(Request $request, int $id): JsonResponse
    {
        $medecin = Medecin::where('user_id', $request->user()->id)->firstOrFail();
        $prescription = Prescription::where('medecin_id', $medecin->id)->findOrFail($id);

        if ($prescription->statut === 'delivree') {
            return response()->json([
                'success' => false,
                'message' => 'Impossible d\'annuler une ordonnance déjà délivrée.',
            ], 422);
        }

        $prescription->update(['statut' => 'annulee']);

        return response()->json([
            'success' => true,
            'message' => 'Ordonnance annulée',
            'data' => $prescription->fresh()->load(self::WITH),
        ]);
    }
}
