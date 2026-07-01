# 🎭 Stage-Path

**Stage-Path** est une application web moderne et performante de planification scénique et de tracé de trajectoires pour le spectacle vivant (théâtre, opéra, danse, reconstitutions historiques..

Conçue avec **React 18**, **TypeScript** et **Vite**, elle offre un contrôle précis et fluide sur les figurants, leurs déplacements et la scénographie physique de la scène.

---

## 🚀 Fonctionnalités Clés

### 1. Rendu Interactif en Temps Réel (Canvas 2D)
* Visualisation fluide du plateau de scène avec échelle en mètres.
* Dessin de repères gradués ajustables (lignes de grille par défaut toutes les 5 mètres).
* Adaptation dynamique du zoom et du déplacement (`pan`) avec maintien de la lisibilité des jetons (`constantScale`).

### 2. Gestion de la Distribution (Casting)
* Création instantanée de figurants et d'acteurs.
* Éditeur d'identité modulaire avec choix d'une couleur, d'un nom et d'une icône de rôle (sélecteur d'icône réversible repassant facilement en mode initiales de lettres `"Aa"`).
* Regroupement des figurants par dossiers/catégories (Vikings, Gardes, Animaux, etc.) avec support du glisser-déposer.

### 3. Programmation de Trajectoires (Movements)
* **Jalons vectoriels** : Programmation manuelle d'un point A à un point B.
* **Plume / Vector** : Tracé précis segment par segment.
* **Dessin libre (Freehand)** : Dessinez la trajectoire directement au curseur/stylet sur la scène.
* **Enregistrement en direct** : Déplacez un personnage sur le plateau pendant la lecture pour enregistrer son déplacement en temps réel.
* Prise en charge des courbes de Bézier pour des mouvements fluides et organiques.

### 4. Options & Paramètres Avancés
* Activation/désactivation à la volée de l'affichage des trajectoires individuelles ou par groupes.
* Options de visibilité globales (noms des personnages, coordonnées de position `X/Y`, étiquettes de trajectoires).
* Import et Export complets de vos projets de scène au format `.stagepath`.

---

## 🛠️ Stack Technique

* **Framework** : React 18
* **Langage** : TypeScript (Typage strict)
* **Bundler** : Vite (Rapide et léger)
* **Styling** : Vanilla CSS moderne (Design system centralisé dans `index.css`)
* **Icônes** : Lucide React

---

## 📦 Installation & Démarrage

### Prérequis
Avoir installé **Node.js** (version 18+) et **npm**.

### Installation des dépendances
```bash
npm install
```

### Démarrer en mode développement
```bash
npm run dev
```

### Compiler pour la production
```bash
npm run build
```

---

## 📂 Structure du Code Source

* `/src/components/` : Composants UI visuels purs (panneaux latéraux, timeline, wizard de création).
  * `/src/components/sidebar/` : Onglets dédiés du panneau de contrôle (`CastingTab.tsx`, `MovementsTab.tsx`, `OptionsTab.tsx`, `ScenographyTab.tsx`, et le panneau réutilisable `ArtistEditPanel.tsx`).
* `/src/hooks/` : Logique métier et hooks personnalisés de gestion d'état (`useCanvasInteractions`, `useArtistManagement`, etc.).
* `/src/utils/` : Utilitaires mathématiques purs, gestion de la base locale et fonctions de rendu canvas (`canvasRenderers.ts`).
* `/src/types.ts` : Définitions globales des types TypeScript de l'application.
* `GEMINI.md` : Guide de développement persistant et directives techniques du projet.
