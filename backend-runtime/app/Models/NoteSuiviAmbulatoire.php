<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NoteSuiviAmbulatoire extends Model
{
    protected $table = 'notes_suivi_ambulatoire';

    protected $fillable = [
        'admission_id',
        'auteur_id',
        'date_note',
        'evolution',
        'constantes',
        'plan',
    ];

    protected $casts = [
        'date_note' => 'date',
        'constantes' => 'array',
    ];

    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'auteur_id');
    }
}
