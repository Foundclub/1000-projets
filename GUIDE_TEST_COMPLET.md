# Guide de Test Complet - Nouvelles Fonctionnalités

## Prérequis

1. **Redémarrer le serveur de développement** (si nécessaire) :
   ```bash
   npm run dev
   ```

2. **Vérifier que la base de données est à jour** :
   - Les migrations Prisma ont été appliquées
   - Le client Prisma a été régénéré

3. **Vérifier les buckets Supabase Storage** :
   - `avatars` (pour les avatars utilisateurs)
   - `justificatifs` (pour les justificatifs annonceurs)
   - `missions` (pour les images de missions)
   - `proofs` (pour les preuves de soumission)

---

## ÉTAPE 1 : Test de l'Onboarding Rôle

### 1.1 Test avec un nouveau compte

1. **Déconnectez-vous** si vous êtes connecté
2. Allez sur `http://localhost:3000`
3. Cliquez sur **"Login"**
4. Entrez un **nouvel email** (ex: `test-onboarding@example.com`)
5. Cliquez sur **"Envoyer lien magique"**
6. Vérifiez votre email et cliquez sur le lien magique
7. **Vérification** : Vous devriez être redirigé vers `/onboarding/role`

### 1.2 Test du choix Missionnaire

1. Sur la page `/onboarding/role`, cliquez sur **"Missionnaire"**
2. Cliquez sur **"Confirmer"**
3. **Vérification** : 
   - Vous êtes redirigé vers `/missions`
   - Votre rôle est `MISSIONNAIRE` dans la base de données
   - `roleChosenAt` est défini

### 1.3 Test du choix Annonceur

1. **Créez un nouveau compte** avec un autre email (ex: `test-annonceur@example.com`)
2. Complétez le formulaire Annonceur :
   - Prénom : `Jean`
   - Nom : `Dupont`
   - Date de naissance : `1990-01-01`
   - Nom de l'entreprise : `Ma Startup`
   - Avatar : Uploadez une image (optionnel)
   - Justificatif : Uploadez un PDF ou image
3. Cliquez sur **"Confirmer"**
4. **Vérification** :
   - Vous êtes redirigé vers `/missions`
   - Votre rôle reste `MISSIONNAIRE` (pas encore approuvé)
   - `annonceurRequestStatus` = `PENDING` dans la base de données
   - Les fichiers sont uploadés dans Supabase Storage

### 1.4 Test du choix Admin

1. **Créez un nouveau compte** avec un autre email (ex: `test-admin@example.com`)
2. Complétez le formulaire Admin :
   - Prénom : `Admin`
   - Nom : `Test`
   - Téléphone : `0123456789`
3. Cliquez sur **"Confirmer"**
4. **Vérification** :
   - Vous êtes redirigé vers `/missions`
   - Votre rôle reste `MISSIONNAIRE` (pas encore approuvé)
   - `adminRequestStatus` = `PENDING` dans la base de données

### 1.5 Test de la redirection (compte existant)

