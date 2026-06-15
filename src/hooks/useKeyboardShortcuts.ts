import { useEffect } from 'react';
import { Project } from '../types';

interface KeyboardShortcutsProps {
  project: Project;
  activeArtistId: string | null;
  setActiveArtistId: (id: string | null) => void;
  activeMovementId: string | null;
  setActiveMovementId: (id: string | null) => void;
  currentTime: number;
  handleTimelineScrub: (time: number) => void;
  isPlaying: boolean;
  handleTogglePlay: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handleDeleteMovement: (artistId: string, movementId: string) => void;
  handleDeleteArtist: (artistId: string) => void;
  isDrawingMode: boolean;
  setIsDrawingMode: (val: boolean) => void;
  isRecordingMode: boolean;
  setIsRecordingMode: (val: boolean) => void;
}

export function useKeyboardShortcuts({
  project,
  activeArtistId,
  setActiveArtistId,
  activeMovementId,
  setActiveMovementId,
  currentTime,
  handleTimelineScrub,
  isPlaying,
  handleTogglePlay,
  handleUndo,
  handleRedo,
  handleDeleteMovement,
  handleDeleteArtist,
  isDrawingMode,
  setIsDrawingMode,
  isRecordingMode,
  setIsRecordingMode,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const isTyping = () => {
      const active = document.activeElement;
      if (!active) return false;
      const tagName = active.tagName.toLowerCase();
      return tagName === 'input' || tagName === 'textarea' || active.getAttribute('contenteditable') === 'true';
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isControl = e.ctrlKey || e.metaKey;

      // Ctrl + Z (Undo)
      if (isControl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      // Ctrl + Y (Redo)
      if (isControl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // If typing in input, ignore other hotkeys
      if (isTyping()) return;

      // Play/Pause: Space
      if (e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
      }

      // Escape: Deselect active elements
      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveArtistId(null);
        setActiveMovementId(null);
        setIsDrawingMode(false);
        setIsRecordingMode(false);
      }

      // Delete/Backspace: delete movement or artist
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeArtistId) {
          if (activeMovementId) {
            e.preventDefault();
            if (confirm("Supprimer ce déplacement ?")) {
              handleDeleteMovement(activeArtistId, activeMovementId);
            }
          } else {
            e.preventDefault();
            const artist = project.artists.find(a => a.id === activeArtistId);
            if (artist && confirm(`Supprimer définitivement le figurant ${artist.name} ?`)) {
              handleDeleteArtist(activeArtistId);
            }
          }
        }
      }

      // Timeline fine scrub: Left/Right Arrow
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const scrubVal = e.shiftKey ? 1.0 : 0.1;
        handleTimelineScrub(Math.min(project.duration, currentTime + scrubVal));
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const scrubVal = e.shiftKey ? 1.0 : 0.1;
        handleTimelineScrub(Math.max(0, currentTime - scrubVal));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    project,
    activeArtistId,
    activeMovementId,
    currentTime,
    isPlaying,
    isDrawingMode,
    isRecordingMode,
    handleTimelineScrub,
    handleTogglePlay,
    handleUndo,
    handleRedo,
    handleDeleteMovement,
    handleDeleteArtist,
    setActiveArtistId,
    setActiveMovementId,
    setIsDrawingMode,
    setIsRecordingMode,
  ]);
}
