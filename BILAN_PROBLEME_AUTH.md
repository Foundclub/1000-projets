# Bilan du Problème d'Authentification - Soumission de Mission

## 📋 Contexte Général

**Application :** Next.js 15.5.6 (App Router) avec Supabase Auth et Prisma ORM  
**Problème :** Échec de soumission de mission avec erreur "Unauthorized" (401)  
**Date :** 07/11/2025

---

## 🔴 Problème Actuel

L'utilisateur tente de soumettre une réalisation via le formulaire `SubmissionForm`, mais la requête API vers `/api/submissions` échoue systématiquement avec une erreur **401 Unauthorized**.

### Symptômes Observés

1. **Côté Client (Navigateur) :**
   - Le formulaire se soumet correctement (pas d'erreurs de validation)
   - Message d'erreur affiché : "Unauthorized" en rouge
   - Console navigateur : `Submission error: {}` à la ligne 93 de `submission-form.tsx`
   - La réponse HTTP est `401` (non autorisé)

2. **Côté Serveur (Terminal Next.js) :**
   ```
   Middleware - /api/submissions - Session: null
   Middleware - /api/submissions - No session, returning 401
   ```
   - Le middleware intercepte la requête avant qu'elle n'atteigne l'API route
   - La session utilisateur est détectée comme `null`
   - Le middleware retourne immédiatement 401

3. **Logs Additionnels (quand l'API route est atteinte) :**
   ```
   getCurrentUser (API) - Cookies found: 1
   getCurrentUser (API) - Auth user: null Error: Auth session missing!
   ```
   - Un cookie est présent dans la requête
   - Mais la session Supabase n'est pas valide ou ne peut pas être récupérée

---

## 🔧 Historique des Corrections Apportées

### 1. Problème Initial : Formulaire ne se soumettait pas

**Symptômes :**
- Clic sur "Soumettre ma réalisation" ne déclenchait rien
- Console : `Form validation errors: {}` même sans erreurs

**Corrections :**
- ✅ `src/lib/validators.ts` : `missionId` changé de `.cuid()` à `.min(1)`
- ✅ `proofUrl` modifié pour accepter les chaînes vides optionnelles
- ✅ `src/components/submission-form.tsx` : Logique `onFormSubmit` simplifiée
- ✅ Ajout de `defaultValues: { missionId, proofUrl: '' }` dans `useForm`
- ✅ Les `files` sont maintenant manuellement ajoutés aux données
- ✅ Correction d'une erreur de build (`supabase` déclaré deux fois)

**Résultat :** Le formulaire se soumet maintenant correctement côté client.

### 2. Problème Actuel : Authentification échoue côté serveur

**Corrections Apportées :**

#### A. Modification de `getCurrentUser()` pour les API routes

**Fichier :** `src/lib/auth.ts`

```typescript
export async function getCurrentUser(req?: NextRequest, res?: NextResponse) {
  let email: string | null = null;
  if (req) {
    // API route: use NextRequest cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            if (res) {
              cookiesToSet.forEach(({ name, value, options }) => {
                res.cookies.set(name, value, options);
              });
            }
            // Otherwise, cookies are set by middleware
          },
        },
      }
    );
    // Use getUser() instead of getSession() for API routes
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    email = authUser?.email ?? null;
  } else {
    // Server Component: use cookies() from next/headers
    const session = await getSession();
    email = session?.user?.email ?? null;
  }
  // ...
}
```

**Changements :**
- ✅ Accepte `NextRequest` en paramètre optionnel
- ✅ Utilise `req.cookies.getAll()` pour les API routes
- ✅ Utilise `getUser()` au lieu de `getSession()` pour les API routes
- ✅ Logs de débogage ajoutés

#### B. Mise à jour de toutes les API routes

**Fichiers modifiés :**
- `src/app/api/submissions/route.ts`
- `src/app/api/user/me/route.ts`
- `src/app/api/user/xp/route.ts`
- `src/app/api/ratings/route.ts`
- `src/app/api/submissions/[id]/shots/route.ts`
- `src/app/api/submissions/[id]/accept/route.ts`
- `src/app/api/submissions/[id]/refuse/route.ts`
- `src/app/api/missions/route.ts`
- `src/app/api/missions/[id]/route.ts`
- `src/app/api/reports/route.ts`
- `src/app/api/threads/[id]/messages/route.ts`
- `src/app/api/admin/roles/route.ts`
- `src/app/api/admin/users/[email]/route.ts`
- `src/app/api/admin/annonceurs/[id]/certify/route.ts`
- `src/app/api/admin/moderation/[reportId]/route.ts`

**Changement :** Toutes les routes passent maintenant `req` à `getCurrentUser(req)`

#### C. Modification du formulaire de soumission

**Fichier :** `src/components/submission-form.tsx`

**Changements :**
- ✅ Ajout de `credentials: 'include'` dans la requête `fetch`
- ✅ Vérification de l'authentification côté client avant soumission
- ✅ Message d'erreur si l'utilisateur n'est pas connecté
- ✅ Logs de débogage ajoutés

```typescript
// Check if user is authenticated before submitting
const supabase = supabaseBrowser();
const { data: { user: authUser } } = await supabase.auth.getUser();
if (!authUser) {
  setError('Vous devez être connecté pour soumettre une mission. Veuillez vous connecter.');
  return;
}

// Step 1: create submission to get its id
const res = await fetch('/api/submissions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Ensure cookies are sent
  body: JSON.stringify({ 
    missionId, 
    proofUrl: values.proofUrl?.trim() || '', 
    proofShots: [] 
  })
});
```

#### D. Ajout de logs dans le middleware

**Fichier :** `src/middleware.ts`

```typescript
if (pathname.startsWith('/api/submissions')) {
  console.log('Middleware - /api/submissions - Session:', session ? session.user.email : 'null');
  if (!session) {
    console.log('Middleware - /api/submissions - No session, returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return res;
}
```

---

## 🔍 Configuration Actuelle

### Stack Technique

- **Framework :** Next.js 15.5.6 (App Router)
- **Authentification :** Supabase Auth avec `@supabase/ssr`
- **Base de données :** Prisma ORM (PostgreSQL)
- **Validation :** Zod avec `react-hook-form`
- **Middleware :** `src/middleware.ts` pour protection des routes

### Structure des Fichiers Clés

```
src/
├── lib/
│   ├── auth.ts          # getCurrentUser(), getSession(), etc.
│   ├── supabase.ts      # supabaseBrowser(), supabaseServer()
│   └── validators.ts    # Schemas Zod
├── middleware.ts        # Protection des routes API
├── components/
│   └── submission-form.tsx  # Formulaire de soumission
└── app/
    └── api/
        └── submissions/
            └── route.ts  # API route POST /api/submissions
```

### Configuration Middleware

**Fichier :** `src/middleware.ts`

```typescript
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  
  // Protection /api/submissions
  if (pathname.startsWith('/api/submissions')) {
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return res;
  }
  
  return res;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/missions',
    '/api/submissions/:path*',
    '/api/threads/:path*',
  ],
};
```

---

## 🤔 Hypothèses sur la Cause du Problème

### Hypothèse 1 : Cookies non envoyés par le client
**Probabilité :** Faible  
**Raison :** `credentials: 'include'` est présent, et c'est le comportement par défaut pour les requêtes same-origin.

### Hypothèse 2 : Cookies présents mais session invalide/expirée
**Probabilité :** Moyenne  
**Raison :** Les logs montrent "Cookies found: 1" mais "Auth user: null". Cela suggère que :
- Les cookies sont présents mais ne contiennent pas de session valide
- La session a expiré côté Supabase
- Les cookies ne sont pas les bons (pas de cookies Supabase)

### Hypothèse 3 : Problème de configuration `createServerClient` dans le middleware
**Probabilité :** Élevée  
**Raison :** Le middleware utilise `getSession()` qui peut ne pas fonctionner correctement avec la configuration actuelle des cookies. Il y a peut-être un problème avec la façon dont `setAll` gère les cookies dans le middleware.

### Hypothèse 4 : Problème de synchronisation entre client et serveur
**Probabilité :** Moyenne  
**Raison :** L'utilisateur peut être authentifié côté client (Supabase client) mais les cookies ne sont pas correctement synchronisés avec le serveur/middleware.

### Hypothèse 5 : Problème spécifique à Next.js 15 + Supabase SSR
**Probabilité :** Moyenne  
**Raison :** Next.js 15 a introduit des changements dans la gestion des cookies et des Server Components. Il peut y avoir une incompatibilité avec `@supabase/ssr`.

---

## ❓ Questions à Résoudre

1. **Pourquoi `getSession()` dans le middleware retourne `null` alors que l'utilisateur est connecté côté client ?**
   - Les cookies Supabase sont-ils réellement présents dans la requête HTTP ?
   - Y a-t-il un problème avec la façon dont `createServerClient` lit les cookies via `req.cookies.getAll()` ?

2. **Pourquoi `getUser()` dans l'API route retourne `null` même si un cookie est présent ?**
   - Le cookie présent est-il un cookie Supabase valide ?
   - Y a-t-il un problème avec la validation du token dans `getUser()` ?

3. **Le middleware devrait-il utiliser `getUser()` au lieu de `getSession()` ?**
   - `getSession()` peut-il échouer silencieusement si les cookies sont mal formatés ?
   - `getUser()` est-il plus robuste pour les API routes ?

4. **Y a-t-il un problème avec la configuration des cookies dans `createServerClient` ?**
   - Le `setAll` dans le middleware est-il correctement implémenté ?
   - Faut-il rafraîchir la session avant de la vérifier ?

5. **Comment diagnostiquer plus précisément le problème ?**
   - Peut-on logger le contenu exact des cookies reçus ?
   - Peut-on vérifier si les cookies Supabase (`sb-*-auth-token`) sont présents ?

---

## 🎯 Solutions à Explorer

### Solution 1 : Utiliser `getUser()` dans le middleware au lieu de `getSession()`
**Avantage :** `getUser()` peut être plus robuste pour valider les tokens  
**Inconvénient :** Peut être plus lent (appel réseau à Supabase)

### Solution 2 : Rafraîchir la session dans le middleware
**Avantage :** S'assure que la session est à jour  
**Inconvénient :** Peut ajouter de la latence

### Solution 3 : Désactiver temporairement la protection middleware pour `/api/submissions`
**Avantage :** Permet de tester si le problème vient du middleware ou de l'API route  
**Inconvénient :** Supprime la protection (à utiliser uniquement pour le debug)

### Solution 4 : Vérifier la configuration Supabase
**Avantage :** S'assure que les variables d'environnement sont correctes  
**Inconvénient :** Nécessite de vérifier manuellement

### Solution 5 : Utiliser une approche alternative (token dans header)
**Avantage :** Contourne les problèmes de cookies  
**Inconvénient :** Nécessite des modifications importantes du code

---

## 📊 État Actuel du Code

### Fichiers Modifiés Récemment

1. **`src/lib/auth.ts`** - `getCurrentUser()` modifié pour API routes
2. **`src/components/submission-form.tsx`** - Ajout de `credentials: 'include'` et vérification auth
3. **`src/middleware.ts`** - Ajout de logs de débogage
4. **Toutes les API routes** - Passage de `req` à `getCurrentUser(req)`

### Points d'Attention

- Le middleware intercepte la requête **avant** qu'elle n'atteigne l'API route
- Si le middleware retourne 401, l'API route n'est jamais exécutée
- Les logs montrent que le middleware trouve `session: null`
- Un cookie est présent mais ne contient pas de session valide

---

## 🔬 Prochaines Étapes de Diagnostic

1. **Vérifier les cookies dans le navigateur :**
   - Ouvrir DevTools > Application > Cookies
   - Vérifier la présence des cookies Supabase (`sb-*-auth-token`)
   - Vérifier leur domaine et leur expiration

2. **Vérifier la requête HTTP :**
   - Ouvrir DevTools > Network
   - Inspecter la requête POST vers `/api/submissions`
   - Vérifier l'onglet "Headers" > "Request Headers" pour les cookies

3. **Ajouter plus de logs :**
   - Logger le contenu exact des cookies dans le middleware
   - Logger les noms des cookies présents
   - Logger l'erreur complète de `getUser()` si disponible

4. **Tester avec un utilisateur fraîchement connecté :**
   - Se déconnecter et se reconnecter
   - Vérifier si le problème persiste

---

## 📝 Notes Additionnelles

- L'utilisateur peut voir la page de mission, ce qui suggère qu'il est connecté côté client
- D'autres API routes (`/api/user/me`, `/api/user/xp`) retournent également 401
- Le problème semble systémique, pas spécifique à `/api/submissions`
- Les logs montrent "Cookies found: 1" mais la session est toujours `null`

---

**Date de création :** 07/11/2025  
**Dernière mise à jour :** 07/11/2025  
**Statut :** 🔴 Problème non résolu

