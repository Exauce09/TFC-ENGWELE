<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Triage extends Model
{
    protected $fillable = [
        'admission_id',
        'infirmier_id',
        'niveau_urgence',
        'temperature',
        'tension_arterielle',
        'frequence_cardiaque',
        'frequence_respiratoire',
        'saturation_02',
        'glycemie',
        'poids_kg',
        'taille_cm',
        'notes',
        'triage_at',
    ];

    protected $casts = [
        'triage_at' => 'datetime',
        'temperature' => 'decimal:1',
        'glycemie' => 'decimal:2',
        'poids_kg' => 'decimal:2',
        'taille_cm' => 'decimal:1',
    ];

    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    public function infirmier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'infirmier_id');
    }
}
