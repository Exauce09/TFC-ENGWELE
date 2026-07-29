<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfilDirecteur extends Model
{
    protected $table = 'profils_directeurs';

    protected $fillable = [
        'user_id',
        'numero_ordre',
        'departements_supervises',
        'diplome',
        'niveau_autorite',
    ];

    protected $casts = [
        'departements_supervises' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
