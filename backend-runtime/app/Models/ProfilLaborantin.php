<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfilLaborantin extends Model
{
    protected $table = 'profils_laborantins';

    protected $fillable = [
        'user_id',
        'specialisation',
        'diplome',
        'numero_agrement',
        'equipements_habilites',
    ];

    protected $casts = [
        'equipements_habilites' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
