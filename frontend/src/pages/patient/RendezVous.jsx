import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

const STATUT_COLORS = {
  confirme: 'bg-emerald-100 text-emerald-700',
  en_attente: 'bg-amber-100 text-amber-700',
  en_cours: 'bg-blue-100 text-blue-700',
  termine: 'bg-slate-100 text-slate-600',
  annule: 'bg-red-100 text-red-700',
  absent: 'bg-orange-100 text-orange-700',
};

function Badge({ statut }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUT_COLORS[statut] ?? 'bg-slate-100'}`}>
      {statut?.replace(/_/g, ' ')}
    </span>
  );
}

export default function PatientRendezVous() {
  const [rdv, setRdv] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [creneaux, setCreneaux] = useState([]);
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [reportModal, setReportModal] = useState(null);
  const [payForm, setPayForm] = useState({ mode: 'airtel_money', telephone: '' });
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    departement_id: '',
    medecin_id: '',
    date_rdv: '',
    heure_rdv: '',
    motif: '',
    type: 'presentiel',
  });
  const [reportForm, setReportForm] = useState({ date_rdv: '', heure_rdv: '' });
  const [reportCreneaux, setReportCreneaux] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [rdvRes, deptRes] = await Promise.all([
        api.get('/patient/rendez-vous'),
        api.get('/departements'),
      ]);
      setRdv(rdvRes.data.data || []);
      setDepartements(deptRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!form.departement_id) { setMedecins([]); return; }
    api.get('/medecins', { params: { departement_id: form.departement_id } })
      .then((res) => setMedecins(res.data.data || []))
      .catch(() => setMedecins([]));
  }, [form.departement_id]);

  useEffect(() => {
    if (!form.medecin_id || !form.date_rdv) {
      setCreneaux([]);
      return;
    }
    setLoadingCreneaux(true);
    setForm((f) => ({ ...f, heure_rdv: '' }));
    api.get('/patient/creneaux', { params: { medecin_id: form.medecin_id, date: form.date_rdv } })
      .then((res) => setCreneaux(res.data.data || []))
      .catch(() => setCreneaux([]))
      .finally(() => setLoadingCreneaux(false));
  }, [form.medecin_id, form.date_rdv]);

  useEffect(() => {
    if (!reportModal || !reportForm.date_rdv) {
      setReportCreneaux([]);
      return;
    }
    api.get('/patient/creneaux', {
      params: {
        medecin_id: reportModal.medecin_id,
        date: reportForm.date_rdv,
        exclure_rdv_id: reportModal.id,
      },
    })
      .then((res) => setReportCreneaux(res.data.data || []))
      .catch(() => setReportCreneaux([]));
  }, [reportModal, reportForm.date_rdv]);

  const annuler = async (id) => {
    if (!confirm('Annuler ce rendez-vous ? Le créneau sera libéré.')) return;
    try {
      await api.delete(`/patient/rendez-vous/${id}`);
      setSuccess('Rendez-vous annulé — créneau libéré.');
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Annulation impossible');
    }
  };

  const ouvrirReport = (r) => {
    setReportModal(r);
    setReportForm({ date_rdv: '', heure_rdv: '' });
    setError('');
  };

  const reporter = async (e) => {
    e.preventDefault();
    if (!reportModal) return;
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/patient/rendez-vous/${reportModal.id}/reporter`, reportForm);
      setSuccess('Rendez-vous reporté — ancien créneau libéré, en attente de confirmation.');
      setReportModal(null);
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Report impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const payer = async (e) => {
    e.preventDefault();
    if (!payModal) return;
    setPaying(true);
    setError('');
    try {
      const res = await api.post(`/patient/rendez-vous/${payModal.id}/paiement`, payForm);
      setSuccess(res.data.message || 'Paiement enregistré.');
      setPayModal(null);
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Paiement impossible');
    } finally {
      setPaying(false);
    }
  };

  const reserver = async (e) => {
    e.preventDefault();
    if (!form.heure_rdv) {
      setError('Choisissez un créneau disponible.');
      return;
    }
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/patient/rendez-vous', form);
      setSuccess('Rendez-vous enregistré (en attente). Confirmation et rappels J-1 / H-2 suivront.');
      setShowForm(false);
      setForm({ departement_id: '', medecin_id: '', date_rdv: '', heure_rdv: '', motif: '', type: 'presentiel' });
      void load();
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? Object.values(errs).flat().join(' ') : err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const modifiable = (statut) => ['en_attente', 'confirme'].includes(statut);

  return (
    <Layout title="Mes Rendez-vous">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mes rendez-vous</h2>
          <p className="text-sm text-slate-500">
            Choisissez un créneau libre. Statut : en attente → confirmé. Rappels automatiques J-1 et H-2.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-semibold text-white shadow hover:-translate-y-0.5 transition"
        >
          {showForm ? '✕ Fermer' : '+ Nouveau rendez-vous'}
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {showForm && (
        <form onSubmit={reserver} className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Réserver un créneau</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Département *</span>
              <select required value={form.departement_id} onChange={(e) => setForm((f) => ({ ...f, departement_id: e.target.value, medecin_id: '', heure_rdv: '' }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm">
                <option value="">Choisir...</option>
                {departements.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Médecin *</span>
              <select required value={form.medecin_id} onChange={(e) => setForm((f) => ({ ...f, medecin_id: e.target.value, heure_rdv: '' }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm" disabled={!form.departement_id}>
                <option value="">Choisir...</option>
                {medecins.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.specialite}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Date *</span>
              <input type="date" required min={new Date().toISOString().slice(0, 10)} value={form.date_rdv}
                onChange={(e) => setForm((f) => ({ ...f, date_rdv: e.target.value, heure_rdv: '' }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Type *</span>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm">
                <option value="presentiel">Présentiel</option>
                <option value="teleconsultation">Téléconsultation (15 000 FC)</option>
              </select>
            </label>
            <div className="sm:col-span-2">
              <span className="mb-2 block text-sm font-medium">Créneau disponible *</span>
              {!form.medecin_id || !form.date_rdv ? (
                <p className="text-sm text-slate-400">Sélectionnez un médecin et une date.</p>
              ) : loadingCreneaux ? (
                <p className="text-sm text-slate-500">Chargement des créneaux…</p>
              ) : creneaux.filter((c) => c.disponible).length === 0 ? (
                <p className="text-sm text-amber-600">Aucun créneau libre ce jour-là.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {creneaux.map((c) => (
                    <button
                      key={c.heure}
                      type="button"
                      disabled={!c.disponible}
                      onClick={() => setForm((f) => ({ ...f, heure_rdv: c.heure }))}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        form.heure_rdv === c.heure
                          ? 'border-medical-primary bg-medical-primary text-white'
                          : c.disponible
                            ? 'border-slate-200 bg-white text-slate-700 hover:border-medical-primary'
                            : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through'
                      }`}
                    >
                      {c.heure}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Motif</span>
              <textarea rows={2} value={form.motif} onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm" placeholder="Décrivez brièvement..." />
            </label>
          </div>
          <button type="submit" disabled={submitting || !form.heure_rdv}
            className="mt-4 rounded-xl bg-gradient-to-r from-medical-primary to-cyan-500 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {submitting ? 'Enregistrement...' : 'Confirmer la réservation'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : rdv.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
          <p className="mt-3 font-medium text-slate-700">Aucun rendez-vous pour le moment</p>
          <p className="mt-1 text-sm text-slate-500">Cliquez sur « Nouveau rendez-vous » pour choisir un créneau.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rdv.map((r) => (
            <article key={r.id} className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">
                    {new Date(r.date_rdv).toLocaleDateString('fr-FR')} à {String(r.heure_rdv).slice(0, 5)}
                  </p>
                  <Badge statut={r.statut} />
                  {r.type === 'teleconsultation' && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">Vidéo</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {r.medecin?.user?.name || 'Médecin'} — {r.departement?.nom || 'Département'}
                </p>
                {r.motif && <p className="mt-1 text-xs text-slate-400">{r.motif}</p>}
                {r.type === 'teleconsultation' && r.paiement_statut !== 'paye' && (
                  <p className="mt-1 text-xs text-amber-600">Paiement requis avant la consultation</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {r.type === 'teleconsultation' && r.paiement_statut !== 'paye' && modifiable(r.statut) && (
                  <button onClick={() => setPayModal(r)}
                    className="rounded-lg border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50">
                    Payer {Number(r.montant || 15000).toLocaleString()} FC
                  </button>
                )}
                {modifiable(r.statut) && (
                  <>
                    <button onClick={() => ouvrirReport(r)}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      Reporter
                    </button>
                    <button onClick={() => annuler(r.id)}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                      Annuler
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={reporter} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Reporter le rendez-vous</h3>
            <p className="mt-1 text-sm text-slate-500">L&apos;ancien créneau sera libéré automatiquement.</p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Nouvelle date</span>
                <input type="date" required min={new Date().toISOString().slice(0, 10)} value={reportForm.date_rdv}
                  onChange={(e) => setReportForm((f) => ({ ...f, date_rdv: e.target.value, heure_rdv: '' }))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm" />
              </label>
              <div>
                <span className="mb-2 block text-sm font-medium">Nouveau créneau</span>
                <div className="flex flex-wrap gap-2">
                  {reportCreneaux.filter((c) => c.disponible).map((c) => (
                    <button key={c.heure} type="button"
                      onClick={() => setReportForm((f) => ({ ...f, heure_rdv: c.heure }))}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${
                        reportForm.heure_rdv === c.heure
                          ? 'border-medical-primary bg-medical-primary text-white'
                          : 'border-slate-200'
                      }`}
                    >
                      {c.heure}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setReportModal(null)} className="flex-1 rounded-xl border px-4 py-2.5 text-sm">Fermer</button>
              <button type="submit" disabled={submitting || !reportForm.heure_rdv}
                className="flex-1 rounded-xl bg-medical-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {submitting ? '…' : 'Reporter'}
              </button>
            </div>
          </form>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={payer} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Paiement Mobile Money</h3>
            <p className="mt-1 text-sm text-slate-500">
              Téléconsultation du {new Date(payModal.date_rdv).toLocaleDateString('fr-FR')} — {Number(payModal.montant || 15000).toLocaleString()} FC
            </p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Opérateur</span>
                <select value={payForm.mode} onChange={(e) => setPayForm((f) => ({ ...f, mode: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm">
                  <option value="airtel_money">Airtel Money</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Numéro de téléphone</span>
                <input type="tel" required placeholder="+243..." value={payForm.telephone}
                  onChange={(e) => setPayForm((f) => ({ ...f, telephone: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm" />
              </label>
            </div>
            <p className="mt-3 text-xs text-slate-400">Mode démo : le paiement est simulé automatiquement.</p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setPayModal(null)}
                className="flex-1 rounded-xl border px-4 py-2.5 text-sm">Annuler</button>
              <button type="submit" disabled={paying}
                className="flex-1 rounded-xl bg-medical-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {paying ? 'Traitement...' : 'Confirmer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
