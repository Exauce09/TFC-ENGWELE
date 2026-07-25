<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParcoursPrescription extends Model
{
    protected $table = 'parcours_prescriptions';

    protected $fillable = [
        'admission_id',
        'medecin_id',
        'pharmacien_id',
        'date_prescription',
        'medicaments',
        'posologie_generale',
        'duree_jours',
        'statut',
        'delivree_at',
    ];

    protected $casts = [
        'date_prescription' => 'date',
        'medicaments' => 'array',
        'delivree_at' => 'datetime',
    ];

    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Medecin::class);
    }

    public function pharmacien(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pharmacien_id');
    }
}
