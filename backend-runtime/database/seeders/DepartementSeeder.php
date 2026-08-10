<?php

namespace Database\Seeders;

use App\Models\Departement;
use Illuminate\Database\Seeder;

/**
 * Catalogue des services du Centre Médical AMEN.
 * Préchargés pour sélection à l'affectation du personnel ; l'admin peut en ajouter d'autres.
 */
class DepartementSeeder extends Seeder
{
    /** @return list<array{nom: string, code: string, description: string, is_active: bool}> */
    public static function catalogue(): array
    {
        return [
            [
                'nom' => 'Médecine générale',
                'code' => 'MED_GEN',
                'description' => 'Consultations générales et orientation du parcours patient.',
                'is_active' => true,
            ],
            [
                'nom' => 'Médecine interne',
                'code' => 'MED_INT',
                'description' => 'Pathologies internes de l’adulte.',
                'is_active' => true,
            ],
            [
                'nom' => 'Urgences',
                'code' => 'URG',
                'description' => 'Prise en charge immédiate des cas urgents et critiques.',
                'is_active' => true,
            ],
            [
                'nom' => 'Pédiatrie',
                'code' => 'PED',
                'description' => 'Soins aux enfants, de la naissance à l’adolescence.',
                'is_active' => true,
            ],
            [
                'nom' => 'Maternité / Gynécologie',
                'code' => 'MAT',
                'description' => 'Suivi de grossesse, accouchement et santé de la femme.',
                'is_active' => true,
            ],
            [
                'nom' => 'Chirurgie',
                'code' => 'CHIR',
                'description' => 'Interventions chirurgicales et suivi post-opératoire.',
                'is_active' => true,
            ],
            [
                'nom' => 'Anesthésie / Réanimation',
                'code' => 'ANES',
                'description' => 'Anesthésie, réanimation et soins intensifs.',
                'is_active' => true,
            ],
            [
                'nom' => 'Ophtalmologie',
                'code' => 'OPHT',
                'description' => 'Soins des yeux et de la vision.',
                'is_active' => true,
            ],
            [
                'nom' => 'Dentisterie / Stomatologie',
                'code' => 'DENT',
                'description' => 'Soins dentaires et bucco-dentaires.',
                'is_active' => true,
            ],
            [
                'nom' => 'Kinésithérapie',
                'code' => 'KINE',
                'description' => 'Rééducation et thérapie physique.',
                'is_active' => true,
            ],
            [
                'nom' => 'Laboratoire',
                'code' => 'LAB',
                'description' => 'Analyses biologiques et examens de laboratoire.',
                'is_active' => true,
            ],
            [
                'nom' => 'Imagerie / Radiologie',
                'code' => 'RADIO',
                'description' => 'Radiographie, échographie et imagerie médicale.',
                'is_active' => true,
            ],
            [
                'nom' => 'Pharmacie',
                'code' => 'PHARM',
                'description' => 'Dispensation des médicaments sur ordonnance.',
                'is_active' => true,
            ],
            [
                'nom' => 'Accueil / Réception',
                'code' => 'ACC',
                'description' => 'Accueil des patients, admissions et orientation.',
                'is_active' => true,
            ],
            [
                'nom' => 'Caisse / Facturation',
                'code' => 'CAISSE',
                'description' => 'Encaissements, factures et paiements.',
                'is_active' => true,
            ],
            [
                'nom' => 'Hospitalisation',
                'code' => 'HOSP',
                'description' => 'Lits, chambres et séjour hospitalier.',
                'is_active' => true,
            ],
            [
                'nom' => 'Administration',
                'code' => 'ADMIN',
                'description' => 'Direction et gestion administrative du centre.',
                'is_active' => true,
            ],
        ];
    }

    /** Codes des services actifs (rétrocompatibilité). */
    public const ACTIFS = [
        'MED_GEN', 'MED_INT', 'URG', 'PED', 'MAT', 'CHIR', 'ANES',
        'OPHT', 'DENT', 'KINE', 'LAB', 'RADIO', 'PHARM', 'ACC', 'CAISSE', 'HOSP', 'ADMIN',
    ];

    public function run(): void
    {
        foreach (self::catalogue() as $departement) {
            Departement::updateOrCreate(
                ['code' => $departement['code']],
                $departement
            );
        }

        // Alias historique éventuel
        Departement::where('code', 'GYN')->update([
            'is_active' => false,
            'description' => 'Fusionné dans Maternité / Gynécologie (MAT).',
        ]);
    }
}
