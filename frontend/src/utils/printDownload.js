const PRINT_STYLES = `
  body{font-family:Georgia,'Times New Roman',serif;color:#0D3B3A;padding:28px;max-width:800px;margin:auto;line-height:1.45}
  h1{font-size:22px;margin:0 0 4px} h2{font-size:16px;margin:20px 0 8px;border-bottom:1px solid #C5D9D0;padding-bottom:4px}
  .muted{color:#5A8A7A;font-size:12px} .brand{color:#1A7A6D;font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:700}
  .box{border:1px solid #C5D9D0;border-radius:8px;padding:12px;margin:12px 0;background:#F4FAF8}
  .alert{background:#FEF2F2;border:1px solid #FECACA;color:#991B1B;padding:8px;border-radius:6px;font-size:12px;margin-top:8px}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
  th,td{border-bottom:1px solid #C5D9D0;padding:8px;text-align:left;vertical-align:top}
  th{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#7A9A90}
  .foot{margin-top:48px;display:flex;justify-content:space-between;font-size:12px;color:#5A8A7A}
  .meta{font-size:12px;color:#5A8A7A} ul{padding-left:18px;margin:6px 0} li{margin:4px 0}
  @media print{body{padding:0} .no-print{display:none}}
`;

function openDocWindow(title, bodyHtml) {
  const win = window.open('', '_blank', 'width=860,height=980');
  if (!win) return null;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
    <style>${PRINT_STYLES}</style></head><body>${bodyHtml}</body></html>`);
  win.document.close();
  return win;
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Imprime un document HTML (l'utilisateur peut aussi « Enregistrer en PDF »). */
export function printHtml(title, bodyHtml) {
  const win = openDocWindow(title, bodyHtml);
  if (!win) {
    window.alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }
  win.focus();
  setTimeout(() => {
    win.print();
  }, 250);
}

/** Télécharge un fichier HTML (ouvrable / imprimable). */
export function downloadHtml(filename, title, bodyHtml) {
  const full = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
    <style>${PRINT_STYLES}</style></head><body>${bodyHtml}</body></html>`;
  const blob = new Blob([full], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR');
}

function ageFrom(patient) {
  if (patient?.date_naissance) {
    const birth = new Date(patient.date_naissance);
    if (!Number.isNaN(birth.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
      return age;
    }
  }
  return patient?.age_declare ?? null;
}

export function buildOrdonnanceHtml({ prescription, patient, dossier }) {
  const age = ageFrom(patient);
  const meds = (prescription.medicaments || []).map((m) => `
    <tr>
      <td><strong>${escapeHtml(m.nom_dci || m.nom || '')}</strong>
        ${m.nom_commercial ? `<div class="muted">${escapeHtml(m.nom_commercial)}</div>` : ''}
        ${m.instructions ? `<div class="muted">${escapeHtml(m.instructions)}</div>` : ''}
      </td>
      <td>${escapeHtml(m.dosage || '—')}</td>
      <td>${escapeHtml(m.forme || '—')}</td>
      <td>${escapeHtml(m.posologie || m.frequence || '—')}</td>
      <td>${escapeHtml(m.duree || '—')}</td>
      <td>${escapeHtml(m.quantite || '—')}</td>
    </tr>`).join('');

  return `
    <p class="brand">Centre Médical AMEN</p>
    <h1>Ordonnance médicale</h1>
    <p class="meta">${escapeHtml(prescription.numero_ordonnance || `ORD-${prescription.id}`)}
      · Émise le ${fmtDate(prescription.date_prescription)}
      ${prescription.date_expiration ? ` · Valide jusqu'au ${fmtDate(prescription.date_expiration)}` : ''}
    </p>
    <div class="box">
      <strong>${escapeHtml(patient?.user?.name || 'Patient')}</strong><br/>
      <span class="meta">${escapeHtml(dossier?.numero_dossier || patient?.numero_patient || '')}
      ${age != null ? ` · ${age} ans` : ''}
      ${patient?.sexe ? ` · ${patient.sexe === 'F' ? 'F' : 'M'}` : ''}
      ${prescription.poids_kg ? ` · ${prescription.poids_kg} kg` : ''}</span>
      ${patient?.allergies ? `<div class="alert">Allergies : ${escapeHtml(patient.allergies)}</div>` : ''}
    </div>
    <p class="meta">Médecin : ${escapeHtml(prescription.medecin?.user?.name || '—')}
      ${prescription.medecin?.numero_ordre ? ` · Ordre n° ${escapeHtml(prescription.medecin.numero_ordre)}` : ''}
      ${prescription.medecin?.departement?.nom || dossier?.departement?.nom
        ? ` · ${escapeHtml(prescription.medecin?.departement?.nom || dossier?.departement?.nom)}`
        : ''}
    </p>
    ${prescription.diagnostic_motif ? `<p><strong>Diagnostic / motif :</strong> ${escapeHtml(prescription.diagnostic_motif)}</p>` : ''}
    <table>
      <thead><tr><th>Médicament</th><th>Dosage</th><th>Forme</th><th>Posologie</th><th>Durée</th><th>Qté</th></tr></thead>
      <tbody>${meds || '<tr><td colspan="6">Aucun médicament</td></tr>'}</tbody>
    </table>
    ${prescription.instructions_generales ? `<p><strong>Instructions :</strong> ${escapeHtml(prescription.instructions_generales)}</p>` : ''}
    ${prescription.renouvellement ? '<p><strong>Renouvellement autorisé</strong></p>' : ''}
    <div class="foot"><span>Signature du médecin</span><span>Cachet — Centre Médical AMEN</span></div>
  `;
}

export function buildDossierHtml(data) {
  const patient = data?.patient || {};
  const age = ageFrom(patient);
  const consultations = data?.consultations || [];
  const ordonnances = data?.ordonnances || [];
  const examens = [...(data?.examens || []), ...(data?.analyses || [])];
  const admissions = data?.admissions || [];
  const derniere = data?.derniere_visite;

  const consultRows = consultations.map((c) => `
    <li><strong>${escapeHtml(c.numero_dossier || `DOS-${c.id}`)}</strong> — ${fmtDate(c.date_consultation)}
      · ${escapeHtml(c.motif || '—')}
      ${c.diagnostics?.[0]?.libelle ? ` · Dx : ${escapeHtml(c.diagnostics[0].libelle)}` : ''}
      ${c.medecin?.user?.name ? ` · ${escapeHtml(c.medecin.user.name)}` : ''}
    </li>`).join('');

  const ordRows = ordonnances.map((o) => `
    <li><strong>${escapeHtml(o.numero_ordonnance || `ORD-${o.id}`)}</strong> — ${fmtDate(o.date_prescription)}
      · ${(o.medicaments || []).map((m) => escapeHtml(m.nom || m.nom_dci)).filter(Boolean).join(', ') || '—'}
      · ${escapeHtml(o.statut_label || o.statut || '')}
    </li>`).join('');

  const examRows = examens.map((e) => `
    <li><strong>${escapeHtml(e.type_examen || e.type_analyse || 'Examen')}</strong>
      — ${fmtDate(e.termine_at || e.date_resultat || e.prescrit_at || e.date_prelevement)}
      · ${escapeHtml(e.statut || '')}
      ${e.interpretation ? ` · ${escapeHtml(e.interpretation)}` : ''}
    </li>`).join('');

  const admRows = admissions.map((a) => `
    <li><strong>${escapeHtml(a.numero_admission)}</strong> — ${fmtDate(a.arrivee_at)}
      · ${escapeHtml(a.motif_arrivee || '—')} · ${escapeHtml(a.statut_label || a.statut || '')}
    </li>`).join('');

  return `
    <p class="brand">Centre Médical AMEN</p>
    <h1>Dossier patient</h1>
    <p class="meta">Généré le ${new Date().toLocaleString('fr-FR')}</p>

    <div class="box">
      <strong>${escapeHtml(patient.user?.name || 'Patient')}</strong><br/>
      <span class="meta">${escapeHtml(patient.numero_patient || '')}
      ${age != null ? ` · ${age} ans` : ''}
      ${patient.sexe ? ` · ${patient.sexe === 'F' ? 'Femme' : 'Homme'}` : ''}
      ${patient.groupe_sanguin ? ` · Groupe ${escapeHtml(patient.groupe_sanguin)}` : ''}
      </span>
      ${patient.allergies ? `<div class="alert">Allergies : ${escapeHtml(patient.allergies)}</div>` : ''}
    </div>

    <h2>Informations administratives</h2>
    <p class="meta">
      Naissance : ${fmtDate(patient.date_naissance)} · ${escapeHtml(patient.lieu_naissance || '')}<br/>
      Adresse : ${escapeHtml([patient.adresse, patient.quartier, patient.commune, patient.ville].filter(Boolean).join(', ') || '—')}<br/>
      Tél. : ${escapeHtml(patient.user?.phone || '—')} · Assurance : ${escapeHtml(patient.assurance_type || patient.mutuelle || '—')}
    </p>

    <h2>Antécédents</h2>
    <p><strong>Médicaux :</strong> ${escapeHtml(patient.antecedents_medicaux || 'Non renseigné')}</p>
    <p><strong>Familiaux :</strong> ${escapeHtml(patient.antecedents_familiaux || 'Non renseigné')}</p>

    <h2>Dernière visite</h2>
    ${derniere ? `<p class="meta">${escapeHtml(derniere.numero_admission)} — ${fmtDate(derniere.arrivee_at)}
      · ${escapeHtml(derniere.motif_arrivee || '')} · ${escapeHtml(derniere.statut_label || derniere.statut || '')}</p>`
      : '<p class="meta">Aucune visite.</p>'}

    <h2>Consultations (${consultations.length})</h2>
    <ul>${consultRows || '<li>Aucune</li>'}</ul>

    <h2>Ordonnances (${ordonnances.length})</h2>
    <ul>${ordRows || '<li>Aucune</li>'}</ul>

    <h2>Examens (${examens.length})</h2>
    <ul>${examRows || '<li>Aucun</li>'}</ul>

    <h2>Historique des visites (${admissions.length})</h2>
    <ul>${admRows || '<li>Aucune</li>'}</ul>

    <div class="foot"><span>Document confidentiel</span><span>Centre Médical AMEN</span></div>
  `;
}
