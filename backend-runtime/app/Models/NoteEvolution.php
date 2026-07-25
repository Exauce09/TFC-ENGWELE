<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NoteEvolution extends Model
{
    protected $table = 'notes_evolution';

    protected $fillable = [
        'hospitalisation_id',
        'auteur_id',
        'date_note',
        'heure_note',
        'type',
        'contenu',
        'constantes',
    ];

    protected $casts = [
        'date_note' => 'date',
        'constantes' => 'array',
    ];

    public function hospitalisation(): BelongsTo
    {
        return $this->belongsTo(Hospitalisation::class);
    }

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'auteur_id');
    }
}
