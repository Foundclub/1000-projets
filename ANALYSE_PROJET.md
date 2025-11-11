# 📊 Analyse Complète du Projet "1000 Projets"

## 🎯 Vue d'ensemble

**1000 Projets** est une plateforme web de gestion de missions PRO et SOLIDAIRE qui connecte des annonceurs (créateurs de missions) et des missionnaires (réalisateurs de missions). L'application intègre un système de gamification avec XP et niveaux, un système de notation, des clubs/organisations, et un système de chat en temps réel.

---

## 🏗️ Architecture Technique

### Stack Technologique

#### Frontend
- **Next.js 15** (App Router) - Framework React avec SSR/SSG
- **TypeScript** - Typage statique
- **React 18.3** - Bibliothèque UI
- **Tailwind CSS** - Framework CSS utilitaire
- **shadcn/ui** - Composants UI (sous-ensemble minimal)
- **React Hook Form** - Gestion de formulaires
- **Zod** - Validation de schémas

#### Backend
- **Next.js API Routes** - API REST intégrée
- **Prisma 5.20** - ORM pour PostgreSQL
- **PostgreSQL** (via Supabase) - Base de données relationnelle

#### Services Externes
- **Supabase Auth** - Authentification (magic link)
- **Supabase Storage** - Stockage de fichiers (avatars, missions, preuves, justificatifs)
- **Supabase Realtime** - Messages en temps réel

#### Outils & Configuration
- **PWA** (next-pwa) - Application Progressive Web App
- **ESLint** - Linting
- **TypeScript** - Compilation et typage

---

## 📁 Structure du Projet

```
src/
├── app/                    # Pages et routes API (App Router)
│   ├── api/                # Route handlers API REST
│   │   ├── admin/          # Routes admin (missions, users, requests, etc.)
│   │   ├── auth/           # Authentification (login, signup, magic link)
│   │   ├── missions/       # CRUD missions, applications, submissions
│   │   ├── submissions/    # Gestion des soumissions (accept/refuse/reward)
│   │   ├── threads/        # Chat threads et messages
│   │   ├── clubs/          # Organisations/clubs (follow/unfollow)
│   │   ├── annonceurs/     # Profils annonceurs (favorite, rating)
│   │   ├── notifications/  # Notifications in-app
│   │   ├── ratings/        # Système de notation
│   │   ├── reports/        # Signalements
│   │   └── user/           # Données utilisateur (me, xp, xp-history)
│   ├── admin/              # Pages admin (dashboard, users, missions, etc.)
│   ├── missions/           # Pages missions (feed, détails)
│   ├── clubs/              # Pages clubs (liste, détails)
│   ├── annonceurs/         # Pages profils annonceurs
│   ├── profile/            # Pages profil utilisateur
│   ├── threads/            # Pages chat threads
│   ├── onboarding/        # Pages onboarding par rôle
│   └── auth/               # Pages login/signup
├── components/             # Composants React réutilisables
│   ├── ui/                 # Composants UI de base (Button, Card, Input, etc.)
│   ├── mission-card.tsx    # Carte de mission
│   ├── xp-bars.tsx         # Barres de progression XP
│   ├── ChatThread.tsx      # Composant chat
│   └── ...                 # Autres composants métier
└── lib/                    # Utilitaires et helpers
    ├── auth.ts             # Authentification Supabase
    ├── db.ts               # Client Prisma
    ├── supabase.ts         # Client Supabase
    ├── rbac.ts             # Contrôle d'accès basé sur les rôles
    ├── ratelimit.ts        # Rate limiting in-memory
    ├── validators.ts       # Schémas Zod
    ├── xp.ts               # Système XP et niveaux
    └── notifications.ts    # Gestion des notifications
```

---

## 🗄️ Modèle de Données (Prisma Schema)

### Modèles Principaux

#### User
- **Rôles** : `ADMIN`, `ANNONCEUR`, `MISSIONNAIRE`
- **XP** : `xp` (général), `xpPro`, `xpSolid`
- **Profil** : `displayName`, `firstName`, `lastName`, `avatar`, `bio`, `activities`, `website`
- **Statuts** : `isCertifiedAnnonceur`, `annonceurRequestStatus`, `adminRequestStatus`
- **Relations** : missions (owner), submissions, applications, ratings, organizations, follows, notifications, favoriteAnnonceurs, xpEvents

