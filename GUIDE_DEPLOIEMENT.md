# 🚀 Guide de Déploiement - 1000 Projets

Ce guide vous explique comment publier votre application en production.

## 📋 Prérequis

- ✅ Compte GitHub (pour le déploiement)
- ✅ Compte Supabase (déjà configuré)
- ✅ Variables d'environnement prêtes

---

## 🎯 Option 1 : Vercel (Recommandé pour Next.js)

Vercel est la plateforme créée par l'équipe Next.js. C'est la solution la plus simple et optimisée.

### Étape 1 : Préparer le code

1. **Vérifier que tout fonctionne localement** :
   ```bash
   npm run build
   ```

2. **Créer un dépôt GitHub** (si ce n'est pas déjà fait) :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
   git push -u origin main
   ```

### Étape 2 : Créer un compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Sign Up"**
3. Connectez-vous avec votre compte **GitHub**

### Étape 3 : Importer le projet

1. Dans le dashboard Vercel, cliquez sur **"Add New..."** → **"Project"**
2. Sélectionnez votre dépôt GitHub
3. Vercel détectera automatiquement Next.js

### Étape 4 : Configurer les variables d'environnement

Dans la page de configuration du projet, ajoutez ces variables :

```env
NEXT_PUBLIC_SUPABASE_URL=https://igoryzxejxbvsuuuglyx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-supabase
DATABASE_URL=votre-connection-string-postgres
NEXT_PUBLIC_BASE_URL=https://votre-app.vercel.app
```

**Important** :
- Remplacez `votre-clé-anon-supabase` par votre vraie clé Supabase
- Remplacez `votre-connection-string-postgres` par votre connection string PostgreSQL
- `NEXT_PUBLIC_BASE_URL` sera automatiquement mis à jour par Vercel (vous pouvez le laisser vide pour l'instant)

### Étape 5 : Configurer le build

Dans les **"Build Settings"**, vérifiez que :
- **Framework Preset** : `Next.js`
- **Build Command** : `npm run build` (ou laissez vide, Vercel le détecte)
- **Output Directory** : `.next` (par défaut)
- **Install Command** : `npm install` (par défaut)

### Étape 6 : Configurer Prisma

Vercel doit générer le client Prisma lors du build. Ajoutez cette commande dans **"Build Command"** :

```bash
npm run postinstall && npm run build
```

Ou créez un fichier `vercel.json` à la racine :

```json
{
  "buildCommand": "npm run postinstall && npm run build",
  "installCommand": "npm install"
}
```

### Étape 7 : Déployer

1. Cliquez sur **"Deploy"**
2. Attendez la fin du build (2-5 minutes)
3. Votre application sera disponible à `https://votre-app.vercel.app`

### Étape 8 : Configurer le domaine personnalisé (Optionnel)

1. Dans les **"Settings"** du projet → **"Domains"**
2. Ajoutez votre domaine (ex: `app.1000projets.com`)
3. Suivez les instructions pour configurer les DNS

---

## 🚂 Option 2 : Railway

Railway est excellent pour les applications avec base de données.

### Étape 1 : Créer un compte

1. Allez sur [railway.app](https://railway.app)
2. Créez un compte avec GitHub

### Étape 2 : Créer un nouveau projet

1. Cliquez sur **"New Project"**
2. Sélectionnez **"Deploy from GitHub repo"**
3. Choisissez votre dépôt

### Étape 3 : Configurer les variables d'environnement

Dans **"Variables"**, ajoutez :

```env
NEXT_PUBLIC_SUPABASE_URL=https://igoryzxejxbvsuuuglyx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-supabase
DATABASE_URL=votre-connection-string-postgres
NEXT_PUBLIC_BASE_URL=https://votre-app.railway.app
NODE_ENV=production
```

### Étape 4 : Configurer le build

Railway détecte automatiquement Next.js. Si besoin, créez un fichier `railway.json` :

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run postinstall && npm run build"
  }
}
```

### Étape 5 : Déployer

Railway déploie automatiquement à chaque push sur `main`.

---

## 🌐 Option 3 : Netlify

Alternative à Vercel, également très simple.

### Étape 1 : Créer un compte

1. Allez sur [netlify.com](https://netlify.com)
2. Créez un compte avec GitHub

### Étape 2 : Importer le projet

1. Cliquez sur **"Add new site"** → **"Import an existing project"**
2. Connectez votre dépôt GitHub

### Étape 3 : Configurer le build

Dans les **"Build settings"** :

- **Build command** : `npm run build`
- **Publish directory** : `.next`

**Important** : Netlify nécessite un fichier `netlify.toml` à la racine :

```toml
[build]
  command = "npm run postinstall && npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Étape 4 : Variables d'environnement

Dans **"Site settings"** → **"Environment variables"**, ajoutez les mêmes variables que pour Vercel.

---

## 🔧 Configuration Supabase pour la Production

### 1. Mettre à jour les URLs de redirection

Dans votre projet Supabase :

1. Allez dans **Authentication** → **URL Configuration**
2. Ajoutez votre URL de production dans **"Redirect URLs"** :
   ```
   https://votre-app.vercel.app/**
   https://votre-app.vercel.app/auth/callback
   ```

### 2. Vérifier les policies RLS

Assurez-vous que toutes les policies RLS sont correctement configurées pour la production.

### 3. Vérifier les buckets Storage

Vérifiez que tous les buckets (`avatars`, `missions`, `proofs`, etc.) sont accessibles publiquement si nécessaire.

---

## 📝 Checklist de Déploiement

Avant de déployer, vérifiez :

- [ ] `npm run build` fonctionne sans erreur
- [ ] Toutes les variables d'environnement sont configurées
- [ ] Les URLs de redirection Supabase sont mises à jour
- [ ] Le domaine personnalisé est configuré (si applicable)
- [ ] Les migrations Prisma sont appliquées
- [ ] Les buckets Supabase Storage sont accessibles
- [ ] Le PWA manifest est correct (`public/manifest.json`)
- [ ] Les images sont accessibles (vérifier les `remotePatterns` dans `next.config.mjs`)

---

## 🐛 Résolution de Problèmes

### Erreur : "Module not found: Can't resolve '@prisma/client'"

**Solution** : Ajoutez `npm run postinstall` dans la commande de build.

### Erreur : "Invalid DATABASE_URL"

**Solution** : Vérifiez que la connection string PostgreSQL est correcte et accessible depuis Internet.

### Erreur : "Failed to fetch" (CORS)

**Solution** : Vérifiez que `NEXT_PUBLIC_BASE_URL` est correctement configuré.

### Erreur : "PWA not working"

**Solution** : Vérifiez que `next-pwa` est correctement configuré et que `NODE_ENV=production`.

---

## 🎉 Après le Déploiement

1. **Tester l'application** : Visitez votre URL de production
2. **Tester l'authentification** : Créez un compte et connectez-vous
3. **Tester les fonctionnalités principales** : Missions, soumissions, chat, etc.
4. **Configurer le monitoring** : Ajoutez des outils comme Sentry (optionnel)
5. **Configurer les backups** : Assurez-vous que Supabase fait des backups automatiques

---

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Railway](https://docs.railway.app)
- [Documentation Netlify](https://docs.netlify.com)
- [Documentation Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Date de création** : 2024-11-08  
**Version** : 1.0


