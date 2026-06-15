import { useEffect } from 'react';
import { Project } from '../types';
import { updateMovementLUT } from '../utils/projectHelper';
import { clearProjectMedia } from '../utils/indexedDBHelper';

interface UseProjectStorageProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  view: 'dashboard' | 'editor';
  setView: (view: 'dashboard' | 'editor') => void;
  setShowWizard: (show: boolean) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  broadcastProject: (updatedProj: Project) => void;
}

export function useProjectStorage({
  projects,
  setProjects,
  project,
  setProject,
  view,
  setView,
  setShowWizard,
  setCurrentTime,
  setIsPlaying,
  audioRef,
  broadcastProject,
}: UseProjectStorageProps) {
  
  const saveProjectsToLocalStorage = (updatedProjects: Project[]) => {
    localStorage.setItem('stagepath_projects', JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
  };

  // Auto-save active project when it changes in the editor
  useEffect(() => {
    if (view === 'editor' && project && project.id) {
      setProjects(prevProjects => {
        const existingIndex = prevProjects.findIndex(p => p.id === project.id);
        const now = Date.now();
        
        // Prepare updated project object with timestamps
        const updatedProj = { 
          ...project, 
          updatedAt: now,
          createdAt: existingIndex !== -1 ? (prevProjects[existingIndex].createdAt || now) : now
        };
        
        let newProjects;
        if (existingIndex !== -1) {
          const existing = prevProjects[existingIndex];
          // Simple stringify content check to prevent duplicate writes
          const hasChanged = JSON.stringify({ ...existing, updatedAt: 0, createdAt: 0 }) !== 
                             JSON.stringify({ ...updatedProj, updatedAt: 0, createdAt: 0 });
          
          if (!hasChanged) return prevProjects;

          const updated = [...prevProjects];
          updated[existingIndex] = updatedProj;
          newProjects = updated;
        } else {
          newProjects = [...prevProjects, updatedProj];
        }
        
        localStorage.setItem('stagepath_projects', JSON.stringify(newProjects));
        return newProjects;
      });
    }
  }, [project, view, setProjects]);

  const handleSelectProject = (projectId: string) => {
    const selected = projects.find(p => p.id === projectId);
    if (selected) {
      setProject(selected);
      setView('editor');
      setShowWizard(false);
      setCurrentTime(0);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.src = selected.audioSettings.fileUrl || '';
        audioRef.current.load();
      }
      broadcastProject(selected);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const updated = projects.filter(p => p.id !== projectId);
    saveProjectsToLocalStorage(updated);
    if (project && project.id === projectId) {
      setView('dashboard');
    }
    clearProjectMedia(projectId).catch(err => {
      console.error("Failed to delete project media from IndexedDB", err);
    });
  };

  const handleUpdateProjectMeta = (
    id: string, 
    meta: { 
      name: string; 
      directorName: string; 
      stageWidth: number; 
      stageHeight: number; 
      duration: number; 
    }
  ) => {
    const updated = projects.map(p => {
      if (p.id === id) {
        const scaleX = meta.stageWidth / p.stageWidth;
        const scaleY = meta.stageHeight / p.stageHeight;

        const updatedArtists = p.artists.map(art => {
          const scaledInitialPosition = {
            x: Math.round(art.initialPosition.x * scaleX),
            y: Math.round(art.initialPosition.y * scaleY)
          };
          const scaledMovements = art.movements.map(mov => {
            const scaledPoints = mov.points.map(pPoint => ({
              x: Math.round(pPoint.x * scaleX),
              y: Math.round(pPoint.y * scaleY)
            }));
            const updatedMov = {
              ...mov,
              points: scaledPoints
            };
            return updateMovementLUT(updatedMov);
          });
          return {
            ...art,
            initialPosition: scaledInitialPosition,
            movements: scaledMovements
          };
        });

        return {
          ...p,
          name: meta.name,
          directorName: meta.directorName,
          stageWidth: meta.stageWidth,
          stageHeight: meta.stageHeight,
          duration: meta.duration,
          artists: updatedArtists,
          updatedAt: Date.now(),
        };
      }
      return p;
    });
    saveProjectsToLocalStorage(updated);
    
    if (project && project.id === id) {
      setProject(prev => {
        const scaleX = meta.stageWidth / prev.stageWidth;
        const scaleY = meta.stageHeight / prev.stageHeight;

        const updatedArtists = prev.artists.map(art => {
          const scaledInitialPosition = {
            x: Math.round(art.initialPosition.x * scaleX),
            y: Math.round(art.initialPosition.y * scaleY)
          };
          const scaledMovements = art.movements.map(mov => {
            const scaledPoints = mov.points.map(pPoint => ({
              x: Math.round(pPoint.x * scaleX),
              y: Math.round(pPoint.y * scaleY)
            }));
            const updatedMov = {
              ...mov,
              points: scaledPoints
            };
            return updateMovementLUT(updatedMov);
          });
          return {
            ...art,
            initialPosition: scaledInitialPosition,
            movements: scaledMovements
          };
        });

        return {
          ...prev,
          name: meta.name,
          directorName: meta.directorName,
          stageWidth: meta.stageWidth,
          stageHeight: meta.stageHeight,
          duration: meta.duration,
          artists: updatedArtists
        };
      });
    }
  };

  const handleImportProjectDashboard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as Project;
        if (parsed.id && parsed.artists) {
          const exists = projects.some(p => p.id === parsed.id);
          const now = Date.now();
          const importedProject = {
            ...parsed,
            id: exists ? 'art_' + Math.random().toString(36).substring(2, 9) : parsed.id,
            createdAt: now,
            updatedAt: now,
          };
          const updated = [...projects, importedProject];
          saveProjectsToLocalStorage(updated);
          alert(`Spectacle "${importedProject.name}" importé avec succès !`);
        } else {
          alert("Fichier invalide.");
        }
      } catch (err) {
        alert("Erreur de lecture du fichier.");
      }
    };
    reader.readAsText(file);
  };

  return {
    saveProjectsToLocalStorage,
    handleSelectProject,
    handleDeleteProject,
    handleUpdateProjectMeta,
    handleImportProjectDashboard,
  };
}
