<?php

namespace App\Services\Parcours;

use App\Models\Admission;
use App\Models\Facture;
use App\Models\FactureLigne;
use Illuminate\Support\Facades\DB;

/**
 * Facturation transversale : une ligne d'acte à chaque étape du parcours.
 */
class FacturationParcoursService
{
    /** Tarifs indicatifs (FC) par acte / étape. */
    public const TARIFS = [
        'enregistrement' => ['code' => 'ACC-01', 'libelle' => 'Accueil / ouverture dossier', 'montant' => 5000],
        'triage' => ['code' => 'TRI-01', 'libelle' => 'Triage / constantes vitales', 'montant' => 3000],
        'consultation' => ['code' => 'CON-01', 'libelle' => 'Consultation médicale', 'montant' => 15000],
        'examens_labo' => ['code' => 'LAB-01', 'libelle' => 'Examen de laboratoire', 'montant' => 10000],
        'diagnostic' => ['code' => 'DIA-01', 'libelle' => 'Diagnostic / décision médicale', 'montant' => 5000],
        'pharmacie_ambulatoire' => ['code' => 'PHA-01', 'libelle' => 'Délivrance ordonnance', 'montant' => 2000],
        'hospitalisation' => ['code' => 'HOS-01', 'libelle' => 'Admission hospitalisation', 'montant' => 25000],
        'sortie' => ['code' => 'SOR-01', 'libelle' => 'Frais de sortie', 'montant' => 2000],
    ];

    public function facturerActe(Admission $admission, string $etape, ?string $description = null, ?float $montant = null): FactureLigne
    {
        $tarif = self::TARIFS[$etape] ?? [
            'code' => strtoupper(substr($etape, 0, 3)).'-00',
            'libelle' => $description ?? $etape,
            'montant' => $montant ?? 0,
        ];

        $montantLigne = $montant ?? (float) $tarif['montant'];
        $libelle = $description ?? $tarif['libelle'];

        return DB::transaction(function () use ($admission, $etape, $tarif, $montantLigne, $libelle) {
            $facture = Facture::query()
                ->where('admission_id', $admission->id)
                ->whereIn('statut', ['emise', 'brouillon', 'partiellement_payee'])
                ->latest('id')
                ->first();

            if (! $facture) {
                $facture = Facture::create([
                    'numero_facture' => 'FAC-'.$admission->numero_admission.'-'.now()->format('His'),
                    'patient_id' => $admission->patient_id,
                    'admission_id' => $admission->id,
                    'date_facture' => now()->toDateString(),
                    'lignes' => [],
                    'sous_total' => 0,
                    'remise' => 0,
                    'montant_total' => 0,
                    'montant_paye' => 0,
                    'reste_a_payer' => 0,
                    'statut' => 'emise',
                ]);
            }

            $ligne = FactureLigne::create([
                'facture_id' => $facture->id,
                'admission_id' => $admission->id,
                'etape' => $etape,
                'acte_code' => $tarif['code'],
                'description' => $libelle.' ('.$admission->numero_admission.')',
                'quantite' => 1,
                'prix_unitaire' => $montantLigne,
                'montant' => $montantLigne,
            ]);

            $lignesJson = $facture->lignes ?? [];
            $lignesJson[] = [
                'description' => $ligne->description,
                'quantite' => 1,
                'prix_unitaire' => $montantLigne,
                'montant' => $montantLigne,
                'etape' => $etape,
            ];

            $nouveauTotal = (float) $facture->montant_total + $montantLigne;
            $facture->update([
                'lignes' => $lignesJson,
                'sous_total' => $nouveauTotal,
                'montant_total' => $nouveauTotal,
                'reste_a_payer' => $nouveauTotal - (float) $facture->montant_paye,
            ]);

            return $ligne;
        });
    }
}
