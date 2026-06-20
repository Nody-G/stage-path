# Compétence : Export Vidéo

> **Quand charger ce fichier** : modification de l'export mp4, qualité vidéo, encodage.

---

## Stack Technique

- **Bibliothèque** : `mp4-muxer` (encodage MP4 côté client)
- **Rendu** : le canvas est capturé frame par frame via `canvas.toBlob()` ou `canvas.toDataURL()`
- **Audio** : synchronisation avec la piste audio du projet (si présente)

---

## Pipeline d'Export

```
1. Initialiser le muxer MP4 avec les paramètres (résolution, framerate)
2. Pour chaque frame de la timeline :
   a. Calculer les positions des artistes à ce timestamp
   b. Dessiner la scène sur le canvas
   c. Capturer le canvas comme image
   d. Encoder et muxer la frame
3. Finaliser le fichier MP4
4. Proposer le téléchargement
```

---

## Paramètres

| Paramètre | Valeur par défaut | Notes |
|---|---|---|
| Résolution | 1920x1080 | Configurable dans les options |
| Framerate | 30fps | Standard pour la vidéo |
| Codec | H.264 | Via mp4-muxer |
| Qualité | Haute | Ajustable |

---

## Points d'Attention

1. **Performance** : l'export est gourmand — afficher une barre de progression
2. **Mémoire** : ne pas stocker toutes les frames en mémoire, encoder au fur et à mesure
3. **Audio sync** : s'assurer que l'audio est synchronisé avec les positions des artistes
4. **Annulation** : permettre d'annuler un export en cours
5. **Safari** : mp4-muxer peut avoir des limitations sur Safari — tester
