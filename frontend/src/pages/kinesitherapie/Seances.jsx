import SpecialiteModule from '../../components/specialite/SpecialiteModule';

export default function KinesitherapieSeances() {
  return (
    <SpecialiteModule
      layoutTitle="Kinésithérapie"
      pageTitle="Séances"
      listEndpoint="/kinesitherapie/seances"
      createEndpoint="/kinesitherapie/seances"
      patientsEndpoint="/kinesitherapie/patients"
      filterKey="evolution"
      filterOptions={[
        { value: 'amelioration', label: 'Amélioration' },
        { value: 'stable', label: 'Stable' },
        { value: 'deterioration', label: 'Détérioration' },
      ]}
      defaultForm={{
        patient_id: '',
        date_seance: new Date().toISOString().slice(0, 10),
        numero_seance: '',
        total_seances: '',
        techniques: '',
        observations: '',
        evolution: 'stable',
      }}
      fields={[
        { name: 'date_seance', label: 'Date *', type: 'date', required: true },
        { name: 'numero_seance', label: 'N° séance', type: 'number' },
        { name: 'total_seances', label: 'Total prévu', type: 'number' },
        {
          name: 'evolution',
          label: 'Évolution',
          type: 'select',
          options: [
            { value: 'amelioration', label: 'Amélioration' },
            { value: 'stable', label: 'Stable' },
            { value: 'deterioration', label: 'Détérioration' },
          ],
        },
        { name: 'techniques', label: 'Techniques', type: 'textarea', fullWidth: true },
        { name: 'observations', label: 'Observations', type: 'textarea', fullWidth: true },
      ]}
      renderItem={(s) => (
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[#0D6E6E]/40">
          <p className="font-semibold text-slate-900">{s.patient?.user?.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {s.date_seance} · Séance {s.numero_seance || '—'}/{s.total_seances || '—'}
          </p>
        </article>
      )}
    />
  );
}
