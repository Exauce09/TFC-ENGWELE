<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SoinDentaire extends Model
{
    public $timestamps = false;

    protected $table = 'soins_dentaires';

    protected $fillable = [
        'patient_id',
        'dentiste_id',
        'dossier_id',
        'date_soin',
        'type_soin',
        'dents_traitees',
        'actes',
        'anesthesie',
        'type_anesthesie',
        'observations',
        'prochain_rdv',
    ];

    protected $casts = [
        'date_soin' => 'date',
        'prochain_rdv' => 'date',
        'actes' => 'array',
        'anesthesie' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
}
