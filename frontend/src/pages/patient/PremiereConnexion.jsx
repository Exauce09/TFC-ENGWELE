import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const COMMUNES = [
  'Bandalungwa', 'Barumbu', 'Bumbu', 'Gombe', 'Kalamu', 'Kasa-Vubu',
  'Kimbanseke', 'Kinshasa', 'Kintambo', 'Kisenso', 'Lemba', 'Limete',
  'Lingwala', 'Makala', 'Maluku', 'Masina', 'Matete', 'Mont-Ngafula',
  'Ndjili', 'Ngaba', 'Ngaliema', 'Ngiri-Ngiri', 'Nsele', 'Selembao',
];

const ETATS = [
  { value: '', label: '—' },
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'marie', label: 'Marié(e)' },
  { value: 'divorce', label: 'Divorcé(e)' },
  { value: 'veuf', label: 'Veuf / veuve' },
  { value: 'autre', label: 'Autre' },
];

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400';
const lockedCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700';

/**
 * Première connexion : identité hospitalière figée + données réception affichées
 * + corrections / compléments + nouveau mot de passe.
 */
export default function PremiereConnexion() {
  const { user, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    phone: '',
    date_naissance: '',
    age_declare: '',
    sexe: '',
    etat_civil: '',
    adresse: '',
    quartier: '',
    commune: 'Matete',
    ville: 'Kinshasa',
    piece_identite_type: '',
    piece_identite_numero: '',
    contact_urgence_nom: '',
    contact_urgence_lien: '',
    contact_urgence_tel: '',
    groupe_sanguin: '',
    allergies: '',
    antecedents_medicaux: '',
    password: '',
    password_confirmation: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/me');
        if (cancelled) return;
        const u = res.data.data;
        const p = u.patient || {};
        setProfile(u);
        setForm({
          phone: u.phone || '',
          date_naissance: p.date_naissance ? String(p.date_naissance).slice(0, 10) : '',
          age_declare: p.age_declare != null ? String(p.age_declare) : '',
          sexe: p.sexe || '',
          etat_civil: p.etat_civil || '',
          adresse: p.adresse || '',
          quartier: p.quartier || '',
          commune: p.commune || 'Matete',
          ville: p.ville || 'Kinshasa',
          piece_identite_type: p.piece_identite_type || '',
          piece_identite_numero: p.piece_identite_numero || '',
          contact_urgence_nom: p.contact_urgence_nom || '',
          contact_urgence_lien: p.contact_urgence_lien || '',
          contact_urgence_tel: p.contact_urgence_tel || '',
          groupe_sanguin: p.groupe_sanguin || '',
          allergies: p.allergies || '',
          antecedents_medicaux: p.antecedents_medicaux || '',
          password: '',
          password_confirmation: '',
        });
      } catch {
        if (!cancelled) setError('Impossible de charger votre dossier. Réessayez.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const locked = useMemo(() => ({
    name: profile?.name || user?.name || '—',
    numero: profile?.patient?.numero_patient || '—',
    login: profile?.login_identifiant || '—',
  }), [profile, user]);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.password.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (!form.sexe) {
      setError('Indiquez votre sexe.');
      return;
    }
    if (!form.date_naissance && !form.age_declare) {
      setError('Indiquez la date de naissance ou l’âge.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const payload = {
        ...form,
        age_declare: form.age_declare === '' ? null : Number(form.age_declare),
        date_naissance: form.date_naissance || null,
        groupe_sanguin: form.groupe_sanguin || null,
      };
      const res = await api.post('/patient/premiere-connexion', payload);
      const next = res.data.data;
      setCurrentUser(next);
      navigate(res.data.redirect || '/patient/dashboard', { replace: true });
    } catch (err) {
      const errors = err.response?.data?.errors;
      const first = errors ? Object.values(errors).flat()[0] : null;
      setError(first || err.response?.data?.message || 'Impossible d’enregistrer.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Chargement de votre dossier…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 border-b border-slate-100 pb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Centre Médical AMEN</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Première connexion</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Bonjour <strong>{locked.name}</strong>. Vérifiez les informations saisies à l’accueil,
            corrigez ce qui est inexact, complétez le reste, puis choisissez un nouveau mot de passe
            (le mot de passe provisoire <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">Amen2026</code> ne doit plus être utilisé).
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {/* Identité hospitalière — figée */}
          <section className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-teal-800">Identité hospitalière (non modifiable)</h2>
            <p className="mt-1 text-xs text-teal-700/80">Attribuée par la réception — contactez l’accueil en cas d’erreur de nom.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Nom complet</span>
                <input readOnly value={locked.name} className={lockedCls} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">N° patient</span>
                <input readOnly value={locked.numero} className={`${lockedCls} font-mono`} />
              </label>
            </div>
          </section>

          {/* Données réception — affichées, corrigeables */}
          <section>
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">Informations de l’accueil</h2>
            <p className="mb-3 text-xs text-slate-500">Préremplies à la réception — corrigez uniquement si une erreur a été saisie.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Téléphone *</span>
                <input required value={form.phone} onChange={set('phone')} placeholder="+243 …" className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Sexe *</span>
                <select required value={form.sexe} onChange={set('sexe')} className={inputCls}>
                  <option value="">— Choisir —</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Date de naissance</span>
                <input type="date" value={form.date_naissance} onChange={set('date_naissance')} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Âge (si date inconnue)</span>
                <input type="number" min={0} max={120} value={form.age_declare} onChange={set('age_declare')} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">État civil</span>
                <select value={form.etat_civil} onChange={set('etat_civil')} className={inputCls}>
                  {ETATS.map((e) => <option key={e.value || 'x'} value={e.value}>{e.label}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Commune</span>
                <select value={form.commune} onChange={set('commune')} className={inputCls}>
                  {COMMUNES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Adresse (avenue)</span>
                <input value={form.adresse} onChange={set('adresse')} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Quartier</span>
                <input value={form.quartier} onChange={set('quartier')} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Ville</span>
                <input value={form.ville} onChange={set('ville')} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Type de pièce</span>
                <input value={form.piece_identite_type} onChange={set('piece_identite_type')} className={inputCls} placeholder="carte_electeur, passeport…" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">N° de pièce</span>
                <input value={form.piece_identite_numero} onChange={set('piece_identite_numero')} className={inputCls} />
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">Contact d’urgence & santé</h2>
            <p className="mb-3 text-xs text-slate-500">Complétez ou corrigez — utile en cas d’urgence.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Nom du contact</span>
                <input value={form.contact_urgence_nom} onChange={set('contact_urgence_nom')} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Lien</span>
                <input value={form.contact_urgence_lien} onChange={set('contact_urgence_lien')} placeholder="Époux, père…" className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Téléphone contact</span>
                <input value={form.contact_urgence_tel} onChange={set('contact_urgence_tel')} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Groupe sanguin</span>
                <select value={form.groupe_sanguin} onChange={set('groupe_sanguin')} className={inputCls}>
                  <option value="">— Inconnu —</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Allergies</span>
                <input value={form.allergies} onChange={set('allergies')} placeholder="Aucune si vide" className={inputCls} />
              </label>
              <label className="block text-sm sm:col-span-3">
                <span className="mb-1 block font-medium">Antécédents médicaux</span>
                <textarea rows={2} value={form.antecedents_medicaux} onChange={set('antecedents_medicaux')} className={inputCls} />
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Nouveau mot de passe *</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Mot de passe</span>
                <input required type="password" minLength={8} value={form.password} onChange={set('password')} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Confirmer</span>
                <input required type="password" minLength={8} value={form.password_confirmation} onChange={set('password_confirmation')} className={inputCls} />
              </label>
            </div>
          </section>

          {error && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-teal-700 to-cyan-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/20 disabled:opacity-60"
          >
            {busy ? 'Enregistrement…' : 'Valider mon profil et accéder à mon espace'}
          </button>
        </form>
      </div>
    </main>
  );
}
