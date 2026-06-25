<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResultatEchographie extends Model
{
    public $timestamps = false;

    protected $table = 'resultats_echographie';

    protected $fillable = [
        'patient_id',
        'echographiste_id',
        'medecin_prescripteur_id',
        'dossier_id',
        'date_examen',
        'type_echo',
        'organe_examine',
        'compte_rendu',
        'conclusion',
        'images',
        'statut',
    ];

    protected $casts = [
        'date_examen' => 'date',
        'images' => 'array',
        'created_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
}
