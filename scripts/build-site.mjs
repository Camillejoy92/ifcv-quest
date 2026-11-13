import { cp, copyFile, mkdir, rm, stat, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const src = join(root, 'site');
const dist = join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await cp(src, dist, { recursive: true });
const vendor = join(dist, 'vendor');
await mkdir(vendor, { recursive: true });
const dependencies = [
  { src: 'node_modules/pdfjs-dist/build/pdf.min.mjs', dst: 'pdf.min.mjs', minSize: 120000 },
  { src: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs', dst: 'pdf.worker.min.mjs', minSize: 300000 },
  { src: 'node_modules/pdf-lib/dist/pdf-lib.min.js', dst: 'pdf-lib.min.js', minSize: 150000 },
];
for (const file of dependencies) {
  const origin = join(root, file.src);
  const metadata = await stat(origin).catch(() => { throw Error(`Bibliothèque manquante : ${file.src}. Vérifie npm install.`); });
  if (metadata.size < file.minSize) throw Error(`Fichier incomplet : ${file.src} (${metadata.size} octets)`);
  await copyFile(origin, join(vendor, file.dst));
  console.log(`✓ ${file.dst} (${Math.round(metadata.size/1024)} Ko)`);
}
const licenseInfo = `PDF.js 4.10.38 — Apache License 2.0 — https://github.com/mozilla/pdf.js/blob/v4.10.38/LICENSE\npdf-lib 1.17.1 — MIT License — https://github.com/Hopding/pdf-lib/blob/v1.17.1/LICENSE.md\n`;
await writeFile(join(vendor,'BIBLIOTHEQUES.txt'), licenseInfo, 'utf8');
for (const dependency of [
  ['node_modules/pdfjs-dist/LICENSE', 'LICENCE_PDFJS.txt'],
  ['node_modules/pdf-lib/LICENSE.md', 'LICENCE_PDF_LIB.txt'],
]) {
  const file = join(root, dependency[0]);
  try { await copyFile(file, join(vendor, dependency[1])); }
  catch { console.warn(`Licence non trouvée dans le package : ${dependency[0]} — voir BIBLIOTHEQUES.txt`); }
}
const html = await readFile(join(dist,'index.html'),'utf8');
for (const expected of ['./vendor/pdf.min.mjs','./vendor/pdf.worker.min.mjs','./vendor/pdf-lib.min.js']) {
  if (!html.includes(expected)) throw Error(`Référence non trouvée dans le jeu : ${expected}`);
}
console.log('✓ Site prêt dans dist/ avec lecteurs PDF locaux.');
