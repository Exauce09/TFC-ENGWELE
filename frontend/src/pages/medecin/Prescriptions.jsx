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
    <Layout title="Prescriptions">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Prescriptions</h2>
          <p className="text-sm text-slate-500">Ordonnances émises depuis vos consultations.</p>
        </div>
        <Link to="/medecin/dossiers" className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-bold text-white">
          + Nouvelle consultation
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucune prescription.</p>
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <article key={p.id} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{p.patient?.user?.name || 'Patient'}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(p.date_prescription).toLocaleDateString('fr-FR')} · Dossier #{p.dossier_id}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.statut === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {p.statut}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(p.medicaments ?? []).map((m, i) => (
                  <div key={i} className="rounded-lg bg-blue-50 p-3 text-sm">
                    <p className="font-medium">{m.nom} {m.dosage}</p>
                    <p className="text-xs text-slate-500">{m.frequence} · {m.duree}</p>
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
