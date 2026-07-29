<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParcoursPrescription extends Model
{
    protected $table = 'parcours_prescriptions';

    protected $fillable = [
        'admission_id',
        'numero_ordonnance',
        'medecin_id',
        'pharmacien_id',
        'date_prescription',
        'medicaments',
        'lignes_delivrance',
        'posologie_generale',
        'duree_jours',
        'diagnostic_motif',
        'statut',
        'delivree_at',
        'notes_pharmacien',
        'allergies_signalees',
    ];

    protected $casts = [
        'date_prescription' => 'date',
        'medicaments' => 'array',
        'lignes_delivrance' => 'array',
        'delivree_at' => 'datetime',
    ];

    protected $appends = ['statut_label'];

    public function getStatutLabelAttribute(): string
    {
        return match ($this->statut) {
            'active' => 'En attente de délivrance',
            'delivree' => 'Délivrée',
            'annulee' => 'Annulée',
            default => (string) $this->statut,
        };
    }

    public static function genererNumero(): string
    {
        return 'ORD-P-'.now()->format('Ymd').'-'.str_pad(
            (string) (static::whereDate('created_at', today())->count() + 1),
            4,
            '0',
            STR_PAD_LEFT
        );
    }

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
