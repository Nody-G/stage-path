# Stage-Path — Instructions Universelles pour Agents IA

> **Ce fichier est la source unique de vérité pour TOUS les assistants IA.**
> Chaque outil IA (Claude Code, Cursor, Copilot, Gemini, Windsurf, Cline, Aider, Codex) lit ce fichier
> directement ou via un wrapper spécifique qui pointe ici.
> **NE PAS dupliquer le contenu dans les fichiers wrappers — toujours éditer CE fichier.**

---

## 🧠 Protocole d'Intelligence Adaptative

Ce document est **vivant**. Chaque session IA qui touche ce projet DOIT suivre ce protocole :

### Avant de commencer le travail
1. Lire ce fichier intégralement
2. Consulter le **Registre de Leçons** (`.memo/lessons-registry.md`) — apprendre des erreurs passées
3. Évaluer la tâche et charger **uniquement les compétences nécessaires** depuis `.memo/skills/`

### Pendant le travail
4. **Auto-diagnostic continu** : après chaque modification significative, vérifier :
   - Le build passe-t-il ? (`npm run build`)
   - Les types sont-ils stricts ? (aucun `any`)
   - La limite de 400 lignes est-elle respectée ?
   - Les patterns existants sont-ils respectés ?
5. **Décision contextuelle** : si une zone du code est ambiguë, consulter la compétence correspondante dans `.memo/skills/` AVANT de modifier

### Après avoir résolu un problème non trivial
6. **Enregistrer la leçon** dans `.memo/lessons-registry.md` avec le format structuré fourni
7. Si une compétence manque dans `.memo/skills/`, la créer avec la solution trouvée
8. **Principe de compression** : ne garder que ce qui ferait gagner du temps à une future session

> **Objectif** : Chaque session rend la suivante plus intelligente. Élaguer sans pitié. Précision > verbosité.

---

## 1. Identité du Projet

**Stage-Path** — Application web de chorégraphie scénique et planification de trajectoires (théâtre, opéra, danse, reconstitutions historiques).

| Aspect | Valeur |
|---|---|
| Framework | React 18 |
| Langage | TypeScript (strict, aucun `any`) |
| Bundler | Vite 5 |
| Style | CSS Vanilla (pas de compilateur Tailwind — classes utilitaires mappées dans `index.css`) |
| Icônes | Lucide React |
| Export vidéo | mp4-muxer |
| Stockage | IndexedDB (local) |

---

## 2. Règles d'Architecture

### 2.1 La Règle des 400 Lignes
Aucun composant ne dépasse **400 lignes**. Extraire la logique vers les hooks (`src/hooks/`) ou sous-composants. `StageCanvas.tsx` doit rester sous **300 lignes** (orchestration uniquement).

### 2.2 Séparation des Responsabilités
| Couche | Emplacement | Responsabilité |
|---|---|---|
| Composants UI | `src/components/` | Pur visuel, reçoit l'état via props |
| Onglets Sidebar | `src/components/sidebar/` | CastingTab, MovementsTab, OptionsTab, ScenographyTab, ExportTab |
| Overlays Scène | `src/components/stage/` | DrawingHUD, RecordingHUD, ZoomControls |
| Logique Métier | `src/hooks/` | Gestion d'état, interactions utilisateur |
| Utilitaires Purs | `src/utils/` | Maths, géométrie, Bézier, rendu canvas, i18n |
| Définitions de Types | `src/types.ts` | Toutes les interfaces TypeScript partagées |

### 2.3 Flux de Données
`App.tsx` → méga-hook `useApp` (état central) → routage vers `Dashboard` (liste projets) ou `EditorWorkspace` (éditeur : canvas + sidebar + timeline + transport).

### 2.4 Modèle de Données Clé
- **Project** → contient `Artist[]`, `Group[]`, paramètres audio/fond, dimensions scène
- **Artist** → nom, couleur, icône, groupes, position initiale, `Movement[]`, visibilité, temps entrée/sortie
- **Movement** → points de contrôle, courbes Bézier, LUT longueur-arc, temps début/fin, type de transition

---

## 3. Conventions de Code

### 3.1 Nommage
- Gestionnaires d'événements (fonctions) : `handle*` (ex: `handleSelectArtist`)
- Props de gestionnaires : `on*` (ex: `onSelectArtist`)
- Hooks personnalisés : `use*` (ex: `useCanvasInteractions`)

### 3.2 TypeScript
- **Zéro `any`**. Tous les types explicites, définis dans `types.ts` ou localement.
- Préférer `interface` pour les formes d'objets, `type` pour les unions/intersections.

### 3.3 CSS
- **Pas de compilateur Tailwind**. Des classes comme `flex`, `absolute` sont manuellement mappées dans `src/index.css`.
- Avant d'utiliser une classe utilitaire, vérifier qu'elle existe dans `index.css` (chercher `/* Tailwind custom utility mappings */`).
- Pour les styles complexes, préférer les classes sémantiques (ex: `.movement-block-item`) plutôt que chaîner 15 utilitaires.
- Les effets de survol nécessitent des déclarations `:hover` explicites en CSS.

