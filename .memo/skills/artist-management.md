# Compétence : Gestion des Artistes

> **Quand charger ce fichier** : CRUD artistes, mouvements, groupes, positions initiales.

---

## Modèle de Données

```typescript
// types.ts — Structure simplifiée
interface Artist {
  id: string;
  name: string;
  color: string;
  icon: string;
  groups: string[];        // IDs des groupes
  initialPosition: { x: number; y: number };
  movements: Movement[];
  visible: boolean;
  entryTime: number;       // Seconde d'entrée
  exitTime: number;        // Seconde de sortie
}

interface Movement {
  id: string;
  controlPoints: Point[];  // Points de contrôle Bézier
  startTime: number;
  endTime: number;
  transitionType: 'linear' | 'ease' | 'ease-in' | 'ease-out';
  // + LUT longueur-arc précalculée
}

interface Group {
  id: string;
  name: string;
  color: string;
}
```

---

## Hooks de Gestion

| Hook | Fichier | Responsabilité |
|---|---|---|
| `useArtistManagement` | `src/hooks/useArtistManagement.ts` | CRUD artistes, groupes, sélection |
| `useMovementEngine` | `src/hooks/useMovementEngine.ts` | Calcul des positions, interpolation |

---

## Patterns de Code

### Sélection d'artiste
```typescript
// handle* pour les fonctions, on* pour les props
const handleSelectArtist = (artistId: string) => {
  setSelectedArtistId(artistId);
};
```

### Ajout de mouvement
```typescript
const handleAddMovement = (artistId: string, startTime: number) => {
  // 1. Créer le mouvement avec des points par défaut
  // 2. L'ajouter au tableau movements de l'artiste
  // 3. Recalculer la LUT si nécessaire
};
```

---

## Points d'Attention

1. **Immutabilité** : toujours créer de nouveaux objets/arrays, ne jamais muter l'état directement
2. **IDs** : utiliser `crypto.randomUUID()` ou un utilitaire similaire
3. **Temps** : toutes les valeurs temporelles sont en secondes (pas en frames)
4. **Groupes** : un artiste peut appartenir à plusieurs groupes
5. **Visibilité** : un artiste invisible n'est pas rendu mais reste dans les données
