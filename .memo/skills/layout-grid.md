# Compétence : Grille & Structure de Mise en Page

> **Quand charger ce fichier** : modification de la disposition, ajout de panneaux, changement de layout.

---

## Grille Principale (`app-container`)

L'application utilise une grille CSS sur `.app-container` avec deux lignes :

```typescript
// Dans App.tsx — getGridRows()
const getGridRows = () => {
  if (timelineMode === 'full') return '1fr 220px';
  if (timelineMode === 'compact') return '1fr 80px';
  return '1fr 28px'; // 'collapsed'
};
```

- **Ligne 1** (`1fr`) : Zone de travail (canvas + sidebar)
- **Ligne 2** : Timeline/footer (hauteur dynamique selon le mode)

---

## Flexbox de l'Espace de Travail (`app-workspace`)

La zone de travail est divisée horizontalement :

### Colonne de Gauche (`flex-1 flex flex-col min-w-0 overflow-hidden h-full`)
- **Haut** : `HeaderPanel.tsx` (barre titre + navigation)
- **Bas** : `StageCanvas.tsx` (canvas interactif, `flex-1` pour prendre l'espace restant)

### Colonne de Droite
- `ControlSidebar.tsx` (largeur dynamique, contient les onglets)

---

## Positionnement Sidebar

La sidebar s'affiche à partir du bord supérieur (y=0) car `HeaderPanel` est uniquement dans la colonne de gauche. Les 4 onglets de la sidebar sont donc en haut de l'écran.

---

## Modes de Timeline

| Mode | Hauteur | Usage |
|---|---|---|
| `full` | 220px | Édition détaillée des mouvements |
| `compact` | 80px | Vue résumée |
| `collapsed` | 28px | Barre minimale |

---

## Points d'Attention

1. **Overflow** : la colonne gauche utilise `overflow-hidden` pour éviter les débordements
2. **Min-width** : `min-w-0` sur la colonne gauche permet le flex-shrink correct
3. **Hauteur** : `h-full` assure que la colonne prend toute la hauteur disponible
