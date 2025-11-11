# Guide d'utilisation Admin

## Étape 1 : Configuration du Bootstrap Admin

### 1.1 Ajouter les variables d'environnement

Ouvrez le fichier `.env.local` à la racine du projet et ajoutez :

```env
ADMIN_EMAILS=votre.email@domaine.com,autre.admin@exemple.com
ADMIN_BOOTSTRAP_SECRET=changez_moi_par_une_chaine_aleatoire_securisee
```

**Important :**
- Remplacez `votre.email@domaine.com` par votre email réel
- Vous pouvez ajouter plusieurs emails séparés par des virgules
- `ADMIN_BOOTSTRAP_SECRET` doit être une chaîne aléatoire sécurisée (ex: générée avec `openssl rand -hex 32`)

### 1.2 Redémarrer le serveur

Après avoir modifié `.env.local`, redémarrez le serveur de développement :

```bash
npm run dev
```

## Étape 2 : Créer le premier compte Admin

### Option A : Via le bootstrap automatique (recommandé)

1. **Créer un compte normal** :
   - Allez sur `http://localhost:3000/login`
   - Créez un compte avec un email qui est dans `ADMIN_EMAILS`
   - Cliquez sur le lien de confirmation dans votre email
   - Vous serez automatiquement promu en ADMIN lors de la connexion

2. **Vérifier le statut** :
   - Après connexion, vous devriez voir "Admin" dans le header
   - Vous pouvez accéder à `/admin` pour voir le dashboard

### Option B : Via la route de secours (si l'option A ne fonctionne pas)

1. **Appeler la route bootstrap** :
   ```bash
   curl -X POST http://localhost:3000/api/admin/bootstrap \
     -H "Content-Type: application/json" \
     -d '{"email": "votre.email@domaine.com", "secret": "votre_ADMIN_BOOTSTRAP_SECRET"}'
   ```

2. **Ou utiliser Postman/Thunder Client** :
   - Méthode : `POST`
   - URL : `http://localhost:3000/api/admin/bootstrap`
   - Body (JSON) :
     ```json
     {
       "email": "votre.email@domaine.com",
       "secret": "votre_ADMIN_BOOTSTRAP_SECRET"
     }
     ```

## Étape 3 : Accéder à l'espace Admin

### 3.1 Dashboard

1. **URL** : `http://localhost:3000/admin`
2. **Contenu** :
   - KPI cards : Statistiques globales (utilisateurs, missions, soumissions, litiges)
   - Missions en attente d'approbation
   - Annonceurs en attente (KYC)

### 3.2 Navigation

L'espace admin est accessible via les onglets :
- **Dashboard** : `/admin` - Vue d'ensemble
- **Utilisateurs** : `/admin/users` - Gestion des utilisateurs
- **Revues** : `/admin/requests` - Demandes Annonceur/Admin
- **Missions** : `/admin/missions` - Modération des missions

## Étape 4 : Utiliser les fonctionnalités Admin

### 4.1 Gestion des Utilisateurs (`/admin/users`)

**Filtres disponibles :**
- Rôle : Missionnaire / Annonceur / Admin
- Vérification Annonceur : Aucune / En attente / Approuvé / Rejeté
- Admin Status : Aucune / En attente / Approuvé / Rejeté
- Recherche : Email, nom, entreprise

**Actions possibles :**
- **Certifier un annonceur** : Cliquez sur "Certifier" pour accorder le badge "Certifié"
- **Voir KYC** : Cliquez sur "Voir KYC" pour voir les documents justificatifs (URLs signées)

### 4.2 Revues (`/admin/requests`)

**Onglet "Annonceurs"** :
- Liste des demandes d'Annonceur en attente
- Actions : **Accepter** ou **Refuser**
- Bouton "Voir Doc" pour consulter les justificatifs

**Onglet "Admin"** :
- Liste des demandes Admin en attente
- Actions : **Accepter** ou **Refuser**

### 4.3 Modération des Missions (`/admin/missions`)

**Onglets disponibles :**
- **À valider** : Missions avec status `PENDING`
- **Ouvertes** : Missions avec status `OPEN`
- **Clôturées** : Missions avec status `CLOSED`
- **Archivées** : Missions avec status `ARCHIVED`
- **À la Une** : Missions avec `isFeatured=true`

**Actions par mission :**
- **Approuver** : Change le status de `PENDING` à `OPEN`
- **Rejeter** : Change le status à `ARCHIVED`
- **Mettre à la Une** : Active `isFeatured` et définit le `featuredRank`
- **Editer** : Modifier les détails de la mission

