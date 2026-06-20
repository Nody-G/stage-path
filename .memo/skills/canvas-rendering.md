# Compétence : Rendu Canvas

> **Quand charger ce fichier** : modification du canvas, des interactions de dessin, ou du rendu des trajectoires.

---

## Architecture

| Fichier | Rôle |
|---|---|
| `src/components/StageCanvas.tsx` | Orchestration (< 300 lignes), ne fait que coordonner |
| `src/hooks/useCanvasInteractions.ts` | Toute la logique d'interaction (clic, drag, zoom, pan) |
| `src/utils/canvasRenderers.ts` | Toutes les fonctions de dessin (artistes, trajectoires, grille, etc.) |

**Règle** : `StageCanvas.tsx` ne contient AUCUNE logique de dessin. Il délègue tout.

---

## Résolution & Échelle

- **Résolution interne max** : 2500px (côté le plus long)
- **constantScale** : facteur `1/zoom` appliqué aux éléments pour qu'ils restent lisibles à tout niveau de zoom
- **DPI** : le canvas s'adapte au `devicePixelRatio` pour la netteté sur écrans Retina

---

## Système de Zoom

- **Molette** : zoom centré sur le pointeur
- **Pinch** : zoom tactile (si supporté)
- **Boutons** : zoom +/- avec pas configurable
- **Limites** : typiquement 0.1x à 5x

---

## Rendu des Trajectoires

Les trajectoires sont des courbes de Bézier cubiques avec :
- **Points de contrôle** : définis par l'utilisateur
- **LUT longueur-arc** : précalculée pour un échantillonnage uniforme
- **Interpolation** : évaluation par subdivision de De Casteljau

---

## Patterns de Dessin

```typescript
// Structure typique dans canvasRenderers.ts
export function drawScene(ctx: CanvasRenderingContext2D, state: RenderState) {
  ctx.save();
  // 1. Appliquer les transformations (zoom, pan)
  // 2. Dessiner le fond/la grille
  // 3. Dessiner les trajectoires
  // 4. Dessiner les artistes
  // 5. Dessiner les overlays (sélection, hover)
  ctx.restore();
}
```

---

## Points d'Attention

1. **Performance** : ne pas redessiner à chaque frame si rien n'a changé (utiliser un flag `dirty`)
2. **Hiérarchie de rendu** : fond → grille → trajectoires → artistes → overlays → HUD
3. **Épaisseurs** : utiliser `constantScale` pour que les traits restent visibles au zoom
4. **Texte** : toujours mesurer avec `ctx.measureText()` avant de dessiner
