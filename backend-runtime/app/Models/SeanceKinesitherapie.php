<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeanceKinesitherapie extends Model
{
    public $timestamps = false;

    protected $table = 'seances_kinesitherapie';

    protected $fillable = [
        'patient_id',
        'kinesitherapeute_id',
        'dossier_id',
        'date_seance',
        'heure_debut',
        'heure_fin',
        'numero_seance',
        'total_seances',
        'techniques',
        'observations',
        'evolution',
        'statut',
    ];

    protected $casts = [
        'date_seance' => 'date',
        'created_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
}
