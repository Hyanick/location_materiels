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

## Remarque importante

Le prix de la nappe est configuré à **5 €** d'après votre deuxième image.
Si vous souhaitez **6 €**, modifiez simplement le fichier :

`src/app/data/rental-catalog.data.ts`
