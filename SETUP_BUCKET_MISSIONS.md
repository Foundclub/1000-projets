# Configuration du bucket "missions" dans Supabase Storage

## Étapes à suivre

### 1. Créer le bucket dans Supabase

1. Allez sur votre projet Supabase : https://supabase.com/dashboard
2. Cliquez sur **Storage** dans le menu de gauche
3. Cliquez sur **New bucket**
4. Configurez le bucket :
   - **Name** : `missions`
   - **Public bucket** : ✅ **Coché** (pour permettre l'affichage des images)
   - **File size limit** : 5 MB (ou plus selon vos besoins)
   - **Allowed MIME types** : `image/*` (ou laissez vide pour tous les types)

5. Cliquez sur **Create bucket**

### 2. Configurer les politiques RLS (Row Level Security)

Une fois le bucket créé, vous devez configurer les politiques pour permettre :
- **INSERT** : Les utilisateurs authentifiés peuvent uploader
- **SELECT** : Tout le monde peut lire (puisque c'est un bucket public)

#### Politique pour INSERT (Upload)

1. Dans le bucket "missions", cliquez sur **Policies**
2. Cliquez sur **New Policy**
3. Sélectionnez **For full customization**
4. Configurez :
   - **Policy name** : `Allow authenticated users to upload`
   - **Allowed operation** : `INSERT`
   - **Policy definition** :
   ```sql
   bucket_id = 'missions'::text AND auth.role() = 'authenticated'::text
   ```
   - **With check expression** : 
   ```sql
   bucket_id = 'missions'::text AND auth.role() = 'authenticated'::text
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
  bucket_id = 'missions'::text
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
   bucket_id = 'missions'::text
   ```
   - **With check expression** : Même expression
4. Cliquez sur **Review** puis **Save policy**

**IMPORTANT** : Si vous utilisez Supabase CLI ou SQL Editor, voici la commande SQL complète :

```sql
-- Politique SELECT pour lecture publique
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'missions'::text
);
```

### Alternative : Utiliser le SQL Editor de Supabase

Si les politiques via l'interface ne fonctionnent pas, vous pouvez utiliser le **SQL Editor** de Supabase :

1. Allez dans **SQL Editor** dans le menu de gauche
2. Créez une nouvelle requête
3. Collez ce code SQL :

```sql
-- Supprimer les politiques existantes si elles existent (optionnel)
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- Politique INSERT pour les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'missions'::text
);

-- Politique SELECT pour lecture publique
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'missions'::text
);
```

4. Cliquez sur **Run** pour exécuter

### 3. Vérification

Après avoir créé le bucket et configuré les politiques, vous devriez pouvoir :
- Uploader des images lors de la création d'une mission
- Voir les images dans les missions (via URLs publiques ou signées)

### Note importante

Si vous préférez que les images soient privées (accessibles uniquement via URLs signées), vous pouvez :
- Créer le bucket comme **privé** (décocher "Public bucket")
- Ne créer que la politique INSERT pour les utilisateurs authentifiés
- Utiliser des URLs signées pour afficher les images (comme pour les `proofs`)

Pour l'instant, avec un bucket public, les images seront accessibles directement via l'URL publique de Supabase Storage.

