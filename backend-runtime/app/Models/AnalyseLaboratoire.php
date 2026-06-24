<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalyseLaboratoire extends Model
{
    protected $table = 'analyses_laboratoire';

    protected $fillable = [
        'patient_id',
        'laborantin_id',
        'medecin_prescripteur_id',
        'dossier_id',
        'rendez_vous_id',
        'date_prelevement',
        'date_resultat',
        'type_analyse',
        'resultats',
        'interpretation',
        'fichier_pdf',
        'statut',
        'urgent',
    ];

    protected $casts = [
        'date_prelevement' => 'date',
        'date_resultat' => 'date',
        'resultats' => 'array',
        'urgent' => 'boolean',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function laborantin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'laborantin_id');
    }
}
