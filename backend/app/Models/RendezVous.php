<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RendezVous extends Model
{
    protected $table = 'rendez_vous';

    protected $fillable = [
        'patient_id',
        'medecin_id',
        'departement_id',
        'date_rdv',
        'heure_rdv',
        'heure_fin',
        'motif',
        'statut',
        'type',
        'lien_video',
        'priorite',
        'notes_rdv',
        'montant',
        'paiement_statut',
        'paiement_mode',
        'rappel_24h_envoye',
        'rappel_1h_envoye',
        'cree_par',
    ];

    protected $casts = [
        'date_rdv' => 'date',
        'montant' => 'decimal:2',
        'rappel_24h_envoye' => 'boolean',
        'rappel_1h_envoye' => 'boolean',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Medecin::class);
    }
}
