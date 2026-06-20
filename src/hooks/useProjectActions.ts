import React from 'react';
import { Project, Artist } from '../types';
import { createNewProject, createDemoProject, exportProject } from '../utils/projectHelper';
import { saveMedia } from '../utils/indexedDBHelper';

interface UseProjectActionsProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  project: Project;
  setProject: (value: React.SetStateAction<Project>) => void;
  setView: (view: 'dashboard' | 'editor') => void;
  setShowWizard: (show: boolean) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  broadcastProject: (p: Project) => void;
  saveProjectsToLocalStorage: (projects: Project[]) => void;
  setActiveArtistId: (id: string | null) => void;
}

export function useProjectActions({
  projects,
  setProjects,
  project,
  setProject,
  setView,
  setShowWizard,
  setCurrentTime,
  setIsPlaying,
  audioRef,
  broadcastProject,
  saveProjectsToLocalStorage,
  setActiveArtistId,
}: UseProjectActionsProps) {
  
  const handleWizardComplete = (data: {
    projectName: string;
    directorName: string;
    stageWidth: number;
    stageHeight: number;
    duration: number;
    bgFile: File | null;
    audioFile: File | null;
    casting: string[];
  }) => {
    const newProj = createNewProject(
      data.projectName, 
      data.directorName, 
      data.stageWidth, 
      data.stageHeight, 
      data.duration
    );

    newProj.createdAt = Date.now();
    newProj.updatedAt = Date.now();

    // Initial cast members initialized backstage
    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
    const initialArtists: Artist[] = data.casting.map((name, index) => {
      const numArtists = data.casting.length;
      const centerX = (data.stageWidth * 100) / 2;
      const centerY = (data.stageHeight * 100) / 2;
      
      let x = centerX;
      let y = centerY;
      
      if (numArtists > 1) {
        const angle = (index / numArtists) * Math.PI * 2;
        const radius = Math.min(data.stageWidth, data.stageHeight) * 15; // 15% of stage dimension
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      }
      
      return {
        id: 'art_' + Math.random().toString(36).substring(2, 9),
        name: name,
        color: colors[index % colors.length],
        groupIds: [],
        initialPosition: { x: Math.round(x), y: Math.round(y) },
        visible: true,
        movements: [],
        onStage: true, // On stage by default!
        entryTime: 0,
        exitTime: data.duration
      };
    });

    newProj.artists = initialArtists;

    // Background scene map loading
    if (data.bgFile) {
      const url = URL.createObjectURL(data.bgFile);
      newProj.backgroundSettings = {
        fileName: data.bgFile.name,
        fileUrl: url,
        opacity: 1.0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      };
      saveMedia(newProj.id, 'background', data.bgFile).catch(err => {
        console.error("Failed to save background to IndexedDB", err);
      });
    }

    // Audio soundtrack loading
    if (data.audioFile) {
      const url = URL.createObjectURL(data.audioFile);
      newProj.audioSettings = {
        fileName: data.audioFile.name,
        fileUrl: url,
        duration: data.duration,
      };
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
      saveMedia(newProj.id, 'audio', data.audioFile).catch(err => {
        console.error("Failed to save audio to IndexedDB", err);
      });
    }

    const updated = [...projects, newProj];
    saveProjectsToLocalStorage(updated);
    setProjects(updated);

    setProject(newProj);
    broadcastProject(newProj);
    setActiveArtistId(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setShowWizard(false);
    setView('editor');
  };

  const handleLoadDemoProject = () => {
    const demo = createDemoProject();
    const demoExists = projects.find(p => p.name === demo.name && p.directorName === demo.directorName);
    
    let finalDemo = demo;
    const now = Date.now();
    if (demoExists) {
      finalDemo = {
        ...demo,
        id: 'art_' + Math.random().toString(36).substring(2, 9),
        name: `${demo.name} (Copie)`,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      finalDemo.createdAt = now;
      finalDemo.updatedAt = now;
    }
    
    const updated = [...projects, finalDemo];
    saveProjectsToLocalStorage(updated);
    setProjects(updated);

    setProject(finalDemo);
    setActiveArtistId(null);
    setCurrentTime(0);
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.src = '';
    broadcastProject(finalDemo);
    setShowWizard(false);
    setView('editor');
  };

  const handleExport = () => {
    exportProject(project);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setProjects(updated);

          setProject(importedProject);
          setActiveArtistId(null);
          setCurrentTime(0);
          setIsPlaying(false);
          if (audioRef.current) audioRef.current.src = '';
          broadcastProject(importedProject);
          setShowWizard(false);
          setView('editor');
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
    handleWizardComplete,
    handleLoadDemoProject,
    handleExport,
    handleImport,
  };
}
