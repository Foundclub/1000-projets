# 📦 Guide Complet - Dépot sur GitHub

Guide étape par étape pour déposer votre code sur GitHub.

## 🚀 Résumé Rapide

Si vous voulez juste les commandes essentielles :

```powershell
# 1. Vérifier Git
git --version

# 2. Aller dans le projet
cd D:\App\Missions

# 3. Initialiser Git (si pas déjà fait)
git init

# 4. Configurer Git (première fois)
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@exemple.com"

# 5. Ajouter les fichiers
git add .

# 6. Créer le premier commit
git commit -m "Initial commit - 1000 Projets"

# 7. Créer un dépôt sur GitHub (via le site web)
# Puis connecter :
git remote add origin https://github.com/VOTRE_USERNAME/NOM_DU_DEPOT.git

# 8. Pousser le code
git push -u origin main
```

**⚠️ Mais lisez le guide complet ci-dessous pour les détails et les explications !**

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :
- ✅ Un compte GitHub (si vous n'en avez pas, créez-en un sur [github.com](https://github.com))
- ✅ Git installé sur votre ordinateur
- ✅ Votre code prêt à être déposé

---

## 🔍 Étape 1 : Vérifier si Git est installé

### 1.1 Ouvrir le terminal

1. Appuyez sur `Windows + R`
2. Tapez `powershell` et appuyez sur `Entrée`
3. Ou ouvrez PowerShell directement depuis le menu Démarrer

### 1.2 Vérifier l'installation de Git

Dans le terminal PowerShell, tapez :

```powershell
git --version
```

**Résultat attendu** : Vous devriez voir quelque chose comme `git version 2.xx.x`

**Si Git n'est pas installé** :

⚠️ **IMPORTANT** : Si vous voyez une erreur comme "git n'est pas reconnu", Git n'est pas installé.

**Installation de Git (Windows)** :

1. **Télécharger Git** :
   - Allez sur [git-scm.com/download/win](https://git-scm.com/download/win)
   - Cliquez sur "Download for Windows"
   - Le téléchargement devrait commencer automatiquement

2. **Installer Git** :
   - Double-cliquez sur le fichier téléchargé (ex: `Git-2.xx.x-64-bit.exe`)
   - Cliquez sur "Next" pour chaque étape
   - **Options importantes** :
     - ✅ Laissez "Git from the command line and also from 3rd-party software" coché
     - ✅ Laissez "Use bundled OpenSSH" coché
     - ✅ Laissez "Use the OpenSSL library" coché
     - ✅ Laissez "Checkout Windows-style, commit Unix-style line endings" coché
   - Cliquez sur "Install"
   - Attendez la fin de l'installation
   - Cliquez sur "Finish"

3. **Redémarrer PowerShell** :
   - Fermez complètement PowerShell
   - Rouvrez PowerShell
   - Vérifiez à nouveau avec `git --version`

---

## 📂 Étape 2 : Naviguer vers votre projet

### 2.1 Vérifier votre emplacement actuel

Dans PowerShell, tapez :

```powershell
pwd
```

Cela affiche votre répertoire actuel.

### 2.2 Aller dans le dossier de votre projet

Si vous n'êtes pas déjà dans le dossier `D:\App\Missions`, tapez :

```powershell
cd D:\App\Missions
```

**Vérification** : Vérifiez que vous êtes au bon endroit :

```powershell
ls
```

Vous devriez voir des fichiers comme `package.json`, `next.config.mjs`, `src`, etc.

---

## 🔧 Étape 3 : Initialiser Git (si ce n'est pas déjà fait)

### 3.1 Vérifier si Git est déjà initialisé

Tapez :

```powershell
git status
```

**Si vous voyez** : `fatal: not a git repository`
→ Passez à l'étape 3.2

**Si vous voyez** : Des informations sur les fichiers
→ Git est déjà initialisé, passez à l'étape 4

### 3.2 Initialiser Git

Si Git n'est pas initialisé, tapez :

```powershell
git init
```

**Résultat attendu** : `Initialized empty Git repository in D:/App/Missions/.git/`

---

## 📝 Étape 4 : Configurer Git (première fois uniquement)

### 4.1 Configurer votre nom

```powershell
git config --global user.name "Votre Nom"
```

**Exemple** :
```powershell
git config --global user.name "Jean Dupont"
```

### 4.2 Configurer votre email

```powershell
git config --global user.email "votre.email@exemple.com"
```

**Exemple** :
```powershell
git config --global user.email "jean.dupont@exemple.com"
```

**Important** : Utilisez l'email associé à votre compte GitHub !

### 4.3 Vérifier la configuration

```powershell
git config --global --list
```

Vous devriez voir votre nom et votre email.

---

## 📋 Étape 5 : Vérifier le fichier .gitignore

### 5.1 Vérifier que .gitignore existe

```powershell
ls .gitignore
```

### 5.2 Vérifier le contenu de .gitignore

Le fichier `.gitignore` doit contenir au minimum :

```
node_modules/
.next/
.env
.env.local
.env*.local
dist/
build/
*.log
.DS_Store
```

**Si le fichier n'existe pas ou est incomplet**, créez-le avec les lignes ci-dessus.

---

## ➕ Étape 6 : Ajouter les fichiers au dépôt

### 6.1 Vérifier l'état actuel

```powershell
git status
```

Cela affiche tous les fichiers qui ne sont pas encore suivis par Git.

### 6.2 Ajouter tous les fichiers

```powershell
git add .
```

**Explication** : Le point `.` signifie "tous les fichiers du dossier actuel"

### 6.3 Vérifier que les fichiers sont ajoutés

```powershell
git status
```

Vous devriez voir tous vos fichiers en vert avec "Changes to be committed".

---

## 💾 Étape 7 : Créer le premier commit

### 7.1 Créer le commit

```powershell
git commit -m "Initial commit - 1000 Projets"
```

**Explication** :
- `commit` : Enregistre les changements
- `-m` : Message du commit
- Le message entre guillemets décrit ce que vous enregistrez

**Résultat attendu** : Vous devriez voir quelque chose comme :
```
[main (root-commit) abc1234] Initial commit - 1000 Projets
 X files changed, Y insertions(+)
```

### 7.2 Vérifier le commit

```powershell
git log
```

Vous devriez voir votre commit avec son message.

---

## 🌐 Étape 8 : Créer un dépôt sur GitHub

### 8.1 Se connecter à GitHub

1. Allez sur [github.com](https://github.com)
2. Connectez-vous avec votre compte

### 8.2 Créer un nouveau dépôt

1. Cliquez sur le **"+"** en haut à droite
2. Sélectionnez **"New repository"**

### 8.3 Configurer le dépôt

Remplissez le formulaire :

- **Repository name** : `1000-projets` (ou le nom que vous voulez)
- **Description** (optionnel) : `Missions PRO & SOLIDAIRE - Next.js 15, Supabase, Prisma`
- **Visibility** :
  - ✅ **Public** : Tout le monde peut voir votre code
  - ✅ **Private** : Seulement vous et les personnes que vous invitez
- **NE COCHEZ PAS** :
  - ❌ "Add a README file" (vous en avez déjà un)
  - ❌ "Add .gitignore" (vous en avez déjà un)
  - ❌ "Choose a license" (optionnel, vous pouvez le faire plus tard)

### 8.4 Cliquer sur "Create repository"

GitHub va vous afficher une page avec des instructions. **NE SUIVEZ PAS CES INSTRUCTIONS** pour l'instant, nous allons utiliser les commandes ci-dessous.

### 8.5 Copier l'URL du dépôt

Sur la page GitHub, vous verrez une URL comme :
```
https://github.com/VOTRE_USERNAME/1000-projets.git
```

**Copiez cette URL**, vous en aurez besoin à l'étape suivante.

---

## 🔗 Étape 9 : Connecter votre dépôt local à GitHub

### 9.1 Ajouter le dépôt distant

Remplacez `VOTRE_USERNAME` et `NOM_DU_DEPOT` par vos valeurs :

```powershell
git remote add origin https://github.com/VOTRE_USERNAME/NOM_DU_DEPOT.git
```

**Exemple** :
```powershell
git remote add origin https://github.com/jeandupont/1000-projets.git
```

### 9.2 Vérifier que le dépôt distant est bien ajouté

```powershell
git remote -v
```

Vous devriez voir :
```
origin  https://github.com/VOTRE_USERNAME/NOM_DU_DEPOT.git (fetch)
origin  https://github.com/VOTRE_USERNAME/NOM_DU_DEPOT.git (push)
```

---

## 🚀 Étape 10 : Pousser le code sur GitHub

### 10.1 Vérifier le nom de la branche

```powershell
git branch
```

Vous devriez voir `* main` ou `* master`.

**Si vous voyez `master`** et que GitHub utilise `main`, renommez votre branche :

```powershell
git branch -M main
```

### 10.2 Pousser le code

```powershell
git push -u origin main
```

**Explication** :
- `push` : Envoie vos commits sur GitHub
- `-u origin main` : Configure la branche principale et la lie au dépôt distant
- `origin` : Nom du dépôt distant (GitHub)
- `main` : Nom de votre branche

### 10.3 Authentification

GitHub va vous demander de vous authentifier. Vous avez deux options :

#### Option A : Token d'accès personnel (Recommandé)

1. **Créer un token** :
   - Allez sur GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Cliquez sur "Generate new token (classic)"
   - Donnez-lui un nom (ex: "1000-projets")
   - Cochez la case `repo` (accès complet aux dépôts)
   - Cliquez sur "Generate token"
   - **COPIEZ LE TOKEN** (vous ne pourrez plus le voir après !)

2. **Utiliser le token** :
   - Quand Git vous demande votre nom d'utilisateur, entrez votre **username GitHub**
   - Quand Git vous demande votre mot de passe, entrez le **token** (pas votre mot de passe GitHub)

#### Option B : GitHub CLI (Plus simple mais nécessite une installation)

```powershell
# Installer GitHub CLI (si pas déjà installé)
winget install --id GitHub.cli

# Se connecter
gh auth login

# Puis refaire le push
git push -u origin main
```

### 10.4 Vérifier que le push a réussi

Si tout s'est bien passé, vous devriez voir :
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
Writing objects: 100% (X/X), done.
To https://github.com/VOTRE_USERNAME/NOM_DU_DEPOT.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## ✅ Étape 11 : Vérifier sur GitHub

### 11.1 Rafraîchir la page GitHub

Retournez sur la page de votre dépôt GitHub et **rafraîchissez** (F5).

### 11.2 Vérifier que vos fichiers sont là

Vous devriez voir tous vos fichiers :
- `package.json`
- `next.config.mjs`
- `src/`
- `prisma/`
- etc.

---

## 🔄 Étape 12 : Commandes pour les mises à jour futures

Une fois le dépôt créé, voici les commandes à utiliser pour mettre à jour votre code :

### 12.1 Vérifier les changements

```powershell
git status
```

### 12.2 Ajouter les fichiers modifiés

```powershell
git add .
```

Ou pour ajouter un fichier spécifique :

```powershell
git add nom-du-fichier.ts
```

### 12.3 Créer un commit

```powershell
git commit -m "Description de vos changements"
```

**Exemples de messages** :
- `git commit -m "Ajout de la fonctionnalité de recherche"`
- `git commit -m "Correction du bug d'authentification"`
- `git commit -m "Mise à jour des dépendances"`

### 12.4 Pousser sur GitHub

```powershell
git push
```

---

## 🆘 Problèmes Courants et Solutions

### Problème 1 : "fatal: not a git repository"

**Solution** : Vous n'êtes pas dans le bon dossier. Utilisez `cd D:\App\Missions`

### Problème 2 : "fatal: remote origin already exists"

**Solution** : Le dépôt distant existe déjà. Vérifiez avec `git remote -v` ou supprimez-le avec :
```powershell
git remote remove origin
```
Puis refaites l'étape 9.

### Problème 3 : "error: failed to push some refs"

**Solution** : Quelqu'un a peut-être poussé du code avant vous. Récupérez d'abord :
```powershell
git pull origin main --allow-unrelated-histories
```
Puis refaites le push.

### Problème 4 : "Authentication failed"

**Solution** : 
- Vérifiez que vous utilisez un token d'accès personnel (pas votre mot de passe)
- Vérifiez que le token a les permissions `repo`
- Créez un nouveau token si nécessaire

### Problème 5 : "Permission denied"

**Solution** : 
- Vérifiez que vous êtes bien connecté à GitHub
- Vérifiez que vous avez les droits sur le dépôt
- Vérifiez l'URL du dépôt distant avec `git remote -v`

---

## 📚 Commandes Git Utiles

### Voir l'historique des commits

```powershell
git log
```

### Voir les différences avant de committer

```powershell
git diff
```

### Annuler des changements non commités

```powershell
git restore nom-du-fichier.ts
```

### Voir les branches

```powershell
git branch
```

### Créer une nouvelle branche

```powershell
git branch nom-de-la-branche
```

### Changer de branche

```powershell
git checkout nom-de-la-branche
```

---

## 🎉 Félicitations !

Votre code est maintenant sur GitHub ! 🚀

Vous pouvez maintenant :
- Partager votre code avec d'autres développeurs
- Utiliser GitHub pour le déploiement (Vercel, etc.)
- Collaborer sur le projet
- Suivre l'historique de vos changements

---

## 📞 Besoin d'aide ?

Si vous rencontrez un problème, vérifiez :
1. Que vous êtes dans le bon dossier (`D:\App\Missions`)
2. Que Git est bien installé (`git --version`)
3. Que vous êtes connecté à GitHub
4. Que l'URL du dépôt distant est correcte (`git remote -v`)

