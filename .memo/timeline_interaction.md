# Interactions de la Timeline & Drag (timeline_interaction.md)

Ce fichier détaille le fonctionnement du glissement (drag) et du redimensionnement (resize) des blocs de mouvement de la timeline dans [FooterTimeline.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/FooterTimeline.tsx).

## 1. Mécanisme de Pointer Capture
Pour assurer un glissement fluide et robuste (même si la souris sort temporairement de la zone du bloc ou de la fenêtre), le composant utilise les événements de pointeur standard (`onPointerDown`, `onPointerMove`, `onPointerUp`) combinés à la capture de pointeur :

- **Capture** : Déclenchée au clic dans `handleBlockPointerDown` par :
  `e.currentTarget.setPointerCapture(e.pointerId);`
- **Libération** : Déclenchée au relâchement dans `handleBlockPointerUp` par :
  `e.currentTarget.releasePointerCapture(e.pointerId);`

## 2. Détection des Poignées (Resize vs Move)
Le bloc calcule s'il doit effectuer un déplacement ou un redimensionnement selon l'endroit du clic :
- Clic à moins de 8px du bord gauche : redimensionnement du début (`resize-start`).
- Clic à moins de 8px du bord droit : redimensionnement de la fin (`resize-end`).
- Clic au milieu : déplacement du bloc (`move`).

## 3. Positionnement des Overlays et Curseurs
Trois divs absolument positionnés à l'intérieur du bloc de mouvement gèrent les indicateurs de curseur :
1. **Bord gauche** : class `absolute left-0 w-2 cursor-w-resize z-20` (zone de 8px de large).
2. **Zone centrale** : class `absolute left-2 right-2 cursor-grab active:cursor-grabbing` (zone centrale décalée de 8px des bords).
3. **Bord droit** : class `absolute right-0 w-2 cursor-e-resize z-20` (zone de 8px de large).

## 4. Règle Critique de Bubbling et Cursors
- **Pas de `pointer-events-none`** : Ces overlays de poignées doivent conserver la gestion des événements pointeur (`pointer-events` par défaut ou `pointer-events-auto`) afin que le navigateur affiche le bon curseur système (redimensionnement gauche/droite, main de déplacement).
- **Propagation (Bubbling)** : Au clic sur une poignée, l'événement remonte au parent. Le handler de l'élément parent récupère sa propre boîte de délimitation en utilisant **`e.currentTarget`** (qui désigne toujours le conteneur du handler, c'est-à-dire le bloc de mouvement lui-même) plutôt que `e.target` (qui désigne la poignée cliquée).

## 5. Zoom et Précision de la Timeline
- **Zoom à la molette** : Écouté via un événement natif `{ passive: false }` sur le conteneur défilable de la timeline (`timelineTracksRef`).
- **Centrage du zoom** : Lors du zoom à la molette, le défilement horizontal (`scrollLeft`) est ajusté dynamiquement pour maintenir le point situé sous le curseur de la souris à sa position relative dans le viewport.
- **Paramètres de précision** :
  - Facteur de zoom multiplicateur de `1.05` par tick de molette.
  - Limite de zoom de `1x` (100%) à `20x` (2000%).
  - Boutons `-` et `+` ajustant le zoom par pas de `0.1` (10%).

