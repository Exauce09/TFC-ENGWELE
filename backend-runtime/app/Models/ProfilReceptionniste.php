<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfilReceptionniste extends Model
{
    protected $table = 'profils_receptionnistes';

    protected $fillable = [
        'user_id',
        'poste_accueil',
        'langues',
        'horaires_shift',
        'formation_logiciel',
    ];

    protected $casts = [
        'langues' => 'array',
        'formation_logiciel' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
