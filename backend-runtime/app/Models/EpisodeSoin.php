<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EpisodeSoin extends Model
{
    protected $table = 'episodes_soins';

    public const ETAPES = [
        'enregistrement',
        'triage',
        'consultation',
        'examens',
        'decision',
        'ambulatoire',
        'hospitalisation',
        'sorti',
        'suivi_post_sortie',
        'termine',
    ];

    public const LABELS = [
        'enregistrement' => '1. Accueil / Enregistrement',
        'triage' => '2. Triage infirmier',
        'consultation' => '3. Consultation médicale',
        'examens' => '4. Laboratoire / Imagerie',
        'decision' => '5. Retour médecin / Décision',
        'ambulatoire' => '6a. Circuit ambulatoire',
        'hospitalisation' => '6b. Circuit hospitalisation',
        'sorti' => '7. Sortie',
        'suivi_post_sortie' => '8. Suivi post-sortie',
        'termine' => 'Parcours terminé',
    ];

    protected $fillable = [
        'numero_episode',
        'patient_id',
        'enregistre_par',
        'triage_par',
        'medecin_id',
        'dossier_id',
        'departement_id',
        'etape',
        'motif_arrivee',
        'mode_arrivee',
        'niveau_urgence',
        'notes_triage',
        'triage_at',
        'circuit',
        'decision_medicale',
        'decision_at',
        'service_hospitalisation',
        'lit',
        'admission_at',
        'sortie_at',
        'date_suivi_prevue',
        'consignes_sortie',
        'facturation_ouverte',
        'observations',
    ];

    protected $casts = [
        'triage_at' => 'datetime',
        'decision_at' => 'datetime',
        'admission_at' => 'datetime',
        'sortie_at' => 'datetime',
        'date_suivi_prevue' => 'date',
        'facturation_ouverte' => 'boolean',
    ];

    protected $appends = ['etape_label'];

    public function getEtapeLabelAttribute(): string
    {
        return self::LABELS[$this->etape] ?? $this->etape;
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function enregistreur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'enregistre_par');
    }

    public function triageur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triage_par');
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Medecin::class);
    }

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(DossierMedical::class, 'dossier_id');
    }

    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class);
    }

    public static function genererNumero(): string
    {
        return 'EPS-'.now()->format('Ymd').'-'.str_pad((string) (static::whereDate('created_at', today())->count() + 1), 4, '0', STR_PAD_LEFT);
    }
}
