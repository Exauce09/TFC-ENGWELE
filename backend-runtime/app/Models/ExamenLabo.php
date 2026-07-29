<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamenLabo extends Model
{
    protected $table = 'examens_labo';

    protected $fillable = [
        'admission_id',
        'prescrit_par',
        'laborantin_id',
        'type_examen',
        'categorie',
        'indication',
        'statut',
        'urgent',
        'priorite',
        'type_echantillon',
        'conditions_prelevement',
        'numero_echantillon',
        'resultats',
        'interpretation',
        'technique',
        'commentaire_medecin',
        'valide_par_medecin_at',
        'prescrit_at',
        'preleve_at',
        'recu_labo_at',
        'termine_at',
    ];

    protected $casts = [
        'urgent' => 'boolean',
        'resultats' => 'array',
        'prescrit_at' => 'datetime',
        'preleve_at' => 'datetime',
        'recu_labo_at' => 'datetime',
        'termine_at' => 'datetime',
        'valide_par_medecin_at' => 'datetime',
    ];

    protected $appends = ['priorite_label', 'statut_label'];

    public function getPrioriteLabelAttribute(): string
    {
        return match ($this->priorite) {
            'stat' => 'STAT (immédiat)',
            'urgent' => 'Urgent',
            default => 'Routine',
        };
    }

    public function getStatutLabelAttribute(): string
    {
        return match ($this->statut) {
            'prescrit' => 'Prescrit',
            'en_cours' => 'En cours',
            'termine' => 'Résultat disponible',
            'annule' => 'Annulé',
            default => (string) $this->statut,
        };
    }

    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    public function prescritPar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'prescrit_par');
    }

    public function laborantin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'laborantin_id');
    }
}
