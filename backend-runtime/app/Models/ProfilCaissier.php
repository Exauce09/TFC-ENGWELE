<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfilCaissier extends Model
{
    protected $table = 'profils_caissiers';

    protected $fillable = [
        'user_id',
        'guichet',
        'diplome',
        'plafond_transaction',
        'devises',
    ];

    protected $casts = [
        'plafond_transaction' => 'decimal:2',
        'devises' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
