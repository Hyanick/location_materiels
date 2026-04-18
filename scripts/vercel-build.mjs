import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Script dédié à Vercel.
// On garde ce fichier plutôt qu'une simple commande inline pour documenter
// clairement le build attendu côté hébergement.
const projectRoot = process.cwd();
const angularBin = join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'ng.cmd' : 'ng');
const outputDir = join(projectRoot, 'dist', 'rental-doc-app', 'browser');

const build = spawnSync(angularBin, ['build', '--configuration', 'production'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: false
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

// Avec le builder Angular 19, Vercel doit publier le dossier `browser`.
if (!existsSync(outputDir)) {
  console.error(`Dossier de sortie introuvable pour Vercel: ${outputDir}`);
  process.exit(1);
}

console.log(`Build Vercel prêt dans: ${outputDir}`);
