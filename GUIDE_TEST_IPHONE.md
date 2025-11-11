# 📱 Guide pour Tester l'Application sur iPhone

## ✅ Prérequis

- ✅ Votre ordinateur et votre iPhone sont sur le **même réseau WiFi**
- ✅ Le serveur de développement est configuré pour écouter sur toutes les interfaces (`0.0.0.0`)
- ✅ Votre adresse IP locale : **192.168.1.200**

---

## 🚀 Méthode 1 : Test en Local (Recommandée)

### Étape 1 : Démarrer le serveur de développement

1. Ouvrez un terminal dans le dossier du projet (`D:\App\Missions`)
2. Exécutez la commande :
   ```bash
   npm run dev
   ```
3. Attendez que le serveur démarre. Vous devriez voir :
   ```
   ▲ Next.js 15.x.x
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.200:3000
   ```

### Étape 2 : Vérifier le pare-feu Windows

1. Ouvrez **Paramètres Windows** → **Sécurité Windows** → **Pare-feu Windows Defender**
2. Cliquez sur **Paramètres avancés**
3. Cliquez sur **Règles de trafic entrant** → **Nouvelle règle...**
4. Sélectionnez **Port** → **Suivant**
5. Sélectionnez **TCP** et entrez **3000** dans "Ports locaux spécifiques" → **Suivant**
6. Sélectionnez **Autoriser la connexion** → **Suivant**
7. Cochez **Domaine**, **Privé**, et **Public** → **Suivant**
8. Nommez la règle : "Next.js Dev Server" → **Terminer**

### Étape 3 : Trouver l'adresse IP de votre ordinateur

Si l'adresse IP a changé, trouvez-la avec :
```bash
ipconfig | findstr /i "IPv4"
```

Notez l'adresse IP affichée (exemple : `192.168.1.200`)

### Étape 4 : Accéder depuis votre iPhone

1. **Assurez-vous que votre iPhone est sur le même WiFi** que votre ordinateur
2. Ouvrez **Safari** sur votre iPhone
3. Dans la barre d'adresse, tapez :
   ```
   http://192.168.1.200:3000
   ```
   ⚠️ **Important** : Remplacez `192.168.1.200` par votre adresse IP si elle est différente

4. Appuyez sur **Aller**
5. L'application devrait se charger !

### Étape 5 : Tester les fonctionnalités

- ✅ Navigation entre les pages
- ✅ Responsivité (rotation, zoom)
- ✅ Boutons et interactions
- ✅ Formulaires
- ✅ Authentification (si configurée)

---

## 🔧 Méthode 2 : Utiliser ngrok (Alternative)

Si la méthode 1 ne fonctionne pas, utilisez ngrok pour créer un tunnel public.

### Étape 1 : Installer ngrok

