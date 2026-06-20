# Stage-Path — Instructions pour Claude Code

> **Ce fichier redirige vers la source unique de vérité.**
> Éditez `AGENTS.md` à la racine du projet — NE PAS éditer ce fichier directement.

Lisez et suivez toutes les instructions dans [AGENTS.md](./AGENTS.md) avant de faire des modifications.

## Spécificités Claude Code

- Utilisez `.claude/rules/` pour les règles à portée glob si nécessaire
- Utilisez `.claude/skills/` pour la documentation à la demande
- Après avoir résolu des bugs complexes, mettez à jour `.memo/` avec la solution

## Système de Décision Contextuelle

Suivez ce processus avant chaque tâche :

```
1. Lire AGENTS.md — toujours
2. Lire .memo/lessons-registry.md — toujours (erreurs connues)
3. Évaluer la tâche :
   ├── Modification CSS → lire .memo/skills/css-system.md
   ├── Modification layout → lire .memo/skills/layout-grid.md
   ├── Travail timeline → lire .memo/skills/timeline-interaction.md
   ├── Travail canvas → lire .memo/skills/canvas-rendering.md
   ├── Travail artistes → lire .memo/skills/artist-management.md
   ├── Travail export → lire .memo/skills/video-export.md
   └── Tâche générale → ne rien charger de plus
4. Si blocage → chercher dans lessons-registry.md par mot-clé
5. Si toujours bloqué → explorer le code source directement
```

## Auto-amélioration

Après avoir résolu un problème non trivial :
1. Ajouter une leçon dans `.memo/lessons-registry.md`
2. Si une compétence manque dans `.memo/skills/`, la créer
3. Principe de compression : ne garder que ce qui ferait gagner du temps
