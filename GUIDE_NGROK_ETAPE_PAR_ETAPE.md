# 🔧 Guide Complet : Installer et Utiliser ngrok (Étape par Étape)

## ⚠️ Important

**ngrok n'est PAS une application avec interface graphique.** C'est un outil en ligne de commande qui s'utilise dans un terminal.

---

## 📥 Étape 1 : Télécharger ngrok

1. Allez sur : https://ngrok.com/download
2. Cliquez sur **"Download for Windows"**
3. Le fichier `ngrok.zip` sera téléchargé (généralement dans `C:\Users\VotreNom\Downloads\`)

---

## 📂 Étape 2 : Extraire ngrok

1. Allez dans le dossier **Téléchargements** (`C:\Users\VotreNom\Downloads\`)
2. **Clic droit** sur `ngrok.zip` → **Extraire tout...**
3. Choisissez un dossier d'extraction (ex: `C:\ngrok\`)
4. Cliquez sur **Extraire**

Vous devriez maintenant avoir `C:\ngrok\ngrok.exe`

---

## 🔑 Étape 3 : Créer un compte ngrok (Gratuit)

1. Allez sur : https://dashboard.ngrok.com/signup
2. Créez un compte (email + mot de passe)
3. Une fois connecté, allez dans **"Your Authtoken"** (dans le menu de gauche)
4. **Copiez votre authtoken** (une longue chaîne de caractères)

---

## ⚙️ Étape 4 : Configurer ngrok

### Option A : Depuis n'importe quel dossier (Recommandé)

1. Ouvrez **PowerShell** ou **Terminal**
2. Naviguez vers le dossier ngrok :
   ```powershell
   cd C:\ngrok
   ```
3. Configurez ngrok avec votre token :
   ```powershell
   .\ngrok config add-authtoken VOTRE_TOKEN_ICI
   ```
   ⚠️ Remplacez `VOTRE_TOKEN_ICI` par le token que vous avez copié

4. Vous devriez voir : `Authtoken saved to configuration file`

### Option B : Ajouter ngrok au PATH (Avancé)

Si vous voulez utiliser `ngrok` depuis n'importe quel dossier :

1. Appuyez sur `Windows + R`
2. Tapez : `sysdm.cpl` → **Entrée**
3. Onglet **"Avancé"** → **"Variables d'environnement"**
4. Dans **"Variables système"**, sélectionnez **"Path"** → **"Modifier"**
5. Cliquez sur **"Nouveau"**
6. Ajoutez : `C:\ngrok`
7. Cliquez sur **"OK"** partout
8. **Redémarrez** votre terminal

Maintenant vous pouvez utiliser `ngrok` depuis n'importe où !

---

## 🚀 Étape 5 : Utiliser ngrok

### 5.1 : Démarrer le serveur Next.js

1. Ouvrez un **premier terminal** dans `D:\App\Missions`
2. Exécutez :
   ```bash
   npm run dev
   ```
3. Attendez que le serveur démarre (vous devriez voir `Ready`)

### 5.2 : Créer le tunnel ngrok

1. Ouvrez un **deuxième terminal** (laissez le premier ouvert)
2. Si ngrok est dans `C:\ngrok\`, exécutez :
   ```powershell
   cd C:\ngrok
   .\ngrok http 3000
   ```
   
   OU si vous avez ajouté ngrok au PATH :
   ```powershell
   ngrok http 3000
   ```

3. Vous verrez quelque chose comme :
   ```
   Session Status                online
   Account                       VotreEmail (Plan: Free)
   Version                       3.x.x
   Region                        United States (us)
   Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000
   
   Connections                   ttl     opn     rt1     rt5     p50     p90
                                 0       0       0.00    0.00    0.00    0.00
   ```

4. **Copiez l'URL HTTPS** affichée (ex: `https://abc123.ngrok-free.app`)

### 5.3 : Accéder depuis votre iPhone

1. Ouvrez **Safari** sur votre iPhone
2. Dans la barre d'adresse, **collez l'URL ngrok** (ex: `https://abc123.ngrok-free.app`)
3. Appuyez sur **"Aller"**
4. ⚠️ **Première fois** : ngrok affichera une page d'avertissement. Cliquez sur **"Visit Site"**
5. L'application devrait se charger !

---

## 🎯 Interface Web ngrok (Bonus)

ngrok fournit aussi une interface web pour surveiller les requêtes :

1. Pendant que ngrok tourne, ouvrez votre navigateur
2. Allez sur : **http://localhost:4040**
3. Vous verrez toutes les requêtes en temps réel !

---

## ⚠️ Notes Importantes

1. **L'URL ngrok change à chaque redémarrage** : Si vous fermez ngrok et le relancez, vous aurez une nouvelle URL
2. **Gardez les deux terminaux ouverts** : Le terminal avec `npm run dev` ET le terminal avec `ngrok` doivent rester ouverts
3. **Plan gratuit** : Le plan gratuit de ngrok a des limitations (URL changeante, limite de connexions)
4. **Pour une URL fixe** : Il faut un plan payant ngrok

---

## 🐛 Problèmes Courants

### Problème : "ngrok : command not found"

**Solution** : Vous n'avez pas ajouté ngrok au PATH, ou vous n'êtes pas dans le bon dossier.
- Utilisez le chemin complet : `C:\ngrok\ngrok.exe http 3000`
- OU ajoutez ngrok au PATH (voir Étape 4, Option B)

### Problème : "authtoken is required"

**Solution** : Vous n'avez pas configuré votre token.
- Exécutez : `ngrok config add-authtoken VOTRE_TOKEN`

### Problème : "address already in use"

**Solution** : Le port 3000 est déjà utilisé.
- Vérifiez que le serveur Next.js tourne bien
- OU utilisez un autre port : `ngrok http 3001` (et changez le port Next.js)

### Problème : "ngrok free account limit"

**Solution** : Vous avez atteint la limite du plan gratuit.
- Attendez quelques minutes
- OU créez un nouveau compte ngrok
- OU passez à un plan payant

---

## ✅ Checklist

- [ ] ngrok téléchargé et extrait
- [ ] Compte ngrok créé
- [ ] Authtoken configuré
- [ ] Serveur Next.js démarré (`npm run dev`)
- [ ] Tunnel ngrok créé (`ngrok http 3000`)
- [ ] URL ngrok copiée
- [ ] Application accessible depuis iPhone

---

**C'est tout ! 🎉**