1. **Connectez-vous** avec un compte qui a déjà choisi son rôle
2. **Vérification** : Vous êtes directement redirigé vers `/missions` (pas d'onboarding)

---

## ÉTAPE 2 : Test de la Page Profil

### 2.1 Accès à la page profil

1. Connectez-vous avec un compte existant
2. Cliquez sur **"Profil"** dans le header
3. **Vérification** : La page `/profile` s'affiche avec vos informations

### 2.2 Modification du profil

1. Modifiez les champs suivants :
   - Nom d'affichage : `Mon Nom`
   - Prénom : `Prénom`
   - Nom : `Nom`
   - Téléphone : `0123456789`
   - Date de naissance : `1990-01-01`
   - Nom de l'entreprise : `Mon Entreprise`
   - Avatar : Uploadez une nouvelle image
2. Cliquez sur **"Enregistrer les modifications"**
3. **Vérification** :
   - Message de succès affiché
   - Les modifications sont sauvegardées
   - L'avatar est uploadé dans Supabase Storage

### 2.3 Affichage du statut de demande

1. Si vous avez une demande Annonceur ou Admin en attente
2. **Vérification** : Un message indique "Demande en attente de validation"

---

## ÉTAPE 3 : Test de la Recherche et Filtres Missions

### 3.1 Test de la barre de recherche

1. Allez sur `/missions`
2. Dans la barre de recherche, tapez un mot-clé (ex: `développement`)
3. Cliquez sur **"Rechercher"**
4. **Vérification** :
   - Seules les missions contenant le mot-clé dans le titre ou la description s'affichent
   - L'URL contient `?query=développement`

### 3.2 Test du filtre "Annonceur certifié"

1. Cliquez sur la checkbox **"Annonceur certifié uniquement"**
2. **Vérification** :
   - Seules les missions dont l'annonceur est certifié s'affichent
   - L'URL contient `?certified=true`

### 3.3 Test du filtre "Slots disponibles"

1. Cliquez sur la checkbox **"Slots disponibles uniquement"**
2. **Vérification** :
   - Seules les missions avec `slotsTaken < slotsMax` s'affichent
   - L'URL contient `?available=true`

### 3.4 Test des filtres combinés

1. Activez plusieurs filtres en même temps (recherche + certifié + disponible)
2. **Vérification** : Les filtres fonctionnent ensemble correctement

### 3.5 Test avec les onglets PRO/SOLIDAIRE

1. Activez des filtres sur l'onglet PRO
2. Passez à l'onglet SOLIDAIRE
3. **Vérification** : Les filtres sont conservés (ou réinitialisés selon votre préférence)

---

## ÉTAPE 4 : Test de la Création de Mission

### 4.1 Accès à la page de création

1. Connectez-vous avec un compte **ADMIN** ou **ANNONCEUR**
2. **Vérification** : Le bouton **"Créer une mission"** apparaît dans le header
3. Cliquez sur **"Créer une mission"**
4. **Vérification** : Vous êtes redirigé vers `/admin/missions/new`

### 4.2 Test avec un compte MISSIONNAIRE

1. Connectez-vous avec un compte **MISSIONNAIRE**
2. **Vérification** : Le bouton **"Créer une mission"** n'apparaît PAS

### 4.3 Création d'une mission sans image

1. Remplissez le formulaire :
   - Titre : `Mission Test Sans Image`
   - Espace : `PRO`
   - Description : `Description de test pour une mission sans image`
   - Critères : `Critères d'acceptation de test`
   - Slots max : `5`
   - SLA Décision : `48`
   - SLA Récompense : `72`
   - Récompense : `100€`
   - Image : Sélectionnez **"Aucune image"**
2. Cliquez sur **"Publier la mission"**
3. **Vérification** :
   - La mission est créée
   - Vous êtes redirigé vers `/missions`
   - La mission apparaît dans le feed
   - La récompense est affichée

### 4.4 Création d'une mission avec image upload

1. Remplissez le formulaire (même que précédemment)
2. Pour l'image : Sélectionnez **"Upload"**
3. Uploadez une image (PNG, JPG)
4. Cliquez sur **"Publier la mission"**
5. **Vérification** :
   - La mission est créée
   - L'image est uploadée dans Supabase Storage (`missions/{userId}/{filename}`)
   - L'image s'affiche dans la carte mission et la page détail

### 4.5 Création d'une mission avec image URL

1. Remplissez le formulaire
2. Pour l'image : Sélectionnez **"URL externe"**
3. Entrez une URL d'image valide (ex: `https://example.com/image.jpg`)
4. Cliquez sur **"Publier la mission"**
5. **Vérification** :
   - La mission est créée
   - L'image externe s'affiche dans la carte mission et la page détail

---

## ÉTAPE 5 : Test de l'Affichage Image et Récompense

### 5.1 Affichage dans les cartes missions

1. Allez sur `/missions`
2. **Vérification** :
   - Les missions avec `imageUrl` affichent l'image en haut de la carte
   - Les missions avec `rewardText` affichent un badge "🎁 Récompense: ..."
   - Les missions sans image n'affichent pas d'espace vide

### 5.2 Affichage dans la page détail

1. Cliquez sur une mission avec image et récompense
2. **Vérification** :
   - L'image s'affiche en grand en haut de la page
   - La récompense s'affiche dans un encadré distinct avec le titre "🎁 Récompense"
   - Le texte de la récompense est bien formaté

---

## ÉTAPE 6 : Test du Champ Commentaires dans Soumission

### 6.1 Soumission avec commentaires

1. Allez sur une mission ouverte
2. Remplissez le formulaire de soumission :
   - Preuve (URL) : `https://github.com/user/repo` (optionnel)
   - **Commentaires / Notes** : `Voici des informations complémentaires sur ma réalisation. J'ai utilisé React et TypeScript.`
   - Captures d'écran : Uploadez 1-3 fichiers (optionnel)
3. Cliquez sur **"Soumettre ma réalisation"**
4. **Vérification** :
   - La soumission est créée
   - Les commentaires sont sauvegardés dans la base de données

### 6.2 Affichage des commentaires (Owner/Admin)

1. Connectez-vous avec le compte **owner** de la mission ou un **ADMIN**
2. Allez sur la page détail de la mission
3. **Vérification** :
   - La section "Preuves soumises" affiche les soumissions
   - Chaque soumission avec commentaires affiche une section "💬 Commentaires"
   - Le texte des commentaires est bien formaté (whitespace préservé)

### 6.3 Affichage des commentaires (Missionnaire)

1. Connectez-vous avec un compte **MISSIONNAIRE** (pas owner)
2. Allez sur la page détail de la mission
3. **Vérification** : La section "Preuves soumises" n'est PAS visible (sécurité)

### 6.4 Test de validation

1. Essayez de soumettre avec un commentaire de plus de 2000 caractères
2. **Vérification** : Une erreur de validation s'affiche

---

## ÉTAPE 7 : Test d'Intégration Complète

### 7.1 Parcours complet Missionnaire

1. Créez un nouveau compte → Onboarding Missionnaire
2. Allez sur `/missions` → Recherchez une mission
3. Cliquez sur une mission → Consultez les détails
4. Soumettez une réalisation avec commentaires
5. Allez sur `/profile` → Modifiez votre profil

### 7.2 Parcours complet Annonceur

1. Créez un nouveau compte → Onboarding Annonceur (demande en attente)
2. Allez sur `/profile` → Vérifiez le statut "en attente"
3. **Note** : Pour tester la création de mission, vous devez d'abord approuver la demande via l'admin
4. Une fois approuvé (via `/admin/roles`), créez une mission avec image et récompense
5. Vérifiez que la mission apparaît dans le feed avec l'image et la récompense

### 7.3 Parcours complet Admin

1. Créez un nouveau compte → Onboarding Admin (demande en attente)
2. **Note** : Pour tester les fonctionnalités admin, vous devez d'abord approuver la demande
3. Une fois approuvé, créez une mission
4. Consultez les soumissions avec commentaires
5. Gérez les rôles des utilisateurs

---

## Points de Vérification Importants

### ✅ Base de données

- Vérifiez que `roleChosenAt` est défini après l'onboarding
- Vérifiez que `annonceurRequestStatus` ou `adminRequestStatus` est `PENDING` pour les demandes
- Vérifiez que `imageUrl` et `rewardText` sont sauvegardés pour les missions
- Vérifiez que `comments` est sauvegardé pour les soumissions

### ✅ Supabase Storage

- Vérifiez que les avatars sont uploadés dans `avatars/{userId}/...`
- Vérifiez que les justificatifs sont uploadés dans `justificatifs/{userId}/...`
- Vérifiez que les images de missions sont uploadées dans `missions/{userId}/...`
- Vérifiez que les preuves sont uploadées dans `proofs/{userId}/{submissionId}/...`

### ✅ Sécurité

- Les MISSIONNAIRES ne peuvent pas créer de missions
- Les preuves (proofShots) ne sont visibles que pour owner/admin
- Les commentaires ne sont visibles que pour owner/admin
- L'onboarding n'est demandé qu'une seule fois par utilisateur

### ✅ UX

- Les redirections fonctionnent correctement
- Les messages d'erreur sont clairs
- Les messages de succès sont affichés
- Les formulaires sont validés côté client et serveur

---

## Problèmes Courants et Solutions

### Problème : "Unauthorized" lors de la soumission

**Solution** : Vérifiez que vous êtes bien connecté et que les cookies sont envoyés (`credentials: 'include'`)

### Problème : L'image ne s'affiche pas

**Solution** : 
- Vérifiez que le bucket Supabase Storage existe
- Vérifiez que les permissions du bucket sont correctes
- Vérifiez que l'URL de l'image est valide

### Problème : Les filtres ne fonctionnent pas

**Solution** : Vérifiez que les query params sont bien passés dans l'URL et traités dans le code

### Problème : L'onboarding ne s'affiche pas

**Solution** : Vérifiez que `roleChosenAt` est `null` dans la base de données pour votre utilisateur

---

## Checklist Finale

- [ ] Onboarding Missionnaire fonctionne
- [ ] Onboarding Annonceur fonctionne (demande en attente)
- [ ] Onboarding Admin fonctionne (demande en attente)
- [ ] Page profil accessible et modifiable
- [ ] Recherche missions fonctionne
- [ ] Filtres missions fonctionnent (certifié, disponible)
- [ ] Création mission accessible uniquement pour ADMIN/ANNONCEUR
- [ ] Création mission avec image upload fonctionne
- [ ] Création mission avec image URL fonctionne
- [ ] Création mission avec récompense fonctionne
- [ ] Image et récompense s'affichent dans les cartes
- [ ] Image et récompense s'affichent dans la page détail
- [ ] Champ commentaires dans soumission fonctionne
- [ ] Commentaires s'affichent pour owner/admin uniquement
- [ ] Sécurité : MISSIONNAIRES ne peuvent pas créer de missions
- [ ] Sécurité : Preuves visibles uniquement pour owner/admin

---

**Bon test ! 🚀**

