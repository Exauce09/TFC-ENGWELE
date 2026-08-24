import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InfirmierLayout from '../../components/layout/InfirmierLayout';
import api from '../../services/api';

export default function InfirmierPatients() {
  const [patients, setPatients] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const search = async (term = '') => {
    setQ(term);
    setLoading(true);
    try {
      const res = await api.get('/infirmier/patients', { params: term ? { q: term } : {} });
      setPatients(res.data.data || []);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void search(); }, []);

  return (
    <InfirmierLayout title="Patients">
      <div className="mb-6">
        <h2 className="font-infirmier-display text-3xl text-[#152238]">Patients</h2>
        <p className="text-sm text-[#7A8FA8]">Recherche pour triage, constantes et suivi des visites.</p>
      </div>

      <input
        type="search"
        value={q}
        onChange={(e) => void search(e.target.value)}
        placeholder="Nom, téléphone ou n° patient…"
        className="mb-6 w-full max-w-md rounded-xl border border-[#C9D4E3] bg-white px-4 py-2.5 text-sm text-[#152238]"
      />

      {loading ? (
        <p className="text-[#7A8FA8]">Chargement…</p>
      ) : patients.length === 0 ? (
        <p className="infirmier-card p-8 text-center text-[#8FA3BE]">Aucun patient.</p>
      ) : (
        <div className="space-y-3">
          {patients.map((p) => (
            <article key={p.id} className="infirmier-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {p.photo ? (
                    <img src={p.photo} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-[#C9D4E3] object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-[#C9D4E3] bg-[#EEF2F7] font-infirmier-display text-lg text-[#E07A5F]">
                      {(p.user?.name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="truncate font-semibold text-[#152238]">{p.user?.name}</p>
                    <p className="truncate text-sm text-[#7A8FA8]">
                      <span className="font-mono">{p.numero_patient}</span>
                      {p.user?.phone ? ` · ${p.user.phone}` : ''}
                      {p.sexe ? ` · ${p.sexe === 'F' ? 'F' : 'M'}` : ''}
                      {p.commune ? ` · ${p.commune}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {p.admission_active ? (
                    <Link to={`/parcours/${p.admission_active.id}`} className="infirmier-btn text-xs">
                      Visite en cours →
                    </Link>
                  ) : (
                    <Link to="/infirmier/constantes" className="infirmier-btn-ghost text-xs">
                      Saisir constantes
                    </Link>
                  )}
                </div>
              </div>

              {p.admission_active && (
                <dl className="mt-3 grid gap-2 border-t border-[#C9D4E3] pt-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8FA3BE]">Admission</dt>
                    <dd className="font-medium text-[#152238]">{p.admission_active.numero_admission}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8FA3BE]">Statut</dt>
                    <dd className="font-medium text-[#152238]">{p.admission_active.statut_label || p.admission_active.statut}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8FA3BE]">Service</dt>
                    <dd className="font-medium text-[#152238]">{p.admission_active.departement || '—'}</dd>
                  </div>
                </dl>
              )}

              {p.allergies && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
                  Allergies : {p.allergies}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </InfirmierLayout>
  );
}
