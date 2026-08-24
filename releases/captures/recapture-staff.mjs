import { chromium } from 'playwright-core';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://127.0.0.1:5173';
const PWD = 'Password@123';

const jobs = [
  { email: 'qwert@gmail.com', pages: [
    ['50-infirmier-dashboard', '/infirmier/dashboard'],
    ['51-infirmier-triage', '/infirmier/triage'],
    ['52-infirmier-prelevements', '/infirmier/prelevements'],
    ['53-infirmier-constantes', '/infirmier/constantes'],
    ['54-infirmier-patients', '/infirmier/patients'],
  ]},
  { email: 'exauce@gmail.com', pages: [
    ['60-labo-dashboard', '/laboratoire/dashboard'],
    ['61-labo-patients', '/laboratoire/patients'],
    ['62-labo-analyses', '/laboratoire/analyses'],
  ]},
  { email: 'ferdi@gmail.com', pages: [
    ['70-pharmacie-dashboard', '/pharmacie/dashboard'],
    ['71-pharmacie-patients', '/pharmacie/patients'],
    ['72-pharmacie-stock', '/pharmacie/stock'],
    ['73-pharmacie-ordonnances', '/pharmacie/ordonnances'],
  ]},
  { email: 'caissier@amen.cd', pages: [
    ['80-caisse-dashboard', '/caisse/dashboard'],
    ['81-caisse-factures', '/caisse/factures'],
    ['82-caisse-paiements', '/caisse/paiements'],
  ]},
];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

async function login(email) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#login-id').fill(email);
  await page.locator('#login-pwd').fill(PWD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 20000 });
  await page.waitForTimeout(600);
}

for (const job of jobs) {
  await context.clearCookies();
  await page.goto(`${BASE}/`);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await login(job.email);
  for (const [name, path] of job.pages) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(__dirname, `${name}.png`), fullPage: true });
    console.log('OK', name);
  }
}
await browser.close();
console.log('DONE');
