<?php

namespace App\Enums;

/**
 * Parcours patient AMEN — 9 étapes (accueil → suivi).
 *
 * 1 enregistre → 2 triage → 3 consultation_medicale
 *   → (optionnel) 4 prelevement → 5 examens_laboratoire
 *   → 6 diagnostic_prescription → 7 delivrance_medicaments
 *   → 8 initiation_traitement → 9 suivi
 */
enum AdmissionStatut: string
{
    case Enregistre = 'enregistre';
    case Triage = 'triage';
    case ConsultationMedicale = 'consultation_medicale';
    case Prelevement = 'prelevement';
    case ExamensLaboratoire = 'examens_laboratoire';
    case DiagnosticPrescription = 'diagnostic_prescription';
    case DelivranceMedicaments = 'delivrance_medicaments';
    case InitiationTraitement = 'initiation_traitement';
    case Suivi = 'suivi';

    public function label(): string
    {
        return match ($this) {
            self::Enregistre => '1. Accueil (réceptionniste)',
            self::Triage => '2. Triage (infirmier)',
            self::ConsultationMedicale => '3. Consultation médicale',
            self::Prelevement => '4. Prélèvement (infirmier)',
            self::ExamensLaboratoire => '5. Analyses de laboratoire',
            self::DiagnosticPrescription => '6. Diagnostic & prescription',
            self::DelivranceMedicaments => '7. Délivrance médicaments',
            self::InitiationTraitement => '8. Initiation du traitement',
            self::Suivi => '9. Suivi',
        };
    }

    /** @return list<self> */
    public function transitionsAutorisees(): array
    {
        return match ($this) {
            self::Enregistre => [self::Triage],
            self::Triage => [self::ConsultationMedicale],
            // Examens optionnels : passage direct au diagnostic possible
            self::ConsultationMedicale => [self::Prelevement, self::DiagnosticPrescription],
            self::Prelevement => [self::ExamensLaboratoire],
            self::ExamensLaboratoire => [self::DiagnosticPrescription],
            self::DiagnosticPrescription => [self::DelivranceMedicaments],
            self::DelivranceMedicaments => [self::InitiationTraitement],
            self::InitiationTraitement => [self::Suivi],
            self::Suivi => [],
        };
    }

    public function peutTransitionnerVers(self $cible): bool
    {
        return in_array($cible, $this->transitionsAutorisees(), true);
    }

    public function estCloture(): bool
    {
        return $this === self::Suivi;
    }

    /** @return list<string> */
    public static function statutsClotures(): array
    {
        return [self::Suivi->value];
    }

    /** @return array<string, string> */
    public static function labels(): array
    {
        $out = [];
        foreach (self::cases() as $case) {
            $out[$case->value] = $case->label();
        }

        return $out;
    }

    /** Anciens codes (v1/v2) → parcours 9 étapes. */
    public static function mapAncien(string $ancien): string
    {
        return match ($ancien) {
            'consultation' => self::ConsultationMedicale->value,
            'examens_prescrits', 'examens_en_cours', 'examens_termines', 'examens_labo' => self::ExamensLaboratoire->value,
            'diagnostic', 'decision_therapeutique' => self::DiagnosticPrescription->value,
            'prescription_delivree', 'pharmacie_ambulatoire' => self::DelivranceMedicaments->value,
            'initiation_traitement' => self::InitiationTraitement->value,
            'hospitalise', 'hospitalisation', 'suivi_en_cours', 'pret_pour_sortie', 'chirurgie' => self::ConsultationMedicale->value,
            'sortie', 'sortie_ambulatoire', 'sortie_hospitalisation', 'transfert', 'suivi_post_sortie' => self::Suivi->value,
            default => $ancien,
        };
    }
}
