# Problème : Modal d'image non centré, trop zoomé et non scrollable

## Description du problème

Lorsqu'un utilisateur clique sur une image de mission, un modal s'ouvre pour afficher l'image en grand format. Cependant, trois problèmes majeurs persistent :

1. **L'image n'est pas centrée sur l'écran** : L'image apparaît décalée (généralement vers la droite et vers le haut), et n'est pas centrée verticalement et horizontalement dans la fenêtre du navigateur.

2. **L'image est trop zoomée** : L'image s'affiche avec un zoom excessif par défaut, ce qui fait que seule une partie de l'image est visible, même sans action de l'utilisateur.

3. **Le scroll ne fonctionne pas** : Même si l'image est plus grande que l'écran ou zoomée, l'utilisateur ne peut pas scroller pour voir le reste de l'image. Le scroll vertical et horizontal ne fonctionne pas.

## Contexte technique

### Stack technique
- **Framework** : Next.js 15 (App Router)
- **Styling** : Tailwind CSS
- **Composants UI** : Shadcn/ui
- **TypeScript** : Oui

### Structure actuelle

Le modal est implémenté dans `src/components/image-modal.tsx` et est déclenché par `src/components/clickable-image.tsx`.

### Code actuel (simplifié)

```tsx
// src/components/image-modal.tsx
export function ImageModal({ src, alt, isOpen, onClose }: ImageModalProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm transition-opacity duration-300 overflow-y-auto overflow-x-hidden"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/95 to-black/90 transition-opacity duration-300 pointer-events-none" />
      
      {/* Boutons fixes */}
      <button className="fixed top-3 right-3 ...">Fermer</button>
      <div className="fixed bottom-3 left-1/2 ...">Actions</div>
      
      {/* Conteneur d'image */}
      <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 py-20 sm:py-24">
        <div className="relative flex items-center justify-center">
          <img
            src={src}
            alt={alt}
            className={`object-contain rounded-lg shadow-2xl transition-transform duration-300 ${
              isZoomed ? 'scale-150' : 'scale-100'
            }`}
            style={{ 
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 120px)',
              width: 'auto',
              height: 'auto',
              display: 'block'
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

## Problèmes identifiés

### 1. Problème de centrage

**Symptômes** :
- L'image n'est pas centrée verticalement et horizontalement
- L'image apparaît décalée vers la droite et vers le haut

**Causes probables** :
- Conflit entre `fixed inset-0` et `min-h-screen` dans le conteneur d'image
- Le conteneur avec `min-h-screen` peut créer un décalage si le parent a des contraintes
- Les boutons fixes (`fixed top-3 right-3`, `fixed bottom-3`) peuvent interférer avec le centrage
- Le padding (`py-20 sm:py-24`) peut créer un décalage vertical

**Tentatives de correction** :
- Utilisation de `flex items-center justify-center` sur le conteneur
- Utilisation de `min-h-screen` pour garantir une hauteur minimale
- Ajustement du padding vertical
- Utilisation de `margin: '0 auto'` sur l'image

**Résultat** : Le problème persiste

### 2. Problème de zoom

**Symptômes** :
- L'image s'affiche avec un zoom excessif par défaut
- Seule une partie de l'image est visible

**Causes probables** :
- Le zoom par défaut (`scale-100`) pourrait ne pas être appliqué correctement
- Les contraintes de taille (`maxHeight: 'calc(100vh - 120px)'`) pourraient forcer un zoom
- Le `object-contain` pourrait ne pas fonctionner correctement avec les contraintes de taille
- Les dimensions de l'image source pourraient être incorrectes

**Tentatives de correction** :
- Suppression du zoom par défaut
- Utilisation de `object-contain` pour préserver les proportions
- Ajustement des contraintes de taille (`maxWidth: '100%'`, `maxHeight: 'calc(100vh - 120px)'`)
- Utilisation de `width: 'auto'` et `height: 'auto'` pour préserver les proportions

**Résultat** : Le problème persiste

### 3. Problème de scroll

**Symptômes** :
- Le scroll vertical ne fonctionne pas
- Le scroll horizontal ne fonctionne pas
- Même si l'image est plus grande que l'écran, on ne peut pas scroller

**Causes probables** :
- Le body est verrouillé avec `overflow: hidden` dans le `useEffect`
- Le conteneur principal a `overflow-y-auto overflow-x-hidden` mais le conteneur d'image avec `min-h-screen` peut bloquer le scroll
- Les contraintes de taille (`maxHeight: 'calc(100vh - 120px)'`) peuvent empêcher le scroll si l'image est plus grande
- Le zoom (`scale-150`) peut faire sortir l'image de l'écran sans permettre le scroll

**Tentatives de correction** :
- Ajout de `overflow-y-auto overflow-x-hidden` sur le conteneur principal
- Utilisation de `min-h-screen` sur le conteneur d'image pour permettre le scroll
- Simplification de la structure (suppression des conteneurs imbriqués)
- Ajustement des contraintes de taille

**Résultat** : Le problème persiste

## Hypothèses supplémentaires

### 1. Conflit avec le body lock
Le `useEffect` qui verrouille le body avec `overflow: hidden` pourrait interférer avec le scroll du modal. Il faudrait peut-être permettre le scroll uniquement dans le modal tout en verrouillant le body.

### 2. Problème de viewport
Les calculs avec `100vh` peuvent être incorrects sur mobile à cause de la barre d'adresse du navigateur. Il faudrait peut-être utiliser `100dvh` (dynamic viewport height) ou une autre approche.

### 3. Problème de z-index ou de positionnement
Les boutons fixes (`fixed top-3 right-3`, `fixed bottom-3`) pourraient créer des conflits de positionnement avec le conteneur d'image.

### 4. Problème de CSS spécificité
Les classes Tailwind CSS pourraient être surchargées par d'autres styles globaux ou par des styles inline.

## Solutions à explorer

### Solution 1 : Utiliser un portal React
Utiliser `createPortal` pour rendre le modal directement dans le body, en dehors de la hiérarchie React normale, ce qui pourrait résoudre les problèmes de positionnement.

### Solution 2 : Utiliser une bibliothèque dédiée
Utiliser une bibliothèque comme `react-image-lightbox` ou `react-image-gallery` qui gère déjà le centrage, le zoom et le scroll.

### Solution 3 : Refactoriser complètement la structure
Créer une structure plus simple avec :
- Un conteneur principal `fixed inset-0` avec `overflow-y-auto`
- Un conteneur d'image centré avec `flex items-center justify-center` et `min-h-full`
- L'image avec des contraintes de taille appropriées

### Solution 4 : Utiliser CSS Grid ou Flexbox de manière plus robuste
Utiliser `display: grid` avec `place-items: center` pour un centrage plus fiable, ou utiliser `position: absolute` avec `top: 50%`, `left: 50%` et `transform: translate(-50%, -50%)`.

### Solution 5 : Gérer le scroll manuellement
Détecter si l'image est plus grande que l'écran et permettre le scroll uniquement dans ce cas, tout en verrouillant le body.

## Informations supplémentaires

### Fichiers concernés
- `src/components/image-modal.tsx` : Composant du modal
- `src/components/clickable-image.tsx` : Composant qui déclenche le modal
- `src/app/missions/[id]/page.tsx` : Page où le modal est utilisé
- `src/components/mission-card.tsx` : Autre endroit où le modal est utilisé

### Environnement de test
- **Navigateur** : Chrome (mobile et desktop)
- **OS** : Windows 10
- **Résolution** : Variable (mobile et desktop)

### Comportement attendu
1. L'image doit être centrée verticalement et horizontalement dans la fenêtre
2. L'image doit s'afficher à sa taille naturelle (adaptée à l'écran) sans zoom par défaut
3. Si l'image est plus grande que l'écran ou si elle est zoomée, l'utilisateur doit pouvoir scroller pour voir le reste de l'image
4. Les boutons (fermer, zoom, télécharger) doivent rester visibles et accessibles

### Comportement actuel
1. ❌ L'image n'est pas centrée (décalée vers la droite et vers le haut)
2. ❌ L'image est trop zoomée par défaut
3. ❌ Le scroll ne fonctionne pas

## Pistes de débogage

1. **Inspecter le DOM** : Vérifier les styles calculés dans les DevTools pour identifier les conflits CSS
2. **Tester avec une image de taille connue** : Utiliser une image avec des dimensions précises pour isoler le problème
3. **Tester sur différents navigateurs** : Vérifier si le problème est spécifique à Chrome
4. **Désactiver temporairement le body lock** : Vérifier si le verrouillage du body cause le problème
5. **Simplifier au maximum** : Créer une version minimale du modal pour identifier le problème de base

## Conclusion

Le problème semble être lié à une combinaison de problèmes de positionnement CSS, de gestion du scroll et de contraintes de taille. Une refactorisation complète de la structure du modal pourrait être nécessaire pour résoudre ces problèmes de manière définitive.



