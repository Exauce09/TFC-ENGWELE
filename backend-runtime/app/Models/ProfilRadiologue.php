<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfilRadiologue extends Model
{
    protected $table = 'profils_radiologues';

    protected $fillable = [
        'user_id',
        'types_imagerie',
        'diplome',
        'numero_agrement',
        'habilitation',
    ];

    protected $casts = [
        'types_imagerie' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
