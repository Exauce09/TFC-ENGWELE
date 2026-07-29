<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DossierMedical extends Model
{
    protected $table = 'dossiers_medicaux';

    protected $fillable = [
        'numero_dossier',
        'patient_id',
        'ouvert_par',
        'medecin_id',
        'departement_id',
        'rendez_vous_id',
        'date_consultation',
        'motif',
        'anamnese',
        'examen_clinique',
        'observations',
        'statut',
        'ouvert_at',
    ];

    protected $casts = [
        'date_consultation' => 'date',
        'ouvert_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function ouvertPar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ouvert_par');
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(Medecin::class);
    }

    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class);
    }

    public function rendezVous(): BelongsTo
    {
        return $this->belongsTo(RendezVous::class, 'rendez_vous_id');
    }

    public function diagnostics(): HasMany
    {
        return $this->hasMany(Diagnostic::class, 'dossier_id');
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class, 'dossier_id')->latest('date_prescription')->latest('id');
    }

    public function episode(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(EpisodeSoin::class, 'dossier_id');
    }

    public static function genererNumero(): string
    {
        return 'DOS-'.now()->format('Ymd').'-'.str_pad((string) (static::whereDate('created_at', today())->count() + 1), 4, '0', STR_PAD_LEFT);
    }
}
