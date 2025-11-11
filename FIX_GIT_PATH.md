# 🔧 Solution : Git non reconnu dans PowerShell

## ✅ Problème résolu temporairement

Git fonctionne maintenant dans cette session PowerShell. Mais pour que ça fonctionne dans toutes les nouvelles sessions, suivez les étapes ci-dessous.

---

## 🔄 Solution Rapide (Recommandée)

### 1. Fermer et rouvrir PowerShell

1. **Fermez complètement PowerShell** (fermez toutes les fenêtres)
2. **Rouvrez PowerShell**
3. Testez avec : `git --version`

Si ça fonctionne, c'est bon ! ✅

Si ça ne fonctionne toujours pas, passez à l'option 2.

---

## 🔧 Solution Permanente (Si l'option 1 ne fonctionne pas)

### Méthode 1 : Via l'interface graphique Windows

1. **Ouvrir les Variables d'environnement** :
   - Appuyez sur `Windows + R`
   - Tapez : `sysdm.cpl` et appuyez sur Entrée
   - Cliquez sur l'onglet **"Avancé"**
   - Cliquez sur **"Variables d'environnement"**

2. **Ajouter Git au PATH** :
   - Dans la section **"Variables système"**, trouvez la variable **"Path"**
   - Cliquez sur **"Modifier"**
   - Cliquez sur **"Nouveau"**
   - Ajoutez : `C:\Program Files\Git\bin`
   - Cliquez sur **"OK"** sur toutes les fenêtres

3. **Fermer et rouvrir PowerShell**

### Méthode 2 : Via PowerShell (Administrateur)

1. **Ouvrir PowerShell en tant qu'administrateur** :
   - Clic droit sur PowerShell
   - Sélectionner **"Exécuter en tant qu'administrateur"**

2. **Exécuter cette commande** :
   ```powershell
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\Git\bin", [EnvironmentVariableTarget]::Machine)
   ```

3. **Fermer et rouvrir PowerShell**

---

## ✅ Vérification

Après avoir appliqué une des solutions, testez :

```powershell
git --version
```

Vous devriez voir : `git version 2.xx.x.windows.x`

---

## 🚀 Pour cette session actuelle

Si vous voulez continuer à utiliser Git dans cette session PowerShell actuelle, exécutez cette commande :

```powershell
$env:Path += ";C:\Program Files\Git\bin"
```

**Note** : Cette modification ne dure que pour cette session. Dès que vous fermez PowerShell, il faudra refaire cette commande ou appliquer une solution permanente.

---

## 📝 Pourquoi ça arrive ?

Quand vous installez Git, l'installateur devrait normalement ajouter Git au PATH automatiquement. Mais parfois :
- L'option n'a pas été cochée lors de l'installation
- Le PATH n'a pas été mis à jour dans la session PowerShell actuelle
- Il faut redémarrer PowerShell pour que les changements prennent effet

---

## 🆘 Si rien ne fonctionne

1. **Réinstaller Git** :
   - Téléchargez Git depuis [git-scm.com/download/win](https://git-scm.com/download/win)
   - Pendant l'installation, **assurez-vous de cocher** :
     - ✅ "Git from the command line and also from 3rd-party software"
   - Redémarrez votre ordinateur après l'installation

2. **Vérifier l'installation** :
   ```powershell
   Test-Path "C:\Program Files\Git\bin\git.exe"
   ```
   Si ça retourne `True`, Git est installé mais pas dans le PATH.

---

## ✅ Résumé

- ✅ Git est installé sur votre PC (`C:\Program Files\Git\bin\git.exe`)
- ✅ Git fonctionne dans cette session PowerShell
- ⚠️ Pour les nouvelles sessions : fermez et rouvrez PowerShell, ou ajoutez Git au PATH de manière permanente