### 3.4 Interdictions Absolues
- Pas de `TODO`, pas de placeholders, pas de données fictives, pas de blocs de code commentés.
- Pas de secrets ou clés API en dur.
- Pas d'import depuis `src/internal/` en dehors de ce répertoire (s'il existe).

---

## 4. Compétences Techniques (→ `.memo/skills/`)

Pour les guides d'implémentation détaillés, lire les fichiers de compétences correspondants :

| Compétence | Fichier | Quand le charger |
|---|---|---|
| Système CSS & classes utilitaires | `.memo/skills/css-system.md` | Modification de styles ou ajout de classes |
| Grille & structure de mise en page | `.memo/skills/layout-grid.md` | Modification de la disposition de la page |
| Interactions timeline & drag | `.memo/skills/timeline-interaction.md` | Travail sur la timeline ou le drag & drop |
| Rendu Canvas | `.memo/skills/canvas-rendering.md` | Modification du canvas ou des interactions |
| Gestion des artistes | `.memo/skills/artist-management.md` | Travail sur le CRUD artistes ou les mouvements |
| Export vidéo | `.memo/skills/video-export.md` | Modification de l'export mp4 |

### Rendu Canvas (résumé)
- Logique d'interaction : `src/hooks/useCanvasInteractions.ts`
- Fonctions de dessin : `src/utils/canvasRenderers.ts`
- Résolution interne max : 2500px
- `constantScale` applique un facteur `1/zoom` pour que les éléments restent lisibles à tout niveau de zoom

---

## 5. Checklist de Validation

Après **toute** modification de code :
1. Exécuter `npm run build` — doit réussir sans erreur
2. Vérifier qu'aucun type `any` n'a été introduit
3. Vérifier qu'aucun composant ne dépasse 400 lignes
4. Confirmer que les nouvelles classes CSS existent dans `index.css`
5. Consulter `.memo/lessons-registry.md` pour les erreurs connues liées à la zone modifiée

---

## 6. Registre de Leçons

> Ce registre est auto-maintenu par les sessions IA.
> Voir `.memo/lessons-registry.md` pour le registre complet et structuré.
> Ce fichier ne contient que les **5 leçons les plus critiques** pour un accès rapide.

*(Le registre sera alimenté au fur et à mesure que le projet évolue.)*

---

## 7. Carte des Fichiers (Référence Rapide)

```
Stage-Path/
├── AGENTS.md              ← VOUS ÊTES ICI (source unique de vérité)
├── CLAUDE.md              ← Redirige ici (Claude Code)
├── GEMINI.md              ← Redirige ici (Gemini CLI)
├── .cursor/rules/         ← Règles Cursor (format MDC)
├── .github/               ← Instructions Copilot
├── .clinerules/           ← Règles Cline/Roo
├── .windsurf/rules/       ← Règles Windsurf
├── .aider.conf.yml        ← Config Aider
├── .memo/                 ← Mémoire technique
│   ├── lessons-registry.md ← Registre d'erreurs apprenant
│   └── skills/            ← Compétences modulaires (chargement à la demande)
│       ├── css-system.md
│       ├── layout-grid.md
│       ├── timeline-interaction.md
│       ├── canvas-rendering.md
│       ├── artist-management.md
│       └── video-export.md
├── src/
│   ├── App.tsx            ← Composant racine
│   ├── types.ts           ← Définitions de types globaux
│   ├── index.css          ← Tous les styles + mappages de classes utilitaires
│   ├── components/        ← Composants UI
│   │   ├── sidebar/       ← Panneaux d'onglets sidebar
│   │   └── stage/         ← Overlays scène (HUD, zoom)
│   ├── hooks/             ← Hooks personnalisés (logique métier)
│   └── utils/             ← Utilitaires purs (maths, canvas, i18n)
└── package.json
```

---

## 8. Système de Décision Contextuelle

L'agent ne charge PAS tout en même temps. Il suit ce processus de décision :

```
1. Lire AGENTS.md (ce fichier) — toujours
2. Lire .memo/lessons-registry.md — toujours (erreurs connues)
3. Évaluer la tâche :
   ├── Modification CSS → charger .memo/skills/css-system.md
   ├── Modification layout → charger .memo/skills/layout-grid.md
   ├── Travail timeline → charger .memo/skills/timeline-interaction.md
   ├── Travail canvas → charger .memo/skills/canvas-rendering.md
   ├── Travail artistes → charger .memo/skills/artist-management.md
   ├── Travail export → charger .memo/skills/video-export.md
   └── Tâche générale → ne rien charger de plus
4. Si blocage → chercher dans lessons-registry.md par mot-clé
5. Si toujours bloqué → explorer le code source directement
```

Ce système garantit que l'agent reste **rapide** (charge le minimum) et **précis** (a accès au contexte exact quand il en a besoin).
