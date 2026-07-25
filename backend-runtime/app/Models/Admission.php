<?php

namespace App\Models;

use App\Enums\AdmissionStatut;
use App\Services\Parcours\AdmissionStateMachine;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Admission extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'numero_admission',
        'patient_id',
        'departement_id',
        'enregistre_par',
        'medecin_referent_id',
        'statut',
        'mode_arrivee',
        'motif_arrivee',
        'circuit',
        'observations',
        'arrivee_at',
        'sortie_at',
        'date_suivi_prevue',
        'consignes_sortie',
        'facturation_ouverte',
    ];

    protected $casts = [
        'arrivee_at' => 'datetime',
        'sortie_at' => 'datetime',
        'date_suivi_prevue' => 'date',
        'facturation_ouverte' => 'boolean',
    ];

    protected $appends = ['statut_label', 'prochaines_etapes'];

    public function getStatutLabelAttribute(): string
    {
        return AdmissionStatut::tryFrom($this->statut)?->label() ?? $this->statut;
    }

    public function getProchainesEtapesAttribute(): array
    {
        return app(AdmissionStateMachine::class)->prochainesEtapes($this);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class);
    }

    public function enregistreur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'enregistre_par');
    }

    public function medecinReferent(): BelongsTo
    {
        return $this->belongsTo(Medecin::class, 'medecin_referent_id');
    }

    public function triage(): HasOne
    {
        return $this->hasOne(Triage::class);
    }

    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class);
    }

    public function derniereConsultation(): HasOne
    {
        return $this->hasOne(Consultation::class)->latestOfMany();
    }

    public function examensLabo(): HasMany
    {
        return $this->hasMany(ExamenLabo::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(ParcoursPrescription::class);
    }

    public function hospitalisation(): HasOne
    {
        return $this->hasOne(Hospitalisation::class);
    }

    public function historiqueStatuts(): HasMany
    {
        return $this->hasMany(AdmissionStatutHistorique::class)->orderBy('created_at');
    }

    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class);
    }

    public function factureLignes(): HasMany
    {
        return $this->hasMany(FactureLigne::class);
    }

    public static function genererNumero(): string
    {
        return 'ADM-'.now()->format('Ymd').'-'.str_pad(
            (string) (static::whereDate('created_at', today())->count() + 1),
            4,
            '0',
            STR_PAD_LEFT
        );
    }
}
