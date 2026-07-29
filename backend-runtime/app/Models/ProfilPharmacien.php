<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfilPharmacien extends Model
{
    protected $table = 'profils_pharmaciens';

    protected $fillable = [
        'user_id',
        'numero_ordre',
        'diplome',
        'specialisation',
        'habilitations',
    ];

    protected $casts = [
        'habilitations' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
