<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationChirurgicale extends Model
{
    public $timestamps = false;

    protected $table = 'operations_chirurgicales';

    protected $fillable = [
        'patient_id',
        'chirurgien_id',
        'anesthesiste_id',
        'dossier_id',
        'date_operation',
        'heure_debut',
        'heure_fin',
        'type_operation',
        'type_anesthesie',
        'salle',
        'compte_rendu',
        'complications',
        'statut',
    ];

    protected $casts = [
        'date_operation' => 'date',
        'created_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function chirurgien(): BelongsTo
    {
        return $this->belongsTo(User::class, 'chirurgien_id');
    }
}
