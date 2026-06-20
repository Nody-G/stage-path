# Compétence : Interactions Timeline & Drag

> **Quand charger ce fichier** : travail sur la timeline, drag & drop, redimensionnement de blocs.

---

## Mécanisme de Pointer Capture

Le composant utilise les événements pointeur natifs pour un glissement fluide :

```typescript
// Capture au clic
handleBlockPointerDown(e) {
  e.currentTarget.setPointerCapture(e.pointerId);
}

// Libération au relâchement
handleBlockPointerUp(e) {
  e.currentTarget.releasePointerCapture(e.pointerId);
}
```

**Pourquoi** : la capture maintient le suivi même si la souris sort de la zone du bloc.

---

## Détection des Poignées (Resize vs Move)

Le type d'action est déterminé par la position du clic dans le bloc :

| Zone | Action | Curseur |
|---|---|---|
| < 8px du bord gauche | Redimensionnement début (`resize-start`) | `w-resize` |
| Zone centrale | Déplacement (`move`) | `grab` / `grabbing` |
| < 8px du bord droit | Redimensionnement fin (`resize-end`) | `e-resize` |

---

## Structure des Overlays

Trois divs absolument positionnés à l'intérieur du bloc :

```tsx
{/* Bord gauche — zone de 8px */}
<div className="absolute left-0 w-2 cursor-w-resize z-20" />

{/* Zone centrale — décalée de 8px des bords */}
<div className="absolute left-2 right-2 cursor-grab active:cursor-grabbing" />

{/* Bord droit — zone de 8px */}
<div className="absolute right-0 w-2 cursor-e-resize z-20" />
```

---

## Règles Critiques

1. **Pas de `pointer-events-none`** : les overlays doivent conserver `pointer-events` pour que le navigateur affiche le bon curseur système
2. **Bubbling** : utiliser `e.currentTarget` (conteneur du handler) et non `e.target` (l'élément cliqué) pour récupérer la bounding box
3. **Capture** : toujours capturer au `pointerDown` et libérer au `pointerUp`

---

## Zoom de la Timeline

- **Molette** : événement natif `{ passive: false }` sur le conteneur
- **Centrage** : le `scrollLeft` est ajusté pour maintenir le point sous le curseur
- **Facteur** : `1.05` par tick de molette
- **Limites** : `1x` (100%) à `20x` (2000%)
- **Boutons** : pas de `0.1` (10%)
