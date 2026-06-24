<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DemandeRdv extends Model
{
    protected $table = 'demandes_rdv';

    protected $fillable = [
        'nom',
        'telephone',
        'departement_id',
        'service_libelle',
        'date_souhaitee',
        'message',
        'statut',
    ];

    protected $casts = [
        'date_souhaitee' => 'date',
    ];

    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class);
    }
}
