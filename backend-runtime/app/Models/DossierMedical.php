<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Medecin::class);
    }

    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class);
    }

    public function rendezVous(): BelongsTo
    {
        return $this->belongsTo(RendezVous::class, 'rendez_vous_id');
    }

    public function diagnostics(): HasMany
    {
        return $this->hasMany(Diagnostic::class, 'dossier_id');
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class, 'dossier_id');
    }
}