#### Mission
- **Espace** : `PRO` ou `SOLIDAIRE`
- **Statut** : `PENDING`, `OPEN`, `CLOSED`, `ARCHIVED`
- **XP** : `baseXp` (défaut 500), `bonusXp` (admin)
- **Slots** : `slotsMax`, `slotsTaken`
- **SLA** : `slaDecisionH`, `slaRewardH`
- **Featured** : `isFeatured`, `featuredRank`
- **Relations** : owner (User), organization, submissions, applications, ratings, xpEvents

#### Submission
- **Statut** : `PENDING`, `ACCEPTED`, `REFUSED`
- **Preuves** : `proofUrl`, `proofShots` (JSON)
- **Récompense** : `rewardDeliveredAt`, `rewardNote`
- **Relations** : mission, user, thread

#### MissionApplication
- **Statut** : `PENDING`, `ACCEPTED`, `REJECTED`
- **Message** : message initial du missionnaire
- **Relations** : mission, user, thread

#### Thread
- **Relations** : submission (optionnel), application (optionnel), messages
- **Participants** : `aId` (annonceur), `bId` (missionnaire)

#### Message
- **Type** : `TEXT`, `FILE`, `CODE`
- **Relations** : thread

#### Organization (Clubs)
- **Slug** : URL unique (`/clubs/[slug]`)
- **Certification** : `isCertified`
- **Relations** : owner (User), missions, followers

#### Rating
- **Score** : 1-5 étoiles
- **Commentaire** : optionnel
- **Relations** : annonceur, rater, mission, submission

#### XpEvent
- **Type** : `MISSION_ACCEPTED`, `BONUS_ADMIN`, `BONUS_MANUAL`, `BONUS_CLUB_FOLLOWED`
- **Delta** : montant d'XP gagné/perdu
- **Space** : `PRO`, `SOLIDAIRE`, ou `null` (général)
- **Relations** : user, mission (optionnel)

#### Notification
- **Type** : `NEW_MISSION`, `MISSION_ACCEPTED`, etc.
- **Payload** : JSON avec données de la notification
- **Relations** : user

#### FavoriteAnnonceur
- **Relations** : user (favoriter), annonceur (favorited)

---

## 🎮 Fonctionnalités Principales

### 1. Authentification & Onboarding

#### Authentification
- **Magic Link** : Connexion sans mot de passe via Supabase
- **Pages séparées** : `/signup` et `/login`
- **Synchronisation** : User Prisma ↔ Supabase automatique
- **Middleware** : Protection des routes avec vérification de session

#### Onboarding
- **Par rôle** :
  - `/onboarding/missionnaire` : prénom, nom, date de naissance, avatar
  - `/onboarding/annonceur` : idem + création Organization + KYC (justificatif)
  - `/onboarding/admin` : prénom, nom, téléphone
- **Super-admin** : Bootstrap via `ALLOW_BOOTSTRAP=true`

### 2. Système de Missions

#### Feed de Missions (`/missions`)
- **Onglets** : PRO / SOLIDAIRE / Mes annonceurs favoris
- **Section "À la une"** : Missions featured (`isFeatured=true`)
- **Recherche** : Texte (titre/description)
- **Filtres** :
  - Espace (PRO/SOLIDAIRE)
  - Annonceur certifié
  - Slots disponibles
  - Club
- **Tri** : Featured, récent
- **Pagination** : 12 missions/page

#### Détails de Mission (`/missions/[id]`)
- Informations complètes
- Bouton "Je veux faire cette mission" (création application)
- Liste des candidatures (pour annonceur)
- Soumissions (pour missionnaires)
- Notation annonceur

#### Création de Missions
- **Accès** : ADMIN ou ANNONCEUR uniquement
- **Champs** : titre, description, critères, espace, slots, SLA, image, récompense
- **Association** : Club optionnel
- **XP** : `baseXp` et `bonusXp` (admin uniquement)
- **Statut** : Créées directement en `OPEN` (pas de validation admin requise)

### 3. Système de Soumissions

