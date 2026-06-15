import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { Project, Artist } from './types';
import { StageCanvas } from './components/StageCanvas';
import { HeaderPanel } from './components/HeaderPanel';
import { ControlSidebar } from './components/ControlSidebar';
import { FooterTimeline } from './components/FooterTimeline';
import { ProjectWizard } from './components/ProjectWizard';
import { Dashboard } from './components/Dashboard';
import { createDemoProject, createNewProject, exportProject, updateMovementLUT } from './utils/projectHelper';
import { saveMedia, getMedia } from './utils/indexedDBHelper';
import { Lang } from './utils/i18n';

import { useProjectStorage } from './hooks/useProjectStorage';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { useProjectMetadata } from './hooks/useProjectMetadata';
import { useGroupManagement } from './hooks/useGroupManagement';
import { useArtistManagement } from './hooks/useArtistManagement';
import { useMovementEngine } from './hooks/useMovementEngine';
import { useMediaUploads } from './hooks/useMediaUploads';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  // --- 1. State Configuration ---
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('stagepath_lang') as Lang) || 'fr';
  });

  const [view, setView] = useState<'dashboard' | 'editor'>(() => {
    const saved = localStorage.getItem('stagepath_view');
    return (saved as 'dashboard' | 'editor') || 'dashboard';
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('stagepath_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved projects", e);
      }
    }
    return [];
  });

  // Project state
  const [project, setProject] = useState<Project>(() => {
    const savedActiveId = localStorage.getItem('stagepath_active_project_id');
    const savedProjects = localStorage.getItem('stagepath_projects');
    if (savedActiveId && savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects) as Project[];
        const found = parsedProjects.find(p => p.id === savedActiveId);
        if (found) return found;
      } catch (e) {
        console.error("Failed to parse active project on load", e);
      }
    }
    // Return a default empty project that will be replaced by wizard or demo
    return createNewProject("Nouveau Spectacle", "", 14, 10, 120);
  });
  const [showWizard, setShowWizard] = useState<boolean>(false);

  // --- History State for Undo/Redo ---
  const [history, setHistory] = useState<Project[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isDraggingRef = useRef<boolean>(false);
  const lastPushTimeRef = useRef<number>(0);

  const setProjectWithHistory = (value: React.SetStateAction<Project>) => {
    setProject(prev => {
      const nextProject = typeof value === 'function' ? value(prev) : value;
      
      if (!isDraggingRef.current) {
        const now = Date.now();
        const timeSinceLastPush = now - lastPushTimeRef.current;
        
        setHistory(hPrev => {
          const nextHistory = hPrev.slice(0, historyIndex + 1);
          if (nextHistory.length >= 50) nextHistory.shift();
          
          const lastInHistory = nextHistory[nextHistory.length - 1];
          if (lastInHistory && 
              JSON.stringify({ ...lastInHistory, updatedAt: 0, createdAt: 0 }) === 
              JSON.stringify({ ...nextProject, updatedAt: 0, createdAt: 0 })) {
            return hPrev;
          }

          const shouldOverwrite = lastInHistory && timeSinceLastPush < 1200;
          
          let updatedHistory;
          if (shouldOverwrite && nextHistory.length > 1) {
            updatedHistory = [...nextHistory.slice(0, -1), nextProject];
          } else {
            updatedHistory = [...nextHistory, nextProject];
          }
          
          setHistoryIndex(updatedHistory.length - 1);
          lastPushTimeRef.current = now;
          return updatedHistory;
        });
      }
      
      return nextProject;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const prevProject = history[newIndex];
      setProject(prevProject);
      broadcastProject(prevProject);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextProject = history[newIndex];
      setProject(nextProject);
      broadcastProject(nextProject);
    }
  };

  const handleDragStart = () => {
    isDraggingRef.current = true;
    setHistory(hPrev => {
      const nextHistory = hPrev.slice(0, historyIndex + 1);
      if (nextHistory.length >= 50) nextHistory.shift();
      const lastInHistory = nextHistory[nextHistory.length - 1];
      if (lastInHistory && 
          JSON.stringify({ ...lastInHistory, updatedAt: 0, createdAt: 0 }) === 
          JSON.stringify({ ...project, updatedAt: 0, createdAt: 0 })) {
        return hPrev;
      }
      const updatedHistory = [...nextHistory, project];
      setHistoryIndex(updatedHistory.length - 1);
      return updatedHistory;
    });
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    setHistory(hPrev => {
      const nextHistory = hPrev.slice(0, historyIndex + 1);
      if (nextHistory.length >= 50) nextHistory.shift();
      const lastInHistory = nextHistory[nextHistory.length - 1];
      if (lastInHistory && 
          JSON.stringify({ ...lastInHistory, updatedAt: 0, createdAt: 0 }) === 
          JSON.stringify({ ...project, updatedAt: 0, createdAt: 0 })) {
        return hPrev;
      }
      const updatedHistory = [...nextHistory, project];
      setHistoryIndex(updatedHistory.length - 1);
      lastPushTimeRef.current = Date.now();
      return updatedHistory;
    });
  };

  // Synchronize history stack on active project switch
  useEffect(() => {
    if (project && project.id) {
      setHistory(prev => {
        if (prev.length === 0 || prev[0].id !== project.id) {
          setHistoryIndex(0);
          return [project];
        }
        return prev;
      });
    }
  }, [project.id]);
  
  const [activeArtistId, setActiveArtistId] = useState<string | null>(null);
  const [activeMovementId, setActiveMovementId] = useState<string | null>(null);
  
  // Playback states
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  



  // Timeline resize mode
  const [timelineMode, setTimelineMode] = useState<'full' | 'compact' | 'collapsed'>('full');

  // Sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Advanced movement creation modes
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [drawModeType, setDrawModeType] = useState<'freehand' | 'vector'>('vector');
  const [drawTimeRange, setDrawTimeRange] = useState<{ start: number; end: number }>({ start: 0, end: 10 });
  const [isRecordingMode, setIsRecordingMode] = useState<boolean>(false);

  const handleSelectArtist = (id: string | null) => {
    setActiveArtistId(id);
    setActiveMovementId(null);
    if (id) {
      setIsSidebarOpen(true);
    }
  };

  // Refs for audio and timing
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);

  // Broadcast state changes when project is updated locally
  const broadcastProject = (_updatedProj: Project) => {
    // No-op: collaboration disabled
  };

  const {
    saveProjectsToLocalStorage,
    handleSelectProject,
    handleDeleteProject,
    handleUpdateProjectMeta,
    handleImportProjectDashboard,
  } = useProjectStorage({
    projects,
    setProjects,
    project,
    setProject: setProjectWithHistory,
    view,
    setView,
    setShowWizard,
    setCurrentTime,
    setIsPlaying,
    audioRef,
    broadcastProject,
  });

  // Save view and active project ID to localStorage to survive reloads
  useEffect(() => {
    localStorage.setItem('stagepath_view', view);
    if (view === 'editor' && project && project.id) {
      localStorage.setItem('stagepath_active_project_id', project.id);
    } else {
      localStorage.removeItem('stagepath_active_project_id');
    }
  }, [view, project.id]);

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('stagepath_lang', lang);
  }, [lang]);

  // Load project media files from IndexedDB on startup or active project change
  useEffect(() => {
    if (!project.id) return;
    
    let isMounted = true;
    
    const loadProjectMedia = async () => {
      try {
        const [audioBlob, bgBlob] = await Promise.all([
          getMedia(project.id, 'audio'),
          getMedia(project.id, 'background')
        ]);
        
        if (!isMounted) return;
        
        let needsUpdate = false;
        let updatedAudioUrl = project.audioSettings.fileUrl;
        let updatedBgUrl = project.backgroundSettings.fileUrl;
        
        if (audioBlob) {
          updatedAudioUrl = URL.createObjectURL(audioBlob);
          needsUpdate = true;
        }
        if (bgBlob) {
          updatedBgUrl = URL.createObjectURL(bgBlob);
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          setProject(prev => {
            if (prev.id !== project.id) return prev;
            return {
              ...prev,
              audioSettings: {
                ...prev.audioSettings,
                fileUrl: updatedAudioUrl
              },
              backgroundSettings: {
                ...prev.backgroundSettings,
                fileUrl: updatedBgUrl
              }
            };
          });

          if (audioRef.current && updatedAudioUrl) {
            audioRef.current.src = updatedAudioUrl;
            audioRef.current.load();
          }
        } else {
          // If no stored media is found but there's a transient blob URL, clear it to avoid broken links
          const clearBlobUrl = (url: string | null) => {
            if (url && url.startsWith('blob:')) {
              return null;
            }
            return url;
          };
          
          const clearedAudioUrl = clearBlobUrl(project.audioSettings.fileUrl);
          const clearedBgUrl = clearBlobUrl(project.backgroundSettings.fileUrl);
          
          if (clearedAudioUrl !== project.audioSettings.fileUrl || clearedBgUrl !== project.backgroundSettings.fileUrl) {
            setProject(prev => {
              if (prev.id !== project.id) return prev;
              return {
                ...prev,
                audioSettings: {
                  ...prev.audioSettings,
                  fileUrl: clearedAudioUrl
                },
                backgroundSettings: {
                  ...prev.backgroundSettings,
                  fileUrl: clearedBgUrl
                }
              };
            });
            if (audioRef.current) {
              audioRef.current.src = clearedAudioUrl || '';
              audioRef.current.load();
            }
          }
        }
      } catch (err) {
        console.error("Error loading media from IndexedDB", err);
      }
    };
    
    loadProjectMedia();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  // Synchronize stage aspect ratio with background image ratio
  useEffect(() => {
    const url = project.backgroundSettings.fileUrl;
    if (!url) return;

    const img = new Image();
    img.src = url;
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (isFinite(ratio) && ratio > 0) {
        setProject(prev => {
          const newHeight = Math.round((prev.stageWidth / ratio) * 100) / 100;
          if (prev.stageHeight === newHeight) return prev;
          
          const scaleY = newHeight / prev.stageHeight;
          const updatedArtists = prev.artists.map(art => {
            const scaledInitialPosition = {
              x: art.initialPosition.x,
              y: Math.round(art.initialPosition.y * scaleY)
            };
            const scaledMovements = art.movements.map(mov => {
              const scaledPoints = mov.points.map(p => ({
                x: p.x,
                y: Math.round(p.y * scaleY)
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

          const updated = {
            ...prev,
            stageHeight: newHeight,
            artists: updatedArtists
          };
          broadcastProject(updated);
          return updated;
        });
      }
    };
  }, [project.backgroundSettings.fileUrl, project.stageWidth]);

  // --- 3. Audio & Playback Sync Engine ---
  const {
    handleTogglePlay,
    handleStop,
    handleTimelineScrub,
  } = useAudioPlayback({
    project,
    isPlaying,
    setIsPlaying,
    setCurrentTime,
    playbackSpeed,
    audioRef,
    prevTimeRef,
    requestRef,
  });

  // --- 4. Wizard Setup Completion & Imports/Exports ---
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


  // --- 5. Project Metadata Setters ---
  const {
    handleRenameProject,
    handleUpdateDirectorName,
    handleUpdateStageDimensions,
    handleUpdateProjectDuration,
    handleToggleConstantScale,
    handleUpdateSetting,
  } = useProjectMetadata({
    project,
    setProject: setProjectWithHistory,
    broadcastProject,
  });

  // --- 6. Group Management ---
  const {
    handleCreateGroup,
    handleDeleteGroup,
    handleToggleGroupVisibility,
    handleToggleGroupPathVisibility,
  } = useGroupManagement({
    project,
    setProject: setProjectWithHistory,
    broadcastProject,
  });

  // --- 7. Artist Management ---
  const {
    handleCreateArtist,
    handleDeleteArtist,
    handleToggleArtistVisibility,
    handleToggleArtistHighlight,
    handleToggleArtistPathVisibility,
    handleUpdateArtistName,
    handleUpdateArtistColor,
    handleUpdateArtistIcon,
    handleToggleArtistGroup,
    handleDoubleClickStage,
  } = useArtistManagement({
    project,
    setProject: setProjectWithHistory,
    broadcastProject,
    activeArtistId,
    setActiveArtistId,
    handleSelectArtist,
  });

  // --- 8. Spatiotemporal Movement Updates ---
  const {
    handleUpdateArtistPositionAtTime,
    handleUpdateKeypointTime,
    handleUpdateKeypointPosition,
    handleToggleTransitionType,
    handleDeleteKeypoint,
    handleCreateKeypointAtCurrentTime,
    handleUpdateMovementControlPoint,
    handleCreateManualMovement,
    handleFinishDrawingPath,
    handleFinishRealtimeRecording,
    handleUpdateMovementPoint,
    handleAddMovementPoint,
    handleDeleteMovementPoint,
    handleDeleteMovement,
    handleUpdateMovementTimeRange,
    handleUpdateMovementLabel,
  } = useMovementEngine({
    project,
    setProject: setProjectWithHistory,
    activeMovementId,
    setActiveMovementId,
    currentTime,
    broadcastProject,
    onTimelineScrub: handleTimelineScrub,
  });

  // --- 9. Multimedia Uploads ---
  const {
    handleAudioLoadedMetadata,
    handleAudioUpload,
    handleBackgroundUpload,
    handleBackgroundSettingsChange,
  } = useMediaUploads({
    project,
    setProject: setProjectWithHistory,
    audioRef,
    setIsPlaying,
    broadcastProject,
  });

  // --- Keyboard Shortcuts ---
  useKeyboardShortcuts({
    project,
    activeArtistId,
    setActiveArtistId: handleSelectArtist,
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
  });

  // --- 10. Formatting & Rendering Filters ---
  const formatTime = (timeInSec: number): string => {
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    const ms = Math.floor((timeInSec % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Visibility filters (group membership)
  const visibleArtists = project.artists.map(artist => {
    const hasNoGroups = artist.groupIds.length === 0;
    const isAnyGroupVisible = artist.groupIds.some(groupId => {
      let currentId: string | undefined = groupId;
      while (currentId) {
        const g = project.groups.find(group => group.id === currentId);
        if (!g) return false;
        if (!g.visible) return false;
        currentId = g.parentId;
      }
      return true;
    });

    const isVisible = artist.visible && (hasNoGroups || isAnyGroupVisible);

    return {
      ...artist,
      visible: isVisible
    };
  });

  const getGridRows = () => {
    if (timelineMode === 'full') return '1fr 220px';
    if (timelineMode === 'compact') return '1fr 80px';
    return '1fr 28px';
  };

  return (
    <>
      <audio ref={audioRef} className="hidden" onLoadedMetadata={handleAudioLoadedMetadata} />
      {view === 'dashboard' ? (
        <>
          <Dashboard
            projects={projects}
            onSelectProject={handleSelectProject}
            onCreateNewProject={() => setShowWizard(true)}
            onLoadDemoProject={handleLoadDemoProject}
            onDeleteProject={handleDeleteProject}
            onImportProject={handleImportProjectDashboard}
            onExportProject={exportProject}
            onUpdateProjectMeta={handleUpdateProjectMeta}
            lang={lang}
          />
          {showWizard && (
            <ProjectWizard 
              onComplete={handleWizardComplete}
              onLoadDemo={handleLoadDemoProject}
            />
          )}
        </>
      ) : (
        <div 
          className="app-container bg-[#07080a] text-[#f8fafc]"
          style={{ gridTemplateRows: getGridRows() }}
        >

      {/* --- SETUP WIZARD --- */}
      {showWizard && (
        <ProjectWizard 
          onComplete={handleWizardComplete}
          onLoadDemo={handleLoadDemoProject}
        />
      )}

      {/* --- MAIN WORKSPACE --- */}
      <main className={`app-workspace ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        
        {/* Left side column: Header + Interactive Canvas */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
          <HeaderPanel
            projectName={project.name}
            onRenameProject={handleRenameProject}
            onBackToDashboard={() => setView('dashboard')}
            lang={lang}
          />

          <section className="stage-container relative flex-1">
          <StageCanvas
            project={project}
            artists={visibleArtists}
            activeArtistId={activeArtistId}
            currentTime={currentTime}
            onUpdateArtistPosition={handleUpdateArtistPositionAtTime}
            onUpdateMovementControlPoint={handleUpdateMovementControlPoint}
            isPlaying={isPlaying}
            onSelectArtist={handleSelectArtist}
            
            placementArtistId={null}
            setPlacementArtistId={() => {}}
            onDoubleClickStage={handleDoubleClickStage}
            
            isDrawingMode={isDrawingMode}
            setIsDrawingMode={setIsDrawingMode}
            drawModeType={drawModeType}
            drawTimeRange={drawTimeRange}
            isRecordingMode={isRecordingMode}
            setIsRecordingMode={setIsRecordingMode}
            onFinishDrawingPath={handleFinishDrawingPath}
            onFinishRealtimeRecording={handleFinishRealtimeRecording}
            onUpdateMovementPoint={handleUpdateMovementPoint}
            onDeleteMovementPoint={handleDeleteMovementPoint}
            onAddMovementPoint={handleAddMovementPoint}
            setIsPlaying={setIsPlaying}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />

          {/* Floating Transport Bar */}
          <div className="floating-transport-bar glass-panel flex items-center gap-3">
            <button 
              type="button"
              onClick={handleTogglePlay}
              className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 shadow-md hover:scale-105 flex items-center justify-center"
              style={{ width: '32px', height: '32px' }}
              title={isPlaying ? "Mettre en pause" : "Lancer la lecture"}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button 
              type="button"
              onClick={handleStop}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 transition-all duration-200 hover:scale-105 flex items-center justify-center"
              style={{ width: '32px', height: '32px' }}
              title="Arrêter et revenir au début"
            >
              <Square size={14} />
            </button>

            <div className="h-5 w-px bg-white/10 mx-1" />

            {/* Speed selection */}
            <div className="flex items-center gap-0.5 bg-black/30 rounded-lg p-0.5 text-[10px] font-bold text-slate-400">
              {[0.5, 1, 2].map(speed => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-1.5 py-0.5 rounded transition ${
                    playbackSpeed === speed 
                      ? 'bg-indigo-600 text-white font-semibold' 
                      : 'hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-white/10 mx-1" />

            <span className="text-xs font-mono text-indigo-300 font-bold tracking-wider select-none px-1">
              {formatTime(currentTime)}
            </span>
          </div>

          {/* Quick-toggle sidebar floating button */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="floating-sidebar-btn glass-panel"
              title="Ouvrir le panneau de contrôle"
            >
              👥 Panneau
            </button>
          )}

        </section>
        </div>

        {/* Right side: Consolidated Control Sidebar */}
        <ControlSidebar
          project={project}
          activeArtistId={activeArtistId}
          activeMovementId={activeMovementId}
          onSelectMovement={setActiveMovementId}
          currentTime={currentTime}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen(false)}
          
          onRenameProject={handleRenameProject}
          onUpdateDirectorName={handleUpdateDirectorName}
          onUpdateStageDimensions={handleUpdateStageDimensions}
          onUpdateProjectDuration={handleUpdateProjectDuration}
          onToggleConstantScale={handleToggleConstantScale}
          onUpdateSetting={handleUpdateSetting}
          
          onCreateGroup={handleCreateGroup}
          onDeleteGroup={handleDeleteGroup}
          onToggleGroupVisibility={handleToggleGroupVisibility}
          onToggleGroupPathVisibility={handleToggleGroupPathVisibility}
          
          onCreateArtist={handleCreateArtist}
          onDeleteArtist={handleDeleteArtist}
          onToggleArtistVisibility={handleToggleArtistVisibility}
          onToggleArtistHighlight={handleToggleArtistHighlight}
          onToggleArtistPathVisibility={handleToggleArtistPathVisibility}
          onUpdateArtistName={handleUpdateArtistName}
          onUpdateArtistColor={handleUpdateArtistColor}
          onUpdateArtistIcon={handleUpdateArtistIcon}
          onToggleArtistGroup={handleToggleArtistGroup}
          
          onDeleteMovement={handleDeleteMovement}
          onTimelineScrub={handleTimelineScrub}
          
          onAudioUpload={handleAudioUpload}
          onBackgroundUpload={handleBackgroundUpload}
          onBackgroundSettingsChange={handleBackgroundSettingsChange}
          onSelectArtist={handleSelectArtist}
          onImportProject={handleImport}
          onExportProject={handleExport}
          lang={lang}
          onLanguageChange={setLang}

          // Keyframe editor properties
          onUpdateKeypointTime={handleUpdateKeypointTime}
          onUpdateKeypointPosition={handleUpdateKeypointPosition}
          onToggleTransitionType={handleToggleTransitionType}
          onDeleteKeypoint={handleDeleteKeypoint}
          onCreateKeypointAtCurrentTime={handleCreateKeypointAtCurrentTime}

          // New Advanced Movement props
          isDrawingMode={isDrawingMode}
          setIsDrawingMode={setIsDrawingMode}
          drawModeType={drawModeType}
          setDrawModeType={setDrawModeType}
          drawTimeRange={drawTimeRange}
          setDrawTimeRange={setDrawTimeRange}
          isRecordingMode={isRecordingMode}
          setIsRecordingMode={setIsRecordingMode}
          onCreateManualMovement={handleCreateManualMovement}
          onDeleteMovementPoint={handleDeleteMovementPoint}
          onUpdateMovementLabel={handleUpdateMovementLabel}
        />
      </main>

      {/* --- FOOTER --- */}
      <FooterTimeline
        lang={lang}
        artists={visibleArtists}
        activeMovementId={activeMovementId}
        onSelectArtist={handleSelectArtist}
        onSelectMovement={setActiveMovementId}
        currentTime={currentTime}
        duration={project.duration}
        audioFileName={project.audioSettings.fileName}
        audioFileUrl={project.audioSettings.fileUrl}
        audioDuration={project.audioSettings.fileUrl ? project.audioSettings.duration : 0}
        timelineMode={timelineMode}
        onSetMode={setTimelineMode}
        onTimelineScrub={handleTimelineScrub}
        onUpdateMovementTimeRange={handleUpdateMovementTimeRange}
        formatTime={formatTime}
        onUpdateDuration={handleUpdateProjectDuration}
      />
    </div>
      )}
    </>
  );
}
