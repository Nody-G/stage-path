import { useState, useRef, useMemo } from 'react';
import { Project, Point } from './types';
import { ProjectWizard } from './components/ProjectWizard';
import { Dashboard } from './components/Dashboard';
import { EditorWorkspace } from './components/EditorWorkspace';
import { AppModal } from './components/AppModal';
import { createNewProject, exportProject } from './utils/projectHelper';
import { Lang } from './utils/i18n';

import { useProjectStorage } from './hooks/useProjectStorage';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { useProjectMetadata } from './hooks/useProjectMetadata';
import { useGroupManagement } from './hooks/useGroupManagement';
import { useArtistManagement } from './hooks/useArtistManagement';
import { useMovementEngine } from './hooks/useMovementEngine';
import { useMediaUploads } from './hooks/useMediaUploads';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useProjectSync } from './hooks/useProjectSync';
import { useProjectHistory } from './hooks/useProjectHistory';
import { useProjectActions } from './hooks/useProjectActions';

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

  const broadcastProject = (_updatedProj: Project) => {}; // No-op: collaboration disabled

  // --- History State for Undo/Redo ---
  const {
    setProjectWithHistory,
    handleUndo,
    handleRedo,
    handleDragStart,
    handleDragEnd,
  } = useProjectHistory({
    project,
    setProject,
    broadcastProject,
  });
  
  const [activeArtistId, setActiveArtistId] = useState<string | null>(null);
  const [activeMovementId, setActiveMovementId] = useState<string | null>(null);
  
  // Playback states
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Modal state for artist creation via double-click on canvas
  const [createArtistModal, setCreateArtistModal] = useState<{
    open: boolean;
    defaultName: string;
    defaultColor: string;
    position: Point;
  }>({ open: false, defaultName: '', defaultColor: '#6366f1', position: { x: 0, y: 0 } });

  // Timeline height (resizable by drag)
  const [timelineHeight, setTimelineHeight] = useState<number>(() => {
    const saved = localStorage.getItem("stage_path_timeline_height");
    return saved ? Math.min(Math.max(parseInt(saved, 10), 60), 500) : 220;
  });

  // Sidebar tab (lifted from ControlSidebar to share with HeaderPanel)
  const [activeSidebarTab, setActiveSidebarTab] = useState<'casting' | 'movements' | 'scenography' | 'options' | 'export'>('casting');

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
  useProjectSync({
    view,
    project,
    setProject: setProjectWithHistory,
    lang,
    audioRef,
  });

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
  const {
    handleWizardComplete,
    handleLoadDemoProject,
    handleExport,
    handleImport,
  } = useProjectActions({
    projects,
    setProjects,
    project,
    setProject: setProjectWithHistory,
    setView,
    setShowWizard,
    setCurrentTime,
    setIsPlaying,
    audioRef,
    broadcastProject,
    saveProjectsToLocalStorage,
    setActiveArtistId,
  });


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
    handleUpdateGroupColor,
    handleUpdateGroupName,
  } = useGroupManagement({
    project,
    setProject: setProjectWithHistory,
    broadcastProject,
  });

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
    handleConfirmCreateArtist,
  } = useArtistManagement({
    project,
    setProject: setProjectWithHistory,
    broadcastProject,
    activeArtistId,
    setActiveArtistId,
    handleSelectArtist,
    onRequestCreateArtist: (defaultName, defaultColor, position) => {
      setCreateArtistModal({ open: true, defaultName, defaultColor, position });
    },
  });

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
  const formatTime = useMemo(() => (timeInSec: number): string => {
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    const ms = Math.floor((timeInSec % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }, []);

  // Visibility filters (group membership) — memoized
  const visibleArtists = useMemo(() => project.artists.map(artist => {
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
  }), [project.artists, project.groups]);

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
        <EditorWorkspace
          project={project}
          visibleArtists={visibleArtists}
          activeArtistId={activeArtistId}
          activeMovementId={activeMovementId}
          setActiveMovementId={setActiveMovementId}
          currentTime={currentTime}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          timelineHeight={timelineHeight}
          setTimelineHeight={setTimelineHeight}
          activeSidebarTab={activeSidebarTab}
          setActiveSidebarTab={setActiveSidebarTab}
          isDrawingMode={isDrawingMode}
          setIsDrawingMode={setIsDrawingMode}
          drawModeType={drawModeType}
          setDrawModeType={setDrawModeType}
          drawTimeRange={drawTimeRange}
          setDrawTimeRange={setDrawTimeRange}
          isRecordingMode={isRecordingMode}
          setIsRecordingMode={setIsRecordingMode}
          lang={lang}
          setLang={setLang}
          setView={setView}
          showWizard={showWizard}
          
          handleSelectArtist={handleSelectArtist}
          handleTogglePlay={handleTogglePlay}
          handleStop={handleStop}
          handleTimelineScrub={handleTimelineScrub}
          handleDoubleClickStage={handleDoubleClickStage}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}

          handleRenameProject={handleRenameProject}
          handleUpdateDirectorName={handleUpdateDirectorName}
          handleUpdateStageDimensions={handleUpdateStageDimensions}
          handleUpdateProjectDuration={handleUpdateProjectDuration}
          handleToggleConstantScale={handleToggleConstantScale}
          handleUpdateSetting={handleUpdateSetting}
          
          handleCreateGroup={handleCreateGroup}
          handleDeleteGroup={handleDeleteGroup}
          handleToggleGroupVisibility={handleToggleGroupVisibility}
          handleToggleGroupPathVisibility={handleToggleGroupPathVisibility}
          handleUpdateGroupColor={handleUpdateGroupColor}
          handleUpdateGroupName={handleUpdateGroupName}
          
          handleCreateArtist={handleCreateArtist}
          handleDeleteArtist={handleDeleteArtist}
          handleToggleArtistVisibility={handleToggleArtistVisibility}
          handleToggleArtistHighlight={handleToggleArtistHighlight}
          handleToggleArtistPathVisibility={handleToggleArtistPathVisibility}
          handleUpdateArtistName={handleUpdateArtistName}
          handleUpdateArtistColor={handleUpdateArtistColor}
          handleUpdateArtistIcon={handleUpdateArtistIcon}
          handleToggleArtistGroup={handleToggleArtistGroup}

          handleUpdateArtistPositionAtTime={handleUpdateArtistPositionAtTime}
          handleUpdateMovementControlPoint={handleUpdateMovementControlPoint}
          handleFinishDrawingPath={handleFinishDrawingPath}
          handleFinishRealtimeRecording={handleFinishRealtimeRecording}
          handleUpdateMovementPoint={handleUpdateMovementPoint}
          handleDeleteMovementPoint={handleDeleteMovementPoint}
          handleAddMovementPoint={handleAddMovementPoint}
          handleDeleteMovement={handleDeleteMovement}
          handleUpdateMovementTimeRange={handleUpdateMovementTimeRange}
          handleUpdateMovementLabel={handleUpdateMovementLabel}
          handleCreateManualMovement={handleCreateManualMovement}

          handleAudioUpload={handleAudioUpload}
          handleBackgroundUpload={handleBackgroundUpload}
          handleBackgroundSettingsChange={handleBackgroundSettingsChange}
          handleWizardComplete={handleWizardComplete}
          handleLoadDemoProject={handleLoadDemoProject}
          handleExport={handleExport}
          handleImport={handleImport}

          handleUpdateKeypointTime={handleUpdateKeypointTime}
          handleUpdateKeypointPosition={handleUpdateKeypointPosition}
          handleToggleTransitionType={handleToggleTransitionType}
          handleDeleteKeypoint={handleDeleteKeypoint}
          handleCreateKeypointAtCurrentTime={handleCreateKeypointAtCurrentTime}

          formatTime={formatTime}
        />
      )}

      {/* Artist creation modal (triggered by double-click on canvas) */}
      <AppModal
        isOpen={createArtistModal.open}
        title="Nouvel acteur / figurant"
        subtitle="Double-cliquez pour positionner sur la scène"
        icon="🎭"
        placeholder="Nom de l'acteur..."
        defaultValue={createArtistModal.defaultName}
        confirmLabel="Ajouter"
        cancelLabel="Annuler"
        showColorPicker
        defaultColor={createArtistModal.defaultColor}
        onConfirm={(name, color) => {
          handleConfirmCreateArtist(name, color, createArtistModal.position);
          setCreateArtistModal(m => ({ ...m, open: false }));
        }}
        onCancel={() => setCreateArtistModal(m => ({ ...m, open: false }))}
      />
    </>
  );
}
