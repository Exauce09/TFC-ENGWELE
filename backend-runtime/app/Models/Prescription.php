<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prescription extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'dossier_id',
        'medecin_id',
        'patient_id',
        'date_prescription',
        'date_expiration',
        'medicaments',
        'instructions_generales',
        'renouvellement',
        'statut',
    ];

    protected $casts = [
        'date_prescription' => 'date',
        'date_expiration' => 'date',
        'medicaments' => 'array',
        'renouvellement' => 'boolean',
    ];

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(DossierMedical::class, 'dossier_id');
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Medecin::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
}
