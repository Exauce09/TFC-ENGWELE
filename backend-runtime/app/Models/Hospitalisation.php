<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hospitalisation extends Model
{
    protected $fillable = [
        'admission_id',
        'medecin_id',
        'service_id',
        'service_libelle',
        'lit',
        'chambre',
        'statut',
        'date_entree',
        'date_sortie',
        'motif_admission',
        'diagnostic_entree',
        'resume_sortie',
    ];

    protected $casts = [
        'date_entree' => 'datetime',
        'date_sortie' => 'datetime',
    ];

    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Medecin::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Departement::class, 'service_id');
    }

    public function notesEvolution(): HasMany
    {
        return $this->hasMany(NoteEvolution::class)->orderByDesc('date_note');
    }
}
