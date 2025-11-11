# Guide de tests étape par étape - 1000 Projets

## Prérequis

1. **Vérifier que l'application démarre** :
   ```bash
   npm run dev
   ```
   L'application doit être accessible sur `http://localhost:3000` (ou le port configuré)

2. **Vérifier la base de données** :
   - Les migrations Prisma doivent être appliquées
   - Avoir au moins 2 comptes email différents pour tester (un pour annonceur, un pour missionnaire)

---

## ÉTAPE 1 : Test de connexion (Login)

### Actions à faire :
1. Ouvrir `http://localhost:3000` dans votre navigateur
2. Vous devriez être redirigé vers `/missions`
3. Cliquer sur "Login" dans le header
4. Entrer votre email (ex: `test@example.com`)
5. Cliquer sur "Envoyer lien magique"
6. Vérifier votre boîte email et cliquer sur le lien magique
7. Vous devriez être connecté et voir votre email dans le header

### Screenshots à prendre :
- 📸 **Screenshot 1** : Page de login (`/login`)
- 📸 **Screenshot 2** : Message de confirmation "Vérifiez votre email"
- 📸 **Screenshot 3** : Page `/missions` après connexion (avec votre email dans le header)

---

## ÉTAPE 2 : Test du feed missions

### Actions à faire :
1. Aller sur `/missions`
2. Vérifier que vous voyez deux onglets : "PRO" et "SOLIDAIRE"
3. Cliquer sur l'onglet "PRO" - vérifier que les missions PRO s'affichent
4. Cliquer sur l'onglet "SOLIDAIRE" - vérifier que les missions SOLIDAIRE s'affichent
5. Vérifier que chaque carte mission affiche :
   - Le titre
   - Le badge PRO ou SOLIDAIRE
   - Les étoiles de notation (ou "Nouveau" si pas de notes)
   - Le badge "Certifié" si l'annonceur est certifié
   - Les slots (ex: "2/5 slots")
   - Le SLA (ex: "48h")

### Screenshots à prendre :
- 📸 **Screenshot 4** : Feed missions PRO avec plusieurs missions
- 📸 **Screenshot 5** : Feed missions SOLIDAIRE
- 📸 **Screenshot 6** : Une carte mission détaillée (montrant étoiles + badge certifié si présent)

---

## ÉTAPE 3 : Test de création de mission (si vous êtes ADMIN ou ANNONCEUR)

### Actions à faire :
1. Si vous n'êtes pas ADMIN ou ANNONCEUR, passer à l'étape suivante
2. Créer une mission via l'API ou directement en base de données
3. Vérifier qu'elle apparaît dans le feed

### Screenshots à prendre :
- 📸 **Screenshot 7** : Une mission nouvellement créée dans le feed

---

## ÉTAPE 4 : Test de la page détail mission

### Actions à faire :
1. Cliquer sur une mission dans le feed pour aller sur `/missions/[id]`
2. Vérifier que la page affiche :
   - Le titre de la mission
   - Le badge PRO ou SOLIDAIRE
   - Les étoiles de notation + badge certifié (si annonceur certifié)
   - Les slots occupés
   - Les SLA (Décision et Remise)
   - La description
   - Les critères d'acceptation
   - Le formulaire de soumission
3. Si vous êtes owner/admin de cette mission, vérifier qu'une section "Preuves soumises" apparaît

### Screenshots à prendre :
- 📸 **Screenshot 8** : Page détail mission complète (avec étoiles + badge si présent)
- 📸 **Screenshot 9** : Section "Preuves soumises" (si vous êtes owner/admin)

---

## ÉTAPE 5 : Test de soumission (si vous êtes MISSIONNAIRE)

### Actions à faire :
1. Sur la page détail mission, remplir le formulaire de soumission :
   - Option 1 : Entrer une URL (ex: `https://github.com/username/repo`)
   - Option 2 : Uploader 1-3 fichiers (PNG, JPG, ou MP4, max 10Mo chacun)
   - Option 3 : Les deux
2. Cliquer sur "Soumettre ma réalisation"
3. Vérifier le message de succès
4. Vérifier que le formulaire se réinitialise

### Cas limites à tester :
- Essayer de soumettre sans URL ni fichier → doit afficher une erreur
- Essayer de soumettre un fichier > 10Mo → doit afficher une erreur
- Essayer de soumettre sur une mission fermée → le formulaire doit être désactivé

