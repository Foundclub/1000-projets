# 🚀 Guide de Déploiement Étape par Étape - 1000 Projets

**Date** : 2025-01-27  
**Statut** : ✅ Code prêt, build testé localement

---

## 📊 Où vous en êtes

### ✅ Ce qui est fait

1. **Code complet** : 273 fichiers, 48 092 lignes
2. **GitHub** : Code déposé sur [https://github.com/Foundclub/1000-projets](https://github.com/Foundclub/1000-projets)
3. **Build testé** : `npm run build` fonctionne sans erreur
4. **Configuration** : `vercel.json` prêt

### 🎯 Prochaines étapes

1. Créer un compte Vercel
2. Connecter GitHub à Vercel
3. Configurer les variables d'environnement
4. Déployer l'application
5. Configurer Supabase pour la production

---

## 🚀 Étape 1 : Créer un compte Vercel

### 1.1 Aller sur Vercel

1. Ouvrez votre navigateur
2. Allez sur [vercel.com](https://vercel.com)
3. Cliquez sur **"Sign Up"** (en haut à droite)

### 1.2 Se connecter avec GitHub

1. Cliquez sur **"Continue with GitHub"**
2. Autorisez Vercel à accéder à votre compte GitHub
3. Acceptez les permissions demandées

**✅ Résultat attendu** : Vous êtes connecté à Vercel avec votre compte GitHub

---

## 🔗 Étape 2 : Importer votre projet GitHub

### 2.1 Ajouter un nouveau projet

1. Dans le dashboard Vercel, cliquez sur **"Add New..."** (en haut à droite)
2. Sélectionnez **"Project"**

### 2.2 Sélectionner votre dépôt

1. Vous verrez la liste de vos dépôts GitHub
2. Trouvez **"1000-projets"** (ou **"Foundclub/1000-projets"**)
3. Cliquez sur **"Import"**

### 2.3 Configuration automatique

Vercel devrait détecter automatiquement :
- ✅ **Framework** : Next.js
- ✅ **Root Directory** : `./` (racine)
- ✅ **Build Command** : `npm run build`
- ✅ **Output Directory** : `.next` (par défaut)

**⚠️ Ne cliquez pas encore sur "Deploy" !** On doit d'abord configurer les variables d'environnement.

---

## 🔐 Étape 3 : Configurer les variables d'environnement

### 3.1 Accéder aux variables d'environnement

Dans la page de configuration du projet, trouvez la section **"Environment Variables"** (Variables d'environnement).

### 3.2 Ajouter les variables

Cliquez sur **"Add"** pour chaque variable suivante :

#### Variable 1 : `NEXT_PUBLIC_SUPABASE_URL`
- **Key** : `NEXT_PUBLIC_SUPABASE_URL`
- **Value** : `https://igoryzxejxbvsuuuglyx.supabase.co`
- **Environments** : ✅ Production, ✅ Preview, ✅ Development

#### Variable 2 : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Key** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value** : Votre clé anonyme Supabase (trouvez-la dans votre projet Supabase → Settings → API → anon/public key)
- **Environments** : ✅ Production, ✅ Preview, ✅ Development

**💡 Comment trouver la clé Supabase** :
1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous
3. Sélectionnez votre projet
4. Allez dans **Settings** → **API**
5. Copiez la clé **"anon"** ou **"public"**

#### Variable 3 : `DATABASE_URL`
- **Key** : `DATABASE_URL`
- **Value** : Votre connection string PostgreSQL (trouvez-la dans Supabase → Settings → Database → Connection string → URI)
- **Environments** : ✅ Production, ✅ Preview, ✅ Development

**💡 Comment trouver la connection string** :
1. Dans Supabase, allez dans **Settings** → **Database**
2. Trouvez **"Connection string"**
3. Sélectionnez **"URI"**
4. Copiez la chaîne (elle ressemble à : `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)

**⚠️ Important** : Remplacez `[YOUR-PASSWORD]` par votre mot de passe de base de données Supabase.

#### Variable 4 : `NEXT_PUBLIC_BASE_URL` (Optionnel)
- **Key** : `NEXT_PUBLIC_BASE_URL`
- **Value** : Laissez vide pour l'instant (Vercel le remplira automatiquement après le premier déploiement)
- **Environments** : ✅ Production, ✅ Preview, ✅ Development

### 3.3 Vérifier les variables

Vous devriez avoir au minimum 3 variables :
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `DATABASE_URL`

---

## ⚙️ Étape 4 : Configurer le build pour Prisma

### 4.1 Vérifier la commande de build

Dans la section **"Build and Output Settings"**, vérifiez que :

- **Build Command** : `npm run postinstall && npm run build`
  - Si ce n'est pas le cas, modifiez-le manuellement

**Explication** : `npm run postinstall` génère le client Prisma avant le build.

### 4.2 Vérifier le fichier vercel.json

Le fichier `vercel.json` à la racine devrait contenir :

```json
{
  "buildCommand": "npm run postinstall && npm run build"
}
```

**✅ C'est déjà fait** : Le fichier existe dans votre dépôt.

---

## 🚀 Étape 5 : Déployer l'application

### 5.1 Lancer le déploiement

1. Vérifiez que toutes les variables d'environnement sont ajoutées
2. Cliquez sur **"Deploy"** (en bas de la page)

### 5.2 Attendre le build

- Le build prend généralement **2-5 minutes**
- Vous verrez les logs en temps réel
- Ne fermez pas la page pendant le build

### 5.3 Résultat attendu

Si tout se passe bien, vous verrez :
- ✅ **"Building"** → **"Deploying"** → **"Ready"**
- Une URL de production : `https://1000-projets-xxxxx.vercel.app`

**🎉 Félicitations !** Votre application est en ligne !

---

## 🔧 Étape 6 : Configurer Supabase pour la production

### 6.1 Mettre à jour les URLs de redirection

1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** → **URL Configuration**
4. Dans **"Redirect URLs"**, ajoutez :
   ```
   https://votre-app.vercel.app/**
   https://votre-app.vercel.app/auth/callback
   ```
   (Remplacez `votre-app.vercel.app` par votre vraie URL Vercel)

5. Cliquez sur **"Save"**

### 6.2 Vérifier les buckets Storage

1. Dans Supabase, allez dans **Storage**
2. Vérifiez que les buckets suivants existent et sont accessibles :
   - ✅ `avatars` (public)
   - ✅ `missions` (public)
   - ✅ `proofs` (public)
   - ✅ `feed-posts` (public)
   - ✅ `rewards` (public)

### 6.3 Vérifier les policies RLS

Assurez-vous que les Row Level Security (RLS) policies sont correctement configurées pour la production.

---

## ✅ Étape 7 : Tester l'application en production

### 7.1 Tester l'authentification

1. Visitez votre URL Vercel
2. Cliquez sur **"S'inscrire"** ou **"Se connecter"**
3. Testez la création d'un compte
4. Testez la connexion

### 7.2 Tester les fonctionnalités principales

- ✅ Créer une mission (si vous êtes annonceur)
- ✅ Postuler à une mission (si vous êtes missionnaire)
- ✅ Soumettre une preuve
- ✅ Utiliser le chat
- ✅ Publier dans le feed

### 7.3 Vérifier les erreurs

1. Ouvrez la console du navigateur (F12)
2. Vérifiez qu'il n'y a pas d'erreurs critiques
3. Vérifiez les logs Vercel dans le dashboard

---

## 🔄 Mises à jour futures

### Comment mettre à jour l'application

1. **Modifier le code localement**
2. **Tester localement** : `npm run dev`
3. **Créer un commit** :
   ```powershell
   git add .
   git commit -m "Description des changements"
   git push
   ```
4. **Vercel déploie automatiquement** : Chaque push sur `main` déclenche un nouveau déploiement

### Voir les déploiements

- Dans le dashboard Vercel, allez dans votre projet
- Onglet **"Deployments"** : Vous verrez tous les déploiements
- Cliquez sur un déploiement pour voir les logs

---

## 🐛 Résolution de problèmes

### Erreur : "Module not found: Can't resolve '@prisma/client'"

**Solution** : Vérifiez que la commande de build contient `npm run postinstall` :
```
npm run postinstall && npm run build
```

### Erreur : "Invalid DATABASE_URL"

**Solution** :
1. Vérifiez que la connection string est correcte
2. Vérifiez que le mot de passe est bien remplacé dans l'URL
3. Vérifiez que la base de données est accessible depuis Internet

### Erreur : "Failed to fetch" (CORS)

**Solution** :
1. Vérifiez que `NEXT_PUBLIC_SUPABASE_URL` est correct
2. Vérifiez que les URLs de redirection Supabase sont bien configurées

### Erreur : "Authentication failed"

**Solution** :
1. Vérifiez que `NEXT_PUBLIC_SUPABASE_ANON_KEY` est correct
2. Vérifiez que les URLs de redirection sont bien configurées dans Supabase

### Erreur : "Build failed"

**Solution** :
1. Cliquez sur le déploiement dans Vercel
2. Regardez les logs pour identifier l'erreur
3. Corrigez l'erreur localement
4. Testez avec `npm run build`
5. Poussez les corrections sur GitHub

---

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Next.js Deployment](https://nextjs.org/docs/deployment)
- [Documentation Supabase](https://supabase.com/docs)

---

## 🎉 Félicitations !

Votre application **1000 Projets** est maintenant en ligne et accessible au monde entier !

**URL de production** : `https://votre-app.vercel.app`

---

**Besoin d'aide ?** Consultez les logs Vercel ou les guides de déploiement dans votre dépôt.

