<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SoinInfirmier extends Model
{
    protected $table = 'soins_infirmiers';

    public $timestamps = false;

    protected $fillable = [
        'patient_id',
        'infirmier_id',
        'dossier_id',
        'date_soin',
        'temperature',
        'tension_arterielle',
        'frequence_cardiaque',
        'frequence_respiratoire',
        'saturation_02',
        'glycemie',
        'poids_kg',
        'actes_realises',
        'medicaments_administres',
        'observations',
    ];

    protected $casts = [
        'date_soin' => 'datetime',
        'medicaments_administres' => 'array',
        'temperature' => 'decimal:1',
        'glycemie' => 'decimal:2',
        'poids_kg' => 'decimal:2',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function infirmier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'infirmier_id');
    }
}
