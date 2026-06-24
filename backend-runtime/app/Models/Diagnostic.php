<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Diagnostic extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'dossier_id',
        'medecin_id',
        'code_cim10',
        'libelle',
        'description',
        'type',
        'date_diagnostic',
    ];

    protected $casts = [
        'date_diagnostic' => 'date',
    ];

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(DossierMedical::class, 'dossier_id');
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Medecin::class);
    }
}