#### Formulaire de Soumission
- **URL** : URL de preuve
- **Captures** : Upload 1-3 fichiers (PNG/JPG/MP4, max 10Mo)
- **Commentaire** : Champ libre
- **Upload** : Supabase Storage (`proofs/{userId}/{submissionId}/`)
- **Validation** : Côté client et serveur (Zod)

#### Décisions (Accept/Refuse)
- **Acceptation** :
  - Attribution XP (baseXp + bonusXp)
  - Bonus si mission d'un club suivi (+10 XP)
  - Création thread automatique
  - `slotsTaken++`
  - Fermeture automatique si `slotsTaken >= slotsMax`
- **Refus** : Motif requis
- **Vérification** : Propriétaire ou ADMIN uniquement

### 4. Système d'Applications

#### Candidature à une Mission
- **Bouton** : "Je veux faire cette mission"
- **Message** : Message initial optionnel
- **Statut** : `PENDING` → `ACCEPTED` / `REJECTED`
- **Thread** : Création automatique si acceptée

#### Gestion des Candidatures
- **Annonceur** : Voir toutes les candidatures pour ses missions
- **Actions** : Accepter/Rejeter
- **Communication** : Chat automatique après acceptation

### 5. Chat en Temps Réel

#### Threads
- **Création** : Automatique à l'acceptation d'une soumission ou application
- **Participants** : Annonceur (aId) et Missionnaire (bId)
- **Messages** : Types TEXT, FILE, CODE
- **Realtime** : Supabase Realtime pour messages instantanés
- **PII Masking** : Masquage automatique des emails/téléphones

#### Interface Chat
- **Page** : `/threads/[id]`
- **Composant** : `ChatThread.tsx`
- **Fonctionnalités** : Envoi de messages, affichage en temps réel, historique

### 6. Système XP & Niveaux

#### Structure des Niveaux
- **10 Tiers** : Bronze, Argent, Or, Platine, Diamant, Saphir, Émeraude, Champion, Grand Champion, Elite
- **5 Sous-niveaux par tier** : Total 50 niveaux
- **XP Général** : Paliers à 2x (1000, 2000, 3000, ...)
- **XP Pro/Solidaire** : Paliers à 1x (500, 1000, 1500, ...)

#### Attribution XP
- **Mission acceptée** : `baseXp` (défaut 500) + `bonusXp` (admin)
  - Général : total XP
  - Pro/Solidaire : total XP selon l'espace de la mission
- **Follow club** : +5 XP général
- **Mission club suivi** : +10 XP général (bonus)
- **Bonus admin** : Attribution manuelle via `/admin/xp-bonus`

#### Affichage
- **Header** : Barres de progression XP (Général, Pro, Solidaire)
- **Badges** : Affichage du badge correspondant au niveau (10 badges par tier)
- **Historique** : Page `/profile/xp-history` avec filtres

#### XpEvent
- **Traçabilité** : Tous les gains d'XP sont enregistrés
- **Types** : `MISSION_ACCEPTED`, `BONUS_ADMIN`, `BONUS_MANUAL`, `BONUS_CLUB_FOLLOWED`
- **Filtres** : Par type, par espace, pagination

### 7. Organisations (Clubs)

#### Création
- **Annonceur** : Création automatique lors de l'onboarding
- **Champs** : nom, slug, logo, cover, bio, website
- **Certification** : Admin peut certifier un club (badge bleu)

#### Fonctionnalités
- **Follow/Unfollow** : Limite 50 clubs suivis
- **Page publique** : `/clubs/[slug]` (logo, certif, rating, followers, missions)
- **Page annuaire** : `/clubs` (liste des clubs)
- **Notifications** : Création mission OPEN → notification pour followers

### 8. Annonceurs Favoris

#### Système de Favoris
- **Ajout** : Depuis la page profil annonceur (`/annonceurs/[id]`)
- **Onglet** : "Mes annonceurs favoris" dans le feed missions
- **Affichage** : Missions des annonceurs favoris uniquement

#### Profil Annonceur
- **Page** : `/annonceurs/[id]`
- **Informations** : bio, activités, site web, missions
- **Actions** : Ajouter/Retirer des favoris