**Créer une mission** :
- Cliquez sur "Créer une mission" en haut de la page
- Remplissez le formulaire
- Si vous êtes ADMIN : la mission sera créée avec status `OPEN` (visible immédiatement)
- Si vous êtes ANNONCEUR : la mission sera créée avec status `PENDING` (nécessite approbation)

### 4.4 Dashboard (`/admin`)

**KPI Cards :**
- **Utilisateurs** : Total / Missionnaires / Annonceurs / Admins
- **Missions** : En attente / Ouvertes / Fermées / Archivées
- **Soumissions** : En attente / Acceptées / Refusées
- **Litiges** : Nombre de reports ouverts

**Sections rapides :**
- **Missions en attente** : Liste des 5 dernières missions `PENDING` avec actions rapides
- **Annonceurs en attente** : Liste des 5 derniers annonceurs en attente de KYC

## Étape 5 : Workflow typique

### 5.1 Approuver une demande Annonceur

1. Aller sur `/admin/requests`
2. Onglet "Annonceurs"
3. Cliquer sur "Voir Doc" pour vérifier les justificatifs
4. Cliquer sur "Accepter" ou "Refuser"
5. Si accepté : l'utilisateur devient ANNONCEUR et peut créer des missions

### 5.2 Approuver une mission

1. Aller sur `/admin/missions`
2. Onglet "À valider"
3. Cliquer sur "Approuver" pour une mission
4. La mission passe en status `OPEN` et devient visible dans le feed public

### 5.3 Mettre une mission à la Une

1. Aller sur `/admin/missions`
2. Trouver la mission (peut être dans n'importe quel onglet)
3. Cliquer sur "Mettre à la Une"
4. La mission apparaîtra en haut du feed public dans la section "⭐ À la une"

### 5.4 Certifier un annonceur

1. Aller sur `/admin/users`
2. Filtrer par rôle "Annonceur" si nécessaire
3. Cliquer sur "Certifier" pour un annonceur
4. Le badge "Certifié" apparaîtra sur ses missions

## Étape 6 : Sécurité et bonnes pratiques

### 6.1 Protection des routes

- Toutes les routes `/admin/*` sont protégées par le middleware
- Seuls les utilisateurs avec `role=ADMIN` peuvent y accéder
- Les autres utilisateurs reçoivent une erreur 403 (Forbidden)

### 6.2 Rate Limiting

- Toutes les routes `/api/admin/*` ont un rate limit de 30 requêtes/minute
- Si vous dépassez la limite, vous recevrez une erreur 429 (Too Many Requests)

### 6.3 Bootstrap Secret

- **Important** : Une fois le premier admin créé, vous pouvez supprimer ou commenter la route `/api/admin/bootstrap` pour plus de sécurité
- Le bootstrap automatique via `ADMIN_EMAILS` reste actif et sécurisé

## Étape 7 : Dépannage

### Problème : Je ne peux pas accéder à `/admin`

**Solutions :**
1. Vérifiez que votre email est dans `ADMIN_EMAILS` dans `.env.local`
2. Redémarrez le serveur après modification de `.env.local`
3. Déconnectez-vous et reconnectez-vous pour que le bootstrap s'applique
4. Vérifiez dans la base de données que votre `role=ADMIN`

### Problème : La route bootstrap ne fonctionne pas

**Solutions :**
1. Vérifiez que `ADMIN_BOOTSTRAP_SECRET` correspond exactement (pas d'espaces)
2. Vérifiez que l'email existe dans la base de données
3. Vérifiez les logs du serveur pour voir les erreurs

### Problème : Les missions ne s'affichent pas dans "À valider"

**Solutions :**
1. Vérifiez que les missions ont bien `status=PENDING` dans la base de données
2. Vérifiez que vous êtes bien connecté en tant qu'ADMIN
3. Rafraîchissez la page

## Notes importantes

- **Bootstrap automatique** : Si votre email est dans `ADMIN_EMAILS`, vous serez automatiquement promu en ADMIN à chaque connexion
- **Création de missions** : En tant qu'ADMIN, vos missions sont créées avec status `OPEN` (visibles immédiatement)
- **Modération** : Toutes les missions créées par des ANNONCEURs nécessitent votre approbation (status `PENDING`)
- **KYC** : Les documents justificatifs sont accessibles uniquement via URLs signées (expiration 5 minutes)


