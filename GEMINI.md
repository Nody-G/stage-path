# Directives de Développement & Mémoire du Projet (GEMINI.md)

Ce fichier sert de mémoire persistante et de guide de bonnes pratiques pour toute Intelligence Artificielle (ou développeur) intervenant sur le projet **Stage-Path**. Vous devez lire ce fichier avant toute modification de code.

---

## 1. Principes d'Architecture & Structure

Le projet est construit en **React 18** avec **TypeScript** et **Vite**.

### Règle d'Or : Éviter les "God Components"
- Aucun composant ne doit dépasser **400 lignes**. Si un composant commence à dépasser cette taille, la logique métier doit être extraite dans un **custom hook** ou découpée en sous-composants.
- Les états complexes et les handlers de mutation du projet doivent être centralisés dans des hooks sous `src/hooks/`.
- Les fonctions de calcul pur (géométrie, interpolation, Bézier, physique) doivent résider exclusivement dans `src/utils/math.ts` ou `src/utils/projectHelper.ts`.

### Dossiers du Projet
- `/src/components/` : Composants UI visuels purs. Ils reçoivent leurs états et callbacks via des props.
  - Les onglets du panneau latéral de contrôle doivent résider dans `/src/components/sidebar/` (ex: `CastingTab.tsx`, `MovementsTab.tsx`, `ScenographyTab.tsx`) pour maintenir `ControlSidebar.tsx` comme un routeur d'onglets léger.
- `/src/hooks/` : Logique métier, gestion d'états (Custom Hooks) de l'application et des interactions utilisateur.
- `/src/utils/` : Fonctions utilitaires pures (sans état React), y compris les fonctions de dessin canvas.
- `/src/types.ts` : Définitions globales des types TypeScript.

---

## 2. Règles d'Implémentation, Style & Layout

1. **Typage Strict** : Pas d'usage du type `any`. Tous les types doivent être explicitement définis dans `types.ts` ou dans le fichier local approprié.
2. **Nommage des Handlers** : Les fonctions gérant des événements ou des actions utilisateur doivent être préfixées par `handle` (ex: `handleSelectArtist`, `handleUpdatePosition`). Les props correspondantes reçues par les composants doivent être préfixées par `on` (ex: `onSelectArtist`, `onUpdatePosition`).
3. **Vanilla CSS & Layout** : Pas de Tailwind sauf demande explicite. Mappage des classes utilitaires manuellement dans `index.css`.
   * *Pour plus de détails sur le style, lire* : [css_system.md](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/.memo/css_system.md)
   * *Pour comprendre la grille et les dimensions de page, lire* : [layout_grid.md](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/.memo/layout_grid.md)
4. **Pas de Placeholders** : Ne jamais laisser de code temporaire, de `TODO` non résolu, ou d'images de remplissage fictives.

---

## 3. Guides Techniques Spécifiques

- **Rendu Canvas (`StageCanvas.tsx`)** :
  - La logique d'interaction utilisateur est encapsulée dans le hook `src/hooks/useCanvasInteractions.ts`.
  - La logique de dessin 2D pur est déportée dans des fonctions de rendu dans `src/utils/canvasRenderers.ts`.
  - `StageCanvas.tsx` doit rester un simple composant d'orchestration de moins de 300 lignes gérant la boucle d'animation.
  - Le canvas utilise une résolution interne maximale plafonnée à 2500px.
  - L'option `constantScale` applique un facteur `1/zoom` lors du dessin des éléments (figurants, noms, échelles en mètres) pour qu'ils restent parfaitement lisibles.
- **Interactions de la Timeline & Drag** :
  - *Pour comprendre le Pointer Capture et le bubbling sur la timeline, lire* : [timeline_interaction.md](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/.memo/timeline_interaction.md)

---

## 4. Processus de Validation
- Après chaque modification, lancez obligatoirement la commande `npm run build` pour vous assurer de l'absence d'erreurs TypeScript ou d'importation.
- Ne soumettez jamais de modifications qui échouent au build.

---

## 5. Gestion de la Mémoire du Projet
Pour éviter de surcharger ce fichier principal et d'épuiser inutilement la fenêtre de contexte de l'IA lors des lectures de projet :
1. **Mémoire modulaire** : Toute règle technique détaillée, explication d'algorithme ou structure de sous-système doit être rédigée dans une fiche dédiée sous le dossier `.memo/`.
2. **Indexation** : Ajouter un lien hypertexte absolu vers la nouvelle fiche dans la section correspondante de `GEMINI.md`.
3. **Mise à jour incrémentale** : Si l'IA résout un problème complexe (bug obscur, comportement inattendu, limitation matérielle), elle doit documenter la cause et la solution dans la fiche appropriée de `.memo/` (ou en créer une nouvelle) pour instruire les futures sessions d'IA.
