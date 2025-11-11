# Configuration du bucket "feed-posts" dans Supabase Storage

## Étapes à suivre

### 1. Créer le bucket dans Supabase

1. Allez sur votre projet Supabase : https://supabase.com/dashboard
2. Cliquez sur **Storage** dans le menu de gauche
3. Cliquez sur **New bucket**
4. Configurez le bucket :
   - **Name** : `feed-posts`
   - **Public bucket** : ✅ **Coché** (pour permettre l'affichage des images)
   - **File size limit** : 5 MB (ou plus selon vos besoins)
   - **Allowed MIME types** : `image/*` (ou laissez vide pour tous les types)

5. Cliquez sur **Create bucket**

### 2. Configurer les politiques RLS (Row Level Security)

Une fois le bucket créé, vous devez configurer les politiques pour permettre :
- **INSERT** : Les utilisateurs authentifiés peuvent uploader
- **SELECT** : Tout le monde peut lire (puisque c'est un bucket public)

#### Politique pour INSERT (Upload)

1. Dans le bucket "feed-posts", cliquez sur **Policies**
2. Cliquez sur **New Policy**
3. Sélectionnez **For full customization**
4. Configurez :
   - **Policy name** : `Allow authenticated users to upload`
   - **Allowed operation** : `INSERT`
   - **Policy definition** :
   ```sql
   bucket_id = 'feed-posts'::text AND auth.role() = 'authenticated'::text
   ```
   - **With check expression** : 
   ```sql
   bucket_id = 'feed-posts'::text AND auth.role() = 'authenticated'::text
   ```
5. Cliquez sur **Review** puis **Save policy**

**IMPORTANT** : Si vous utilisez Supabase CLI ou SQL Editor, voici la commande SQL complète :

```sql
-- Politique INSERT pour les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feed-posts'::text
);
```

#### Politique pour SELECT (Lecture)

1. Cliquez sur **New Policy** à nouveau
2. Sélectionnez **For full customization**
3. Configurez :
   - **Policy name** : `Allow public read access`
   - **Allowed operation** : `SELECT`
   - **Policy definition** :
   ```sql
   bucket_id = 'feed-posts'::text
   ```
4. Cliquez sur **Review** puis **Save policy**

**IMPORTANT** : Si vous utilisez Supabase CLI ou SQL Editor, voici la commande SQL complète :

```sql
-- Politique SELECT pour lecture publique
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'feed-posts'::text
);
```

### 3. Structure des fichiers

Les fichiers seront organisés comme suit :
```
feed-posts/
  {userId}/
    {postId}/
      {timestamp}-{random}.{ext}
```

Exemple :
```
feed-posts/
  user-123/
    post-456/
      1699123456789-abc123.jpg
      1699123456790-def456.png
```

### 4. Validation des fichiers

- **Types acceptés** : `image/png`, `image/jpeg`, `image/jpg`, `image/webp`
- **Taille max** : 5 MB par fichier
- **Nombre max** : 3-5 fichiers par post (selon votre configuration)

### 5. Vérification

Pour vérifier que le bucket est correctement configuré :

1. Allez dans **Storage** → **feed-posts**
2. Essayez d'uploader un fichier de test
3. Vérifiez que le fichier est accessible publiquement

### 6. Utilisation dans le code

Le bucket sera utilisé dans :
- `src/components/feed/publish-modal.tsx` : Pour uploader les médias
- `src/components/feed/feed-card.tsx` : Pour afficher les médias
- `src/lib/supabase.ts` : Pour générer les URLs publiques

---

## Notes importantes

- ⚠️ **Sécurité** : Même si le bucket est public, seuls les utilisateurs authentifiés peuvent uploader grâce à la politique RLS
- ⚠️ **Performance** : Les images seront servies via CDN Supabase pour une meilleure performance
- ⚠️ **Coûts** : Surveillez l'utilisation du stockage pour éviter les coûts inattendus

---

**Date de création** : 2024-11-08
**Version** : 1.0




