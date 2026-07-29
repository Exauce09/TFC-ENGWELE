<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfilInfirmier extends Model
{
    protected $table = 'profils_infirmiers';

    protected $fillable = [
        'user_id',
        'numero_enregistrement',
        'specialisation',
        'diplome',
        'service_affectation',
        'poste_garde',
        'annees_experience',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
