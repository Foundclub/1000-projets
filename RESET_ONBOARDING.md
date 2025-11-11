# Comment réinitialiser l'onboarding pour tester

Si vous voulez tester l'onboarding avec un compte existant, vous devez réinitialiser le champ `roleChosenAt` dans la base de données.

## Option 1 : Via Prisma Studio (Recommandé)

1. Ouvrez Prisma Studio :
   ```bash
   npx prisma studio
   ```

2. Allez sur la table `User`
3. Trouvez votre utilisateur (par email : `gerard.steve19@gmail.com`)
4. Cliquez sur l'utilisateur pour l'éditer
5. Mettez le champ `roleChosenAt` à `null` (ou supprimez la valeur)
6. Sauvegardez

## Option 2 : Via SQL direct

Connectez-vous à votre base de données Supabase et exécutez :

```sql
UPDATE "User" SET "roleChosenAt" = NULL WHERE email = 'gerard.steve19@gmail.com';
```

## Option 3 : Créer un nouveau compte

Pour tester avec un compte complètement nouveau :
1. Utilisez un nouvel email (ex: `test-onboarding@example.com`)
2. Créez le compte via le lien magique
3. Vous devriez être redirigé vers `/onboarding/role`

## Vérification

Après avoir réinitialisé `roleChosenAt` :
1. Rafraîchissez la page `/missions`
2. Vous devriez être redirigé vers `/onboarding/role`
3. Vérifiez les logs du serveur pour voir les messages de débogage

