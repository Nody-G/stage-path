import React, { useState, useEffect } from 'react';
import { 
  Users, Move, Settings, Sliders, ChevronRight, Video
} from 'lucide-react';
import { Project, Point } from '../types';
import { CastingTab } from './sidebar/CastingTab';
import { MovementsTab } from './sidebar/MovementsTab';
import { ScenographyTab } from './sidebar/ScenographyTab';
import { OptionsTab } from './sidebar/OptionsTab';
import { ExportTab } from './sidebar/ExportTab';
import { translations, Lang } from '../utils/i18n';

interface ControlSidebarProps {
  project: Project;
  activeArtistId: string | null;
  activeMovementId: string | null;
  onSelectMovement: (id: string | null) => void;
  currentTime: number;
  isOpen: boolean; // kept in interface for compatibility
  onToggleOpen: () => void;

  // Project Mutation Callbacks
  onRenameProject: (name: string) => void;
  onUpdateDirectorName: (name: string) => void;
  onUpdateStageDimensions: (w: number, h: number) => void;
  onUpdateProjectDuration: (dur: number) => void;
  onToggleConstantScale: () => void;
  onUpdateSetting: (key: string, val: any) => void;
  
  // Group Callbacks
  onCreateGroup: (name: string, color: string, parentId?: string) => void;
  onDeleteGroup: (id: string) => void;
  onToggleGroupVisibility: (id: string) => void;
  onToggleGroupPathVisibility: (id: string) => void;
  
  // Artist Callbacks
  onCreateArtist: (name: string, color: string) => void;
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
  onToggleTransitionType: (artistId: string, movId: string) => void;
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
  onCreateManualMovement: (
    artistId: string,
    startTime: number,
    endTime: number,
    targetX: number,
    targetY: number,
    transitionType: 'linear' | 'curved'
  ) => void;
  onDeleteMovementPoint: (artistId: string, movId: string, pointIndex: number) => void; // kept in interface for compatibility
  onUpdateMovementLabel?: (artistId: string, movementId: string, label: string) => void;
}

export const ControlSidebar: React.FC<ControlSidebarProps> = ({
  project,
  activeArtistId,
  activeMovementId,
  onSelectMovement,
  currentTime,
  isOpen,
  onToggleOpen,
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
  onToggleTransitionType,
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
  onCreateManualMovement,
  onImportProject,
  onExportProject,
  lang,
  onLanguageChange,
  onUpdateMovementLabel,
}) => {
  const [activeTab, setActiveTab] = useState<'casting' | 'movements' | 'scenography' | 'options' | 'export'>('casting');
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

  const t = (key: keyof typeof translations['fr']) => {
    return translations[lang][key] || translations['fr'][key] || key;
  };

  useEffect(() => {
    if (activeArtistId && activeTab !== 'casting') {
      setActiveTab('movements');
    }
  }, [activeArtistId]);

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
      
      <div className="sidebar-header border-b border-white/5 flex items-center justify-between p-3 shrink-0 bg-slate-950/20">
        <div className="flex gap-1 p-1 bg-[#050608] border border-white/5 rounded-xl w-full mr-2">
          <button
            onClick={() => setActiveTab('casting')}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all duration-200 ${
              activeTab === 'casting' 
                ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-200' 
                : 'text-slate-400 border border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={11} /> {t('tabCasting')}
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all duration-200 ${
              activeTab === 'movements' 
                ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-200' 
                : 'text-slate-400 border border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Move size={11} /> {t('tabMovements')}
          </button>
          <button
            onClick={() => setActiveTab('scenography')}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all duration-200 ${
              activeTab === 'scenography' 
                ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-200' 
                : 'text-slate-400 border border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders size={11} /> {t('tabScenography')}
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all duration-200 ${
              activeTab === 'export' 
                ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-200' 
                : 'text-slate-400 border border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Video size={11} /> {t('tabExport')}
          </button>
          <button
            onClick={() => setActiveTab('options')}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all duration-200 ${
              activeTab === 'options' 
                ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-200' 
                : 'text-slate-400 border border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings size={11} /> {t('tabOptions')}
          </button>
        </div>
        <button 
          onClick={onToggleOpen}
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition shrink-0 border border-transparent hover:border-white/5"
          title="Fermer le panneau"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {activeTab === 'casting' && (
          <CastingTab
            project={project}
            activeArtistId={activeArtistId}
            onSelectArtist={onSelectArtist}
            onCreateArtist={onCreateArtist}
            onDeleteArtist={onDeleteArtist}
            onToggleArtistVisibility={onToggleArtistVisibility}
            onToggleArtistHighlight={onToggleArtistHighlight}
            onCreateGroup={onCreateGroup}
            onDeleteGroup={onDeleteGroup}
            onToggleGroupVisibility={onToggleGroupVisibility}
            onToggleArtistGroup={onToggleArtistGroup}
            onToggleArtistPathVisibility={onToggleArtistPathVisibility}
            onToggleGroupPathVisibility={onToggleGroupPathVisibility}
            onUpdateArtistName={onUpdateArtistName}
            onUpdateArtistColor={onUpdateArtistColor}
            onUpdateArtistIcon={onUpdateArtistIcon}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsTab
            project={project}
            activeArtistId={activeArtistId}
            activeMovementId={activeMovementId}
            onSelectMovement={onSelectMovement}
            currentTime={currentTime}
            onDeleteArtist={onDeleteArtist}
            onUpdateArtistName={onUpdateArtistName}
            onUpdateArtistColor={onUpdateArtistColor}
            onUpdateArtistIcon={onUpdateArtistIcon}
            onToggleArtistGroup={onToggleArtistGroup}
            isDrawingMode={isDrawingMode}
            setIsDrawingMode={setIsDrawingMode}
            drawModeType={drawModeType}
            setDrawModeType={setDrawModeType}
            setDrawTimeRange={setDrawTimeRange}
            isRecordingMode={isRecordingMode}
            setIsRecordingMode={setIsRecordingMode}
            onCreateManualMovement={onCreateManualMovement}
            onCreateKeypointAtCurrentTime={onCreateKeypointAtCurrentTime}
            onDeleteKeypoint={onDeleteKeypoint}
            onUpdateKeypointTime={onUpdateKeypointTime}
            onUpdateKeypointPosition={onUpdateKeypointPosition}
            onToggleTransitionType={onToggleTransitionType}
            onTimelineScrub={onTimelineScrub}
            onUpdateMovementLabel={onUpdateMovementLabel}
            onToggleArtistPathVisibility={onToggleArtistPathVisibility}
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