### 9. Système de Notation

#### Notation Annonceur
- **Score** : 1-5 étoiles
- **Commentaire** : Optionnel
- **Conditions** : Uniquement si soumission acceptée
- **Affichage** : Note moyenne et nombre d'avis sur cartes missions et page annonceur

#### Badge Certifié
- **Certification** : Admin peut certifier un annonceur
- **Affichage** : Badge "Certifié" visible partout

### 10. Notifications (MVP)

#### Types de Notifications
- **NEW_MISSION** : Nouvelle mission d'un club suivi
- **MISSION_ACCEPTED** : Soumission acceptée
- Autres types à venir

#### Interface
- **Dropdown** : Cloche + compteur dans le header
- **API** : GET `/api/notifications`, POST `/api/notifications/[id]/read`
- **Polling** : Toutes les 30 secondes (à migrer vers Realtime V2)

### 11. Administration

#### Dashboard (`/admin`)
- **KPIs** : Statistiques globales (utilisateurs, missions, soumissions, litiges)
- **Listes "à valider"** : Missions, annonceurs, admins

#### Gestion des Utilisateurs (`/admin/users`)
- **Table** : Liste des utilisateurs avec filtres
- **Filtres** : Rôle, vérification annonceur, admin status, recherche
- **Actions** :
  - Certifier annonceur
  - Voir KYC (justificatifs)
  - Promouvoir admin
  - Attribution bonus XP

#### Demandes (`/admin/requests`)
- **Onglets** : Annonceurs (KYC), Admins, Missions
- **Actions** : Approve/Reject avec motif

#### Missions (`/admin/missions`)
- **Onglets** : À valider, Ouvertes, Clôturées, Archivées, À la Une
- **Actions** : Approve, Reject, Feature, Close, Archive, Edit, Hide, Delete

#### Clubs (`/admin/clubs`)
- **Liste** : Tous les clubs
- **Action** : Certifier

#### Paramètres (`/admin/settings`)
- **SLA** : Délais de décision et remise de récompense
- **CGU/Charte** : Textes légaux
- **XP Rules** : Règles d'attribution XP (JSON)

#### Bonus XP (`/admin/xp-bonus`)
- **Recherche** : Utilisateur par email/nom/ID
- **Attribution** : Montant, espace (Général/Pro/Solidaire), description

### 12. Signalements & Modération

#### Types de Signalements
- **NO_REWARD** : Récompense non remise
- **INVALID_CODE** : Code invalide
- **ABUSE** : Abus
- **OTHER** : Autre

#### Gestion
- **API** : POST `/api/reports`
- **Modération** : Admin peut voir et traiter les signalements

### 13. Journal de Récompense

#### Fonctionnalités
- **Champs** : `rewardDeliveredAt`, `rewardNote`
- **Action** : Annonceur/admin peut marquer "récompense remise"
- **Affichage** : Dans le thread après acceptation

---

## 🔒 Sécurité

### Rate Limiting
- **In-memory** : Implémentation basique (à migrer vers Redis en production)
- **Limites** :
  - Création mission : 5/min
  - Soumission : 10/min
  - Décision : 10/min
  - Message : 30/min
  - Signalement : 5/min
  - Rating : 5/min
  - Follow/Unfollow : 10/min
  - Admin actions : 30/min

### RBAC (Role-Based Access Control)
- **ADMIN** : Accès complet
- **ANNONCEUR** : Peut créer des missions, gérer ses missions
- **MISSIONNAIRE** : Peut soumettre des missions, postuler

### Protection des Routes
- **Middleware** : Vérification de session Supabase
- **Layouts** : Vérification RBAC dans les layouts admin
- **API Routes** : Vérification RBAC dans chaque route

### Protection des Données
- **PII Masking** : Emails/téléphones masqués dans les messages
- **Signed URLs** : Preuves et justificatifs avec URLs signées (expiration 5 min)
- **Validation** : Zod sur toutes les entrées POST

---

## 🎨 Interface Utilisateur

