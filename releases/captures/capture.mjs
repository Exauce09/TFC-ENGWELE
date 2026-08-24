import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://127.0.0.1:5173';
const PWD = 'Password@123';

const jobs = [
  { role: 'public', email: null, pages: [
    ['00-accueil-public', '/'],
    ['01-connexion', '/login'],
    ['02-inscription', '/register'],
    ['03-mot-de-passe-oublie', '/forgot-password'],
  ]},
  { role: 'patient', email: 'qwertyu@patient.amen.cd', pages: [
    ['10-patient-dashboard', '/patient/dashboard'],
    ['11-patient-rendez-vous', '/patient/rendez-vous'],
    ['12-patient-dossier', '/patient/dossier'],
    ['13-patient-teleconsultation', '/patient/teleconsultation'],
    ['14-patient-factures', '/patient/factures'],
    ['15-patient-profil', '/profil'],
  ]},
  { role: 'medecin', email: 'medecin@amen.cd', pages: [
    ['20-medecin-dashboard', '/medecin/dashboard'],
    ['21-medecin-planning', '/medecin/planning'],
    ['22-medecin-dossiers', '/medecin/dossiers'],
    ['23-medecin-patients', '/medecin/patients'],
    ['24-medecin-teleconsultation', '/medecin/teleconsultation'],
  ]},
  { role: 'admin', email: 'admin@amen.cd', pages: [
    ['30-admin-dashboard', '/admin/dashboard'],
    ['31-admin-rendez-vous', '/admin/rendez-vous'],
    ['32-admin-patients', '/admin/patients'],
    ['33-admin-medecins', '/admin/medecins'],
    ['34-admin-departements', '/admin/departements'],
    ['35-admin-utilisateurs', '/admin/utilisateurs'],
    ['36-admin-facturation', '/admin/facturation'],
    ['37-admin-statistiques', '/admin/statistiques'],
  ]},
  { role: 'accueil', email: 'receptionniste@amen.cd', pages: [
    ['40-accueil-dashboard', '/accueil/dashboard'],
    ['41-accueil-reception', '/accueil/reception'],
    ['42-accueil-arrivee', '/accueil/arrivee'],
    ['43-accueil-demandes', '/accueil/demandes'],
    ['44-accueil-rendez-vous', '/accueil/rendez-vous'],
    ['45-accueil-patients', '/accueil/patients'],
    ['46-accueil-parcours', '/parcours'],
  ]},
  { role: 'infirmier', email: 'infirmier@amen.cd', pages: [
    ['50-infirmier-dashboard', '/infirmier/dashboard'],
    ['51-infirmier-triage', '/infirmier/triage'],
    ['52-infirmier-prelevements', '/infirmier/prelevements'],
    ['53-infirmier-constantes', '/infirmier/constantes'],
    ['54-infirmier-patients', '/infirmier/patients'],
  ]},
  { role: 'laborantin', email: 'laborantin@amen.cd', pages: [
    ['60-labo-dashboard', '/laboratoire/dashboard'],
    ['61-labo-patients', '/laboratoire/patients'],
    ['62-labo-analyses', '/laboratoire/analyses'],
  ]},
  { role: 'pharmacien', email: 'pharmacien@amen.cd', pages: [
    ['70-pharmacie-dashboard', '/pharmacie/dashboard'],
    ['71-pharmacie-patients', '/pharmacie/patients'],
    ['72-pharmacie-stock', '/pharmacie/stock'],
    ['73-pharmacie-ordonnances', '/pharmacie/ordonnances'],
  ]},
  { role: 'caissier', email: 'caissier@amen.cd', pages: [
    ['80-caisse-dashboard', '/caisse/dashboard'],
    ['81-caisse-factures', '/caisse/factures'],
    ['82-caisse-paiements', '/caisse/paiements'],
  ]},
  { role: 'sage_femme', email: 'sagefemme@amen.cd', pages: [
    ['90-maternite-dashboard', '/maternite/dashboard'],
    ['91-maternite-planning', '/maternite/planning'],
    ['92-maternite-suivis', '/maternite/suivis'],
  ]},
  { role: 'chirurgien', email: 'chirurgien@amen.cd', pages: [
    ['93-chirurgie-dashboard', '/chirurgie/dashboard'],
    ['94-chirurgie-planning', '/chirurgie/planning'],
    ['95-chirurgie-operations', '/chirurgie/operations'],
  ]},
  { role: 'echographiste', email: 'echographiste@amen.cd', pages: [
    ['96-echo-dashboard', '/echographie/dashboard'],
    ['97-echo-planning', '/echographie/planning'],
    ['98-echo-examens', '/echographie/examens'],
  ]},
  { role: 'kine', email: 'kine@amen.cd', pages: [
    ['99-kine-dashboard', '/kinesitherapie/dashboard'],
    ['99b-kine-planning', '/kinesitherapie/planning'],
    ['99c-kine-seances', '/kinesitherapie/seances'],
  ]},
  { role: 'dentiste', email: 'dentiste@amen.cd', pages: [
    ['99d-dent-dashboard', '/dentisterie/dashboard'],
    ['99e-dent-patients', '/dentisterie/patients'],
    ['99f-dent-planning', '/dentisterie/planning'],
    ['99g-dent-soins', '/dentisterie/soins'],
  ]},
];

function shotPath(name) {
  return join(__dirname, `${name}.png`);
}

async function login(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#login-id').fill(email);
  await page.locator('#login-pwd').fill(PWD);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 20000 }).catch(() => {}),
    page.locator('button[type="submit"]').click(),
  ]);
  await page.waitForTimeout(800);
}

async function capture(page, name, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30000 }).catch(async () => {
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: shotPath(name), fullPage: true });
  console.log('OK', name);
}

const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
page.setDefaultTimeout(25000);

mkdirSync(__dirname, { recursive: true });

for (const job of jobs) {
  await context.clearCookies();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  if (job.email) {
    try {
      await login(page, job.email);
    } catch (e) {
      console.log('LOGIN FAIL', job.email, e.message);
      continue;
    }
  }
  for (const [name, path] of job.pages) {
    try {
      await capture(page, name, path);
    } catch (e) {
      console.log('FAIL', name, e.message);
    }
  }
}

await browser.close();
console.log('DONE');
