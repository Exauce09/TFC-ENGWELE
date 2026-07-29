<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfilAdmin extends Model
{
    protected $table = 'profils_admins';

    protected $fillable = [
        'user_id',
        'fonction',
        'niveau_acces',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