### Composants UI
- **shadcn/ui** : Composants de base (Button, Card, Input, Select, Tabs, Textarea)
- **Composants métier** :
  - `MissionCard` : Carte de mission
  - `XpBars` : Barres de progression XP avec badges
  - `ChatThread` : Chat en temps réel
  - `AnnonceurProfile` : Profil annonceur
  - `ClubDetail` : Détails club
  - `SubmissionForm` : Formulaire de soumission
  - `RatingDialog` : Dialogue de notation
  - Etc.

### Design System
- **Tailwind CSS** : Classes utilitaires
- **Responsive** : Mobile-first
- **Animations** : Transitions et hover effects
- **Badges** : 10 badges de niveau dans `/public/badges/`

---

## 📊 Statistiques & Métriques

### KPIs Dashboard Admin
- Nombre total d'utilisateurs
- Nombre total de missions
- Nombre total de soumissions
- Nombre de litiges

### Tracking XP
- **XpEvent** : Tous les gains d'XP sont tracés
- **Historique** : Page dédiée avec filtres et pagination

---

## 🚀 Déploiement & Configuration

### Variables d'Environnement
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=your-supabase-postgres-connection-string
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ALLOW_BOOTSTRAP=true # Pour créer le premier admin
```

### Supabase Configuration
- **Auth** : Magic link activé
- **Storage** : Buckets `avatars`, `missions`, `proofs`, `justificatifs`
- **Realtime** : Activé pour la table `Message`
- **Policies** : Configurées selon les besoins

### Scripts
```bash
npm run dev          # Développement
npm run build        # Build production
npm run start        # Production
npm run lint         # Lint
npx prisma generate  # Générer client Prisma
npx prisma db push   # Synchroniser schema
npx prisma studio    # Interface graphique
npm run seed         # Données de test
```

---

## 🔄 Flux Utilisateur Principaux

### Missionnaire
1. **Inscription** → Onboarding → Choix rôle
2. **Feed missions** → Filtrer/Rechercher → Voir détails
3. **Postuler** → "Je veux faire cette mission" → Chat avec annonceur
4. **Soumettre** → Upload preuves → Attendre décision
5. **Acceptation** → Gain XP → Chat ouvert → Notation annonceur

### Annonceur
1. **Inscription** → Onboarding → Création club
2. **Créer mission** → Remplir formulaire → Publier
3. **Voir candidatures** → Accepter/Rejeter → Chat
4. **Voir soumissions** → Accepter/Refuser → Marquer récompense remise

### Admin
1. **Dashboard** → Voir KPIs et listes "à valider"
2. **Gérer utilisateurs** → Certifier, promouvoir, attribuer XP
3. **Modérer missions** → Approve/Reject/Feature/Hide/Delete
4. **Gérer clubs** → Certifier
5. **Paramètres** → SLA, CGU, XP rules

---

## 📈 Points Forts

1. **Architecture moderne** : Next.js 15 App Router, TypeScript, Prisma
2. **Sécurité** : RBAC, rate limiting, validation Zod, PII masking
3. **Gamification** : Système XP complet avec 50 niveaux et badges
4. **Temps réel** : Chat via Supabase Realtime
5. **Scalabilité** : Structure modulaire, séparation des concerns
6. **UX** : Interface intuitive, responsive, animations

---

## 🔧 Points d'Amélioration

1. **Rate Limiting** : Migrer vers Redis pour la production
2. **Notifications** : Migrer vers Realtime V2 au lieu du polling
3. **Tests** : Ajouter tests unitaires et E2E
4. **Documentation API** : Swagger/OpenAPI
5. **Monitoring** : Logging structuré, monitoring d'erreurs
6. **Performance** : Optimisation des requêtes Prisma, caching
7. **Accessibilité** : Améliorer l'accessibilité (ARIA, keyboard navigation)

---

## 📝 Conclusion

**1000 Projets** est une plateforme complète et bien structurée pour la gestion de missions PRO et SOLIDAIRE. L'application intègre toutes les fonctionnalités nécessaires pour connecter annonceurs et missionnaires, avec un système de gamification avancé, un chat en temps réel, et une interface d'administration complète.

L'architecture est moderne, sécurisée, et prête pour la production avec quelques améliorations mineures (rate limiting Redis, notifications Realtime V2).

---

*Analyse générée le ${new Date().toLocaleDateString('fr-FR')}*

