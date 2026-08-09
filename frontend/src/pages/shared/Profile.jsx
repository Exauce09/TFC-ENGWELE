import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { MEDECIN_ROLES } from '../../constants/roleThemes';

const PROFILE_MEDECIN_ROLES = [
  ...MEDECIN_ROLES,
  'chirurgien', 'anesthesiste', 'dentiste',
];

const STATUTS = [
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
  { value: 'suspendu', label: 'Suspendu' },
  { value: 'en_conge', label: 'En congé' },
];

function csv(v) {
  if (Array.isArray(v)) return v.join(', ');
  return v || '';
}

function Field({ label, children, labelCls }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

export default function ProfilePage() {
  const { user, setCurrentUser } = useAuth();
  const isMedecin = PROFILE_MEDECIN_ROLES.includes(user?.role);
  const isInfirmier = user?.role === 'infirmier' || user?.role === 'sage_femme';

  const [form, setForm] = useState({
    nom: '',
    post_nom: '',
    prenom: '',
    phone: '',
    avatar: '',
    sexe: '',
    date_naissance: '',
    adresse: '',
    piece_identite_numero: '',
    date_embauche: '',
    statut: 'actif',
    metier: {},
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const metierKey = useMemo(() => {
    const r = user?.role;
    if (MEDECIN_ROLES.includes(r)) return 'medecin';
    if (r === 'infirmier' || r === 'sage_femme') return 'profil_infirmier';
    if (r === 'receptionniste') return 'profil_receptionniste';
    if (r === 'laborantin') return 'profil_laborantin';
    if (r === 'echographiste' || r === 'radiologue') return 'profil_radiologue';
    if (r === 'pharmacien') return 'profil_pharmacien';
    if (r === 'caissier') return 'profil_caissier';
    if (r === 'gestionnaire_assurance') return 'profil_gestionnaire_assurance';
    if (r === 'responsable_chambres') return 'profil_responsable_chambres';
    if (r === 'directeur_medical') return 'profil_directeur';
    if (r === 'admin') return 'profil_admin';
    return null;
  }, [user?.role]);

  useEffect(() => {
    if (!user) return;
    const rel = metierKey === 'medecin'
      ? user.medecin
      : metierKey
        ? user[metierKey]
        : null;

    setForm({
      nom: user.nom || '',
      post_nom: user.post_nom || '',
      prenom: user.prenom || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
      sexe: user.sexe || '',
      date_naissance: user.date_naissance?.slice?.(0, 10) || user.date_naissance || '',
      adresse: user.adresse || '',
      piece_identite_numero: user.piece_identite_numero || '',
      date_embauche: user.date_embauche?.slice?.(0, 10) || user.date_embauche || '',
      statut: user.statut || 'actif',
      metier: rel ? { ...rel } : {},
    });
  }, [user, metierKey]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setMetier = (key, value) => setForm((f) => ({
    ...f,
    metier: { ...f.metier, [key]: value },
  }));

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        nom: form.nom,
        post_nom: form.post_nom,
        prenom: form.prenom,
        phone: form.phone,
        avatar: form.avatar || null,
        sexe: form.sexe || null,
        date_naissance: form.date_naissance || null,
        adresse: form.adresse || null,
        piece_identite_numero: form.piece_identite_numero || null,
        date_embauche: form.date_embauche || null,
        statut: form.statut,
      };

      if (metierKey) {
        const m = { ...form.metier };
        // Nettoyage ids / timestamps
        delete m.id;
        delete m.user_id;
        delete m.created_at;
        delete m.updated_at;
        delete m.deleted_at;
        payload[metierKey] = m;
      }

      const res = await api.put('/profile', payload);
      const nextUser = res.data?.data || user;
      setCurrentUser(nextUser);
      setMessage('Profil mis à jour avec succès.');
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre à jour le profil.');
    } finally {
      setLoading(false);
    }
  };

  let inputCls = 'w-full rounded-xl border px-4 py-2.5 text-sm';
  let cardCls = 'rounded-2xl border bg-white p-6 shadow-sm';
  let titleCls = 'text-2xl font-bold text-slate-900';
  let mutedCls = 'mt-1 text-sm text-slate-500';
  let labelCls = 'mb-1 block text-sm font-medium text-slate-700';
  let btnCls = 'rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60';
  let infoCls = 'rounded-xl bg-slate-50 p-4 text-sm text-slate-600';
  let sectionTitle = 'text-lg font-semibold text-slate-900';

  if (isMedecin) {
    inputCls = 'w-full rounded-xl border border-[#C5D9D0] bg-white px-4 py-2.5 text-sm text-[#0D3B3A]';
    cardCls = 'medecin-card p-6';
    titleCls = 'font-medecin-display text-2xl text-[#0D3B3A]';
    mutedCls = 'mt-1 text-sm text-[#5A8A7A]';
    labelCls = 'mb-1 block text-sm font-medium text-[#0D3B3A]';
    btnCls = 'medecin-btn disabled:opacity-60';
    infoCls = 'rounded-xl bg-[#E8F5F2] p-4 text-sm text-[#0D3B3A]';
    sectionTitle = 'font-medecin-display text-lg text-[#0D3B3A]';
  } else if (isInfirmier) {
    inputCls = 'w-full rounded-xl border border-[#C9D4E3] bg-white px-4 py-2.5 text-sm text-[#152238]';
    cardCls = 'infirmier-card p-6';
    titleCls = 'font-infirmier-display text-2xl text-[#152238]';
    mutedCls = 'mt-1 text-sm text-[#7A8FA8]';
    labelCls = 'mb-1 block text-sm font-medium text-[#152238]';
    btnCls = 'infirmier-btn disabled:opacity-60';
    infoCls = 'rounded-xl bg-[#F8E8E2] p-4 text-sm text-[#152238]';
    sectionTitle = 'font-infirmier-display text-lg text-[#152238]';
  }

  const metierFields = (() => {
    const m = form.metier || {};
    if (metierKey === 'medecin') {
      return (
        <>
          <Field label="N° d'ordre (ONM)" labelCls={labelCls}>
            <input className={inputCls} value={m.numero_ordre || ''} onChange={(e) => setMetier('numero_ordre', e.target.value)} />
          </Field>
          <Field label="Spécialité" labelCls={labelCls}>
            <input className={inputCls} value={m.specialite || ''} onChange={(e) => setMetier('specialite', e.target.value)} />
          </Field>
          <Field label="Grade" labelCls={labelCls}>
            <input className={inputCls} value={m.grade || ''} onChange={(e) => setMetier('grade', e.target.value)} />
          </Field>
          <Field label="Années d'expérience" labelCls={labelCls}>
            <input type="number" min="0" className={inputCls} value={m.annees_experience ?? ''} onChange={(e) => setMetier('annees_experience', e.target.value === '' ? null : Number(e.target.value))} />
          </Field>
          <Field label="Type de contrat" labelCls={labelCls}>
            <select className={inputCls} value={m.type_contrat || ''} onChange={(e) => setMetier('type_contrat', e.target.value || null)}>
              <option value="">—</option>
              <option value="permanent">Permanent</option>
              <option value="vacataire">Vacataire</option>
              <option value="consultant_externe">Consultant externe</option>
            </select>
          </Field>
          <Field label="Tarif consultation (CDF)" labelCls={labelCls}>
            <input type="number" step="0.01" className={inputCls} value={m.tarif_consultation ?? ''} onChange={(e) => setMetier('tarif_consultation', e.target.value === '' ? null : e.target.value)} />
          </Field>
          <Field label="Durée consultation (min)" labelCls={labelCls}>
            <input type="number" className={inputCls} value={m.duree_consultation ?? 30} onChange={(e) => setMetier('duree_consultation', Number(e.target.value))} />
          </Field>
          <Field label="Langues parlées (séparées par virgule)" labelCls={labelCls}>
            <input className={inputCls} value={csv(m.langues)} onChange={(e) => setMetier('langues', e.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Diplômes (texte libre)" labelCls={labelCls}>
              <textarea rows={2} className={inputCls} value={m.diplomes || ''} onChange={(e) => setMetier('diplomes', e.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Établissements précédents (virgules)" labelCls={labelCls}>
              <input className={inputCls} value={csv(m.etablissements_precedents)} onChange={(e) => setMetier('etablissements_precedents', e.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Signature électronique (URL ou base64)" labelCls={labelCls}>
              <textarea rows={2} className={inputCls} value={m.signature_electronique || ''} onChange={(e) => setMetier('signature_electronique', e.target.value)} placeholder="data:image/png;base64,..." />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Bio" labelCls={labelCls}>
              <textarea rows={2} className={inputCls} value={m.bio || ''} onChange={(e) => setMetier('bio', e.target.value)} />
            </Field>
          </div>
        </>
      );
    }
    if (metierKey === 'profil_infirmier') {
      return (
        <>
          <Field label="N° enregistrement professionnel" labelCls={labelCls}>
            <input className={inputCls} value={m.numero_enregistrement || ''} onChange={(e) => setMetier('numero_enregistrement', e.target.value)} />
          </Field>
          <Field label="Spécialisation" labelCls={labelCls}>
            <input className={inputCls} value={m.specialisation || ''} onChange={(e) => setMetier('specialisation', e.target.value)} placeholder="soins généraux, urgences…" />
          </Field>
          <Field label="Diplôme (niveau RDC)" labelCls={labelCls}>
            <select className={inputCls} value={m.diplome || ''} onChange={(e) => setMetier('diplome', e.target.value || null)}>
              <option value="">—</option>
              <option value="A2">A2</option>
              <option value="A1">A1</option>
              <option value="gradue">Gradué</option>
              <option value="licence">Licencié</option>
              <option value="autre">Autre</option>
            </select>
          </Field>
          <Field label="Service d'affectation" labelCls={labelCls}>
            <input className={inputCls} value={m.service_affectation || ''} onChange={(e) => setMetier('service_affectation', e.target.value)} />
          </Field>
          <Field label="Poste / garde" labelCls={labelCls}>
            <select className={inputCls} value={m.poste_garde || ''} onChange={(e) => setMetier('poste_garde', e.target.value || null)}>
              <option value="">—</option>
              <option value="jour">Jour</option>
              <option value="nuit">Nuit</option>
              <option value="rotation">Rotation</option>
            </select>
          </Field>
          <Field label="Années d'expérience" labelCls={labelCls}>
            <input type="number" min="0" className={inputCls} value={m.annees_experience ?? ''} onChange={(e) => setMetier('annees_experience', e.target.value === '' ? null : Number(e.target.value))} />
          </Field>
        </>
      );
    }
    if (metierKey === 'profil_receptionniste') {
      return (
        <>
          <Field label="Poste d'accueil assigné" labelCls={labelCls}>
            <input className={inputCls} value={m.poste_accueil || ''} onChange={(e) => setMetier('poste_accueil', e.target.value)} placeholder="Guichet 1, Entrée principale…" />
          </Field>
          <Field label="Langues parlées (virgules)" labelCls={labelCls}>
            <input className={inputCls} value={csv(m.langues)} onChange={(e) => setMetier('langues', e.target.value)} placeholder="français, lingala, swahili" />
          </Field>
          <Field label="Horaires / shift" labelCls={labelCls}>
            <input className={inputCls} value={m.horaires_shift || ''} onChange={(e) => setMetier('horaires_shift', e.target.value)} />
          </Field>
          <Field label="Formation logiciel effectuée" labelCls={labelCls}>
            <select className={inputCls} value={m.formation_logiciel ? '1' : '0'} onChange={(e) => setMetier('formation_logiciel', e.target.value === '1')}>
              <option value="1">Oui</option>
              <option value="0">Non</option>
            </select>
          </Field>
        </>
      );
    }
    if (metierKey === 'profil_laborantin') {
      return (
        <>
          <Field label="Spécialisation" labelCls={labelCls}>
            <input className={inputCls} value={m.specialisation || ''} onChange={(e) => setMetier('specialisation', e.target.value)} />
          </Field>
          <Field label="Diplôme / certification" labelCls={labelCls}>
            <input className={inputCls} value={m.diplome || ''} onChange={(e) => setMetier('diplome', e.target.value)} />
          </Field>
          <Field label="N° d'agrément" labelCls={labelCls}>
            <input className={inputCls} value={m.numero_agrement || ''} onChange={(e) => setMetier('numero_agrement', e.target.value)} />
          </Field>
          <Field label="Équipements habilités (virgules)" labelCls={labelCls}>
            <input className={inputCls} value={csv(m.equipements_habilites)} onChange={(e) => setMetier('equipements_habilites', e.target.value)} />
          </Field>
        </>
      );
    }
    if (metierKey === 'profil_radiologue') {
      return (
        <>
          <Field label="Types d'imagerie (virgules)" labelCls={labelCls}>
            <input className={inputCls} value={csv(m.types_imagerie)} onChange={(e) => setMetier('types_imagerie', e.target.value)} placeholder="radio, échographie, scanner…" />
          </Field>
          <Field label="Diplôme / certification" labelCls={labelCls}>
            <input className={inputCls} value={m.diplome || ''} onChange={(e) => setMetier('diplome', e.target.value)} />
          </Field>
          <Field label="N° d'agrément" labelCls={labelCls}>
            <input className={inputCls} value={m.numero_agrement || ''} onChange={(e) => setMetier('numero_agrement', e.target.value)} />
          </Field>
          <Field label="Habilitation" labelCls={labelCls}>
            <select className={inputCls} value={m.habilitation || 'technicien'} onChange={(e) => setMetier('habilitation', e.target.value)}>
              <option value="technicien">Technicien (capture)</option>
              <option value="medecin_radiologue">Médecin radiologue (interprétation)</option>
            </select>
          </Field>
        </>
      );
    }
    if (metierKey === 'profil_pharmacien') {
      return (
        <>
          <Field label="N° d'ordre (pharmaciens)" labelCls={labelCls}>
            <input className={inputCls} value={m.numero_ordre || ''} onChange={(e) => setMetier('numero_ordre', e.target.value)} />
          </Field>
          <Field label="Diplôme" labelCls={labelCls}>
            <input className={inputCls} value={m.diplome || ''} onChange={(e) => setMetier('diplome', e.target.value)} />
          </Field>
          <Field label="Spécialisation" labelCls={labelCls}>
            <input className={inputCls} value={m.specialisation || ''} onChange={(e) => setMetier('specialisation', e.target.value)} />
          </Field>
          <Field label="Habilitations (virgules)" labelCls={labelCls}>
            <input className={inputCls} value={csv(m.habilitations)} onChange={(e) => setMetier('habilitations', e.target.value)} placeholder="stupéfiants, …" />
          </Field>
        </>
      );
    }
    if (metierKey === 'profil_caissier') {
      return (
        <>
          <Field label="Guichet / caisse" labelCls={labelCls}>
            <input className={inputCls} value={m.guichet || ''} onChange={(e) => setMetier('guichet', e.target.value)} />
          </Field>
          <Field label="Diplôme" labelCls={labelCls}>
            <input className={inputCls} value={m.diplome || ''} onChange={(e) => setMetier('diplome', e.target.value)} />
          </Field>
          <Field label="Plafond de transaction" labelCls={labelCls}>
            <input type="number" step="0.01" className={inputCls} value={m.plafond_transaction ?? ''} onChange={(e) => setMetier('plafond_transaction', e.target.value === '' ? null : e.target.value)} />
          </Field>
          <Field label="Devises gérées (virgules)" labelCls={labelCls}>
            <input className={inputCls} value={csv(m.devises)} onChange={(e) => setMetier('devises', e.target.value)} placeholder="CDF, USD" />
          </Field>
        </>
      );
    }
    if (metierKey === 'profil_gestionnaire_assurance') {
      return (
        <>
          <Field label="Compagnies gérées (virgules)" labelCls={labelCls}>
            <input className={inputCls} value={csv(m.compagnies_gerees)} onChange={(e) => setMetier('compagnies_gerees', e.target.value)} />
          </Field>
          <Field label="Diplôme" labelCls={labelCls}>
            <input className={inputCls} value={m.diplome || ''} onChange={(e) => setMetier('diplome', e.target.value)} />
          </Field>
          <Field label="Montant max d'approbation" labelCls={labelCls}>
            <input type="number" step="0.01" className={inputCls} value={m.montant_max_approbation ?? ''} onChange={(e) => setMetier('montant_max_approbation', e.target.value === '' ? null : e.target.value)} />
          </Field>
        </>
      );
    }
    if (metierKey === 'profil_responsable_chambres') {
      return (
        <>
          <Field label="Services gérés (virgules)" labelCls={labelCls}>
            <input className={inputCls} value={csv(m.services_geres)} onChange={(e) => setMetier('services_geres', e.target.value)} />
          </Field>
          <Field label="Diplôme" labelCls={labelCls}>
            <input className={inputCls} value={m.diplome || ''} onChange={(e) => setMetier('diplome', e.target.value)} />
          </Field>
        </>
      );
    }
    if (metierKey === 'profil_directeur') {
      return (
        <>
          <Field label="N° d'ordre" labelCls={labelCls}>
            <input className={inputCls} value={m.numero_ordre || ''} onChange={(e) => setMetier('numero_ordre', e.target.value)} />
          </Field>
          <Field label="Départements supervisés (virgules)" labelCls={labelCls}>
            <input className={inputCls} value={csv(m.departements_supervises)} onChange={(e) => setMetier('departements_supervises', e.target.value)} />
          </Field>
          <Field label="Diplôme" labelCls={labelCls}>
            <input className={inputCls} value={m.diplome || ''} onChange={(e) => setMetier('diplome', e.target.value)} />
          </Field>
          <Field label="Niveau d'autorité" labelCls={labelCls}>
            <select className={inputCls} value={m.niveau_autorite || 'direction'} onChange={(e) => setMetier('niveau_autorite', e.target.value)}>
              <option value="service">Service</option>
              <option value="direction">Direction</option>
              <option value="strategique">Stratégique</option>
            </select>
          </Field>
        </>
      );
    }
    if (metierKey === 'profil_admin') {
      return (
        <>
          <Field label="Fonction" labelCls={labelCls}>
            <select className={inputCls} value={m.fonction || 'technique'} onChange={(e) => setMetier('fonction', e.target.value)}>
              <option value="technique">Technique</option>
              <option value="direction_generale">Direction générale</option>
            </select>
          </Field>
          <Field label="Niveau d'accès" labelCls={labelCls}>
            <select className={inputCls} value={m.niveau_acces || 'total'} onChange={(e) => setMetier('niveau_acces', e.target.value)}>
              <option value="total">Accès total</option>
              <option value="delegue">Délégué</option>
            </select>
          </Field>
        </>
      );
    }
    return null;
  })();

  return (
    <Layout title="Mon Profil">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className={cardCls}>
          <h2 className={titleCls}>Mon profil</h2>
          <p className={mutedCls}>Identité, RH et informations professionnelles selon votre rôle.</p>
        </div>

        <form onSubmit={save} className="space-y-6">
          <div className={`space-y-4 ${cardCls}`}>
            <h3 className={sectionTitle}>Identité & RH</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Nom" labelCls={labelCls}>
                <input className={inputCls} value={form.nom} onChange={(e) => set('nom', e.target.value)} />
              </Field>
              <Field label="Post-nom" labelCls={labelCls}>
                <input className={inputCls} value={form.post_nom} onChange={(e) => set('post_nom', e.target.value)} />
              </Field>
              <Field label="Prénom" labelCls={labelCls}>
                <input className={inputCls} value={form.prenom} onChange={(e) => set('prenom', e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Sexe" labelCls={labelCls}>
                <select className={inputCls} value={form.sexe} onChange={(e) => set('sexe', e.target.value)}>
                  <option value="">—</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </Field>
              <Field label="Date de naissance" labelCls={labelCls}>
                <input type="date" className={inputCls} value={form.date_naissance} onChange={(e) => set('date_naissance', e.target.value)} />
              </Field>
              <Field label="Téléphone" labelCls={labelCls}>
                <input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+243…" />
              </Field>
              <Field label="N° pièce d'identité" labelCls={labelCls}>
                <input className={inputCls} value={form.piece_identite_numero} onChange={(e) => set('piece_identite_numero', e.target.value)} />
              </Field>
              <Field label="Date d'embauche" labelCls={labelCls}>
                <input type="date" className={inputCls} value={form.date_embauche} onChange={(e) => set('date_embauche', e.target.value)} />
              </Field>
              <Field label="Statut" labelCls={labelCls}>
                <select className={inputCls} value={form.statut} onChange={(e) => set('statut', e.target.value)}>
                  {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Adresse" labelCls={labelCls}>
              <textarea rows={2} className={inputCls} value={form.adresse} onChange={(e) => set('adresse', e.target.value)} />
            </Field>
            <Field label="Photo de profil (URL ou data URI)" labelCls={labelCls}>
              <input className={inputCls} value={form.avatar} onChange={(e) => set('avatar', e.target.value)} placeholder="https://… ou data:image/…" />
            </Field>
            <div className={infoCls}>
              <p><span className="font-semibold">Email :</span> {user?.email}</p>
              <p><span className="font-semibold">Rôle :</span> {user?.role}</p>
              {user?.departement && (
                <p><span className="font-semibold">Département :</span> {user.departement.nom || user.departement.name}</p>
              )}
              {user?.superviseur && (
                <p><span className="font-semibold">Superviseur :</span> {user.superviseur.name}</p>
              )}
            </div>
          </div>

          {metierFields && (
            <div className={`space-y-4 ${cardCls}`}>
              <h3 className={sectionTitle}>Profil professionnel</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {metierFields}
              </div>
            </div>
          )}

          {user?.role === 'patient' && user?.patient && (
            <div className={`space-y-2 ${cardCls}`}>
              <h3 className={sectionTitle}>Dossier patient</h3>
              <p className={mutedCls}>Les données médicales et d&apos;assurance se complètent via le parcours patient / réception.</p>
              <div className={infoCls}>
                <p><span className="font-semibold">N° patient :</span> {user.patient.numero_patient}</p>
                {user.patient.contact_urgence_nom && (
                  <p><span className="font-semibold">Contact d&apos;urgence :</span> {user.patient.contact_urgence_nom} ({user.patient.contact_urgence_tel})</p>
                )}
                {(user.patient.assurance_type || user.patient.mutuelle) && (
                  <p><span className="font-semibold">Assurance / mutuelle :</span> {user.patient.assurance_type || user.patient.mutuelle}</p>
                )}
              </div>
            </div>
          )}

          {error && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {message && <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

          <button type="submit" disabled={loading} className={btnCls}>
            {loading ? 'Enregistrement…' : 'Sauvegarder le profil'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
