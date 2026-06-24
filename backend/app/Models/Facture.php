<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Facture extends Model
{
    protected $fillable = [
        'numero_facture',
        'patient_id',
        'rendez_vous_id',
        'caissier_id',
        'date_facture',
        'date_echeance',
        'lignes',
        'sous_total',
        'remise',
        'montant_total',
        'montant_paye',
        'reste_a_payer',
        'statut',
        'notes',
    ];

    protected $casts = [
        'date_facture' => 'date',
        'date_echeance' => 'date',
        'lignes' => 'array',
        'sous_total' => 'decimal:2',
        'remise' => 'decimal:2',
        'montant_total' => 'decimal:2',
        'montant_paye' => 'decimal:2',
        'reste_a_payer' => 'decimal:2',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }
}
