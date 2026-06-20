import React from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { Project, Artist, Point } from '../types';
import { StageCanvas } from './StageCanvas';
import { HeaderPanel } from './HeaderPanel';
import { ControlSidebar } from './ControlSidebar';
import { FooterTimeline } from './FooterTimeline';
import { ProjectWizard } from './ProjectWizard';
import { Lang } from '../utils/i18n';

interface EditorWorkspaceProps {
  project: Project;
  visibleArtists: Artist[];
  activeArtistId: string | null;
  activeMovementId: string | null;
  setActiveMovementId: (id: string | null) => void;
  currentTime: number;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  timelineHeight: number;
  setTimelineHeight: (height: number) => void;
  activeSidebarTab: 'casting' | 'movements' | 'scenography' | 'options' | 'export';
  setActiveSidebarTab: (tab: 'casting' | 'movements' | 'scenography' | 'options' | 'export') => void;
  isDrawingMode: boolean;
  setIsDrawingMode: (val: boolean) => void;
  drawModeType: 'freehand' | 'vector';
  setDrawModeType: (val: 'freehand' | 'vector') => void;
  drawTimeRange: { start: number; end: number };
  setDrawTimeRange: (val: { start: number; end: number }) => void;
  isRecordingMode: boolean;
  setIsRecordingMode: (val: boolean) => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  setView: (view: 'dashboard' | 'editor') => void;
  showWizard: boolean;
  
  handleSelectArtist: (id: string | null) => void;
  handleTogglePlay: () => void;
  handleStop: () => void;
  handleTimelineScrub: (time: number) => void;
  handleDoubleClickStage: (position: Point) => void;
  handleDragStart: () => void;
  handleDragEnd: () => void;

  handleRenameProject: (name: string) => void;
  handleUpdateDirectorName: (name: string) => void;
  handleUpdateStageDimensions: (w: number, h: number) => void;
  handleUpdateProjectDuration: (dur: number) => void;
  handleToggleConstantScale: () => void;
  handleUpdateSetting: (key: string, val: boolean | number | string) => void;
  
  handleCreateGroup: (name: string, color: string, parentId?: string) => void;
  handleDeleteGroup: (id: string) => void;
  handleToggleGroupVisibility: (id: string) => void;
  handleToggleGroupPathVisibility: (id: string) => void;
  handleUpdateGroupColor: (id: string, color: string) => void;
  handleUpdateGroupName: (id: string, name: string) => void;
  
  handleCreateArtist: (name: string, color: string, icon?: string | null) => void;
  handleDeleteArtist: (id: string) => void;
  handleToggleArtistVisibility: (id: string) => void;
  handleToggleArtistHighlight: (id: string) => void;
  handleToggleArtistPathVisibility: (id: string) => void;
  handleUpdateArtistName: (id: string, name: string) => void;
  handleUpdateArtistColor: (id: string, color: string) => void;
  handleUpdateArtistIcon: (id: string, icon: string | null) => void;
  handleToggleArtistGroup: (artistId: string, groupId: string) => void;

  handleUpdateArtistPositionAtTime: (id: string, t: number, pos: Point) => void;
  handleUpdateMovementControlPoint: (artistId: string, movId: string, pos: Point) => void;
  handleFinishDrawingPath: (artistId: string, start: number, end: number, points: Point[], type: 'linear' | 'curved') => void;
  handleFinishRealtimeRecording: (artistId: string, recorded: { x: number; y: number; t: number }[]) => void;
  handleUpdateMovementPoint: (artistId: string, movId: string, index: number, pos: Point) => void;
  handleDeleteMovementPoint: (artistId: string, movId: string, index: number) => void;
  handleAddMovementPoint: (artistId: string, movId: string, index: number, pos: Point) => void;
  handleDeleteMovement: (artistId: string, movId: string) => void;
  handleUpdateMovementTimeRange: (artistId: string, movId: string, start: number, end: number) => void;
  handleUpdateMovementLabel: (artistId: string, movId: string, label: string) => void;
  handleCreateManualMovement: (
    artistId: string,
    startTime: number,
    endTime: number,
    targetX: number,
    targetY: number,
    transitionType?: 'linear' | 'curved'
  ) => void;

  handleAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBackgroundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBackgroundSettingsChange: (key: keyof Project['backgroundSettings'], val: number) => void;
  handleWizardComplete: (data: {
    projectName: string;
    directorName: string;
    stageWidth: number;
    stageHeight: number;
    duration: number;
    bgFile: File | null;
    audioFile: File | null;
    casting: string[];
  }) => void;
  handleLoadDemoProject: () => void;
  handleExport: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Keypoints
  handleUpdateKeypointTime: (artistId: string, keypointId: string, time: number) => void;
  handleUpdateKeypointPosition: (artistId: string, keypointId: string, position: Point) => void;
  handleToggleTransitionType: (artistId: string, keypointId: string) => void;
  handleDeleteKeypoint: (artistId: string, keypointId: string) => void;
  handleCreateKeypointAtCurrentTime: (artistId: string) => void;

  formatTime: (t: number) => string;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  project,
  visibleArtists,
  activeArtistId,
  activeMovementId,
  setActiveMovementId,
  currentTime,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  isSidebarOpen,
  setIsSidebarOpen,
  timelineHeight,
  setTimelineHeight,
  activeSidebarTab,
  setActiveSidebarTab,
  isDrawingMode,
  setIsDrawingMode,
  drawModeType,
  setDrawModeType,
  drawTimeRange,
  setDrawTimeRange,
  isRecordingMode,
  setIsRecordingMode,
  lang,
  setLang,
  setView,
  showWizard,
  
  handleSelectArtist,
  handleTogglePlay,
  handleStop,
  handleTimelineScrub,
  handleDoubleClickStage,
  handleDragStart,
  handleDragEnd,

  handleRenameProject,
  handleUpdateDirectorName,
  handleUpdateStageDimensions,
  handleUpdateProjectDuration,
  handleToggleConstantScale,
  handleUpdateSetting,
  
  handleCreateGroup,
  handleDeleteGroup,
  handleToggleGroupVisibility,
  handleToggleGroupPathVisibility,
  handleUpdateGroupColor,
  handleUpdateGroupName,
  
  handleCreateArtist,
  handleDeleteArtist,
  handleToggleArtistVisibility,
  handleToggleArtistHighlight,
  handleToggleArtistPathVisibility,
  handleUpdateArtistName,
  handleUpdateArtistColor,
  handleUpdateArtistIcon,
  handleToggleArtistGroup,

  handleUpdateArtistPositionAtTime,
  handleUpdateMovementControlPoint,
  handleFinishDrawingPath,
  handleFinishRealtimeRecording,
  handleUpdateMovementPoint,
  handleDeleteMovementPoint,
  handleAddMovementPoint,
  handleDeleteMovement,
  handleUpdateMovementTimeRange,
  handleUpdateMovementLabel,
  handleCreateManualMovement,

  handleAudioUpload,
  handleBackgroundUpload,
  handleBackgroundSettingsChange,
  handleWizardComplete,
  handleLoadDemoProject,
  handleExport,
  handleImport,

  handleUpdateKeypointTime,
  handleUpdateKeypointPosition,
  handleToggleTransitionType,
  handleDeleteKeypoint,
  handleCreateKeypointAtCurrentTime,

  formatTime,
}) => {
  return (
    <div className="app-container bg-[#07080a] text-[#f8fafc]">
      {/* --- SETUP WIZARD --- */}
      {showWizard && (
        <ProjectWizard 
          onComplete={handleWizardComplete}
          onLoadDemo={handleLoadDemoProject}
        />
      )}

      {/* --- HEADER (full width) --- */}
      <div className="app-header">
        <HeaderPanel
          projectName={project.name}
          onRenameProject={handleRenameProject}
          onBackToDashboard={() => setView('dashboard')}
          lang={lang}
          activeTab={activeSidebarTab}
          onTabChange={setActiveSidebarTab}
          onAddArtist={handleCreateArtist}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>

      {/* --- MAIN WORKSPACE --- */}
      <main className={`app-workspace ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        
        {/* Left side column: Interactive Canvas */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">

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
          activeTab={activeSidebarTab}
          
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
          onUpdateGroupColor={handleUpdateGroupColor}
          onUpdateGroupName={handleUpdateGroupName}
          
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
        timelineHeight={timelineHeight}
        onTimelineResize={setTimelineHeight}
        onTimelineScrub={handleTimelineScrub}
        onUpdateMovementTimeRange={handleUpdateMovementTimeRange}
        formatTime={formatTime}
        onUpdateDuration={handleUpdateProjectDuration}
      />
    </div>
  );
};
