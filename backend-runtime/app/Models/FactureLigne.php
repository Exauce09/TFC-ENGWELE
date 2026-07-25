<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FactureLigne extends Model
{
    protected $table = 'facture_lignes';

    protected $fillable = [
        'facture_id',
        'admission_id',
        'etape',
        'acte_code',
        'description',
        'quantite',
        'prix_unitaire',
        'montant',
    ];

    protected $casts = [
        'prix_unitaire' => 'decimal:2',
        'montant' => 'decimal:2',
    ];

    public function facture(): BelongsTo
    {
        return $this->belongsTo(Facture::class);
    }

    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }
}
