import SpecialiteModule from '../../components/specialite/SpecialiteModule';

export default function EchographieExamens() {
  return (
    <SpecialiteModule
      layoutTitle="Échographie"
      pageTitle="Examens échographiques"
      listEndpoint="/echographie/examens"
      createEndpoint="/echographie/examens"
      patientsEndpoint="/echographie/patients"
      defaultForm={{ patient_id: '', date_examen: new Date().toISOString().slice(0, 10), type_echo: '', organe_examine: '', compte_rendu: '', conclusion: '' }}
      fields={[
        { name: 'date_examen', label: 'Date *', type: 'date', required: true },
        { name: 'type_echo', label: 'Type d\'écho' },
        { name: 'organe_examine', label: 'Organe examiné' },
        { name: 'compte_rendu', label: 'Compte rendu *', type: 'textarea', fullWidth: true, required: true },
        { name: 'conclusion', label: 'Conclusion', type: 'textarea', fullWidth: true },
      ]}
      renderItem={(e) => (
        <article key={e.id} className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="font-semibold">{e.patient?.user?.name} — {e.type_echo || 'Échographie'}</p>
          <p className="text-sm text-slate-500">{e.date_examen} · {e.organe_examine}</p>
          <p className="text-xs text-slate-400 line-clamp-2">{e.conclusion || e.compte_rendu}</p>
        </article>
      )}
    />
  );
}
