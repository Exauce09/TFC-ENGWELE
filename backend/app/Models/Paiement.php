<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Paiement extends Model
{
    protected $fillable = [
        'facture_id',
        'patient_id',
        'caissier_id',
        'montant',
        'mode_paiement',
        'reference_transaction',
        'date_paiement',
        'statut',
        'notes',
    ];

    protected $casts = [
        'date_paiement' => 'datetime',
        'montant' => 'decimal:2',
    ];

    public function facture(): BelongsTo
    {
        return $this->belongsTo(Facture::class);
    }
}
