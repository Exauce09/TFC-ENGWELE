<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prescription extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'numero_ordonnance',
        'dossier_id',
        'medecin_id',
        'patient_id',
        'date_prescription',
        'date_expiration',
        'validite_jours',
        'poids_kg',
        'medicaments',
        'diagnostic_motif',
        'instructions_generales',
        'renouvellement',
        'statut',
    ];

    protected $casts = [
        'date_prescription' => 'date',
        'date_expiration' => 'date',
        'medicaments' => 'array',
        'renouvellement' => 'boolean',
        'validite_jours' => 'integer',
        'poids_kg' => 'decimal:2',
    ];

    protected $appends = ['statut_label'];

    public function getStatutLabelAttribute(): string
    {
        return match ($this->statut) {
            'active' => 'Émise',
            'delivree' => 'Délivrée',
            'expiree' => 'Expirée',
            'annulee' => 'Annulée',
            default => (string) $this->statut,
        };
    }

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(DossierMedical::class, 'dossier_id');
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Medecin::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public static function genererNumero(): string
    {
        $prefix = 'ORD-'.now()->format('Ymd');
        $last = static::where('numero_ordonnance', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('numero_ordonnance');

        $seq = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $m)) {
            $seq = ((int) $m[1]) + 1;
        }

        return sprintf('%s-%04d', $prefix, $seq);
    }
}
