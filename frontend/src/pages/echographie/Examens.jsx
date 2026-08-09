import SpecialiteModule from '../../components/specialite/SpecialiteModule';

export default function EchographieExamens() {
  return (
    <SpecialiteModule
      layoutTitle="Échographie"
      pageTitle="Examens échographiques"
      listEndpoint="/echographie/examens"
      createEndpoint="/echographie/examens"
      patientsEndpoint="/echographie/patients"
      defaultForm={{
        patient_id: '',
        date_examen: new Date().toISOString().slice(0, 10),
        type_echo: '',
        organe_examine: '',
        compte_rendu: '',
        conclusion: '',
      }}
      fields={[
        { name: 'date_examen', label: 'Date *', type: 'date', required: true },
        { name: 'type_echo', label: 'Type d\'écho' },
        { name: 'organe_examine', label: 'Organe examiné' },
        { name: 'compte_rendu', label: 'Compte rendu *', type: 'textarea', fullWidth: true, required: true },
        { name: 'conclusion', label: 'Conclusion', type: 'textarea', fullWidth: true },
      ]}
      renderItem={(e) => (
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[#0D6E6E]/40">
          <p className="font-semibold text-slate-900">{e.patient?.user?.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {e.type_echo || 'Échographie'}
            {e.date_examen ? ` · ${e.date_examen}` : ''}
          </p>
        </article>
      )}
    />
  );
}
