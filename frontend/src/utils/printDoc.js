/** Impression navigateur et téléchargements PDF / Word (.docx) pour le patient. */
import html2pdf from 'html2pdf.js';
import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

const PRINT_STYLES = `
  body{font-family:Georgia,serif;color:#111;margin:32px;line-height:1.45}
  h1{font-size:22px;margin:0 0 4px;border-bottom:1px solid #e5e7eb;padding-bottom:6px}
  h2{font-size:14px;color:#444;font-weight:normal;margin:16px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
  h3{font-size:14px;margin:18px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
  table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
  th,td{border-bottom:1px solid #e5e7eb;padding:8px 6px;text-align:left;vertical-align:top}
  th{font-size:11px;text-transform:uppercase;color:#4b5563;background:#f9fafb}
  .meta{font-size:12px;color:#555;margin:4px 0}
  .muted{color:#5A8A7A;font-size:12px}
  .brand{color:#1A7A6D;font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:700}
  .total{font-weight:bold;font-size:15px;margin-top:12px}
  .badge{display:inline-block;padding:2px 8px;border-radius:999px;background:#eee;font-size:11px}
  .box{border:1px solid #ddd;padding:12px;margin:12px 0;background:#fafafa}
  .alert{background:#FEF2F2;border:1px solid #FECACA;color:#991B1B;padding:8px;border-radius:6px;font-size:12px;margin-top:8px}
  .foot{margin-top:48px;display:flex;justify-content:space-between;font-size:12px;color:#888}
  ul{padding-left:18px} li{margin:4px 0}
  @media print{button,.no-print{display:none!important}}
`;

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dispatchToast(message, type = 'success', ttlMs = 3500) {
  try {
    window.dispatchEvent(
      new CustomEvent('amen:toast', {
        detail: { message, type, ttlMs },
      }),
    );
  } catch {
    // ignore
  }
}

