# Rental Doc App

Application Angular standalone pour créer des bons de location imprimables de type A4.

## Installation

```bash
npm install
npm start
```

## Fonctionnalités

- Formulaire client et société
- Catalogue initial avec vos prix
- Ajout / suppression de lignes
- Calcul automatique du total et du solde
- Aperçu imprimable A4
- Sauvegarde locale automatique dans le navigateur
- Bouton impression PDF via le navigateur

## Deploiement Vercel

Le projet contient deja le parametrage minimal pour Vercel :

- [vercel.json](./vercel.json)
- [scripts/vercel-build.mjs](./scripts/vercel-build.mjs)
- [.vercelignore](./.vercelignore)

Ce parametrage fait 3 choses :

- lance un build Angular de production avec `npm run build:vercel`
- publie le dossier `dist/rental-doc-app/browser`
- redirige toutes les routes vers `index.html` pour que le routing Angular fonctionne en SPA

Configuration conseillee dans Vercel :

```text
Framework Preset: Other
Build Command: npm run build:vercel
Output Directory: dist/rental-doc-app/browser
Install Command: npm install
```

Si tu relies le projet a Vercel via Git, le fichier `vercel.json` suffit normalement et Vercel reprendra ces valeurs automatiquement.

## Mise En Place PWA

Cette section detaille ce qui a ete mis en place pour rendre l'application installable en PWA, y compris les erreurs rencontrees et la version finale qui fonctionne sur Vercel.

### Objectif

Le but etait d'obtenir :

- une application installable sur desktop et tablette
- un manifest valide
- un vrai service worker de production
- un fonctionnement correct apres deploiement sur Vercel

### Ce qui ne suffisait pas

Au depart, l'application utilisait :

- un `manifest.webmanifest` place dans `src/`
- un enregistrement manuel du service worker dans `main.ts`
- un fichier `ngsw-worker.js` maison

Cette approche pouvait donner une impression de PWA en local, mais elle etait fragile en production, surtout sur Vercel.

Les problemes typiques rencontres :

- installation proposee en `localhost` mais pas sur le domaine Vercel
- service worker non reconnu comme vrai service worker Angular de production
- manifest present mais icones insuffisantes pour l'installation
- risque de routes Vercel qui renvoient `index.html` a la place des fichiers statiques PWA

### Version finale qui fonctionne

La version qui fonctionne repose sur le vrai package Angular :

- `@angular/service-worker`

Installe avec :

```bash
npm install @angular/service-worker@19.2.21
```

Important :

- la version doit correspondre a la version Angular du projet
- ici le projet etait en Angular `19.2.x`, donc il fallait installer la meme version du service worker

### Fichiers ajoutes ou modifies

#### 1. `ngsw-config.json`

Fichier ajoute :

- [ngsw-config.json](./ngsw-config.json)

Role :

- definit les ressources mises en cache par le service worker Angular
- indique le fichier d'entree `index.html`
- distingue les fichiers applicatifs et les assets

Configuration utilisee :

- groupe `app` en `prefetch` pour les fichiers critiques
- groupe `assets` en `lazy` pour les ressources statiques

#### 2. `angular.json`

Fichier modifie :

- [angular.json](./angular.json)

Ce qui a ete change :

- ajout du dossier `public/` dans les `assets`
- activation du service worker en production avec :
  - `"serviceWorker": "ngsw-config.json"`

Pourquoi :

- Angular doit savoir qu'en build production il faut generer le vrai `ngsw-worker.js`
- le dossier `public/` est ideal pour exposer directement le manifest, les icones et `_redirects`

#### 3. `src/main.ts`

Fichier modifie :

- [src/main.ts](./src/main.ts)

Avant :

- enregistrement manuel du service worker via `navigator.serviceWorker.register(...)`

Apres :

- utilisation de `provideServiceWorker('ngsw-worker.js', ...)`

Pourquoi :

- c'est la methode propre Angular
- elle s'integre au cycle de vie Angular
- elle evite une partie des incoherences entre dev et production

Configuration utilisee :

```ts
provideServiceWorker('ngsw-worker.js', {
  enabled: !isDevMode(),
  registrationStrategy: 'registerWhenStable:30000'
})
```

Explication :

- en dev : pas de service worker
- en prod : enregistrement du service worker quand l'application devient stable

#### 4. Manifest de l'application

Fichier ajoute :

- [public/manifest.webmanifest](./public/manifest.webmanifest)

Et `src/index.html` a ete modifie pour pointer dessus.

Pourquoi le manifest a ete deplace dans `public/` :

- plus simple pour Vercel et pour les assets statiques
- plus proche du montage du projet de reference qui fonctionnait deja

Points importants dans le manifest :

- `start_url`
- `scope`
- `display: "standalone"`
- `theme_color`
- `background_color`
- icones PNG 192x192 et 512x512

#### 5. Icônes PWA

Fichiers ajoutes :

