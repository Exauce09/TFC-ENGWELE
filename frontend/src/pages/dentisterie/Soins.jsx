import SpecialiteModule from '../../components/specialite/SpecialiteModule';

export default function DentisterieSoins() {
  return (
    <SpecialiteModule
      layoutTitle="Dentisterie"
      pageTitle="Soins dentaires"
      listEndpoint="/dentisterie/soins"
      createEndpoint="/dentisterie/soins"
      patientsEndpoint="/dentisterie/patients"
      defaultForm={{ patient_id: '', date_soin: new Date().toISOString().slice(0, 10), type_soin: '', dents_traitees: '', observations: '', prochain_rdv: '' }}
      fields={[
        { name: 'date_soin', label: 'Date *', type: 'date', required: true },
        { name: 'type_soin', label: 'Type de soin' },
        { name: 'dents_traitees', label: 'Dents traitées' },
        { name: 'prochain_rdv', label: 'Prochain RDV', type: 'date' },
        { name: 'observations', label: 'Observations', type: 'textarea', fullWidth: true },
      ]}
      renderItem={(s) => (
        <article key={s.id} className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="font-semibold">{s.patient?.user?.name} — {s.type_soin || 'Soin dentaire'}</p>
          <p className="text-sm text-slate-500">{s.date_soin} · Dents : {s.dents_traitees || '—'}</p>
          <p className="text-xs text-slate-400">{s.observations}</p>
        </article>
      )}
    />
  );
}
