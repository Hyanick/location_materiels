import { createServer } from 'node:https';
import { readFileSync, existsSync, createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { networkInterfaces } from 'node:os';

const host = process.env.HOST ?? '0.0.0.0';
const port = Number(process.env.PORT ?? 4443);
const distDir = process.env.DIST_DIR ?? join(process.cwd(), 'dist', 'rental-doc-app', 'browser');
const fallbackDistDir = join(process.cwd(), 'dist', 'rental-doc-app');
const rootDir = existsSync(distDir) ? distDir : fallbackDistDir;
const certPath = process.env.CERT_PATH ?? join(process.cwd(), 'certs', 'local-pwa-cert.pem');
const keyPath = process.env.KEY_PATH ?? join(process.cwd(), 'certs', 'local-pwa-key.pem');

if (!existsSync(rootDir)) {
  console.error(`Build introuvable: ${rootDir}`);
  console.error('Lance d’abord `npm run build:pwa-local`.');
  process.exit(1);
}

if (!existsSync(certPath) || !existsSync(keyPath)) {
  console.error('Certificat HTTPS introuvable.');
  console.error(`CERT_PATH=${certPath}`);
  console.error(`KEY_PATH=${keyPath}`);
  process.exit(1);
}

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

const server = createServer(
  {
    cert: readFileSync(certPath),
    key: readFileSync(keyPath)
  },
  (request, response) => {
    const requestUrl = new URL(request.url ?? '/', `https://${request.headers.host ?? `localhost:${port}`}`);
    const urlPath = decodeURIComponent(requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname);
    const safePath = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
    let filePath = join(rootDir, safePath);

    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    if (!existsSync(filePath)) {
      filePath = join(rootDir, 'index.html');
    }

    const extension = extname(filePath).toLowerCase();
    const contentType = mimeTypes[extension] ?? 'application/octet-stream';

    response.setHeader('Content-Type', contentType);
    response.setHeader('Cache-Control', extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable');

    createReadStream(filePath)
      .on('error', () => {
        response.writeHead(500);
        response.end('Server error');
      })
      .pipe(response);
  }
);

server.listen(port, host, () => {
  console.log(`PWA locale disponible sur https://localhost:${port}`);

  for (const ip of getLocalIpv4Addresses()) {
    console.log(`Tablette: https://${ip}:${port}`);
  }

  console.log(`Build servi depuis: ${rootDir}`);
});

function getLocalIpv4Addresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((address) => address && address.family === 'IPv4' && !address.internal)
    .map((address) => address.address);
}
