import React from 'react';
import { Users } from 'lucide-react';
import { Project, Point } from '../../types';
import { getArtistPositionAtTime } from '../../utils/math';
import { ArtistEditPanel } from './ArtistEditPanel';
import { MovementCreatorPanel } from './MovementCreatorPanel';
import { KeypointsManagerPanel } from './KeypointsManagerPanel';

interface MovementsTabProps {
  project: Project;
  activeArtistId: string | null;
  activeMovementId: string | null;
  onSelectMovement: (id: string | null) => void;
  currentTime: number;
  onDeleteArtist: (id: string) => void;
  onUpdateArtistName: (id: string, name: string) => void;
  onUpdateArtistColor: (id: string, color: string) => void;
  onUpdateArtistIcon: (id: string, icon: string | null) => void;
  onToggleArtistGroup: (artistId: string, groupId: string) => void;
  isDrawingMode: boolean;
  setIsDrawingMode: (val: boolean) => void;
  drawModeType: 'freehand' | 'vector';
  setDrawModeType: (val: 'freehand' | 'vector') => void;
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
  onCreateKeypointAtCurrentTime: (artistId: string) => void;
  onDeleteKeypoint: (artistId: string, keypointId: string) => void;
  onUpdateKeypointTime: (artistId: string, keypointId: string, newTime: number) => void;
  onUpdateKeypointPosition: (artistId: string, keypointId: string, position: Point) => void;
  onToggleTransitionType: (artistId: string, movId: string) => void;
  onTimelineScrub: (time: number) => void;
  onUpdateMovementLabel?: (artistId: string, movementId: string, label: string) => void;
  onToggleArtistPathVisibility: (artistId: string) => void;
}

export const MovementsTab: React.FC<MovementsTabProps> = ({
  project,
  activeArtistId,
  activeMovementId,
  onSelectMovement,
  currentTime,
  onDeleteArtist,
  onUpdateArtistName,
  onUpdateArtistColor,
  onUpdateArtistIcon,
  onToggleArtistGroup,
  isDrawingMode,
  setIsDrawingMode,
  drawModeType,
  setDrawModeType,
  setDrawTimeRange,
  isRecordingMode,
  setIsRecordingMode,
  onCreateManualMovement,
  onCreateKeypointAtCurrentTime,
  onDeleteKeypoint,
  onUpdateKeypointTime,
  onUpdateKeypointPosition,
  onToggleTransitionType,
  onTimelineScrub,
  onUpdateMovementLabel,
  onToggleArtistPathVisibility,
}) => {
  const activeArtist = project.artists.find(art => art.id === activeArtistId) || null;

  if (!activeArtist) {
    return (
      <div className="h-40 flex flex-col items-center justify-center text-center text-slate-500 italic p-6 border border-dashed border-white/5 rounded-xl bg-slate-900/10 mt-10">
        <Users size={20} className="mb-2 text-slate-600" />
        Sélectionnez un figurant sur la scène pour programmer ses mouvements et éditer ses paramètres.
      </div>
    );
  }

  const pos = getArtistPositionAtTime(activeArtist, currentTime, project.stageWidth, project.stageHeight);
  const xMeters = (pos.x - (project.stageWidth * 100) / 2) / 100;
  const yMeters = (((project.stageHeight * 100) / 2) - pos.y) / 100;
  
  const isMovingNow = activeArtist.movements.some(
    mov => currentTime >= mov.startTime && currentTime <= mov.endTime
  );

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex flex-col gap-4">
        
        <ArtistEditPanel
          project={project}
          activeArtistId={activeArtist.id}
          onDeleteArtist={onDeleteArtist}
          onUpdateArtistName={onUpdateArtistName}
          onUpdateArtistColor={onUpdateArtistColor}
          onUpdateArtistIcon={onUpdateArtistIcon}
          onToggleArtistPathVisibility={onToggleArtistPathVisibility}
          onToggleArtistGroup={onToggleArtistGroup}
        />

        {/* Real-time Status Card */}
        <div className="realtime-status-card border-indigo-500/15" style={{ backgroundColor: 'rgba(99, 102, 241, 0.04)' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-cyan-400 font-bold tracking-wider">STATUT EN TEMPS RÉEL</span>
          </div>
          
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Position :</span>
              <span className="font-mono text-slate-200 font-semibold text-[11px]">
                X: <span className={xMeters >= 0 ? 'text-indigo-300' : 'text-orange-300'}>{xMeters >= 0 ? '+' : ''}{xMeters.toFixed(2)}m</span>, 
                Y: <span className={yMeters >= 0 ? 'text-indigo-300' : 'text-orange-300'}>{yMeters >= 0 ? '+' : ''}{yMeters.toFixed(2)}m</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Timecode actuel :</span>
              <span className="font-mono text-slate-100 font-bold text-[11px] bg-slate-950/40 px-1.5 py-0.5 rounded border border-white/5">{currentTime.toFixed(2)}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">État :</span>
              <span className={`font-bold text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1 ${isMovingNow ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/15' : 'bg-amber-500/5 text-amber-400 border border-amber-500/15'}`}>
                {isMovingNow ? '🏃‍♂️ En déplacement' : '🛑 Statique'}
              </span>
            </div>
          </div>
        </div>

        {/* Advanced Movement Creator Panel */}
        <MovementCreatorPanel
          project={project}
          activeArtist={activeArtist}
          currentTime={currentTime}
          isDrawingMode={isDrawingMode}
          setIsDrawingMode={setIsDrawingMode}
          drawModeType={drawModeType}
          setDrawModeType={setDrawModeType}
          setDrawTimeRange={setDrawTimeRange}
          isRecordingMode={isRecordingMode}
          setIsRecordingMode={setIsRecordingMode}
          onCreateManualMovement={onCreateManualMovement}
        />

        {/* Keypoints Manager Panel */}
        <KeypointsManagerPanel
          project={project}
          activeArtist={activeArtist}
          activeMovementId={activeMovementId}
          onSelectMovement={onSelectMovement}
          currentTime={currentTime}
          onCreateKeypointAtCurrentTime={onCreateKeypointAtCurrentTime}
          onDeleteKeypoint={onDeleteKeypoint}
          onUpdateKeypointTime={onUpdateKeypointTime}
          onUpdateKeypointPosition={onUpdateKeypointPosition}
          onToggleTransitionType={onToggleTransitionType}
          onTimelineScrub={onTimelineScrub}
          onUpdateMovementLabel={onUpdateMovementLabel}
        />

      </div>
    </div>
  );
};