function wrapPrintDocument(title, bodyHtml) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/>
    <title>${escapeHtml(title)}</title>
    <style>${PRINT_STYLES}</style></head><body>
    <p style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#666">Centre Médical AMEN</p>
    ${bodyHtml}
    <p style="margin-top:28px;font-size:11px;color:#888">Document généré le ${new Date().toLocaleString('fr-FR')}</p>
    </body></html>`;
}

/**
 * Ouvre une fenêtre imprimable (ou iframe si pop-up bloqué) puis lance print().
 * Ne pas utiliser noopener : window.open renverrait null et bloquerait l'impression.
 */
export function printHtml(title, bodyHtml) {
  const html = wrapPrintDocument(title, bodyHtml);

  let win = null;
  try {
    // Pas de noopener/noreferrer : sinon win === null dans Chrome/Edge modernes
    win = window.open('', '_blank', 'width=860,height=980');
  } catch {
    win = null;
  }

  if (win && win.document) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    try { win.focus(); } catch { /* ignore */ }
    const trigger = () => {
      try { win.print(); } catch { /* ignore */ }
    };
    // onload peut déjà être passé après document.write — setTimeout est plus fiable
    setTimeout(trigger, 300);
    dispatchToast('Impression lancée.', 'info');
    return true;
  }

  // Fallback sans pop-up : iframe cachée
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', title);
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    dispatchToast('Impossible d’imprimer. Autorisez les pop-ups ou réessayez.', 'error');
    return false;
  }
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      dispatchToast('Impossible d’imprimer depuis ce navigateur.', 'error');
    }
    setTimeout(() => iframe.remove(), 1500);
  }, 350);
  dispatchToast('Impression lancée.', 'info');
  return true;
}

export function downloadText(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function triggerBlobDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Télécharge un vrai fichier PDF (html2pdf.js dans le navigateur). */
export async function downloadPdf(filename, title, bodyHtml) {
  const pdfName = String(filename || 'document').replace(/\.(html?|pdf|docx)$/i, '') + '.pdf';

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff;';
  host.innerHTML = `
    <style>${PRINT_STYLES}</style>
    <div class="pdf-root" style="padding:32px;font-family:Georgia,serif;color:#111;line-height:1.45">
      <p style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#666">Centre Médical AMEN</p>
      ${bodyHtml}
      <p style="margin-top:28px;font-size:11px;color:#888">Document généré le ${new Date().toLocaleString('fr-FR')}</p>
    </div>`;
  document.body.appendChild(host);

  const opt = {
    margin: [10, 10, 10, 10],
    filename: pdfName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  try {
    await html2pdf().set(opt).from(host.querySelector('.pdf-root')).save();
    dispatchToast(`PDF téléchargé (${pdfName}).`, 'success');
  } finally {
    host.remove();
  }
}

const thinBorder = {
  top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
  left: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
  right: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
};

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: String(text ?? ''),
        size: opts.size || 22,
        bold: !!opts.bold,
        italics: !!opts.italics,
        color: opts.color || '111111',
      }),
    ],
  });
}

function heading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 160 },
    children: [new TextRun({ text: String(text ?? ''), bold: true, size: 32 })],
  });
}

function subheading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: String(text ?? ''), bold: true, size: 24, color: '444444' })],
  });
}

function meta(text) {
  return p(text, { size: 20, color: '555555' });
}

function cell(text, opts = {}) {
  return new TableCell({
    borders: thinBorder,
    width: { size: opts.width || 2500, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text ?? ''),
            bold: !!opts.bold,
            size: opts.size || 20,
          }),
        ],
      }),
    ],
  });
}

function simpleTable(headers, rows) {
  const colW = Math.floor(9000 / Math.max(headers.length, 1));
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: headers.map((h) => cell(h, { bold: true, width: colW, size: 18 })),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map((c) => cell(c, { width: colW })),
          }),
      ),
    ],
  });
}

async function saveDocx(filename, children) {
  const name = String(filename || 'document').replace(/\.(html?|pdf|docx)$/i, '') + '.docx';
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          p('CENTRE MÉDICAL AMEN', { size: 18, bold: true, color: '666666' }),
          ...children,
          p(`Document généré le ${new Date().toLocaleString('fr-FR')}`, {
            size: 18,
            color: '888888',
            italics: true,
          }),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  triggerBlobDownload(name, blob);
}

/** Télécharge un fichier Word (.docx) à partir d’un builder structuré. */
export async function downloadDocx(filename, builder) {
  const children = typeof builder === 'function' ? builder() : builder;
  await saveDocx(filename, children);
  const name = String(filename || 'document').replace(/\.(html?|pdf|docx)$/i, '') + '.docx';
  dispatchToast(`Word téléchargé (${name}).`, 'success');
}

export function facturePrintBody(f) {
  const lignes = (f.lignes || [])
    .map(
      (l) =>
        `<tr><td>${escapeHtml(l.description)}</td><td>${l.quantite}</td><td>${Number(l.quantite * l.prix_unitaire).toLocaleString('fr-FR')} FC</td></tr>`,
    )
    .join('');
  return `
    <h1>Facture ${escapeHtml(f.numero_facture)}</h1>
    <p class="meta">Date : ${f.date_facture ? new Date(f.date_facture).toLocaleDateString('fr-FR') : '—'}</p>
    <p class="meta">Statut : <span class="badge">${escapeHtml((f.statut || '').replace(/_/g, ' '))}</span></p>
    <table><thead><tr><th>Description</th><th>Qté</th><th>Montant</th></tr></thead>
    <tbody>${lignes || '<tr><td colspan="3">Aucune ligne</td></tr>'}</tbody></table>
    <p class="total">Total : ${Number(f.montant_total || 0).toLocaleString('fr-FR')} FC</p>
    <p class="meta">Payé : ${Number(f.montant_paye || 0).toLocaleString('fr-FR')} FC — Reste : ${Number(f.reste_a_payer || 0).toLocaleString('fr-FR')} FC</p>
  `;
}

export function factureDocxChildren(f) {
  const rows = (f.lignes || []).map((l) => [
    l.description || '',
    String(l.quantite ?? ''),
    `${Number(l.quantite * l.prix_unitaire).toLocaleString('fr-FR')} FC`,
  ]);
  return [
    heading(`Facture ${f.numero_facture || ''}`),
    meta(`Date : ${f.date_facture ? new Date(f.date_facture).toLocaleDateString('fr-FR') : '—'}`),
    meta(`Statut : ${(f.statut || '').replace(/_/g, ' ')}`),
    simpleTable(['Description', 'Qté', 'Montant'], rows.length ? rows : [['Aucune ligne', '', '']]),
    p(`Total : ${Number(f.montant_total || 0).toLocaleString('fr-FR')} FC`, { bold: true, size: 26 }),
    meta(
      `Payé : ${Number(f.montant_paye || 0).toLocaleString('fr-FR')} FC — Reste : ${Number(f.reste_a_payer || 0).toLocaleString('fr-FR')} FC`,
    ),
  ];
}

export function ordonnancePrintBody(pr) {
  const meds = (pr.medicaments || [])
    .map(
      (m) =>
        `<tr><td>${escapeHtml(m.nom_dci || m.nom || m.nom_commercial)}</td><td>${escapeHtml(m.dosage || '')}</td><td>${escapeHtml(m.frequence || m.posologie || '')}</td><td>${escapeHtml(m.duree || '')}</td></tr>`,
    )
    .join('');
  return `
    <h1>Ordonnance ${escapeHtml(pr.numero_ordonnance || '')}</h1>
    <p class="meta">Date : ${pr.date_prescription ? new Date(pr.date_prescription).toLocaleDateString('fr-FR') : '—'}</p>
    <p class="meta">Médecin : ${escapeHtml(pr.medecin?.user?.name || '—')}</p>
    <p class="meta">Statut : <span class="badge">${escapeHtml(pr.statut_label || pr.statut || '')}</span></p>
    <table><thead><tr><th>Médicament</th><th>Dosage</th><th>Fréquence</th><th>Durée</th></tr></thead>
    <tbody>${meds || '<tr><td colspan="4">Aucun médicament</td></tr>'}</tbody></table>
    ${
      pr.instructions_generales || pr.diagnostic_motif
        ? `<p class="meta" style="margin-top:16px">${escapeHtml(pr.instructions_generales || pr.diagnostic_motif)}</p>`
        : ''
    }
  `;
}

export function ordonnanceDocxChildren(pr) {
  const rows = (pr.medicaments || []).map((m) => [
    m.nom_dci || m.nom || m.nom_commercial || '',
    m.dosage || '',
    m.frequence || m.posologie || '',
    m.duree || '',
  ]);
  const children = [
    heading(`Ordonnance ${pr.numero_ordonnance || ''}`),
    meta(
      `Date : ${pr.date_prescription ? new Date(pr.date_prescription).toLocaleDateString('fr-FR') : '—'}`,
    ),
    meta(`Médecin : ${pr.medecin?.user?.name || '—'}`),
    meta(`Statut : ${pr.statut_label || pr.statut || ''}`),
    simpleTable(
      ['Médicament', 'Dosage', 'Fréquence', 'Durée'],
      rows.length ? rows : [['Aucun médicament', '', '', '']],
    ),
  ];
  if (pr.instructions_generales || pr.diagnostic_motif) {
    children.push(meta(pr.instructions_generales || pr.diagnostic_motif));
  }
  return children;
}

export function consultationPrintBody(c) {
  const dx = (c.diagnostics || [])
    .map((d) => `<li>${escapeHtml(d.libelle)}${d.code_cim10 ? ` (${escapeHtml(d.code_cim10)})` : ''}</li>`)
    .join('');
  return `
    <h1>${escapeHtml(c.motif || 'Consultation')}</h1>
    <p class="meta">Date : ${c.date_consultation ? new Date(c.date_consultation).toLocaleDateString('fr-FR') : '—'}</p>
    <p class="meta">Médecin : ${escapeHtml(c.medecin?.user?.name || '—')} — ${escapeHtml(c.departement?.nom || '—')}</p>
    ${c.numero_admission ? `<p class="meta">Admission : ${escapeHtml(c.numero_admission)}</p>` : ''}
    ${c.anamnese ? `<h3>Anamnèse</h3><p>${escapeHtml(c.anamnese)}</p>` : ''}
    ${c.examen_clinique ? `<h3>Examen clinique</h3><p>${escapeHtml(c.examen_clinique)}</p>` : ''}
    ${dx ? `<h3>Diagnostics</h3><ul>${dx}</ul>` : ''}
    ${!dx && c.diagnostic_final ? `<h3>Diagnostic</h3><p>${escapeHtml(c.diagnostic_final)}</p>` : ''}
    ${c.observations ? `<h3>Observations</h3><p>${escapeHtml(c.observations)}</p>` : ''}
  `;
}

export function consultationDocxChildren(c) {
  const children = [
    heading(c.motif || 'Consultation'),
    meta(
      `Date : ${c.date_consultation ? new Date(c.date_consultation).toLocaleDateString('fr-FR') : '—'}`,
    ),
    meta(`Médecin : ${c.medecin?.user?.name || '—'} — ${c.departement?.nom || '—'}`),
  ];
  if (c.numero_admission) children.push(meta(`Admission : ${c.numero_admission}`));
  if (c.anamnese) {
    children.push(subheading('Anamnèse'), p(c.anamnese));
  }
  if (c.examen_clinique) {
    children.push(subheading('Examen clinique'), p(c.examen_clinique));
  }
  const dx = c.diagnostics || [];
  if (dx.length) {
    children.push(subheading('Diagnostics'));
    dx.forEach((d) => children.push(p(`${d.libelle}${d.code_cim10 ? ` (${d.code_cim10})` : ''}`)));
  } else if (c.diagnostic_final) {
    children.push(subheading('Diagnostic'), p(c.diagnostic_final));
  }
  if (c.observations) {
    children.push(subheading('Observations'), p(c.observations));
  }
  return children;
}

export function resultatPrintBody(ex) {
  const rows = (ex.resultats || [])
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.parametre)}</td><td>${escapeHtml(r.valeur)}</td><td>${escapeHtml(r.unite || '')}</td><td>${escapeHtml(r.norme || '')}</td></tr>`,
    )
    .join('');
  return `
    <h1>Résultat — ${escapeHtml(ex.type_examen || ex.type_analyse || 'Examen')}</h1>
    <p class="meta">Statut : ${escapeHtml(ex.statut_label || ex.statut || '')}</p>
    <p class="meta">Date : ${
      ex.termine_at || ex.date_analyse
        ? new Date(ex.termine_at || ex.date_analyse).toLocaleDateString('fr-FR')
        : '—'
    }</p>
    ${ex.numero_admission ? `<p class="meta">Admission : ${escapeHtml(ex.numero_admission)}</p>` : ''}
    ${
      rows
        ? `<table><thead><tr><th>Paramètre</th><th>Valeur</th><th>Unité</th><th>Norme</th></tr></thead><tbody>${rows}</tbody></table>`
        : ''
    }
    ${ex.interpretation || ex.resultat ? `<p class="meta" style="margin-top:16px">${escapeHtml(ex.interpretation || ex.resultat)}</p>` : ''}
  `;
}

