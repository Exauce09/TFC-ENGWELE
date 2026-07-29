import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MedecinLayout from '../../components/layout/MedecinLayout';
import api from '../../services/api';
import { nomMedecin } from '../../utils/format';

export default function MedecinPatients() {
  const [patients, setPatients] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { void load(''); }, []);

  const load = async (term) => {
    setQ(term);
    setLoading(true);
    try {
      const res = await api.get('/medecin/patients', { params: term ? { q: term } : {} });
      setPatients(res.data.data || []);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MedecinLayout title="Patients">
      <div className="mb-6">
        <h2 className="font-medecin-display text-3xl text-[#0D3B3A]">Patients</h2>
        <p className="text-sm text-[#5A8A7A]">
          Ouvrez le dossier complet : identité, photo, dernière visite, examens et résultats.
        </p>
      </div>

      <input
        type="search"
        value={q}
        onChange={(e) => void load(e.target.value)}
        placeholder="Nom, téléphone ou n° patient (PAT-…)"
        className="mb-6 w-full max-w-md rounded-xl border border-[#C5D9D0] bg-white px-4 py-2.5 text-sm text-[#0D3B3A]"
      />

      {loading ? (
        <p className="text-[#5A8A7A]">Recherche…</p>
      ) : patients.length === 0 ? (
        <p className="medecin-card p-8 text-center text-[#5A8A7A]">
          {q.trim().length >= 2 ? 'Aucun patient trouvé.' : 'Saisissez au moins 2 caractères, ou aucun patient enregistré.'}
        </p>
      ) : (
        <div className="space-y-3">
          {patients.map((p) => (
            <article key={p.id} className="medecin-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {p.photo ? (
                    <img src={p.photo} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-[#C5D9D0] object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-[#B8D4C8] bg-[#F4FAF8] font-medecin-display text-lg text-[#1A7A6D]">
                      {(p.user?.name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0D3B3A]">{p.user?.name}</p>
                    <p className="text-sm text-[#5A8A7A]">
                      <span className="font-mono">{p.numero_patient}</span>
                      {p.user?.phone ? ` · ${p.user.phone}` : ''}
                      {p.sexe ? ` · ${p.sexe === 'F' ? 'F' : 'M'}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/medecin/patients/${p.id}`} className="medecin-btn text-xs">
                    Ouvrir le dossier →
                  </Link>
                  {p.admission_active && (
                    <Link to={`/parcours/${p.admission_active.id}`} className="medecin-btn-ghost text-xs">
                      Visite en cours
                    </Link>
                  )}
                </div>
              </div>

              <dl className="mt-3 grid gap-2 border-t border-[#C5D9D0] pt-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-[#7A9A90]">Dossier</dt>
                  <dd className="font-medium text-[#0D3B3A]">
                    {p.dossier?.numero_dossier || (p.dossier?.id ? `#${p.dossier.id}` : 'Aucun')}
                    {p.nombre_dossiers ? ` · ${p.nombre_dossiers} visite(s)` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-[#7A9A90]">Médecin en charge</dt>
                  <dd className="font-medium text-[#0D3B3A]">
                    {p.medecin_en_charge ? nomMedecin(p.medecin_en_charge) : 'Non attribué'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-[#7A9A90]">Statut visite</dt>
                  <dd className="font-medium text-[#0D3B3A]">
                    {p.admission_active?.statut_label || 'Aucune visite en cours'}
                  </dd>
                </div>
              </dl>

              {(p.allergies || p.antecedents_medicaux) && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {p.allergies && <p><strong>Allergies :</strong> {p.allergies}</p>}
                  {p.antecedents_medicaux && <p><strong>Antécédents :</strong> {p.antecedents_medicaux}</p>}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </MedecinLayout>
  );
}
