import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/parcours/Modal';
import api from '../../services/api';
import { nomMedecin } from '../../utils/format';

const ONGLETS = [
  { key: 'nouvelle', label: 'À confirmer' },
  { key: 'traitee', label: 'Confirmées' },
  { key: 'annulee', label: 'Refusées' },
];

export default function AccueilDemandes() {
  const [statut, setStatut] = useState('nouvelle');
  const [items, setItems] = useState([]);
  const [aConfirmer, setAConfirmer] = useState(0);
  const [loading, setLoading] = useState(true);

  const [demande, setDemande] = useState(null);
  const [medecins, setMedecins] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [patients, setPatients] = useState([]);
  const [patient, setPatient] = useState(null);
  const [rdv, setRdv] = useState({ medecin_id: '', date_rdv: '', heure_rdv: '', motif: '' });
  const [creneaux, setCreneaux] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = (s = statut) => {
    setLoading(true);
    api.get('/accueil/demandes', { params: { statut: s } })
      .then((r) => {
        setItems(r.data.data || []);
        setAConfirmer(r.data.meta?.a_confirmer ?? 0);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(statut); }, [statut]);

  useEffect(() => {
    if (!rdv.medecin_id || !rdv.date_rdv) {
      setCreneaux([]);
      return;
    }
    api.get('/accueil/creneaux', {
      params: {
        medecin_id: rdv.medecin_id,
        date: rdv.date_rdv,
        exclure_rdv_id: demande?.source === 'rendez_vous' ? demande.id : undefined,
      },
    })
      .then((res) => setCreneaux(res.data.data || []))
      .catch(() => setCreneaux([]));
  }, [rdv.medecin_id, rdv.date_rdv, demande?.id, demande?.source]);

  const ouvrirConfirmation = (d) => {
    setDemande(d);
    setError('');
    if (d.source === 'rendez_vous') {
      setPatient(d.patient || { id: d.patient_id, user: { name: d.nom }, numero_patient: d.numero_patient });
      setPatients([]);
      setRecherche(d.nom || '');
      setRdv({
        medecin_id: d.medecin_id ? String(d.medecin_id) : '',
        date_rdv: d.date_souhaitee ? String(d.date_souhaitee).slice(0, 10) : '',
        heure_rdv: d.heure_rdv ? String(d.heure_rdv).slice(0, 5) : '',
        motif: d.message || '',
      });
    } else {
      setPatient(null);
      setPatients([]);
      setRecherche(d.nom || '');
      setRdv({
        medecin_id: '',
        date_rdv: d.date_souhaitee ? String(d.date_souhaitee).slice(0, 10) : '',
        heure_rdv: '',
        motif: d.message || d.service_libelle || '',
      });
    }
    api.get('/medecins', { params: d.departement_id ? { departement_id: d.departement_id } : {} })
      .then((r) => setMedecins(r.data.data || []))
      .catch(() => setMedecins([]));
  };

  const chercherPatient = async (q) => {
    setRecherche(q);
    if (q.trim().length < 2) { setPatients([]); return; }
    const res = await api.get('/accueil/patients', { params: { q } }).catch(() => ({ data: { data: [] } }));
    setPatients(res.data.data || []);
  };

  const confirmer = async (e) => {
    e.preventDefault();
    const isRdv = demande?.source === 'rendez_vous';
    if (!isRdv && !patient) {
      setError('Sélectionnez le patient enregistré à qui appartient cette demande.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.post(`/accueil/demandes/${demande.id}/confirmer`, {
        source: demande.source || 'demande_publique',
        ...rdv,
        patient_id: patient?.id || demande.patient_id,
      });
      setDemande(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Confirmation impossible.');
    } finally {
      setBusy(false);
    }
  };

  const refuser = async (d) => {
    await api.put(`/accueil/demandes/${d.id}`, {
      statut: 'annulee',
      source: d.source || 'demande_publique',
    });
    load();
  };

  return (
    <Layout title="Demandes RDV">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Demandes de rendez-vous</h2>
        <p className="mt-1 text-sm text-slate-500">
          Demandes depuis l&apos;espace patient (en attente) et le site public. Confirmez ou refusez.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {ONGLETS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setStatut(o.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              statut === o.key ? 'bg-medical-primary text-white' : 'border bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {o.label}
            {o.key === 'nouvelle' && aConfirmer > 0 ? ` (${aConfirmer})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border bg-white p-10 text-center text-slate-500">Aucune demande.</p>
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
            <article key={`${d.source}-${d.id}`} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{d.nom}</p>
                  <p className="text-sm text-slate-500">
                    {d.telephone || d.numero_patient || ''}
                    {d.departement?.nom ? ` · ${d.departement.nom}` : ''}
                    {d.date_souhaitee ? ` · ${String(d.date_souhaitee).slice(0, 10)}` : ''}
                    {d.heure_rdv ? ` à ${String(d.heure_rdv).slice(0, 5)}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {d.source === 'rendez_vous' ? 'Depuis l’espace patient' : 'Demande publique'}
                    {d.medecin?.user?.name ? ` · Dr ${nomMedecin(d.medecin.user.name)}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{d.message || '—'}</p>
                </div>
                {d.statut === 'nouvelle' ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => ouvrirConfirmation(d)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Confirmer
                    </button>
                    <button
                      type="button"
                      onClick={() => refuser(d)}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600"
                    >
                      Refuser
                    </button>
                  </div>
                ) : (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    d.statut === 'traitee' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {d.statut === 'traitee' ? 'Confirmée' : 'Refusée'}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={!!demande} title="Confirmer le rendez-vous" onClose={() => setDemande(null)} wide>
        {demande && (
          <form onSubmit={confirmer} className="space-y-4">
            {demande.source !== 'rendez_vous' && (
              <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                Le rendez-vous est réservé aux patients déjà enregistrés. Si la personne n’existe pas encore,
                elle doit d’abord passer à la réception.
              </p>
            )}

            {demande.source === 'rendez_vous' ? (
              <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Patient : <strong>{demande.nom}</strong>
                {demande.numero_patient ? ` (${demande.numero_patient})` : ''}
              </p>
            ) : (
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Patient enregistré *</span>
                <input
                  value={recherche}
                  onChange={(e) => chercherPatient(e.target.value)}
                  placeholder="Nom, téléphone ou n° patient"
                  className="w-full rounded-xl border px-3 py-2.5"
                />
                {patients.length > 0 && (
                  <div className="mt-1 max-h-48 overflow-y-auto rounded-xl border bg-white shadow-lg">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setPatient(p); setPatients([]); setRecherche(p.user?.name || ''); }}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-blue-50"
                      >
                        {p.user?.name} — {p.numero_patient}
                      </button>
                    ))}
                  </div>
                )}
                {patient && (
                  <span className="mt-2 block text-xs text-emerald-700">
                    Patient : {patient.user?.name} ({patient.numero_patient})
                  </span>
                )}
              </label>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Médecin *</span>
                <select
                  required
                  value={rdv.medecin_id}
                  onChange={(e) => setRdv((r) => ({ ...r, medecin_id: e.target.value, heure_rdv: '' }))}
                  className="w-full rounded-xl border px-3 py-2.5"
                >
                  <option value="">Choisir…</option>
                  {medecins.map((m) => (
                    <option key={m.id} value={m.id}>{nomMedecin(m.name || m.user?.name)}{m.specialite ? ` — ${m.specialite}` : ''}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Date *</span>
                <input
                  required
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={rdv.date_rdv}
                  onChange={(e) => setRdv((r) => ({ ...r, date_rdv: e.target.value, heure_rdv: '' }))}
                  className="w-full rounded-xl border px-3 py-2.5"
                />
              </label>
              <div className="block text-sm sm:col-span-2">
                <span className="mb-2 block font-medium">Créneau disponible *</span>
                {!rdv.medecin_id || !rdv.date_rdv ? (
                  <p className="text-xs text-slate-400">Choisissez un médecin et une date.</p>
                ) : creneaux.filter((c) => c.disponible).length === 0 ? (
                  <p className="text-xs text-amber-600">Aucun créneau libre — changez de date.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {creneaux.map((c) => (
                      <button
                        key={c.heure}
                        type="button"
                        disabled={!c.disponible}
                        onClick={() => setRdv((r) => ({ ...r, heure_rdv: c.heure }))}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                          rdv.heure_rdv === c.heure
                            ? 'border-medical-primary bg-medical-primary text-white'
                            : c.disponible
                              ? 'border-slate-200 hover:border-medical-primary'
                              : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through'
                        }`}
                      >
                        {c.heure}
                      </button>
                    ))}
                  </div>
                )}
                <input type="hidden" required value={rdv.heure_rdv} />
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Motif</span>
                <input
                  value={rdv.motif}
                  onChange={(e) => setRdv((r) => ({ ...r, motif: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5"
                />
              </label>
            </div>

            {error && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={busy || !rdv.heure_rdv}
              className="w-full rounded-xl bg-medical-primary py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? 'Confirmation…' : 'Confirmer le rendez-vous'}
            </button>
          </form>
        )}
      </Modal>
    </Layout>
  );
}