export function resultatDocxChildren(ex) {
  const rows = (ex.resultats || []).map((r) => [
    r.parametre || '',
    String(r.valeur ?? ''),
    r.unite || '',
    r.norme || '',
  ]);
  const children = [
    heading(`Résultat — ${ex.type_examen || ex.type_analyse || 'Examen'}`),
    meta(`Statut : ${ex.statut_label || ex.statut || ''}`),
    meta(
      `Date : ${
        ex.termine_at || ex.date_analyse
          ? new Date(ex.termine_at || ex.date_analyse).toLocaleDateString('fr-FR')
          : '—'
      }`,
    ),
  ];
  if (ex.numero_admission) children.push(meta(`Admission : ${ex.numero_admission}`));
  if (rows.length) {
    children.push(simpleTable(['Paramètre', 'Valeur', 'Unité', 'Norme'], rows));
  }
  if (ex.interpretation || ex.resultat) {
    children.push(meta(ex.interpretation || ex.resultat));
  }
  return children;
}

/** Synthèse du dossier médical patient (consultations, ordonnances, examens, visites). */
export function dossierPrintBody(data, prescriptions = []) {
  const patient = data?.patient || {};
  const consultations = data?.consultations || [];
  const examens = [...(data?.examens || []), ...(data?.analyses || [])];
  const visites = data?.visites || [];
  const ords = prescriptions.length ? prescriptions : data?.ordonnances || [];

  const consultLis = consultations
    .map(
      (c) =>
        `<li><strong>${escapeHtml(c.motif || 'Consultation')}</strong> — ${
          c.date_consultation ? new Date(c.date_consultation).toLocaleDateString('fr-FR') : '—'
        } · ${escapeHtml(c.medecin?.user?.name || '—')}</li>`,
    )
    .join('');
  const ordLis = ords
    .map(
      (o) =>
        `<li><strong>${escapeHtml(o.numero_ordonnance || `ORD-${o.id}`)}</strong> — ${
          o.date_prescription ? new Date(o.date_prescription).toLocaleDateString('fr-FR') : '—'
        }</li>`,
    )
    .join('');
  const examLis = examens
    .map(
      (e) =>
        `<li><strong>${escapeHtml(e.type_examen || e.type_analyse || 'Examen')}</strong> — ${escapeHtml(
          e.statut_label || e.statut || '',
        )}</li>`,
    )
    .join('');
  const visitLis = visites
    .map(
      (v) =>
        `<li><strong>${escapeHtml(v.numero_admission)}</strong> — ${escapeHtml(v.statut_label || v.statut || '')}${
          v.service ? ` · ${escapeHtml(v.service)}` : ''
        }</li>`,
    )
    .join('');

  return `
    <h1>Dossier médical</h1>
    <div class="box">
      <strong>${escapeHtml(patient.user?.name || 'Patient')}</strong><br/>
      <span class="meta">${escapeHtml(patient.numero_patient || '')}
      ${patient.sexe ? ` · ${patient.sexe === 'F' ? 'Femme' : 'Homme'}` : ''}
      ${patient.allergies ? ` · Allergies : ${escapeHtml(patient.allergies)}` : ''}
      </span>
    </div>
    <h3>Consultations (${consultations.length})</h3>
    <ul>${consultLis || '<li>Aucune</li>'}</ul>
    <h3>Ordonnances (${ords.length})</h3>
    <ul>${ordLis || '<li>Aucune</li>'}</ul>
    <h3>Examens / analyses (${examens.length})</h3>
    <ul>${examLis || '<li>Aucun</li>'}</ul>
    <h3>Visites (${visites.length})</h3>
    <ul>${visitLis || '<li>Aucune</li>'}</ul>
  `;
}

