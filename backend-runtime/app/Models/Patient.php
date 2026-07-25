<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'numero_patient',
        'date_naissance',
        'lieu_naissance',
        'nationalite',
        'profession',
        'etat_civil',
        'sexe',
        'adresse',
        'commune',
        'quartier',
        'groupe_sanguin',
        'allergies',
        'antecedents_medicaux',
        'antecedents_familiaux',
        'mutuelle',
        'numero_mutuelle',
        'assurance_type',
        'assurance_numero',
        'assurance_expire_le',
        'contact_urgence_nom',
        'contact_urgence_tel',
        'contact_urgence_lien',
    ];

    protected $casts = [
        'date_naissance' => 'date',
        'assurance_expire_le' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function admissions(): HasMany
    {
        return $this->hasMany(Admission::class)->latest();
    }

    public function admissionActive(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Admission::class)
            ->whereNotIn('statut', \App\Enums\AdmissionStatut::statutsClotures())
            ->latestOfMany();
    }

    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class);
    }

    public function rendezVous(): HasMany
    {
        return $this->hasMany(RendezVous::class);
    }
}
