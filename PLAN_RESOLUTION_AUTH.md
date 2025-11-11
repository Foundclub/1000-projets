# Plan de Résolution - Problème d'Authentification

## 🎯 Objectif

Résoudre le problème d'authentification où le middleware et les API routes ne peuvent pas récupérer la session utilisateur, retournant systématiquement `session: null` malgré que l'utilisateur soit connecté côté client.

---

## 📋 Phase 1 : Diagnostic Approfondi

### Étape 1.1 : Vérifier les cookies dans le navigateur

**Action :**
1. Ouvrir DevTools (F12) > Onglet "Application" > Section "Cookies"
2. Vérifier la présence des cookies Supabase :
   - `sb-<project-ref>-auth-token`
   - `sb-<project-ref>-auth-token.0` (si le token est trop long)
   - Autres cookies Supabase (`sb-*-auth-token`)

**Vérifications :**
- ✅ Les cookies sont-ils présents ?
- ✅ Leur domaine est-il correct (`localhost` ou le domaine de l'app) ?
- ✅ Leur expiration est-elle valide (pas expirés) ?
- ✅ Leur valeur est-elle non vide ?

**Résultat attendu :** Confirmer que les cookies Supabase sont présents et valides côté client.

---

### Étape 1.2 : Vérifier les cookies dans la requête HTTP

**Action :**
1. Ouvrir DevTools > Onglet "Network"
2. Soumettre le formulaire de mission
3. Inspecter la requête POST vers `/api/submissions`
4. Vérifier l'onglet "Headers" > Section "Request Headers"

**Vérifications :**
- ✅ Le header `Cookie:` est-il présent dans la requête ?
- ✅ Les cookies Supabase sont-ils inclus dans le header `Cookie:` ?
- ✅ Le format des cookies est-il correct ?

**Résultat attendu :** Confirmer que les cookies sont envoyés avec la requête HTTP.

---

### Étape 1.3 : Logger les cookies dans le middleware

**Action :**
Modifier `src/middleware.ts` pour logger les cookies reçus :

```typescript
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // DEBUG: Log cookies
  const cookies = req.cookies.getAll();
  console.log('Middleware - Cookies received:', cookies.map(c => ({
    name: c.name,
    value: c.value.substring(0, 20) + '...', // Log first 20 chars only
    hasValue: !!c.value
  })));
  
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
  
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('Middleware - Session:', session ? session.user.email : 'null');
  console.log('Middleware - Error:', error?.message || 'none');
  
  // ... rest of middleware
}
```

**Vérifications :**
- ✅ Les cookies sont-ils reçus par le middleware ?
- ✅ Les cookies Supabase sont-ils présents dans la liste ?
- ✅ Y a-t-il une erreur lors de la récupération de la session ?

**Résultat attendu :** Identifier si les cookies arrivent au middleware et pourquoi la session n'est pas récupérée.

---

### Étape 1.4 : Vérifier les variables d'environnement

**Action :**
1. Vérifier que `.env.local` contient :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Vérifier que ces variables sont accessibles dans le middleware

**Vérifications :**
- ✅ Les variables sont-elles définies ?
- ✅ Leur valeur est-elle correcte (pas de caractères spéciaux, pas d'espaces) ?
- ✅ Le middleware peut-il y accéder ?

**Résultat attendu :** Confirmer que la configuration Supabase est correcte.

---

## 🔧 Phase 2 : Solutions à Tester (par ordre de priorité)

### Solution 1 : Utiliser `getUser()` dans le middleware au lieu de `getSession()`

**Hypothèse :** `getSession()` peut ne pas fonctionner correctement avec la configuration actuelle, tandis que `getUser()` peut être plus robuste.

**Action :**
Modifier `src/middleware.ts` :

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
  
  // Use getUser() instead of getSession()
  const { data: { user }, error } = await supabase.auth.getUser();
  const session = user ? { user } : null;
  
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();
  
  // Admin pages: require sign-in
  if (pathname.startsWith('/admin')) {
    if (!session) return NextResponse.redirect(new URL('/login', req.url));
    return res;
  }
  
  // API protections
  if (pathname === '/api/missions' && method === 'POST') {
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return res;
  }
  if (pathname.startsWith('/api/submissions')) {
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return res;
  }
  // ... rest of middleware
}
```

**Test :**
1. Redémarrer le serveur
2. Tester la soumission de mission
3. Vérifier les logs du serveur

**Résultat attendu :** La session est récupérée correctement.

---

### Solution 2 : Rafraîchir la session dans le middleware

**Hypothèse :** La session peut être expirée ou nécessiter un rafraîchissement.

**Action :**
Modifier `src/middleware.ts` pour rafraîchir la session :

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
  
  // Refresh session before checking
  await supabase.auth.refreshSession();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  // ... rest of middleware
}
```

**Test :**
1. Redémarrer le serveur
2. Tester la soumission de mission
3. Vérifier les logs du serveur

**Résultat attendu :** La session est rafraîchie et récupérée correctement.

---

### Solution 3 : Désactiver temporairement la protection middleware pour `/api/submissions`

**Hypothèse :** Le problème vient du middleware, pas de l'API route. En désactivant la protection middleware, on peut tester si l'API route fonctionne correctement.

**Action :**
Modifier `src/middleware.ts` pour commenter la protection :

```typescript
if (pathname.startsWith('/api/submissions')) {
  // TEMPORARY: Disable middleware protection to test API route
  // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return res;
}
```

**Test :**
1. Redémarrer le serveur
2. Tester la soumission de mission
3. Vérifier si l'API route est atteinte et si `getCurrentUser(req)` fonctionne

**Résultat attendu :** Si l'API route fonctionne, le problème vient du middleware. Si elle ne fonctionne pas, le problème vient de `getCurrentUser()`.

**⚠️ Important :** Réactiver la protection après le test !

---

### Solution 4 : Vérifier la configuration Supabase SSR

**Hypothèse :** La configuration de `createServerClient` peut être incorrecte pour Next.js 15.

**Action :**
Vérifier la documentation Supabase SSR pour Next.js 15 et comparer avec notre configuration actuelle.

**Vérifications :**
- ✅ La configuration des cookies est-elle correcte ?
- ✅ Y a-t-il des changements dans Next.js 15 qui affectent la gestion des cookies ?
- ✅ Faut-il utiliser une approche différente pour Next.js 15 ?

**Résultat attendu :** Identifier si la configuration doit être ajustée pour Next.js 15.

---

### Solution 5 : Utiliser une approche alternative (token dans header)

**Hypothèse :** Si les cookies ne fonctionnent pas, on peut passer un token dans le header Authorization.

**Action :**
1. Modifier le client pour envoyer le token dans le header :
   ```typescript
   const { data: { session } } = await supabase.auth.getSession();
   const token = session?.access_token;
   
   const res = await fetch('/api/submissions', {
     method: 'POST',
     headers: { 
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify({ ... })
   });
   ```

2. Modifier l'API route pour lire le token du header :
   ```typescript
   const authHeader = req.headers.get('Authorization');
   const token = authHeader?.replace('Bearer ', '');
   if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   
   const supabase = createServerClient(...);
   const { data: { user } } = await supabase.auth.getUser(token);
   ```

**Test :**
1. Modifier le code client et serveur
2. Tester la soumission de mission
3. Vérifier si l'authentification fonctionne

**Résultat attendu :** L'authentification fonctionne avec le token dans le header.

**⚠️ Note :** Cette solution est un contournement. Il est préférable de résoudre le problème des cookies.

---

## 🧪 Phase 3 : Tests et Validation

### Test 1 : Test de connexion/déconnexion

**Action :**
1. Se déconnecter complètement
2. Se reconnecter
3. Tester immédiatement la soumission de mission

**Résultat attendu :** La session est fraîche et devrait fonctionner.

---

### Test 2 : Test avec un utilisateur différent

**Action :**
1. Se connecter avec un autre compte
2. Tester la soumission de mission

**Résultat attendu :** Confirmer si le problème est spécifique à un utilisateur ou général.

---

### Test 3 : Test des autres API routes

**Action :**
1. Tester `/api/user/me`
2. Tester `/api/user/xp`
3. Tester `/api/ratings`

**Résultat attendu :** Confirmer si le problème affecte toutes les API routes ou seulement `/api/submissions`.

---

## 📝 Phase 4 : Documentation et Nettoyage

### Étape 4.1 : Retirer les logs de débogage

**Action :**
Une fois le problème résolu, retirer tous les `console.log` de débogage ajoutés.

**Fichiers à nettoyer :**
- `src/middleware.ts`
- `src/lib/auth.ts`
- `src/app/api/submissions/route.ts`
- `src/components/submission-form.tsx`

---

### Étape 4.2 : Documenter la solution

**Action :**
Ajouter des commentaires dans le code expliquant pourquoi la solution fonctionne.

**Exemple :**
```typescript
// Note: We use getUser() instead of getSession() in middleware
// because getSession() doesn't work correctly with Next.js 15 + Supabase SSR
const { data: { user } } = await supabase.auth.getUser();
```

---

## 🎯 Ordre d'Exécution Recommandé

1. **Phase 1 : Diagnostic** (30-45 min)
   - Étape 1.1 : Vérifier les cookies dans le navigateur
   - Étape 1.2 : Vérifier les cookies dans la requête HTTP
   - Étape 1.3 : Logger les cookies dans le middleware
   - Étape 1.4 : Vérifier les variables d'environnement

2. **Phase 2 : Solutions** (1-2 heures)
   - Solution 1 : Utiliser `getUser()` dans le middleware (priorité haute)
   - Solution 2 : Rafraîchir la session (si Solution 1 ne fonctionne pas)
   - Solution 3 : Désactiver temporairement la protection (pour diagnostic)
   - Solution 4 : Vérifier la configuration Supabase SSR (si Solutions 1-3 ne fonctionnent pas)
   - Solution 5 : Approche alternative avec token (dernier recours)

3. **Phase 3 : Tests** (30 min)
   - Test 1 : Test de connexion/déconnexion
   - Test 2 : Test avec un utilisateur différent
   - Test 3 : Test des autres API routes

4. **Phase 4 : Documentation** (15 min)
   - Retirer les logs de débogage
   - Documenter la solution

---

## ✅ Checklist de Résolution

- [ ] Phase 1 : Diagnostic complet effectué
- [ ] Phase 2 : Solution testée et fonctionnelle
- [ ] Phase 3 : Tests de validation réussis
- [ ] Phase 4 : Code nettoyé et documenté
- [ ] Problème résolu : La soumission de mission fonctionne
- [ ] Autres API routes fonctionnent correctement

---

## 📚 Ressources Utiles

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js 15 Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Next.js 15 Cookies Documentation](https://nextjs.org/docs/app/api-reference/functions/cookies)

---

**Date de création :** 07/11/2025  
**Statut :** 🔄 En attente d'exécution

