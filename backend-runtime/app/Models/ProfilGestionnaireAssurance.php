<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfilGestionnaireAssurance extends Model
{
    protected $table = 'profils_gestionnaires_assurance';

    protected $fillable = [
        'user_id',
        'compagnies_gerees',
        'diplome',
        'montant_max_approbation',
    ];

    protected $casts = [
        'compagnies_gerees' => 'array',
        'montant_max_approbation' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