- [public/icons/icon-192x192.png](./public/icons/icon-192x192.png)
- [public/icons/icon-512x512.png](./public/icons/icon-512x512.png)

Pourquoi c'est important :

- une PWA installable a besoin d'icones bitmap adaptees
- un simple SVG ou une icone non conforme peut empecher ou degrader l'installation selon le navigateur

#### 6. `src/index.html`

Fichier modifie :

- [src/index.html](./src/index.html)

Points importants :

- ajout de `<link rel="manifest" href="manifest.webmanifest">`
- ajout d'une vraie icone PNG :
  - `icons/icon-192x192.png`
- conservation du `theme-color`

#### 7. `vercel.json`

Fichier modifie :

- [vercel.json](./vercel.json)

La version finale utilise :

```json
{
  "framework": null,
  "buildCommand": "npm run build:vercel",
  "outputDirectory": "dist/rental-doc-app/browser",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
```

Pourquoi cette version fonctionne mieux :

- `handle: filesystem` laisse Vercel servir d'abord les vrais fichiers statiques
- le fallback vers `index.html` ne s'applique qu'apres

Sans ce point, on risque de casser :

- `manifest.webmanifest`
- `ngsw-worker.js`
- les icones
- les autres fichiers statiques PWA

#### 8. `public/_redirects`

Fichier ajoute :

- [public/_redirects](./public/_redirects)

Contenu :

```text
/* /index.html 200
```

Remarque :

- utile comme filet de securite pour le comportement SPA
- sur Vercel, la logique principale reste dans `vercel.json`

### Comparaison avec le projet de reference

Le projet qui fonctionnait deja sur Vercel utilisait :

- le vrai `@angular/service-worker`
- un `ngsw-config.json`
- un manifest servi comme vrai fichier statique
- des icones PNG dediees
- une config Vercel qui laisse passer d'abord les fichiers du filesystem

La correction de ce projet a consisté a s'aligner sur cette architecture.

### Procedure pour reproduire sur un projet vierge Angular

#### Etape 1. Installer le service worker Angular

```bash
npm install @angular/service-worker@<meme-version-qu-angular>
```

#### Etape 2. Ajouter `ngsw-config.json`

Creer un fichier a la racine du projet :

```json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/icons/**"
        ]
      }
    }
  ]
}
```

#### Etape 3. Activer le service worker en production dans `angular.json`

Dans la configuration `production` du builder Angular :

```json
"serviceWorker": "ngsw-config.json"
```

Et veiller a exposer les assets statiques via `public/` ou via les `assets` du projet.

#### Etape 4. Declarer le service worker dans `main.ts`

Avec Angular standalone :

```ts
import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

bootstrapApplication(AppComponent, {
  providers: [
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
});
```

#### Etape 5. Ajouter le manifest dans `public/`

Creer :

- `public/manifest.webmanifest`

Exemple minimal :

```json
{
  "name": "Mon App",
  "short_name": "MonApp",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#123456",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

#### Etape 6. Ajouter les icones PNG

Creer au minimum :

- `public/icons/icon-192x192.png`
- `public/icons/icon-512x512.png`

#### Etape 7. Modifier `index.html`

Ajouter :

```html
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#123456">
<link rel="icon" href="icons/icon-192x192.png" type="image/png">
```

#### Etape 8. Configurer Vercel

Fichier :

- `vercel.json`

Configuration recommande :

```json
{
  "framework": null,
  "buildCommand": "npm run build",
  "outputDirectory": "dist/<nom-du-projet>/browser",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
```

#### Etape 9. Redéployer puis verifier

Une fois deploie :

1. faire un hard refresh
2. ouvrir Chrome DevTools
3. verifier :
   - `Application > Manifest`
   - `Application > Service Workers`

Tu dois voir :

- le manifest charge correctement
- le service worker enregistre
- les icones reconnues
- l'option d'installation de la PWA disponible

### PWA : pas a pas

Cette sous-section reprend la mise en place complete sous forme de checklist executable sur un projet Angular vierge.

#### 1. Verifier la version Angular du projet

Commande :

```bash
npm list @angular/core
```

But :

- connaitre la version exacte d'Angular
- installer ensuite la meme version de `@angular/service-worker`

Exemple :

- si le projet est en `19.2.21`
- il faut installer `@angular/service-worker@19.2.21`

#### 2. Installer le service worker Angular

Commande :

```bash
npm install @angular/service-worker@<version-angular>
```

Exemple :

```bash
npm install @angular/service-worker@19.2.21
```

#### 3. Creer le fichier `ngsw-config.json`

A la racine du projet, creer :

- `ngsw-config.json`

Contenu :

```json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/icons/**"
        ]
      }
    }
  ]
}
```

#### 4. Ajouter un dossier `public/`

Creer si besoin :

- `public/`
- `public/icons/`

Pourquoi :

- les fichiers du dossier `public/` sont servis comme vrais fichiers statiques
- c'est ideal pour le manifest, les icones et les fichiers de routage du host

#### 5. Creer le manifest

Fichier :

- `public/manifest.webmanifest`

Contenu minimal :

```json
{
  "name": "Mon App",
  "short_name": "MonApp",
  "description": "Description de l'application.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#123456",
  "lang": "fr",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

#### 6. Ajouter les icones PWA

Ajouter au minimum :

- `public/icons/icon-192x192.png`
- `public/icons/icon-512x512.png`

Important :

- utiliser de vraies images PNG
- eviter de s'appuyer uniquement sur un SVG pour l'installation PWA

#### 7. Modifier `index.html`

Fichier :

- `src/index.html`

Ajouter dans le `<head>` :

```html
<meta name="theme-color" content="#123456">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192x192.png" type="image/png">
```

#### 8. Modifier `angular.json`

Dans la partie `build > options > assets`, ajouter `public` :

```json
"assets": [
  {
    "glob": "**/*",
    "input": "public"
  },
  {
    "glob": "**/*",
    "input": "src/assets"
  }
]
```

Dans la configuration `production`, activer le service worker :

```json
"serviceWorker": "ngsw-config.json"
```

#### 9. Declarer le service worker dans `main.ts`

Exemple Angular standalone :

```ts
import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

