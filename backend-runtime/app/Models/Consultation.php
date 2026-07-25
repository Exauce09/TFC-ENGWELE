<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Consultation extends Model
{
    protected $fillable = [
        'admission_id',
        'medecin_id',
        'date_consultation',
        'motif',
        'anamnese',
        'examen_clinique',
        'diagnostic_provisoire',
        'diagnostic_final',
        'code_cim10',
        'decision',
        'type_diagnostic',
        'observations',
    ];

    protected $casts = [
        'date_consultation' => 'datetime',
    ];

    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Medecin::class);
    }
}
