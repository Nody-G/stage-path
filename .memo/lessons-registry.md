# Registre de Leçons Apprenant

> **Auto-maintenu par les sessions IA.** Chaque leçon suit un format structuré.
> Les leçons sont indexées par catégorie et mot-clé pour une recherche rapide.
> Quand ce fichier dépasse 50 entrées, archiver les plus anciennes dans `lessons-archive.md`.

---

## Comment Ajouter une Leçon

```markdown
### [CATÉGORIE] Titre concis
- **Problème** : Ce qui a mal tourné (1-2 phrases)
- **Cause** : La racine du problème
- **Solution** : Le correctif exact appliqué
- **Fichiers** : Fichiers concernés
- **Prévention** : Comment éviter que ça se reproduise
- **Gravité** : 🔴 Critique / 🟡 Moyen / 🟢 Mineur
- **Date** : YYYY-MM-DD
```

---

## Registre

### [Canvas & Rendu] Tracés de prévisualisation SVG trop fins
- **Problème** : Les tracés miniatures des déplacements dans la barre latérale étaient quasi invisibles ou extrêmement fins selon la longueur réelle du déplacement.
- **Cause** : Les coordonnées réelles de la scène étaient utilisées directement dans le viewBox de l'SVG, appliquant ainsi un fort coefficient de réduction sur la taille fixe des lignes (`strokeWidth`) et des cercles de départ/fin.
- **Solution** : Normalisation des coordonnées des points sur une grille fixe de 100x100 pixels avec centrage automatique et marges de sécurité, puis utilisation de valeurs de style épaisses et contrastées.
- **Fichiers** : [KeypointsManagerPanel.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/sidebar/KeypointsManagerPanel.tsx)
- **Prévention** : Toujours normaliser les coordonnées pour les vignettes ou mini-previews SVG afin de garder le contrôle sur l'épaisseur des traits et la taille des éléments indépendamment des dimensions du modèle réel.
- **Gravité** : 🟢 Mineur
- **Date** : 2026-06-20


---

### [Canvas & Rendu] Simplification des Courbes par double-clic et suppression du mode Plume
- **Problème** : L'utilisateur trouvait inutile les boutons d'options de courbes et le mode Plume, préférant une interaction directe et rapide sur le canvas.
- **Cause** : Présence d'un mode "Plume" (vector drawing) redondant et d'options de sélection manuelle de transition linéaire/courbe qui alourdissaient l'interface et le code.
- **Solution** : Suppression complète du mode Plume et des contrôles de type de transition, et bascule automatique linéaire <-> courbe selon le nombre de points de contrôle (2 points = linéaire, >= 3 points = courbe), géré par double-clic sur le canvas.
- **Fichiers** : [useCanvasInteractions.ts](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/hooks/useCanvasInteractions.ts), [canvasRenderers.ts](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/utils/canvasRenderers.ts), [MovementCreatorPanel.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/sidebar/MovementCreatorPanel.tsx), [KeypointsManagerPanel.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/sidebar/KeypointsManagerPanel.tsx)
- **Prévention** : Privilégier les interactions directes intuitives sur le canvas (comme le double-clic contextuel) pour modifier la géométrie d'une trajectoire plutôt que de multiplier les formulaires ou onglets de configuration.
- **Gravité** : 🟢 Mineur
- **Date** : 2026-06-21

---

