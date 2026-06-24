<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DossierMedical extends Model
{
    protected $table = 'dossiers_medicaux';

    protected $fillable = [
        'patient_id',
        'medecin_id',
        'departement_id',
        'rendez_vous_id',
        'date_consultation',
        'motif',
        'anamnese',
        'examen_clinique',
        'observations',
    ];

    protected $casts = [
        'date_consultation' => 'date',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
}
