<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMedicament extends Model
{
    protected $table = 'stock_medicaments';

    protected $fillable = [
        'nom',
        'dci',
        'forme',
        'dosage',
        'fabricant',
        'numero_lot',
        'date_expiration',
        'quantite_stock',
        'seuil_alerte',
        'prix_unitaire',
        'categorie',
        'ordonnance_requise',
    ];

    protected $casts = [
        'date_expiration' => 'date',
        'prix_unitaire' => 'decimal:2',
        'ordonnance_requise' => 'boolean',
    ];
}
