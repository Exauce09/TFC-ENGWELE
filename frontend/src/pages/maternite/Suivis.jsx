import SpecialiteModule from '../../components/specialite/SpecialiteModule';

export default function MaterniteSuivis() {
  return (
    <SpecialiteModule
      layoutTitle="Maternité"
      pageTitle="Suivis maternité"
      listEndpoint="/maternite/suivis"
      createEndpoint="/maternite/suivis"
      patientsEndpoint="/maternite/patients"
      filterKey="type_visite"
      filterOptions={[
        { value: 'consultation_prenatale', label: 'Prénatale' },
        { value: 'accouchement', label: 'Accouchement' },
        { value: 'postnatal', label: 'Postnatal' },
      ]}
      defaultForm={{
        patient_id: '',
        type_visite: 'consultation_prenatale',
        grossesse_semaines: '',
        poids_kg: '',
        tension_arterielle: '',
        observations: '',
        date_accouchement_prevue: '',
      }}
      fields={[
        {
          name: 'type_visite',
          label: 'Type de visite *',
          type: 'select',
          required: true,
          options: [
            { value: 'consultation_prenatale', label: 'Consultation prénatale' },
            { value: 'accouchement', label: 'Accouchement' },
            { value: 'postnatal', label: 'Postnatal' },
          ],
        },
        { name: 'grossesse_semaines', label: 'Semaines de grossesse', type: 'number' },
        { name: 'poids_kg', label: 'Poids (kg)', type: 'number' },
        { name: 'tension_arterielle', label: 'Tension artérielle' },
        { name: 'date_accouchement_prevue', label: 'Date accouchement prévue', type: 'date' },
        { name: 'observations', label: 'Observations', type: 'textarea', fullWidth: true },
      ]}
      renderItem={(s) => (
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[#0D6E6E]/40">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-900">{s.patient?.user?.name}</p>
            <span className="rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-pink-800">
              {s.type_visite?.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {s.grossesse_semaines ? `${s.grossesse_semaines} sem.` : '—'}
            {s.tension_arterielle ? ` · TA ${s.tension_arterielle}` : ''}
          </p>
        </article>
      )}
    />
  );
}
