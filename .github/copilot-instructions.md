# Stage-Path — Instructions GitHub Copilot

> **Source unique de vérité : `AGENTS.md` à la racine du projet.**
> Éditez AGENTS.md pour toute modification de règles. Ce fichier est un wrapper de compatibilité.

Lisez le fichier complet [AGENTS.md](../AGENTS.md) pour le contexte complet du projet.

## Règles Clés

- **Stack** : React 18, TypeScript (strict), Vite 5, CSS Vanilla, Lucide React
- **Aucun `any`** : tous les types explicites, définis dans `src/types.ts` ou localement
- **Max 400 lignes** par composant. Extraire vers `src/hooks/` ou sous-composants
- **Nommage** : `handle*` (fonctions), `on*` (props)
- **CSS** : pas de compilateur Tailwind. Classes mappées manuellement dans `src/index.css`
- **Pas de placeholders/TODOs** : code de production uniquement
- **Après modifications** : exécuter `npm run build` — doit réussir sans erreur
- **Canvas** : `StageCanvas.tsx` < 300 lignes, dessin dans `canvasRenderers.ts`

## Système de Décision Contextuelle

Avant chaque tâche, charger SEULEMENT la compétence nécessaire :

| Tâche | Fichier à lire |
|---|---|
| Modification CSS | `.memo/skills/css-system.md` |
| Modification layout | `.memo/skills/layout-grid.md` |
| Travail timeline | `.memo/skills/timeline-interaction.md` |
| Travail canvas | `.memo/skills/canvas-rendering.md` |
| Travail artistes | `.memo/skills/artist-management.md` |
| Travail export | `.memo/skills/video-export.md` |

Toujours consulter `.memo/lessons-registry.md` pour les erreurs connues.
