<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'nom',
        'post_nom',
        'prenom',
        'email',
        'login_identifiant',
        'phone',
        'password',
        'role',
        'departement_id',
        'avatar',
        'sexe',
        'date_naissance',
        'adresse',
        'piece_identite_numero',
        'date_embauche',
        'statut',
        'superviseur_id',
        'is_active',
        'must_change_password',
        'profil_complet',
        'fcm_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'date_naissance' => 'date',
        'date_embauche' => 'date',
        'is_active' => 'boolean',
        'must_change_password' => 'boolean',
        'profil_complet' => 'boolean',
        'password' => 'hashed',
    ];

    protected $appends = [
        'needs_onboarding',
    ];

    public function getNeedsOnboardingAttribute(): bool
    {
        return (bool) ($this->must_change_password || ! $this->profil_complet);
    }

    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class);
    }

    public function superviseur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'superviseur_id');
    }

    public function patient(): HasOne
    {
        return $this->hasOne(Patient::class);
    }

    public function medecin(): HasOne
    {
        return $this->hasOne(Medecin::class);
    }

    public function profilInfirmier(): HasOne
    {
        return $this->hasOne(ProfilInfirmier::class);
    }

    public function profilReceptionniste(): HasOne
    {
        return $this->hasOne(ProfilReceptionniste::class);
    }

    public function profilLaborantin(): HasOne
    {
        return $this->hasOne(ProfilLaborantin::class);
    }

    public function profilRadiologue(): HasOne
    {
        return $this->hasOne(ProfilRadiologue::class);
    }

    public function profilPharmacien(): HasOne
    {
        return $this->hasOne(ProfilPharmacien::class);
    }

    public function profilCaissier(): HasOne
    {
        return $this->hasOne(ProfilCaissier::class);
    }

    public function profilGestionnaireAssurance(): HasOne
    {
        return $this->hasOne(ProfilGestionnaireAssurance::class);
    }

    public function profilResponsableChambres(): HasOne
    {
        return $this->hasOne(ProfilResponsableChambres::class);
    }

    public function profilDirecteur(): HasOne
    {
        return $this->hasOne(ProfilDirecteur::class);
    }

    public function profilAdmin(): HasOne
    {
        return $this->hasOne(ProfilAdmin::class);
    }
}
