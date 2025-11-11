# Changements Effectués - Correction Authentification

## ✅ Modifications Appliquées

### 1. Middleware (`src/middleware.ts`)

**Changements :**
- ✅ Remplacé `getAll()/setAll()` par `get()/set()/remove()` dans la configuration des cookies
- ✅ Utilisé `getUser()` au lieu de `getSession()` pour récupérer l'utilisateur
- ✅ Ajouté `/api/missions/:path*` au matcher (au lieu de `/api/missions` seul)
- ✅ Simplifié la logique de protection des routes

**Code clé :**
```typescript
cookies: {
  get(name: string) {
    return req.cookies.get(name)?.value;
  },
  set(name: string, value: string, options: any) {
    res.cookies.set(name, value, options);
  },
  remove(name: string, options: any) {
    res.cookies.set(name, '', { ...options, maxAge: 0 });
  },
}
```

### 2. Helper Supabase (`src/lib/auth.ts`)

**Changements :**
- ✅ Créé la fonction `supabaseFromRequest(req, res)` pour créer un client Supabase avec `get/set/remove`
- ✅ Modifié `getCurrentUser()` pour accepter `req` et `res` (tous deux requis pour les API routes)
- ✅ Utilisé `getUser()` au lieu de `getSession()` pour les API routes

**Code clé :**
```typescript
export function supabaseFromRequest(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          res.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
}
```

### 3. Toutes les API Routes

**Changements :**
- ✅ Ajouté `const res = NextResponse.next();` au début de chaque handler
- ✅ Passé `req` et `res` à `getCurrentUser(req, res)`

**Fichiers modifiés :**
- `src/app/api/submissions/route.ts`
- `src/app/api/user/me/route.ts`
- `src/app/api/user/xp/route.ts`
- `src/app/api/ratings/route.ts`
- `src/app/api/missions/route.ts`
- `src/app/api/missions/[id]/route.ts`
- `src/app/api/submissions/[id]/shots/route.ts`
- `src/app/api/submissions/[id]/accept/route.ts`
- `src/app/api/submissions/[id]/refuse/route.ts`
- `src/app/api/reports/route.ts`
- `src/app/api/threads/[id]/messages/route.ts`
- `src/app/api/admin/roles/route.ts`
- `src/app/api/admin/users/[email]/route.ts`
- `src/app/api/admin/annonceurs/[id]/certify/route.ts`
- `src/app/api/admin/moderation/[reportId]/route.ts`

**Pattern appliqué :**
```typescript
export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    // ... rest of handler
  }
}
```

---

## 🧪 Tests à Effectuer

### Test 1 : Vérifier les cookies dans le navigateur

1. Ouvrir DevTools (F12) > Onglet "Application" > Section "Cookies"
2. Vérifier la présence des cookies Supabase :
   - `sb-<project-ref>-auth-token`
   - `sb-<project-ref>-auth-token.sig`
3. Vérifier que leur domaine est correct (`localhost` ou le domaine de l'app)
4. Vérifier que leur expiration est valide (pas expirés)

**Résultat attendu :** Les 2 cookies Supabase sont présents et valides.

---

### Test 2 : Vérifier la soumission de mission

1. S'assurer d'être connecté (aller sur `/login` si nécessaire)
2. Aller sur une page de mission (ex: `/missions/mission-pro-demo`)
3. Sélectionner une image dans le formulaire
4. Cliquer sur "Soumettre ma réalisation"
5. Vérifier que la soumission fonctionne (pas d'erreur "Unauthorized")

**Résultat attendu :** La soumission fonctionne sans erreur 401.

---

### Test 3 : Vérifier les autres API routes

1. Tester `/api/user/me` (devrait retourner 200 au lieu de 401)
2. Tester `/api/user/xp` (devrait retourner 200 au lieu de 401)
3. Tester `/api/ratings` (devrait fonctionner si connecté)

**Résultat attendu :** Toutes les API routes fonctionnent correctement.

---

### Test 4 : Vérifier les logs du serveur

1. Redémarrer le serveur (`npm run dev`)
2. Tester la soumission de mission
3. Vérifier les logs du terminal

**Résultat attendu :** Les logs ne montrent plus "Session: null" ou "No session, returning 401".

---

## 🔍 Vérifications Supplémentaires

### Vérifier la configuration Supabase

1. Aller dans Supabase Dashboard > Authentication > URL Configuration
2. Vérifier que :
   - **Site URL** : `http://localhost:3000` (ou le port utilisé)
   - **Redirect URLs** : `http://localhost:3000/**` (ou le port utilisé)

### Vérifier les variables d'environnement

1. Vérifier que `.env.local` contient :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Vérifier que ces variables sont correctes (pas d'espaces, pas de caractères spéciaux)

### Vérifier le port

Si le serveur tourne sur un port différent de 3000 :
- Aligner Supabase sur le bon port
- Ou forcer le port 3000 en fermant l'autre processus

---

## 📝 Notes Importantes

1. **Pourquoi `get/set/remove` au lieu de `getAll/setAll` ?**
   - Supabase SSR s'appuie sur `get/set/remove` pour rafraîchir/valider la session
   - Avec `getAll/setAll`, il ne lit/écrit pas correctement les cookies → session=null → 401

2. **Pourquoi `getUser()` au lieu de `getSession()` ?**
   - `getUser()` est plus robuste en middleware et API routes
   - `getSession()` peut ne pas fonctionner correctement avec la configuration actuelle

3. **Pourquoi `NextResponse.next()` dans chaque API route ?**
   - Supabase a besoin d'une réponse pour pouvoir setter les cookies
   - Sans `res`, les cookies ne peuvent pas être mis à jour

---

## ✅ Checklist de Validation

- [ ] Les cookies Supabase sont présents dans le navigateur
- [ ] La soumission de mission fonctionne sans erreur 401
- [ ] `/api/user/me` retourne 200 (au lieu de 401)
- [ ] `/api/user/xp` retourne 200 (au lieu de 401)
- [ ] Les logs du serveur ne montrent plus "Session: null"
- [ ] La configuration Supabase est correcte (URL et Redirect URLs)
- [ ] Les variables d'environnement sont correctes

---

**Date de modification :** 07/11/2025  
**Statut :** ✅ Modifications appliquées, en attente de tests