### Screenshots à prendre :
- 📸 **Screenshot 10** : Formulaire de soumission rempli
- 📸 **Screenshot 11** : Message de succès après soumission
- 📸 **Screenshot 12** : Message d'erreur si mission fermée/slots atteints

---

## ÉTAPE 6 : Test Accept/Refuse (si vous êtes owner/admin)

### Actions à faire :
1. Si vous êtes owner d'une mission, aller voir les soumissions
2. Accepter une soumission :
   - Vérifier que les slotsTaken augmentent
   - Vérifier que la mission se ferme automatiquement si slotsTaken === slotsMax
   - Vérifier que l'XP est attribué au missionnaire
3. Refuser une soumission :
   - Entrer un motif (obligatoire)
   - Vérifier que la soumission passe en REFUSED

### Screenshots à prendre :
- 📸 **Screenshot 13** : Interface d'acceptation/refus (si visible)
- 📸 **Screenshot 14** : Mission fermée automatiquement après acceptation (si slots max atteints)

---

## ÉTAPE 7 : Test du chat (Thread)

### Actions à faire :
1. Après acceptation d'une soumission, un thread doit être créé
2. Aller sur `/threads/[id]` (l'ID du thread)
3. Vérifier que :
   - Les messages précédents s'affichent
   - Vous pouvez envoyer un nouveau message
   - Les messages apparaissent en temps réel (ouvrir dans 2 onglets pour tester)
   - Les emails/téléphones sont masqués automatiquement
4. Si vous êtes le missionnaire avec submission ACCEPTED, vérifier que le bouton "Noter l'annonceur" apparaît

### Screenshots à prendre :
- 📸 **Screenshot 15** : Page thread avec messages
- 📸 **Screenshot 16** : Bouton "Noter l'annonceur" visible (si vous êtes missionnaire)

---

## ÉTAPE 8 : Test de notation annonceur

### Actions à faire :
1. Si vous êtes missionnaire avec submission ACCEPTED, cliquer sur "Noter l'annonceur"
2. Un dialog doit s'ouvrir avec :
   - 5 étoiles cliquables
   - Un champ commentaire (optionnel)
3. Sélectionner une note (1-5 étoiles)
4. Optionnellement ajouter un commentaire
5. Cliquer sur "Envoyer la note"
6. Vérifier le message de succès
7. Vérifier que les étoiles se mettent à jour sur :
   - La page mission détail
   - Le feed missions (carte de la mission)
8. Vérifier que le bouton "Noter l'annonceur" disparaît après notation

### Screenshots à prendre :
- 📸 **Screenshot 17** : Dialog de notation (étoiles + commentaire)
- 📸 **Screenshot 18** : Message de succès après notation
- 📸 **Screenshot 19** : Étoiles mises à jour sur la page mission (ex: "⭐ 4.5 (1 avis)")
- 📸 **Screenshot 20** : Étoiles mises à jour sur le feed missions

---

## ÉTAPE 9 : Test du badge certifié

### Actions à faire :
1. Aller sur `/admin/roles` (si vous êtes ADMIN)
2. Entrer l'email d'un annonceur
3. Vérifier que la section "Certification" apparaît
4. Cliquer sur le toggle "Certifier (badge bleu)"
5. Vérifier que le badge "Certifié" apparaît :
   - Sur le feed missions (carte de la mission)
   - Sur la page mission détail
6. Essayer de certifier un MISSIONNAIRE → doit afficher une erreur

### Screenshots à prendre :
- 📸 **Screenshot 21** : Page admin/roles avec toggle certification
- 📸 **Screenshot 22** : Badge "Certifié" visible sur le feed missions
- 📸 **Screenshot 23** : Badge "Certifié" visible sur la page mission détail
- 📸 **Screenshot 24** : Message d'erreur si tentative de certifier un MISSIONNAIRE

---

## ÉTAPE 10 : Test des preuves (URLs signées)

### Actions à faire :
1. Si vous êtes owner/admin d'une mission avec des soumissions :
2. Aller sur `/missions/[id]`
3. Vérifier que la section "Preuves soumises" apparaît
4. Vérifier que :
   - Les URLs s'affichent (si fournies)
   - Les images/vidéos s'affichent avec des URLs signées
   - Le statut de chaque soumission est visible
5. Si vous êtes missionnaire (pas owner/admin), vérifier que vous NE voyez PAS les preuves

### Screenshots à prendre :
- 📸 **Screenshot 25** : Section "Preuves soumises" avec images/vidéos (owner/admin)
- 📸 **Screenshot 26** : Page mission SANS section preuves (missionnaire)

---

## ÉTAPE 11 : Test du système XP

### Actions à faire :
1. Vérifier que les barres XP s'affichent dans le header :
   - Niveau global
   - Barre de progression
   - XP PRO
   - XP SOLIDAIRE
2. Après acceptation d'une soumission, vérifier que l'XP augmente
3. Vérifier que le niveau augmente si le seuil est atteint

### Screenshots à prendre :
- 📸 **Screenshot 27** : Barres XP dans le header (avant acceptation)
- 📸 **Screenshot 28** : Barres XP dans le header (après acceptation)

---

## ÉTAPE 12 : Test des garde-fous UX

### Actions à faire :
1. Créer une mission avec `slotsMax = 1`
2. Accepter une soumission → la mission doit se fermer automatiquement
3. Essayer de soumettre sur cette mission fermée → le formulaire doit être désactivé avec message "Mission fermée"
4. Créer une mission avec `slotsMax = 2` et `slotsTaken = 2`
5. Essayer de soumettre → le formulaire doit être désactivé avec message "Tous les slots sont occupés"

### Screenshots à prendre :
- 📸 **Screenshot 29** : Formulaire désactivé avec message "Mission fermée"
- 📸 **Screenshot 30** : Formulaire désactivé avec message "Tous les slots sont occupés"

---

## ÉTAPE 13 : Test rate limiting

### Actions à faire :
1. Essayer de créer plusieurs missions rapidement (5+ en 1 minute) → doit retourner 429
2. Essayer de soumettre plusieurs fois rapidement (10+ en 1 minute) → doit retourner 429
3. Essayer de noter plusieurs fois rapidement (5+ en 1 minute) → doit retourner 429

### Screenshots à prendre :
- 📸 **Screenshot 31** : Message d'erreur 429 "Too Many Requests" (si possible)

---

## Checklist finale

Avant de me partager les screenshots, vérifiez que :

- [ ] Toutes les pages principales fonctionnent
- [ ] Les étoiles de notation s'affichent correctement
- [ ] Le badge "Certifié" s'affiche quand activé
- [ ] Les preuves ne sont visibles que pour owner/admin
- [ ] Le formulaire de soumission se désactive correctement
- [ ] Les messages de succès/erreur s'affichent
- [ ] Le chat fonctionne en temps réel
- [ ] Les barres XP s'affichent et se mettent à jour

---

## Liste des screenshots à prendre (résumé)

1. Page login
2. Message confirmation email
3. Page missions après connexion
4. Feed missions PRO
5. Feed missions SOLIDAIRE
6. Carte mission détaillée (étoiles + badge)
7. Mission nouvellement créée
8. Page détail mission complète
9. Section "Preuves soumises" (owner/admin)
10. Formulaire de soumission rempli
11. Message de succès après soumission
12. Message d'erreur mission fermée
13. Interface acceptation/refus
14. Mission fermée automatiquement
15. Page thread avec messages
16. Bouton "Noter l'annonceur"
17. Dialog de notation
18. Message de succès après notation
19. Étoiles mises à jour (page mission)
20. Étoiles mises à jour (feed)
21. Page admin/roles avec toggle
22. Badge certifié (feed)
23. Badge certifié (page mission)
24. Erreur certification MISSIONNAIRE
25. Preuves soumises (owner/admin)
26. Page mission SANS preuves (missionnaire)
27. Barres XP (avant)
28. Barres XP (après)
29. Formulaire désactivé "Mission fermée"
30. Formulaire désactivé "Slots occupés"
31. Erreur 429 rate limiting

---

## Notes importantes

- Si une fonctionnalité ne fonctionne pas, notez-le et prenez quand même un screenshot
- Les screenshots peuvent être partagés dans l'ordre ou par groupe (ex: tous les screenshots de notation ensemble)
- N'hésitez pas à me poser des questions si quelque chose n'est pas clair !

