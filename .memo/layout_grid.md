# Grille & Structure de la Mise en Page (layout_grid.md)

L'application utilise une grille principale sur l'élément `.app-container` et une structure Flexbox pour l'espace de travail.

## 1. Grille Dynamique (`app-container`)
L'élément principal utilise deux lignes (la zone de travail et la timeline/footer) définies par la fonction `getGridRows()` dans [App.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/App.tsx) et appliquées en style en ligne :

```typescript
const getGridRows = () => {
  if (timelineMode === 'full') return '1fr 220px';
  if (timelineMode === 'compact') return '1fr 80px';
  return '1fr 28px'; // 'collapsed'
};
```

Cette méthode permet à la zone de travail de prendre tout l'espace disponible en haut (`1fr`) et à la timeline d'occuper sa hauteur attitrée au bas de l'écran.

## 2. Flexbox de l'Espace de Travail (`app-workspace`)
La zone de travail [App.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/App.tsx) est divisée horizontalement :

- **Colonne de gauche** (`flex-1 flex flex-col min-w-0 overflow-hidden h-full`) :
  - Contient la barre supérieure de titre et de navigation [HeaderPanel.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/HeaderPanel.tsx) en haut.
  - Contient la zone du canevas interactif [StageCanvas.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/StageCanvas.tsx) en dessous (avec `flex-1`).
- **Colonne de droite** :
  - Contient la barre latérale de contrôle [ControlSidebar.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/ControlSidebar.tsx) (largeur dynamique).

## 3. Positionnement de la Barre Latérale tout en haut (y=0)
Grâce à l'intégration de `HeaderPanel` uniquement dans la colonne de gauche, l'espace situé au-dessus de la barre latérale n'est plus occupé par l'en-tête global. La barre latérale s'affiche donc à partir du bord supérieur de la fenêtre (y=0), plaçant ses 4 onglets en haut de l'écran.