### [Timeline & Interactions] Détection du double-clic compromise par la capture du pointeur
- **Problème** : Le double-clic sur les pistes de la timeline pour créer un mouvement à un instant précis ne fonctionnait plus (aucun événement n'était détecté sur la piste).
- **Cause** : `setPointerCapture` appelé sur le conteneur parent lors du `pointerdown` redirigeait tous les événements suivants (y compris le double-clic) vers le conteneur parent. La cible `e.target` devenait le conteneur lui-même au lieu de la piste (`[data-timeline-track="true"]`), faisant échouer le sélecteur `.closest()`.
- **Solution** : Utilisation de `document.elementFromPoint(e.clientX, e.clientY)` à la place de `e.target` pour retrouver l'élément physique sous le curseur, indépendamment de la capture de pointeur active.
- **Fichiers** : [FooterTimeline.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/FooterTimeline.tsx)
- **Prévention** : Lorsque du pointer-capture ou du drag-scrubbing est actif sur un conteneur, ne pas se fier uniquement à `e.target` pour la résolution des éléments enfants cliqués ou double-cliqués. Utiliser `document.elementFromPoint` comme alternative robuste pour localiser l'élément physique.
- **Gravité** : 🟡 Moyen
- **Date** : 2026-06-21

---

### [Canvas & Rendu] Boutons d'action interactifs sur Canvas 2D
- **Problème** : Ajouter un bouton d'action ("+") interactif à côté d'un jeton de personnage dessiné sur un canvas 2D avec zoom et translation dynamiques.
- **Cause** : Les coordonnées de dessin sont définies localement (relatives au centre traduit et mis à l'échelle), alors que les événements de clic sont reçus dans le repère global du stage (coordonnées absolues).
- **Solution** : Calcul de la position absolue du bouton dans le repère du stage en réappliquant l'échelle (`tokenScale`) et l'offset `(18 * tokenScale, -18 * tokenScale)` au centre absolu du jeton, puis utilisation de cette position dans les tests de collision (`getDistance` sous `pointerdown` et `pointermove`).
- **Fichiers** : [useCanvasInteractions.ts](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/hooks/useCanvasInteractions.ts), [canvasRenderers.ts](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/utils/canvasRenderers.ts), [StageCanvas.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/StageCanvas.tsx)
- **Prévention** : Pour toute interaction click/hover sur canvas avec échelle ou translation, séparer clairement le dessin (local) de la détection de collision (qui doit projeter l'offset local à l'échelle globale pour correspondre aux coordonnées du pointeur).
- **Gravité** : 🟢 Mineur
- **Date** : 2026-06-21

---

### [Timeline & Interactions] Alignement du zoom des pistes de la timeline
- **Problème** : Décalage de positionnement de la tête de lecture et des blocs de mouvements lors des opérations de zoom sur la timeline (la tête de lecture et les blocs n'étaient plus alignés horizontalement).
- **Cause** : Le conteneur parent des pistes avait sa largeur mise à l'échelle via `width: 100 * timelineZoom %`. Le repère de la tête de lecture (absolu) se basait sur cette largeur. Cependant, les lignes de pistes (`div` individuelles) n'avaient pas de contrainte de largeur explicite, ce qui causait des déformations. L'application directe de `width: 100 * timelineZoom %` sur les wrappers enfants multipliait l'effet de zoom (le zoom était appliqué au carré car les enfants héritaient d'un parent déjà mis à l'échelle), provoquant un décalage exponentiel des blocs par rapport à la tête de lecture.
- **Solution** : Ajout de la classe de largeur et de la contrainte explicite `style={{ width: '100%', minWidth: '100%' }}` sur les wrappers de pistes pour qu'ils s'étirent exactement sur 100% de la largeur déjà zoomée du conteneur parent (sans réappliquer la multiplication par `timelineZoom`).
- **Fichiers** : [FooterTimeline.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/FooterTimeline.tsx)
- **Prévention** : Dans une structure de conteneurs imbriqués où le conteneur principal gère le zoom, les enfants doivent être dimensionnés à `width: 100%` et `min-width: 100%` pour hériter de la taille parent sans ré-appliquer la formule de zoom au carré.
- **Gravité** : 🔴 Critique
- **Date** : 2026-06-21

---

### [Timeline & Interactions] Correction de l'étirement des pistes sous zoom (Flexbox vs Block)
- **Problème** : Même après avoir forcé `width: 100%` sur les pistes de la timeline, elles ne s'étiraient pas sur toute la largeur zoomée (par exemple 500%) et restaient bloquées à la largeur du viewport (100%), provoquant un décalage entre la tête de lecture et les blocs de mouvement.
- **Cause** : Le conteneur parent était configuré en flexbox vertical (`flex flex-col`). Dans certains navigateurs, les éléments enfants de type flex ne résolvent pas correctement un étirement de `100%` lorsque le parent flexbox a lui-même une largeur en pourcentage (`100 * zoom %`) dans un conteneur défilant.
- **Solution** : Conversion du conteneur parent en conteneur de type block (suppression de `flex` et `flex-col`) et gestion de l'espacement vertical par marge inférieure (`mb-2`) sur les enfants, ce qui garantit le comportement natif d'étirement à 100% des éléments de bloc.
- **Fichiers** : [FooterTimeline.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/FooterTimeline.tsx)
- **Prévention** : Préférer le positionnement de flux block natif aux flexbox horizontales/verticales lorsque des calculs de largeur complexes avec des pourcentages de zoom dynamiques sont requis au sein de conteneurs défilants.
- **Gravité** : 🔴 Critique
- **Date** : 2026-06-21

---

### [Timeline & Interactions] Redessin Resolve-style avec Réglette, Zoom Hybride et Auto-Scroll
- **Problème** : Améliorer la précision et la fluidité de la timeline pour s'aligner sur les outils professionnels de type DaVinci Resolve.
- **Cause** : Manque d'une réglette temporelle claire, de repères verticaux d'alignement, d'auto-scroll lors de la lecture, et d'un zoom ancré sur la tête de lecture ou le curseur.
- **Solution** : Ajout d'une Time Ruler sticky qui calcule dynamiquement ses ticks via ResizeObserver et getTimelineTicks, déport de la forme d'onde vers une piste scrollable, implémentation du double-scrubbing (Réglette/Playhead), d'un zoom intelligent (clavier playhead-centered et souris cursor-centered) et d'un auto-scroll actif en mode lecture.
- **Fichiers** : [FooterTimeline.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/FooterTimeline.tsx), [useTimelineZoomScroll.ts](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/hooks/useTimelineZoomScroll.ts), [index.css](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/index.css)
- **Prévention** : Lier toujours le zoom de timeline à un point d'ancrage visuel stable (curseur de souris ou tête de lecture) pour éviter les sauts de cadrage désorientants.
- **Gravité** : 🟢 Mineur
- **Date** : 2026-06-21

---

### [Timeline & Interactions] Décalage sous zoom résolu par le positionnement en pixels absolus
- **Problème** : La tête de lecture et les graduations se décalaient de plus en plus au fur et à mesure que le niveau de zoom augmentait.
- **Cause** : L'utilisation de pourcentages (`%`) pour le positionnement absolu d'éléments enfants (`playhead`, `ticks`) à l'intérieur d'un conteneur scrollable mis à l'échelle (ex: `width: 500%`) subit des erreurs d'arrondi sous-pixel de la part du navigateur, exacerbées par la présence de conteneurs sticky.
- **Solution** : Passage d'un positionnement en pourcentages (`%`) à un positionnement en pixels absolus (`px`) calculés en multipliant le ratio de temps par la largeur totale dynamique du conteneur (`contentWidth = viewportWidth * timelineZoom`), combiné avec un forçage de la largeur de la réglette à `100%` dans le CSS.
- **Fichiers** : [FooterTimeline.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/FooterTimeline.tsx), [index.css](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/index.css)
- **Prévention** : Dans un conteneur scrollable zoomé dynamiquement, préférer les coordonnées en pixels absolus (`px`) calculées via JS aux pourcentages CSS (`%`) pour assurer un alignement parfait de tous les overlays.
- **Gravité** : 🔴 Critique
- **Date** : 2026-06-21
### [Timeline & Interactions] Crash de boucle infinie/excessive lors du zoom ou avec des durées larges
- **Problème** : L'application figeait complètement ("Fin de tâche" requis) lors d'un zoom sur la timeline ou avec des durées de projet atypiques.
- **Cause** : La fonction `getTimelineTicks` calculait des subdivisions de graduation temporelle trop denses pour les durées étendues en retombant par défaut à un intervalle majeur fixe de `10` secondes. Le moteur de rendu essayait alors de générer des milliers de repères dans la timeline en bloquant le thread principal. De plus, aucun garde-fou n'existait contre les entrées `NaN` ou les pas de boucle nuls/négatifs.
- **Solution** : Ajout de validations strictes (`isNaN`), calcul dynamique propre des grands intervalles majeurs en multiples d'heures (au lieu de 10s par défaut), et mise en place d'un plafond de sécurité adaptatif limitant la boucle à un maximum absolu de 1000 itérations par rendu.
- **Fichiers** : [FooterTimeline.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/FooterTimeline.tsx)
- **Prévention** : Pour toute boucle de rendu dynamique basée sur une échelle ou un zoom, toujours implémenter un garde-fou sur le nombre maximum d'itérations (`expectedIterations > 1000`) et s'assurer que le pas de progression (`step`) est validé et strictement supérieur à zéro.
- **Gravité** : 🔴 Critique
- **Date** : 2026-06-25

### [CSS & Style] Rétroaction ResizeObserver infinie due aux classes utilitaires de mise en page absentes
- **Problème** : Lors du zoom de la timeline, le logiciel se mettait à zoomer de manière infinie (largeur s'étirant de façon exponentielle à chaque rendu) et figeait l'affichage.
- **Cause** : Les classes utilitaires `.min-w-0`, `.overflow-x-auto` et `.overflow-y-visible` étaient utilisées dans la structure HTML du composant `FooterTimeline.tsx` pour restreindre la largeur du conteneur des pistes flexbox, mais elles n'étaient pas déclarées dans `src/index.css`. Par conséquent, le conteneur ne disposait d'aucune contrainte de min-width ni de comportement de scroll horizontal. À chaque changement de zoom, la largeur réelle du conteneur s'étirait pour s'adapter à la taille de son enfant (en pixels), ce qui déclenchait le `ResizeObserver` qui mettait à jour le viewportWidth, augmentant encore le zoom et la taille de l'enfant dans un cycle de rétroaction positive infini.
- **Solution** : Ajout des classes utilitaires de style de layout manquantes dans `src/index.css`. Réintroduction sécurisée du raccourci `Ctrl + Molette` pour le zoom horizontal sur le conteneur des pistes de la timeline.
- **Fichiers** : [index.css](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/index.css), [FooterTimeline.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/FooterTimeline.tsx)
- **Prévention** : S'assurer que toutes les classes utilitaires Tailwind utilisées dans le JSX (comme `min-w-0` et `overflow-x-auto`) sont systématiquement mappées dans `index.css`.
- **Gravité** : 🔴 Critique
- **Date** : 2026-06-25

---

### [CSS & Style] Styles de timeline manquants lors de l'intégration de fichiers du dossier styles/
- **Problème** : La timeline s'affichait de façon cassée (tous les éléments empilés verticalement, sans pistes d'acteurs ni blocs visibles).
- **Cause** : Les styles de la timeline moderne de type DaVinci Resolve (règle, tiques, playhead, blocs de mouvement) étaient documentés dans `src/styles/timeline.css` mais n'avaient jamais été copiés ou importés dans `src/index.css`, qui est le seul fichier de styles global chargé dans le projet.
- **Solution** : Intégration et copie complète des classes de styles de la timeline depuis `src/styles/timeline.css` dans `src/index.css`.
- **Fichiers** : [index.css](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/index.css)
- **Prévention** : S'assurer que chaque modification de style effectuée dans un sous-fichier sous `src/styles/` soit toujours reportée ou `@import`ée dans `src/index.css` pour être prise en compte au build.
- **Gravité** : 🔴 Critique
- **Date** : 2026-06-30

---

### [Timeline & Interactions] Repositionnement de la bande son en haut de la timeline
- **Problème** : La bande son était affichée tout en bas de la timeline (en dessous de tous les acteurs), ce qui ne correspondait pas aux conventions de montage professionnelles où la bande son est positionnée de manière fixe ou haute.
- **Cause** : L'ordre de rendu des composants dans le DOM de `FooterTimeline.tsx` et le positionnement du label dans `PerformerNamesColumn.tsx` plaçaient la piste audio après les pistes d'acteurs.
- **Solution** : Inversion de l'ordre de rendu dans le DOM en plaçant la bande son et son label directement sous la règle de temps, et ajout de règles de centrage flexbox dans la classe `.timeline-audio-spacer`.
- **Fichiers** : [FooterTimeline.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/FooterTimeline.tsx), [PerformerNamesColumn.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/timeline/PerformerNamesColumn.tsx), [index.css](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/index.css), [timeline.css](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/styles/timeline.css)
- **Prévention** : S'assurer de conserver la correspondance un-à-un de la hauteur et du positionnement vertical (sticky top values) entre la colonne des noms des pistes (à gauche) et la timeline des pistes (à droite).
- **Gravité** : 🟢 Mineur
- **Date** : 2026-06-30

---

### [Timeline & Interactions] Résolution définitive du zoom infini de la timeline par mesure sur le parent stable
- **Problème** : Lors du clic sur le bouton de zoom, la timeline s'emballait parfois et zoomait à l'infini (largeur de layout s'étirant de façon exponentielle).
- **Cause** : Même avec `min-w-0` et `overflow-x-auto` sur le conteneur des pistes (`tracksDiv`), la taille de ce dernier pouvait fluctuer très légèrement en raison de l'apparition de barres de défilement ou d'arrondis sous-pixel de mise en page. Puisque le `ResizeObserver` écoutait directement `tracksDiv`, cela ré-enclenchait la mise à jour de `viewportWidth` et un nouveau cycle de zoom infini.
- **Solution** : Écoute du `ResizeObserver` déplacée sur le conteneur parent `footer` (qui est contraint à 100% de la largeur d'écran sans défilement et stable), et calcul indirect de la largeur utile par soustraction (`largeur_footer - 144px`). Utilisation directe de cet état stable de viewportWidth dans le calcul du zoom de la timeline.
- **Fichiers** : [FooterTimeline.tsx](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/components/FooterTimeline.tsx), [index.css](file:///c:/Users/niels/Documents/Antigravity%20projects/Stage-Path/src/index.css)
- **Prévention** : Pour éviter toute boucle de rétroaction infinie avec un `ResizeObserver`, toujours observer un élément parent ou frère structurellement stable (comme le conteneur général de la page ou du widget) plutôt que le conteneur scrollable qui subit les effets de zoom ou de défilement.
- **Gravité** : 🔴 Critique
- **Date** : 2026-06-30

---

## Index par Catégorie

| Catégorie | Nombre | Dernière entrée |
|---|---|---|
| CSS & Style | 2 | 2026-06-30 |
| TypeScript & Types | 0 | — |
| Canvas & Rendu | 3 | 2026-06-21 |
| Timeline & Interactions | 9 | 2026-06-30 |
| Architecture & Patterns | 0 | — |
| Build & Déploiement | 0 | — |
| Performance | 0 | — |
