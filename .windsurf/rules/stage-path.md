# Stage-Path — Règles Windsurf

> **Source unique de vérité : `AGENTS.md` à la racine du projet.**
> Éditez AGENTS.md pour toute modification de règles. Ce fichier est un wrapper de compatibilité.

Lisez le fichier complet [AGENTS.md](../AGENTS.md) pour le contexte du projet.

## Règles Fondamentales

- React 18 + TypeScript (strict, aucun `any`) + Vite 5
- CSS Vanilla uniquement — classes utilitaires mappées dans `src/index.css`
- Max 400 lignes par composant (300 pour `StageCanvas.tsx`)
- Nommage : `handle*` pour les fonctions, `on*` pour les props
- Pas de TODOs, pas de placeholders, pas de code commenté
- Toujours exécuter `npm run build` après les modifications
- Documentation technique dans `.memo/` — lire avant de toucher aux sous-systèmes complexes

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
