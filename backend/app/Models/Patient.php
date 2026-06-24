<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'numero_patient',
        'date_naissance',
        'sexe',
        'adresse',
        'commune',
        'quartier',
        'groupe_sanguin',
        'allergies',
        'antecedents_medicaux',
        'antecedents_familiaux',
        'mutuelle',
        'numero_mutuelle',
        'contact_urgence_nom',
        'contact_urgence_tel',
    ];

    protected $casts = [
        'date_naissance' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
