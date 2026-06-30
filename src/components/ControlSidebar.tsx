import React, { useState, useEffect } from 'react';
import { Project, Point } from '../types';
import { Lang } from '../utils/i18n';
import { CastingTab } from './sidebar/CastingTab';
import { MovementsTab } from './sidebar/MovementsTab';
import { ScenographyTab } from './sidebar/ScenographyTab';
import { OptionsTab } from './sidebar/OptionsTab';
import { ExportTab } from './sidebar/ExportTab';

interface ControlSidebarProps {
  project: Project;
  activeArtistId: string | null;
  activeMovementId: string | null;
  onSelectMovement: (id: string | null) => void;
  currentTime: number;
  isOpen: boolean; // kept in interface for compatibility
  onToggleOpen: () => void;
  activeTab: 'casting' | 'movements' | 'scenography' | 'options' | 'export';

  // Project Mutation Callbacks
  onRenameProject: (name: string) => void;
  onUpdateDirectorName: (name: string) => void;
  onUpdateStageDimensions: (w: number, h: number) => void;
  onUpdateProjectDuration: (dur: number) => void;
  onToggleConstantScale: () => void;
  onUpdateSetting: (key: string, val: boolean | number | string) => void;
  
  // Group Callbacks
  onCreateGroup: (name: string, color: string, parentId?: string) => void;
  onDeleteGroup: (id: string) => void;
  onToggleGroupVisibility: (id: string) => void;
  onToggleGroupPathVisibility: (id: string) => void;
  onUpdateGroupColor: (id: string, color: string) => void;
  onUpdateGroupName: (id: string, name: string) => void;
  
  // Artist Callbacks
  onCreateArtist: (name: string, color: string, icon?: string | null) => void;
  onDeleteArtist: (id: string) => void;
  onToggleArtistVisibility: (id: string) => void;
  onToggleArtistHighlight: (id: string) => void;
  onToggleArtistPathVisibility: (id: string) => void;
  onUpdateArtistName: (id: string, name: string) => void;
  onUpdateArtistColor: (id: string, color: string) => void;
  onUpdateArtistIcon: (id: string, icon: string | null) => void;
  onToggleArtistGroup: (artistId: string, groupId: string) => void;
  
  // Movements Callbacks
  onDeleteMovement: (artistId: string, movementId: string) => void; // kept in interface for compatibility
  onTimelineScrub: (time: number) => void;
  
  // File Upload & Project Callbacks
  onAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBackgroundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBackgroundSettingsChange: (key: keyof Project['backgroundSettings'], val: number) => void;
  onSelectArtist: (id: string | null) => void;
  onImportProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportProject: () => void;
  lang: Lang;
  onLanguageChange: (lang: Lang) => void;

  // Keyframe Editor Callbacks
  onUpdateKeypointTime: (artistId: string, keypointId: string, newTime: number) => void;
  onUpdateKeypointPosition: (artistId: string, keypointId: string, position: Point) => void;
  onDeleteKeypoint: (artistId: string, keypointId: string) => void;
  onCreateKeypointAtCurrentTime: (artistId: string) => void;

  // Advanced Movement Creation Props
  isDrawingMode: boolean;
  setIsDrawingMode: (val: boolean) => void;
  drawModeType: 'freehand' | 'vector';
  setDrawModeType: (val: 'freehand' | 'vector') => void;
  drawTimeRange: { start: number; end: number };
  setDrawTimeRange: (val: { start: number; end: number }) => void;
  isRecordingMode: boolean;
  setIsRecordingMode: (val: boolean) => void;
  onDeleteMovementPoint: (artistId: string, movId: string, pointIndex: number) => void; // kept in interface for compatibility
}

