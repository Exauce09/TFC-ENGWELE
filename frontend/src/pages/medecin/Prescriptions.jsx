import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function MedecinPrescriptions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/medecin/dossiers')
      .then((res) => {
        const dossiers = res.data.data || [];
        const prescriptions = dossiers.flatMap((d) =>
          (d.prescriptions || []).map((p) => ({
            ...p,
            patient: d.patient,
            dossier_id: d.id,
            numero_dossier: d.numero_dossier,
            date_consultation: d.date_consultation,
          })),
        );
        prescriptions.sort((a, b) => new Date(b.date_prescription) - new Date(a.date_prescription));
        setItems(prescriptions);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Ordonnances">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Ordonnances</h2>
          <p className="text-sm text-slate-500">
            Prescriptions émises. Le pharmacien les délivre ensuite.
          </p>
        </div>
        <Link to="/medecin/dossiers" className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-bold text-white">
          Nouvelle ordonnance via consultation
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border bg-white p-10 text-center text-slate-500">
          Aucune ordonnance. Ouvrez une consultation pour en créer une.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <article key={p.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{p.patient?.user?.name || 'Patient'}</p>
                  <p className="text-xs text-slate-500">
                    {p.date_prescription ? new Date(p.date_prescription).toLocaleDateString('fr-FR') : '—'}
                    {' · '}{p.numero_dossier || `Dossier #${p.dossier_id}`}
                    {p.patient?.numero_patient ? ` · ${p.patient.numero_patient}` : ''}
                  </p>
                  {p.patient?.allergies && (
                    <p className="mt-1 text-xs font-semibold text-red-600">Allergies : {p.patient.allergies}</p>
                  )}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  p.statut === 'active' || p.statut === 'emise'
                    ? 'bg-amber-100 text-amber-800'
                    : p.statut === 'delivree'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                }`}>
                  {p.statut === 'active' ? 'émise' : String(p.statut || '').replace(/_/g, ' ')}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(p.medicaments ?? []).map((m, i) => (
                  <div key={i} className="rounded-xl border border-blue-50 bg-blue-50/60 p-3 text-sm">
                    <p className="font-medium text-slate-900">{m.nom} {m.dosage || ''}</p>
                    <p className="text-xs text-slate-500">
                      {[m.forme, m.frequence || m.posologie, m.duree].filter(Boolean).join(' · ') || '—'}
                    </p>
                    {m.instructions && <p className="mt-1 text-xs text-slate-400">{m.instructions}</p>}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
