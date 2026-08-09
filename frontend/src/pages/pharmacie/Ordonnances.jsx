import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/parcours/Modal';
import api from '../../services/api';

function ageFrom(patient) {
  if (!patient?.date_naissance) return patient?.age_declare ?? null;
  const birth = new Date(patient.date_naissance);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

export default function PharmacieOrdonnances() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState({});
  const [confirmItem, setConfirmItem] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pharmacie/ordonnances');
      setItems(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const demanderDelivrance = (p) => {
    setError('');
    setConfirmItem(p);
  };

  const confirmerDelivrance = async () => {
    if (!confirmItem) return;
    const p = confirmItem;
    setBusy(true);
    setError('');
    try {
      await api.put(`/pharmacie/ordonnances/${p.id}/delivrer`, {
        source: p.source || 'parcours',
        notes_pharmacien: notes[p.id] || null,
      });
      setConfirmItem(null);
      setMsg(
        `${p.numero_ordonnance} délivrée pour ${p.patient?.user?.name || 'le patient'}.`
        + (p.source === 'parcours'
          ? ' Le parcours passe à l’initiation du traitement.'
          : ' Stock mis à jour.')
      );
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la délivrance.');
      setConfirmItem(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout title="Ordonnances">
      <h2 className="mb-6 text-2xl font-bold text-slate-900">Ordonnances</h2>

      {msg && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{msg}</span>
          <button type="button" onClick={() => setMsg('')} className="text-xs font-semibold underline">Fermer</button>
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucune ordonnance.</p>
      ) : (
        <div className="space-y-4">
          {items.map((p) => {
            const age = ageFrom(p.patient);
            const allergies = p.allergies_signalees || p.patient?.allergies;
            return (
              <article key={`${p.source}-${p.id}`} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-bold text-emerald-700">
                      {p.numero_ordonnance}
                      {p.source === 'parcours' ? ' · Parcours' : ' · Dossier'}
                    </p>
                    <p className="font-semibold text-slate-900">{p.patient?.user?.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.numero_admission || ''}
                      {age != null ? ` · ${age} ans` : ''}
                      {p.poids_kg ? ` · ${p.poids_kg} kg` : ''}
                      {' · Prescrit par '}
                      {p.medecin?.user?.name || 'Médecin'}
                      {' · '}
                      {p.date_prescription ? new Date(p.date_prescription).toLocaleDateString('fr-FR') : '—'}
                      {p.departement ? ` · ${p.departement}` : ''}
                    </p>
                    {p.diagnostic_motif && (
                      <p className="mt-1 text-xs text-slate-600"><strong>Motif / diag :</strong> {p.diagnostic_motif}</p>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    p.statut === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {p.statut_label || p.statut}
                  </span>
                </div>

                {allergies && (
                  <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
                    Allergies : {allergies}
                  </p>
                )}

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm text-slate-900">
                    <thead>
                      <tr className="border-b text-[10px] uppercase tracking-wide text-slate-400">
                        <th className="py-2 pr-2">Médicament</th>
                        <th className="py-2 pr-2">Dosage</th>
                        <th className="py-2 pr-2">Forme</th>
                        <th className="py-2 pr-2">Posologie</th>
                        <th className="py-2 pr-2">Durée</th>
                        <th className="py-2">Qté</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(p.medicaments || []).map((m, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-2 pr-2 font-medium">
                            {m.nom_dci || m.nom}
                            {m.nom_commercial ? <span className="block text-xs font-normal text-slate-500">{m.nom_commercial}</span> : null}
                            {m.instructions ? <span className="block text-xs text-emerald-700">{m.instructions}</span> : null}
                          </td>
                          <td className="py-2 pr-2">{m.dosage || '—'}</td>
                          <td className="py-2 pr-2">{m.forme || '—'}</td>
                          <td className="py-2 pr-2">{m.posologie || m.frequence || '—'}</td>
                          <td className="py-2 pr-2">{m.duree || '—'}</td>
                          <td className="py-2">{m.quantite || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {p.lignes_delivrance?.length > 0 && (
                  <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">Traçabilité délivrance</p>
                    {p.lignes_delivrance.map((l, i) => (
                      <p key={i}>
                        {l.medicament_nom} · qté {l.quantite}
                        {l.numero_lot ? ` · lot ${l.numero_lot}` : ''}
                        {l.date_expiration ? ` · exp. ${l.date_expiration}` : ''}
                      </p>
                    ))}
                  </div>
                )}

                {p.statut === 'active' && (
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <label className="block min-w-[200px] flex-1">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Notes pharmacien</span>
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        placeholder="Conseil patient, substitution…"
                        value={notes[p.id] || ''}
                        onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => demanderDelivrance(p)}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Délivrer
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={!!confirmItem}
        title="Confirmer la délivrance"
        onClose={() => !busy && setConfirmItem(null)}
      >
        {confirmItem && (
          <div className="space-y-4 text-sm text-slate-800">
            <p>
              Confirmer la délivrance de{' '}
              <strong className="font-mono text-emerald-700">{confirmItem.numero_ordonnance}</strong>
              {' '}pour{' '}
              <strong>{confirmItem.patient?.user?.name}</strong> ?
            </p>
            <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Le stock sera décrémenté. Lot et péremption seront tracés si disponibles.
            </p>
            <ul className="rounded-xl border bg-slate-50 px-3 py-2 text-xs text-slate-700">
              {(confirmItem.medicaments || []).slice(0, 6).map((m, i) => (
                <li key={i}>• {m.nom_dci || m.nom} {m.dosage ? `(${m.dosage})` : ''}</li>
              ))}
            </ul>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmItem(null)}
                className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={confirmerDelivrance}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? 'Délivrance…' : 'Oui, délivrer'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
