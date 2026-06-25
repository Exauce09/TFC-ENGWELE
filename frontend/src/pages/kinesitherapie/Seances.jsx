import SpecialiteModule from '../../components/specialite/SpecialiteModule';

export default function KinesitherapieSeances() {
  return (
    <SpecialiteModule
      layoutTitle="Kinésithérapie"
      pageTitle="Séances de kinésithérapie"
      listEndpoint="/kinesitherapie/seances"
      createEndpoint="/kinesitherapie/seances"
      patientsEndpoint="/kinesitherapie/patients"
      defaultForm={{ patient_id: '', date_seance: new Date().toISOString().slice(0, 10), numero_seance: '', total_seances: '', techniques: '', observations: '', evolution: 'stable' }}
      fields={[
        { name: 'date_seance', label: 'Date *', type: 'date', required: true },
        { name: 'numero_seance', label: 'N° séance', type: 'number' },
        { name: 'total_seances', label: 'Total prévu', type: 'number' },
        { name: 'evolution', label: 'Évolution', type: 'select', options: [
          { value: 'amelioration', label: 'Amélioration' }, { value: 'stable', label: 'Stable' }, { value: 'deterioration', label: 'Détérioration' },
        ]},
        { name: 'techniques', label: 'Techniques', type: 'textarea', fullWidth: true },
        { name: 'observations', label: 'Observations', type: 'textarea', fullWidth: true },
      ]}
      renderItem={(s) => (
        <article key={s.id} className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="font-semibold">{s.patient?.user?.name}</p>
          <p className="text-sm text-slate-500">{s.date_seance} · Séance {s.numero_seance || '—'}/{s.total_seances || '—'}</p>
          <p className="text-xs text-slate-400">{s.techniques || s.observations}</p>
        </article>
      )}
    />
  );
}
