<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Medecin extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'departement_id',
        'numero_ordre',
        'specialite',
        'grade',
        'diplomes',
        'disponibilites',
        'tarif_consultation',
        'duree_consultation',
        'bio',
    ];

    protected $casts = [
        'disponibilites' => 'array',
        'tarif_consultation' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class);
    }
}
