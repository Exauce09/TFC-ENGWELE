import SpecialiteModule from '../../components/specialite/SpecialiteModule';

const TODAY = new Date().toISOString().slice(0, 10);

export default function MaterniteSuivis() {
  return (
    <SpecialiteModule
      layoutTitle="Maternité"
      pageTitle="Suivis maternité"
      pageSubtitle="Consultations prénatales, accouchements et suivi postnatal."
      listEndpoint="/maternite/suivis"
      createEndpoint="/maternite/suivis"
      patientsEndpoint="/maternite/patients"
      defaultForm={{ patient_id: '', type_visite: 'consultation_prenatale', grossesse_semaines: '', poids_kg: '', tension_arterielle: '', observations: '', date_accouchement_prevue: '' }}
      fields={[
        { name: 'type_visite', label: 'Type de visite *', type: 'select', required: true, options: [
          { value: 'consultation_prenatale', label: 'Consultation prénatale' },
          { value: 'accouchement', label: 'Accouchement' },
          { value: 'postnatal', label: 'Postnatal' },
        ]},
        { name: 'grossesse_semaines', label: 'Semaines de grossesse', type: 'number' },
        { name: 'poids_kg', label: 'Poids (kg)', type: 'number' },
        { name: 'tension_arterielle', label: 'Tension artérielle' },
        { name: 'date_accouchement_prevue', label: 'Date accouchement prévue', type: 'date' },
        { name: 'observations', label: 'Observations', type: 'textarea', fullWidth: true },
      ]}
      renderItem={(s) => (
        <article key={s.id} className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="font-semibold">{s.patient?.user?.name}</p>
          <p className="text-sm text-slate-500 capitalize">{s.type_visite?.replace(/_/g, ' ')} · {s.grossesse_semaines ? `${s.grossesse_semaines} sem.` : '—'}</p>
          <p className="text-xs text-slate-400">{s.observations || 'Pas d\'observation'}</p>
        </article>
      )}
    />
  );
}
