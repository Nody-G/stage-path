# Compétence : Système CSS & Classes Utilitaires

> **Quand charger ce fichier** : modification de styles, ajout de classes utilitaires, debug visuel.

---

## Architecture CSS

Le projet utilise exclusivement du **CSS standard (Vanilla CSS)**. Aucun compilateur Tailwind.

### Mappage des Classes Utilitaires
Bien que le TSX utilise des noms ressemblant à Tailwind (`flex`, `absolute`, `cursor-pointer`), **Tailwind n'est pas compilé**.

Toute classe utilisée dans le TSX **doit** être définie dans `src/index.css`. Si elle n'y est pas → aucun effet visuel.

Les mappages sont centralisés à la fin de `index.css` sous :
```css
/* Tailwind custom utility mappings for local visual consistency */
```

### Syntaxe des Classes
```css
/* Classes standard */
.relative { position: relative; }
.absolute { position: absolute; }
.cursor-grab { cursor: grab !important; }

/* Pseudo-classes (hover, active, focus) */
.hover\:border-white\/20:hover { border-color: rgba(255, 255, 255, 0.2) !important; }
.active\:cursor-grabbing:active { cursor: grabbing !important; }
```

---

## Bonnes Pratiques

1. **Vérifier avant d'ajouter** : chercher la classe dans `index.css` avant de l'utiliser dans un composant
2. **Classes sémantiques** : si le style dépasse ~5 classes utilitaires, créer une classe sémantique (ex: `.movement-block-item`)
3. **Hover explicite** : tout effet de survol nécessite une déclaration `:hover` explicite en CSS
4. **Pas de styles inline** : préférer les classes CSS aux styles inline pour la cohérence

---

## Erreurs Courantes

| Erreur | Cause | Solution |
|---|---|---|
| Classe sans effet | Classe non mappée dans `index.css` | Ajouter le mappage dans la section utilitaires |
| Hover ne fonctionne pas | Déclaration `:hover` manquante | Ajouter la règle `:hover` explicite |
| Styles incohérents | Mélange inline + classes | Choisir une approche et rester cohérent |
