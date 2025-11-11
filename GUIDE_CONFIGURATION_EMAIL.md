# 📧 Guide de Configuration - Système de Notifications Email

Ce guide explique comment configurer le système de notifications email pour recevoir des alertes lorsqu'une nouvelle demande de compte Annonceur ou Admin est soumise.

## 🎯 Fonctionnalité

Le système envoie automatiquement un email à l'admin lorsque :
- Un utilisateur soumet une demande de compte **Annonceur**
- Un utilisateur soumet une demande de compte **Admin**

## 📋 Prérequis

1. **Compte Resend** (gratuit jusqu'à 3000 emails/mois)
   - Créer un compte sur [resend.com](https://resend.com)
   - Vérifier votre domaine ou utiliser le domaine de test fourni

2. **Clé API Resend**
   - Aller dans [Resend Dashboard](https://resend.com/api-keys)
   - Créer une nouvelle clé API
   - Copier la clé (commence par `re_`)

## ⚙️ Configuration

### Variables d'environnement à ajouter

Ajoutez ces variables dans votre fichier `.env.local` (local) et dans Vercel (production) :

```env
# Email Configuration (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=notifications@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

### Explication des variables

- **`RESEND_API_KEY`** : Votre clé API Resend (obtenue depuis le dashboard Resend)
- **`RESEND_FROM_EMAIL`** : L'adresse email de l'expéditeur (doit être vérifiée dans Resend)
  - Si vous utilisez le domaine de test : `onboarding@resend.dev`
  - Si vous avez vérifié votre domaine : `notifications@votredomaine.com`
- **`ADMIN_EMAIL`** : Votre adresse email où vous voulez recevoir les notifications

## 🚀 Configuration dans Resend

### Option 1 : Utiliser le domaine de test (pour tester rapidement)

1. Connectez-vous à [Resend](https://resend.com)
2. Utilisez le domaine de test fourni : `resend.dev`
3. Utilisez `onboarding@resend.dev` comme `RESEND_FROM_EMAIL`

### Option 2 : Vérifier votre propre domaine (recommandé pour la production)

1. Dans Resend Dashboard, allez dans **Domains**
2. Ajoutez votre domaine (ex: `yourdomain.com`)
3. Ajoutez les enregistrements DNS fournis par Resend
4. Attendez la vérification (quelques minutes)
5. Utilisez `notifications@yourdomain.com` comme `RESEND_FROM_EMAIL`

## 📝 Exemple de configuration complète

```env
# .env.local (développement)
RESEND_API_KEY=re_abc123def456ghi789
RESEND_FROM_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=votre.email@gmail.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

```env
# Vercel (production)
RESEND_API_KEY=re_abc123def456ghi789
RESEND_FROM_EMAIL=notifications@yourdomain.com
ADMIN_EMAIL=votre.email@gmail.com
NEXT_PUBLIC_BASE_URL=https://1000-projets.vercel.app
```

## ✅ Test

Pour tester le système :

1. Configurez les variables d'environnement
2. Redémarrez le serveur de développement (`npm run dev`)
3. Soumettez une demande de compte Annonceur ou Admin depuis l'application
4. Vérifiez votre boîte email (et les spams)

## 🔍 Dépannage

### L'email n'est pas envoyé

1. **Vérifiez les logs** : Regardez les logs du serveur pour voir les erreurs
2. **Vérifiez les variables** : Assurez-vous que toutes les variables sont correctement configurées
3. **Vérifiez Resend** : Allez dans Resend Dashboard → Logs pour voir les tentatives d'envoi
4. **Vérifiez les spams** : Les emails peuvent être dans les spams

### Erreur "Invalid API key"

- Vérifiez que `RESEND_API_KEY` est correcte
- Assurez-vous qu'elle commence par `re_`
- Vérifiez qu'elle n'a pas expiré dans Resend Dashboard

### Erreur "Domain not verified"

- Si vous utilisez votre propre domaine, assurez-vous qu'il est vérifié dans Resend
- Utilisez temporairement `onboarding@resend.dev` pour tester

## 📊 Limites du plan gratuit Resend

- **3000 emails/mois** (gratuit)
- **100 emails/jour** maximum
- Domaine de test disponible immédiatement

Pour plus d'informations, consultez [Resend Documentation](https://resend.com/docs).