bootstrapApplication(AppComponent, {
  providers: [
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
});
```

Important :

- ne pas garder en parallele un enregistrement manuel via `navigator.serviceWorker.register(...)`
- choisir une seule approche, ici celle d'Angular

#### 10. Configurer Vercel

Fichier :

- `vercel.json`

Contenu conseille :

```json
{
  "framework": null,
  "buildCommand": "npm run build",
  "outputDirectory": "dist/<nom-du-projet>/browser",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
```

Pourquoi :

- `handle: filesystem` laisse passer les fichiers statiques
- le fallback SPA n'intervient qu'apres
- c'est essentiel pour ne pas casser `manifest.webmanifest` et `ngsw-worker.js`

#### 11. Ajouter `_redirects` dans `public/`

Fichier :

- `public/_redirects`

Contenu :

```text
/* /index.html 200
```

#### 12. Builder le projet

Commande :

```bash
npm run build
```

Verifier ensuite dans le dossier `dist/.../browser` :

- `index.html`
- `manifest.webmanifest`
- `ngsw-worker.js`
- `icons/icon-192x192.png`
- `icons/icon-512x512.png`

#### 13. Deployer sur Vercel

Tu peux :

- pousser sur Git puis laisser Vercel deployer
- ou utiliser l'interface Vercel manuellement

#### 14. Tester la PWA apres deploiement

Ouvrir le site deploie puis faire :

1. `Ctrl + Shift + R`
2. ouvrir Chrome DevTools
3. aller dans `Application`

Verifier :

- `Manifest`
- `Service Workers`
- `Storage`

Tu dois voir :

- le manifest charge sans erreur
- le service worker enregistre
- les icones reconnues
- l'application considerée comme installable

#### 15. Si la PWA ne s'installe pas

Verifier en priorite :

1. `manifest.webmanifest` renvoie bien un vrai JSON
2. `ngsw-worker.js` renvoie bien un vrai fichier JS
3. les icones existent vraiment
4. `vercel.json` laisse passer les fichiers statiques
5. le site est bien en HTTPS
6. il n'y a pas de vieux cache navigateur

Tests utiles :

- ouvrir directement `https://mon-site/manifest.webmanifest`
- ouvrir directement `https://mon-site/ngsw-worker.js`
- ouvrir directement `https://mon-site/icons/icon-192x192.png`

Si l'un de ces liens renvoie `index.html`, la config de routes/rewrite est mauvaise.

### Points d'attention

- un service worker maison peut fonctionner localement mais etre insuffisant en production
- le manifest doit etre servi comme vrai fichier statique
- les icones doivent etre de vraies images PNG adaptees
- sur Vercel, il faut laisser passer les fichiers statiques avant le fallback SPA
- l'installation peut ne pas apparaitre instantanement si Chrome n'a pas encore considere le site comme installable

### Fichiers PWA de ce projet

Pour retrouver rapidement les fichiers concernes dans ce projet :

- [ngsw-config.json](./ngsw-config.json)
- [public/manifest.webmanifest](./public/manifest.webmanifest)
- [public/_redirects](./public/_redirects)
- [public/icons/icon-192x192.png](./public/icons/icon-192x192.png)
- [public/icons/icon-512x512.png](./public/icons/icon-512x512.png)
- [src/main.ts](./src/main.ts)
- [src/index.html](./src/index.html)
- [angular.json](./angular.json)
- [vercel.json](./vercel.json)

## Remarque importante

Le prix de la nappe est configuré à **5 €** d'après votre deuxième image.
Si vous souhaitez **6 €**, modifiez simplement le fichier :

`src/app/data/rental-catalog.data.ts`
