<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SuiviMaternite extends Model
{
    public $timestamps = false;

    protected $table = 'suivis_maternite';

    protected $fillable = [
        'patient_id',
        'sage_femme_id',
        'gynecologue_id',
        'date_dernieres_regles',
        'date_accouchement_prevue',
        'numero_consultation',
        'poids_kg',
        'tension_arterielle',
        'hauteur_uterine_cm',
        'bruit_coeur_foetal',
        'position_foetus',
        'observations',
        'type_visite',
        'grossesse_semaines',
    ];

    protected $casts = [
        'date_dernieres_regles' => 'date',
        'date_accouchement_prevue' => 'date',
        'poids_kg' => 'decimal:2',
        'hauteur_uterine_cm' => 'decimal:1',
        'created_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function sageFemme(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sage_femme_id');
    }
}
