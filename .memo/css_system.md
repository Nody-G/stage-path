# Système CSS & Classes Utilitaires (css_system.md)

Le projet utilise exclusivement du **CSS standard (Vanilla CSS)** pour son design et ses animations.

## 1. Pas de Compilateur Tailwind
Bien que le code TSX utilise des noms de classe ressemblant à Tailwind (ex: `flex`, `absolute`, `cursor-pointer`), **Tailwind n'est pas compilé**.

Toute classe utilisée dans le code TSX doit être définie dans [index.css](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/index.css). Si une classe n'y est pas, elle n'aura aucun effet visuel ou interactif.

## 2. Structure des Mappages dans `index.css`
Les mappages de classes utilitaires Tailwind vers CSS standard sont centralisés à la fin de `index.css` sous le commentaire :
`/* Tailwind custom utility mappings for local visual consistency */`

Exemple de syntaxe pour les classes standards et les pseudo-classes :
```css
.relative { position: relative; }
.absolute { position: absolute; }
.cursor-grab { cursor: grab !important; }
.cursor-w-resize { cursor: w-resize !important; }

/* Syntaxe pour les modificateurs (hover, active, focus) : */
.hover\:border-white\/20:hover { border-color: rgba(255, 255, 255, 0.2) !important; }
.active\:cursor-grabbing:active { cursor: grabbing !important; }
```

## 3. Bonnes Pratiques
- **Toujours vérifier** si la classe Tailwind-like est déjà mappée à la fin de `index.css` avant de l'ajouter dans un composant.
- **Préférer créer des classes sémantiques propres** (ex: `.movement-block-item`) dans le CSS si le style devient trop complexe, plutôt que d'essayer de mapper 15 classes utilitaires distinctes.
- **Règle pour le survol** : Si une bordure ou un effet visuel de survol doit se produire (comme une lueur/illumination d'un bouton ou d'un bloc de déplacement), s'assurer que sa classe `:hover` correspondante est correctement déclarée.
