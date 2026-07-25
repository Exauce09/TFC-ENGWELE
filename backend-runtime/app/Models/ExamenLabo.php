<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamenLabo extends Model
{
    protected $table = 'examens_labo';

    protected $fillable = [
        'admission_id',
        'prescrit_par',
        'laborantin_id',
        'type_examen',
        'indication',
        'statut',
        'urgent',
        'resultats',
        'interpretation',
        'prescrit_at',
        'termine_at',
    ];

    protected $casts = [
        'urgent' => 'boolean',
        'resultats' => 'array',
        'prescrit_at' => 'datetime',
        'termine_at' => 'datetime',
    ];

    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    public function prescritPar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'prescrit_par');
    }

    public function laborantin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'laborantin_id');
    }
}
