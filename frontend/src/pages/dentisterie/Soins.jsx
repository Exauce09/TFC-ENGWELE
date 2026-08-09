import SpecialiteModule from '../../components/specialite/SpecialiteModule';

export default function DentisterieSoins() {
  return (
    <SpecialiteModule
      layoutTitle="Dentisterie"
      pageTitle="Soins dentaires"
      listEndpoint="/dentisterie/soins"
      createEndpoint="/dentisterie/soins"
      patientsEndpoint="/dentisterie/patients"
      defaultForm={{
        patient_id: '',
        date_soin: new Date().toISOString().slice(0, 10),
        type_soin: '',
        dents_traitees: '',
        observations: '',
        prochain_rdv: '',
      }}
      fields={[
        { name: 'date_soin', label: 'Date *', type: 'date', required: true },
        { name: 'type_soin', label: 'Type de soin' },
        { name: 'dents_traitees', label: 'Dents traitées' },
        { name: 'prochain_rdv', label: 'Prochain RDV', type: 'date' },
        { name: 'observations', label: 'Observations', type: 'textarea', fullWidth: true },
      ]}
      renderItem={(s) => (
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[#0D6E6E]/40">
          <p className="font-semibold text-slate-900">{s.patient?.user?.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {s.type_soin || 'Soin'}
            {s.date_soin ? ` · ${s.date_soin}` : ''}
          </p>
        </article>
      )}
    />
  );
}