export const ControlSidebar: React.FC<ControlSidebarProps> = ({
  project,
  activeArtistId,
  activeMovementId,
  onSelectMovement,
  currentTime,
  isOpen,
  activeTab,
  onRenameProject,
  onUpdateDirectorName,
  onUpdateStageDimensions,
  onUpdateProjectDuration,
  onToggleConstantScale,
  onUpdateSetting,
  onCreateGroup,
  onDeleteGroup,
  onToggleGroupVisibility,
  onToggleGroupPathVisibility,
  onUpdateGroupColor,
  onUpdateGroupName,
  onCreateArtist,
  onDeleteArtist,
  onToggleArtistVisibility,
  onToggleArtistHighlight,
  onToggleArtistPathVisibility,
  onUpdateArtistName,
  onUpdateArtistColor,
  onUpdateArtistIcon,
  onToggleArtistGroup,
  onTimelineScrub,
  onAudioUpload,
  onBackgroundUpload,
  onBackgroundSettingsChange,
  onSelectArtist,
  onUpdateKeypointTime,
  onUpdateKeypointPosition,
  onDeleteKeypoint,
  onCreateKeypointAtCurrentTime,

  // Advanced Movement Creation Props
  isDrawingMode,
  setIsDrawingMode,
  drawModeType,
  setDrawModeType,
  setDrawTimeRange,
  isRecordingMode,
  setIsRecordingMode,
  onImportProject,
  onExportProject,
  lang,
  onLanguageChange,
}) => {
  const [width, setWidth] = useState<number>(() => {
    const saved = localStorage.getItem('stage_path_sidebar_width');
    return saved ? Math.min(Math.max(parseInt(saved, 10), 260), 650) : 350;
  });
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.min(Math.max(newWidth, 260), 650);
      setWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem('stage_path_sidebar_width', width.toString());
      document.body.style.cursor = '';
    };

    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isResizing, width]);

  return (
    <aside 
      className="control-sidebar glass-panel h-full flex flex-col overflow-hidden border-l border-white/5" 
      style={{ 
        width: isOpen ? `${width}px` : '0px',
        transition: isResizing ? 'none' : 'transform var(--transition-normal), width var(--transition-normal)',
        backgroundColor: 'rgba(11, 13, 19, 0.75)' 
      }}
    >
      {/* Resizer Handle */}
      {isOpen && (
        <div
          onMouseDown={handleMouseDown}
          className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-50 transition-colors duration-150 ${
            isResizing ? 'bg-indigo-500' : 'hover:bg-indigo-500/30'
          }`}
          title="Faites glisser pour redimensionner"
        />
      )}
      
      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {activeTab === 'casting' && (
          <CastingTab
            project={project}
            activeArtistId={activeArtistId}
            onSelectArtist={onSelectArtist}
            onToggleArtistVisibility={onToggleArtistVisibility}
            onToggleArtistHighlight={onToggleArtistHighlight}
            onCreateGroup={onCreateGroup}
            onDeleteGroup={onDeleteGroup}
            onToggleGroupVisibility={onToggleGroupVisibility}
            onToggleArtistGroup={onToggleArtistGroup}
            onToggleArtistPathVisibility={onToggleArtistPathVisibility}
            onToggleGroupPathVisibility={onToggleGroupPathVisibility}
            onCreateArtist={onCreateArtist}
            onDeleteArtist={onDeleteArtist}
            onUpdateGroupColor={onUpdateGroupColor}
            onUpdateGroupName={onUpdateGroupName}
            onUpdateArtistColor={onUpdateArtistColor}
            onUpdateArtistIcon={onUpdateArtistIcon}
            onUpdateArtistName={onUpdateArtistName}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsTab
            project={project}
            activeArtistId={activeArtistId}
            activeMovementId={activeMovementId}
            onSelectMovement={onSelectMovement}
            currentTime={currentTime}
            isDrawingMode={isDrawingMode}
            setIsDrawingMode={setIsDrawingMode}
            drawModeType={drawModeType}
            setDrawModeType={setDrawModeType}
            setDrawTimeRange={setDrawTimeRange}
            isRecordingMode={isRecordingMode}
            setIsRecordingMode={setIsRecordingMode}
            onCreateKeypointAtCurrentTime={onCreateKeypointAtCurrentTime}
            onDeleteKeypoint={onDeleteKeypoint}
            onUpdateKeypointTime={onUpdateKeypointTime}
            onUpdateKeypointPosition={onUpdateKeypointPosition}
            onTimelineScrub={onTimelineScrub}
          />
        )}

        {activeTab === 'scenography' && (
          <ScenographyTab
            project={project}
            onRenameProject={onRenameProject}
            onUpdateDirectorName={onUpdateDirectorName}
            onUpdateStageDimensions={onUpdateStageDimensions}
            onUpdateProjectDuration={onUpdateProjectDuration}
            onBackgroundUpload={onBackgroundUpload}
            onBackgroundSettingsChange={onBackgroundSettingsChange}
            onAudioUpload={onAudioUpload}
            lang={lang}
          />
        )}

        {activeTab === 'export' && (
          <ExportTab project={project} />
        )}

        {activeTab === 'options' && (
          <OptionsTab
            project={project}
            lang={lang}
            onLanguageChange={onLanguageChange}
            onUpdateSetting={onUpdateSetting}
            onImportProject={onImportProject}
            onExportProject={onExportProject}
            onToggleConstantScale={onToggleConstantScale}
          />
        )}
      </div>
    </aside>
  );
};