1. Allez sur https://ngrok.com/download
2. Téléchargez ngrok pour Windows
3. Extrayez `ngrok.exe` dans un dossier (ex: `C:\ngrok\`)
4. Ajoutez le dossier au PATH Windows ou utilisez le chemin complet

### Étape 2 : Créer un compte ngrok (gratuit)

1. Créez un compte sur https://dashboard.ngrok.com/signup
2. Récupérez votre **authtoken** depuis le dashboard
3. Configurez ngrok :
   ```bash
   ngrok config add-authtoken VOTRE_TOKEN_ICI
   ```

### Étape 3 : Démarrer le serveur Next.js

Dans un terminal :
```bash
npm run dev
```

### Étape 4 : Créer le tunnel ngrok

Dans un **nouveau terminal** :
```bash
ngrok http 3000
```

Vous verrez quelque chose comme :
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

### Étape 5 : Accéder depuis votre iPhone

1. Copiez l'URL **https** affichée par ngrok (ex: `https://abc123.ngrok-free.app`)
2. Ouvrez **Safari** sur votre iPhone
3. Collez l'URL dans la barre d'adresse
4. Appuyez sur **Aller**
5. L'application devrait se charger !

⚠️ **Note** : L'URL ngrok change à chaque redémarrage. Vous devrez la recopier.

---

## 🌐 Méthode 3 : Déployer sur Vercel (Permanent)

Pour un accès permanent et public, déployez sur Vercel.

### Étape 1 : Installer Vercel CLI

```bash
npm install -g vercel
```

### Étape 2 : Se connecter à Vercel

```bash
vercel login
```

### Étape 3 : Déployer

```bash
vercel
```

Suivez les instructions. Vercel vous donnera une URL publique comme :
```
https://votre-app.vercel.app
```

### Étape 4 : Accéder depuis votre iPhone

1. Ouvrez **Safari** sur votre iPhone
2. Tapez l'URL Vercel dans la barre d'adresse
3. L'application sera accessible depuis n'importe où !

---

## 🐛 Résolution de Problèmes

### Problème : "Impossible de se connecter au serveur"

**Solutions :**
1. Vérifiez que le serveur tourne (`npm run dev`)
2. Vérifiez que l'adresse IP est correcte (`ipconfig`)
3. Vérifiez que le pare-feu autorise le port 3000
4. Vérifiez que l'iPhone et l'ordinateur sont sur le même WiFi

### Problème : "La page ne se charge pas"

**Solutions :**
1. Vérifiez que le serveur affiche "Ready" dans le terminal
2. Essayez d'accéder depuis un navigateur sur l'ordinateur : `http://192.168.1.200:3000`
3. Vérifiez les erreurs dans le terminal du serveur

### Problème : "Erreur de connexion à Supabase"

**Solutions :**
1. Vérifiez que `.env.local` contient les bonnes variables
2. Vérifiez que Supabase autorise les connexions depuis votre IP
3. Pour ngrok/Vercel, ajoutez l'URL dans les **Redirect URLs** de Supabase

### Problème : "Les images ne s'affichent pas"

**Solutions :**
1. Vérifiez que les images sont dans le dossier `public/`
2. Vérifiez que les URLs Supabase sont correctes
3. Vérifiez la configuration `next.config.mjs` pour les images distantes

---

## 📝 Checklist de Test

Avant de tester, vérifiez :

- [ ] Le serveur démarre sans erreur
- [ ] L'adresse IP est correcte
- [ ] Le pare-feu autorise le port 3000
- [ ] L'iPhone et l'ordinateur sont sur le même WiFi
- [ ] Les variables d'environnement sont configurées
- [ ] Supabase est accessible

---

## 🎯 Tests à Effectuer sur iPhone

1. **Navigation**
   - [ ] Les liens fonctionnent
   - [ ] Les transitions de page sont fluides
   - [ ] Le menu de navigation est accessible

2. **Responsivité**
   - [ ] L'interface s'adapte à l'écran
   - [ ] Les cartes s'empilent correctement
   - [ ] Les boutons sont facilement cliquables
   - [ ] Le texte est lisible

3. **Interactions**
   - [ ] Les boutons réagissent au clic
   - [ ] Les formulaires fonctionnent
   - [ ] Les modales s'ouvrent/ferment
   - [ ] Les tooltips s'affichent

4. **Performance**
   - [ ] Les pages se chargent rapidement
   - [ ] Les images se chargent correctement
   - [ ] Pas de lag lors des interactions

5. **PWA (si activé)**
   - [ ] L'application peut être ajoutée à l'écran d'accueil
   - [ ] L'icône s'affiche correctement
   - [ ] L'application fonctionne hors ligne (si configuré)

---

## 💡 Astuces

- **Pour tester rapidement** : Utilisez la méthode 1 (local)
- **Pour partager avec d'autres** : Utilisez ngrok (méthode 2)
- **Pour un accès permanent** : Déployez sur Vercel (méthode 3)
- **Pour tester hors WiFi** : Utilisez ngrok ou Vercel

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs du serveur dans le terminal
2. Vérifiez la console Safari sur iPhone (Safari → Développeur → Console)
3. Vérifiez les erreurs réseau dans Safari (Safari → Développeur → Réseau)

---

**Bon test ! 🚀**


