# 1000 Projets (V1)

Missions PRO & SOLIDAIRE — Next.js 15 (App Router), Supabase, Prisma, Tailwind, shadcn/ui, PWA.

## Setup

### 1) Installation

```bash
npm install # or pnpm install / yarn install
```

### 2) Variables d'environnement

Créer `.env.local` avec les variables suivantes :

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=your-supabase-postgres-connection-string
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # ou votre URL de production
```

### 3) Configuration Supabase

Assurez-vous que votre projet Supabase est configuré avec :

- **Auth** : activé (magic link)
- **Storage** : buckets créés avec les policies appropriées :
  - `avatars` : public read, authenticated write
  - `missions` : public read, authenticated write
  - `proofs` : private (signed URLs pour owner/admin)
  - `justificatifs` : private (signed URLs pour owner/admin)
- **Realtime** : activé pour la table `Message`

### 4) Base de données

```bash
# Synchroniser le schema avec la base de données
npx prisma db push

# Générer le client Prisma
npx prisma generate

# (Optionnel) Ouvrir Prisma Studio pour visualiser les données
npx prisma studio
```

### 5) Démarrage

```bash
# Mode développement (port 3000 par défaut)
npm run dev

# Build de production
npm run build

# Démarrer en production
npm start
```

## Scripts npm

- `npm run dev` : Démarre le serveur de développement
- `npm run build` : Build de production
- `npm run start` : Démarre le serveur de production
- `npm run lint` : Lint le code
- `npx prisma generate` : Génère le client Prisma
- `npx prisma studio` : Ouvre Prisma Studio
- `npx prisma db push` : Synchronise le schema avec la base de données

## Fonctionnalités

### Authentification & Onboarding
- Pages séparées `/signup` et `/login`
- Magic link via Supabase (`/login`)
- Synchronisation automatique User Prisma ↔ Supabase
- Onboarding par rôle :
  - `/onboarding/missionnaire` : prénom, nom, date de naissance, avatar
  - `/onboarding/annonceur` : idem + création Organization + KYC
  - `/onboarding/admin` : prénom, nom, téléphone
- Super-admin bootstrap via `ALLOW_BOOTSTRAP=true`

### Missions
- Feed avec onglets PRO / SOLIDAIRE / Mes clubs (`/missions`)
- Section "À la une" pour les missions featured
- Détails de mission (`/missions/[id]`)
- Création de missions (ADMIN/ANNONCEUR uniquement)
- Association à un club (optionnel)
- Recherche texte (titre/description)
- Filtres : espace, annonceur certifié, slots disponibles, club
- Tri : featured, récent
- Pagination (12/page)
- Fermeture automatique quand tous les slots sont occupés

### Soumissions
- Formulaire de soumission avec URL + upload de captures (PNG/JPG/MP4, max 10Mo)
- Upload vers Supabase Storage (`proofs/{userId}/{submissionId}/`)
- Validation côté client et serveur
- Désactivation automatique si mission fermée ou slots atteints

### Décisions (Accept/Refuse)
- Acceptation : attribution XP + création thread
- Refus : motif requis
- Vérification propriétaire/ADMIN
- Calcul XP avec décroissance après 3 acceptations/jour

### Chat (Threads)
- Thread créé automatiquement à l'acceptation
- Messages en temps réel (Supabase Realtime)
- Masquage automatique des emails/téléphones
- Support messages TEXT et CODE

### Système XP & Niveaux
- 3 barres : Global, PRO, SOLIDAIRE
- 8 paliers de niveaux (0, 200, 500, 900, 1400, 2000, 2700, 3500 XP)
- Affichage dans le header
- Règles XP :
  - Follow club : +5 XP global
  - Submission ACCEPTED : +20 XP global +60 XP espace (PRO ou SOLIDAIRE)
  - Bonus mission club suivi : +10 XP global
  - Décroissance après 3 acceptations/jour (×0.5)

### Notation annonceur
- Notation 1-5 étoiles avec commentaire optionnel
- Affichage de la note moyenne et du nombre d'avis
- Badge "Certifié" pour les annonceurs certifiés par un admin
- Notation possible depuis la page mission ou le thread après acceptation

### Preuves (URLs signées)
- Owner/admin peuvent voir les preuves soumises (images/vidéos)
- URLs signées avec expiration de 5 minutes
- Autres utilisateurs ne voient pas les preuves

### Organisations (Clubs)
- Modèle `Organization` relié à `User` (owner annonceur)
- Follow/Unfollow club (limite 50 clubs suivis)
- Page publique `/clubs/[slug]` (logo, certif, rating, followers, missions)
- Page annuaire `/clubs` (liste des clubs)
- Badge certifié visible sur cartes missions et page club
- Certification club (admin) + badge bleu

### Notifications (MVP)
- Notifications in-app (cloche + compteur dans header)
- Type "Nouvelles missions" des clubs suivis
- API : GET `/api/notifications`, POST `/api/notifications/[id]/read`
- Hook : création mission OPEN → notification pour followers

### Journal Récompense
- Champ `rewardDeliveredAt` et `rewardNote` dans Submission
- Annonceur/admin peut marquer "récompense remise" (checkbox + timestamp)
- Affichage dans thread post-acceptance

### Administration
- Dashboard (`/admin`) : KPIs, listes "à valider"
- Gestion des utilisateurs (`/admin/users`) : table + filtres, actions (Certifier, Voir KYC, Promouvoir admin)
- Demandes (`/admin/requests`) : Annonceur KYC PENDING, Admin PENDING, Missions PENDING → Approve/Reject
- Missions (`/admin/missions`) : sous-tabs, quick-actions (Approve/Reject/Feature/Close/Archive/Edit/Hide/Delete)
- Clubs (`/admin/clubs`) : liste clubs + action certifier
- Paramètres (`/admin/settings`) : SLA, CGU/Charte, XP rules (JSON)

### Signalements
- Types : NO_REWARD, INVALID_CODE, ABUSE, OTHER
- API `/api/reports` (POST)

## Sécurité

### Rate Limiting
- Création mission : 5/min
- Soumission : 10/min
- Décision : 10/min
- Message : 30/min
- Signalement : 5/min
- Rating : 5/min
- Follow/Unfollow : 10/min
- Admin actions : 30/min

### RBAC (Role-Based Access Control)
- `ADMIN` : accès complet
- `ANNONCEUR` : peut créer des missions
- `MISSIONNAIRE` : peut soumettre des missions

## Architecture

```
src/
├── app/              # Pages et routes API (App Router)
│   ├── api/          # Route handlers API
│   ├── admin/        # Pages admin
│   ├── missions/      # Pages missions
│   └── threads/      # Pages threads
├── components/       # Composants React réutilisables
└── lib/             # Utilitaires (auth, db, validators, etc.)
```

## Scripts supplémentaires

- `npm run seed` : Exécute le script de seed (création de données de test)

## Notes

- UI shadcn-like components inclus (sous-ensemble minimal)
- Chat temps réel fonctionnel via Supabase Realtime
- Upload Storage fonctionnel via Supabase Storage
- Validation Zod sur toutes les entrées POST
- Rate limiting in-memory (à migrer vers Redis en production)
- Notifications : polling toutes les 30 secondes (Realtime V2 pour amélioration)
- PWA configuré de base

## Guide de Debug Auth (401)

Si vous rencontrez des erreurs 401 :

1. Vérifier que les cookies sont bien envoyés (`credentials: 'include'` dans les fetch)
2. Vérifier que la session Supabase est valide (console navigateur)
3. Vérifier que `getCurrentUser()` fonctionne correctement (logs serveur)
4. Vérifier que le middleware ne bloque pas les routes (logs middleware)
5. Vérifier que les variables d'environnement Supabase sont correctes