export function dossierDocxChildren(data, prescriptions = []) {
  const patient = data?.patient || {};
  const consultations = data?.consultations || [];
  const examens = [...(data?.examens || []), ...(data?.analyses || [])];
  const visites = data?.visites || [];
  const ords = prescriptions.length ? prescriptions : data?.ordonnances || [];

  const children = [
    heading('Dossier médical'),
    p(patient.user?.name || 'Patient', { bold: true, size: 26 }),
    meta(
      `${patient.numero_patient || ''}${patient.sexe ? ` · ${patient.sexe === 'F' ? 'Femme' : 'Homme'}` : ''}${
        patient.allergies ? ` · Allergies : ${patient.allergies}` : ''
      }`,
    ),
    subheading(`Consultations (${consultations.length})`),
  ];
  if (!consultations.length) children.push(meta('Aucune'));
  else {
    consultations.forEach((c) =>
      children.push(
        p(
          `${c.motif || 'Consultation'} — ${
            c.date_consultation ? new Date(c.date_consultation).toLocaleDateString('fr-FR') : '—'
          } · ${c.medecin?.user?.name || '—'}`,
        ),
      ),
    );
  }
  children.push(subheading(`Ordonnances (${ords.length})`));
  if (!ords.length) children.push(meta('Aucune'));
  else {
    ords.forEach((o) =>
      children.push(
        p(
          `${o.numero_ordonnance || `ORD-${o.id}`} — ${
            o.date_prescription ? new Date(o.date_prescription).toLocaleDateString('fr-FR') : '—'
          }`,
        ),
      ),
    );
  }
  children.push(subheading(`Examens / analyses (${examens.length})`));
  if (!examens.length) children.push(meta('Aucun'));
  else {
    examens.forEach((e) =>
      children.push(p(`${e.type_examen || e.type_analyse || 'Examen'} — ${e.statut_label || e.statut || ''}`)),
    );
  }
  children.push(subheading(`Visites (${visites.length})`));
  if (!visites.length) children.push(meta('Aucune'));
  else {
    visites.forEach((v) =>
      children.push(
        p(`${v.numero_admission} — ${v.statut_label || v.statut || ''}${v.service ? ` · ${v.service}` : ''}`),
      ),
    );
  }
  return children;
}
