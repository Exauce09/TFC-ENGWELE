<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdmissionStatutHistorique extends Model
{
    protected $table = 'admission_statut_historique';

    public $timestamps = false;

    protected $fillable = [
        'admission_id',
        'statut_avant',
        'statut_apres',
        'user_id',
        'role_acteur',
        'commentaire',
        'meta',
        'created_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'created_at' => 'datetime',
    ];

    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
