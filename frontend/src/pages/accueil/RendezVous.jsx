import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { nomMedecin } from '../../utils/format';

const STATUT_CLS = {
  confirme: 'bg-emerald-50 text-emerald-700',
  en_attente: 'bg-amber-50 text-amber-700',
  en_cours: 'bg-blue-50 text-blue-700',
  termine: 'bg-slate-100 text-slate-600',
  absent: 'bg-orange-50 text-orange-700',
  annule: 'bg-red-50 text-red-700',
};

export default function AccueilRendezVous() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const load = () => {
    setLoading(true);
    api.get('/accueil/rendez-vous', { params: { date } })
      .then((r) => setItems(r.data.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [date]);

  const convertir = async (id) => {
    if (!confirm('Patient présenté ? Convertir ce RDV en admission (accueil) — statut Terminé.')) return;
    setBusyId(id);
    setErr('');
    setMsg('');
    try {
      const res = await api.post(`/accueil/rendez-vous/${id}/convertir`);
      setMsg(res.data.message || 'Patient reçu — admission créée.');
      load();
    } catch (e) {
      setErr(e.response?.data?.message || 'Conversion impossible');
    } finally {
      setBusyId(null);
    }
  };

  const absent = async (id) => {
    if (!confirm('Marquer ce patient comme absent (non présenté) ?')) return;
    setBusyId(id);
    setErr('');
    setMsg('');
    try {
      const res = await api.post(`/accueil/rendez-vous/${id}/absent`);
      setMsg(res.data.message || 'Absent enregistré.');
      load();
    } catch (e) {
      setErr(e.response?.data?.message || 'Action impossible');
    } finally {
      setBusyId(null);
    }
  };

  const aujourdhui = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const actionable = (s) => ['confirme', 'en_attente'].includes(s);

  return (
    <Layout title="RDV du jour">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Rendez-vous du jour</h2>
          <p className="mt-1 text-sm text-slate-500">
            Jour J : convertir en accueil (patient reçu) ou marquer absent.
          </p>
        </div>
        <label className="text-sm">
          <span className="mr-2 text-slate-500">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm" />
        </label>
      </div>

      <p className="mb-4 text-sm capitalize text-slate-600">{aujourdhui}</p>

      {msg && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{msg}</div>}
      {err && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}

      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border bg-white p-10 text-center text-slate-500">
          Aucun rendez-vous pour cette date.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <article key={r.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    <span className="font-mono text-medical-primary">{String(r.heure_rdv).slice(0, 5)}</span>
                    {' — '}{r.patient?.user?.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {r.patient?.numero_patient ? `${r.patient.numero_patient} · ` : ''}
                    {nomMedecin(r.medecin?.user?.name)}
                    {r.departement?.nom ? ` · ${r.departement.nom}` : ''}
                  </p>
                  <p className="text-sm text-slate-600">{r.motif || '—'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUT_CLS[r.statut] || 'bg-slate-50'}`}>
                  {String(r.statut || '').replace(/_/g, ' ')}
                </span>
              </div>
              {actionable(r.statut) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => convertir(r.id)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Patient reçu → Accueil
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => absent(r.id)}
                    className="rounded-lg border border-orange-200 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-60"
                  >
                    Absent
                  </button>
                  <Link
                    to="/accueil/reception"
                    className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Formulaire réception
                  </Link>
                </div>
              )}
              {r.statut === 'termine' && (
                <p className="mt-2 text-xs text-emerald-700">Patient reçu — admission créée (parcours triage).</p>
              )}
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
