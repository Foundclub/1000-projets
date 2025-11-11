# 🚀 Guide Rapide : Utiliser ngrok pour Tester sur iPhone

## ✅ Étape 1 : Configurer ngrok (Une seule fois)

### 1.1 Créer un compte ngrok (Gratuit)

1. Allez sur : **https://dashboard.ngrok.com/signup**
2. Créez un compte avec votre email
3. Une fois connecté, allez dans **"Your Authtoken"** (menu de gauche)
4. **Copiez votre authtoken** (une longue chaîne de caractères)

### 1.2 Configurer ngrok avec votre token

Dans PowerShell ou Terminal, exécutez :
```powershell
ngrok config add-authtoken VOTRE_TOKEN_ICI
```

Remplacez `VOTRE_TOKEN_ICI` par le token que vous avez copié.

Vous devriez voir : `Authtoken saved to configuration file`

---

## 🚀 Étape 2 : Utiliser ngrok (À chaque test)

### 2.1 Démarrer le serveur Next.js

Dans un **premier terminal** :
```bash
cd D:\App\Missions
npm run dev
```

Attendez que le serveur démarre (vous devriez voir `Ready`)

### 2.2 Créer le tunnel ngrok

Dans un **deuxième terminal** (laissez le premier ouvert) :
```powershell
ngrok http 3000
```

Vous verrez quelque chose comme :
```
Session Status                online
Account                       VotreEmail (Plan: Free)
Version                       3.24.0
Region                        United States (us)
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### 2.3 Copier l'URL HTTPS

**Copiez l'URL HTTPS** affichée (ex: `https://abc123.ngrok-free.app`)

---

## 📱 Étape 3 : Accéder depuis votre iPhone

1. Ouvrez **Safari** sur votre iPhone
2. Dans la barre d'adresse, **collez l'URL ngrok** (ex: `https://abc123.ngrok-free.app`)
3. Appuyez sur **"Aller"**
4. ⚠️ **Première fois** : ngrok affichera une page d'avertissement. Cliquez sur **"Visit Site"**
5. L'application devrait se charger !

---

## 🎯 Interface Web ngrok (Bonus)

Pendant que ngrok tourne, vous pouvez surveiller les requêtes :

1. Ouvrez votre navigateur
2. Allez sur : **http://localhost:4040**
3. Vous verrez toutes les requêtes en temps réel !

---

## ⚠️ Notes Importantes

- **Gardez les deux terminaux ouverts** : Le terminal avec `npm run dev` ET le terminal avec `ngrok` doivent rester ouverts
- **L'URL ngrok change à chaque redémarrage** : Si vous fermez ngrok et le relancez, vous aurez une nouvelle URL
- **Plan gratuit** : Le plan gratuit de ngrok a des limitations (URL changeante, limite de connexions)

---

## 🐛 Problèmes Courants

### "authtoken is required"
→ Vous n'avez pas configuré votre token. Exécutez : `ngrok config add-authtoken VOTRE_TOKEN`

### "address already in use"
→ Le port 3000 est déjà utilisé. Vérifiez que le serveur Next.js tourne bien.

### "ngrok free account limit"
→ Vous avez atteint la limite du plan gratuit. Attendez quelques minutes ou créez un nouveau compte.

---

**C'est tout ! 🎉**

