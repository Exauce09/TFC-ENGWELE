<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfilResponsableChambres extends Model
{
    protected $table = 'profils_responsables_chambres';

    protected $fillable = [
        'user_id',
        'services_geres',
        'diplome',
    ];

    protected $casts = [
        'services_geres' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
