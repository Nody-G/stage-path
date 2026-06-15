import React, { useState, useEffect } from 'react';
import { 
  Trash2, Plus, Users, Copy, ClipboardPaste
} from 'lucide-react';
import { Project, Point } from '../../types';
import { getArtistPositionAtTime } from '../../utils/math';
import { ArtistEditPanel } from './ArtistEditPanel';



const formatHMS = (timeInSec: number): string => {
  const hours = Math.floor(timeInSec / 3600);
  const mins = Math.floor((timeInSec % 3600) / 60);
  const secs = Math.floor(timeInSec % 60);
  const ms = Math.floor((timeInSec % 1) * 100);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

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
  // Creator panels tabs selection
  const [activeCreatorMode, setActiveCreatorMode] = useState<'p2p' | 'vector' | 'freehand' | 'realtime'>('p2p');



  // Copy/Paste position clipboard
  const [copiedPosition, setCopiedPosition] = useState<{ x: number; y: number } | null>(null);

  const [showMiniPaths, setShowMiniPaths] = useState<boolean>(() => {
    const saved = localStorage.getItem('stagepath_show_mini_paths');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('stagepath_show_mini_paths', showMiniPaths.toString());
  }, [showMiniPaths]);



  // Manual movement form states
  const [manualStart, setManualStart] = useState<number>(0);
  const [manualEnd, setManualEnd] = useState<number>(5);
  const [manualX, setManualX] = useState<number>(0);
  const [manualY, setManualY] = useState<number>(0);
  const [manualTransitionType, setManualTransitionType] = useState<'linear' | 'curved'>('linear');

  // Vector drawing form states
  const [vectorStart, setVectorStart] = useState<number>(0);
  const [vectorEnd, setVectorEnd] = useState<number>(5);

  // Freehand drawing form states
  const [freehandStart, setFreehandStart] = useState<number>(0);
  const [freehandEnd, setFreehandEnd] = useState<number>(5);

  // Sync timing and coordinates with currentTime and selected performer when they change
  // Sync timing with currentTime and selected performer when they change
  useEffect(() => {
    const roundedTime = parseFloat(currentTime.toFixed(2));
    setManualStart(roundedTime);
    setManualEnd(parseFloat(Math.min(project.duration, currentTime + 5).toFixed(2)));
    setVectorStart(roundedTime);
    setVectorEnd(parseFloat(Math.min(project.duration, currentTime + 5).toFixed(2)));
    setFreehandStart(roundedTime);
    setFreehandEnd(parseFloat(Math.min(project.duration, currentTime + 5).toFixed(2)));
  }, [currentTime, activeArtistId, project.duration]);

  // Sync manual X/Y destination coordinates with the performer's position at manualStart
  useEffect(() => {
    const artist = project.artists.find(art => art.id === activeArtistId);
    if (artist) {
      const currentPos = getArtistPositionAtTime(artist, manualStart, project.stageWidth, project.stageHeight);
      const currentXM = (currentPos.x - (project.stageWidth * 100) / 2) / 100;
      const currentYM = (((project.stageHeight * 100) / 2) - currentPos.y) / 100;
      setManualX(parseFloat(currentXM.toFixed(2)));
      setManualY(parseFloat(currentYM.toFixed(2)));
    } else {
      setManualX(0);
      setManualY(0);
    }
  }, [manualStart, activeArtistId, project.artists, project.stageWidth, project.stageHeight]);

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
        <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
          <span className="text-[10px] text-indigo-400 font-bold tracking-wider">PROGRAMMER UNE TRAJECTOIRE</span>
          
          {/* Creator Mode Selector Tabs */}
          <div className="grid grid-cols-4 gap-1 p-0.5 bg-black/40 border border-white/5 rounded-lg">
            {[
              { id: 'p2p', label: 'Jalon' },
              { id: 'vector', label: 'Plume' },
              { id: 'freehand', label: 'Dessin' },
              { id: 'realtime', label: 'Direct' }
            ].map(mode => (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setActiveCreatorMode(mode.id as any);
                  setIsDrawingMode(false);
                  setIsRecordingMode(false);
                }}
                className={`py-1 rounded text-[9px] font-bold transition-all ${
                  activeCreatorMode === mode.id
                    ? 'bg-indigo-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Creator Form Content */}
          {activeCreatorMode === 'p2p' && (
            <div className="flex flex-col gap-2.5 animate-fade-in text-[11px]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-0.5">Début (s)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    max={project.duration}
                    value={manualStart}
                    onChange={(e) => setManualStart(parseFloat(e.target.value) || 0)}
                    className="glass-input w-full p-1.5 font-mono text-center text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-0.5">Fin (s)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    max={project.duration}
                    value={manualEnd}
                    onChange={(e) => setManualEnd(parseFloat(e.target.value) || 0)}
                    className="glass-input w-full p-1.5 font-mono text-center text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-0.5">X destination (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualX}
                    onChange={(e) => setManualX(parseFloat(e.target.value) || 0)}
                    className="glass-input w-full p-1.5 font-mono text-center text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-0.5">Y destination (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualY}
                    onChange={(e) => setManualY(parseFloat(e.target.value) || 0)}
                    className="glass-input w-full p-1.5 font-mono text-center text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-1">
                <span className="text-slate-400">Type de ligne :</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setManualTransitionType('linear')}
                    className={`px-2 py-0.5 rounded font-bold border transition text-[9px] ${
                      manualTransitionType === 'linear'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/10'
                    }`}
                  >
                    📏 Droit
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualTransitionType('curved')}
                    className={`px-2 py-0.5 rounded font-bold border transition text-[9px] ${
                      manualTransitionType === 'curved'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/10'
                    }`}
                  >
                    ➰ Courbe
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const wPx = project.stageWidth * 100;
                  const hPx = project.stageHeight * 100;
                  const targetXPx = manualX * 100 + wPx / 2;
                  const targetYPx = hPx / 2 - manualY * 100;
                  onCreateManualMovement(
                    activeArtist.id,
                    manualStart,
                    manualEnd,
                    targetXPx,
                    targetYPx,
                    manualTransitionType
                  );
                }}
                className="w-full mt-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
              >
                Créer le déplacement
              </button>
            </div>
          )}

          {activeCreatorMode === 'vector' && (
            <div className="flex flex-col gap-2.5 animate-fade-in text-[11px]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-0.5">Début (s)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    max={project.duration}
                    value={vectorStart}
                    onChange={(e) => setVectorStart(parseFloat(e.target.value) || 0)}
                    className="glass-input w-full p-1.5 font-mono text-center text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-0.5">Fin (s)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    max={project.duration}
                    value={vectorEnd}
                    onChange={(e) => setVectorEnd(parseFloat(e.target.value) || 0)}
                    className="glass-input w-full p-1.5 font-mono text-center text-xs"
                  />
                </div>
              </div>

              <span className="text-[10px] text-slate-400 leading-normal block py-1 bg-black/20 px-2 rounded-lg border border-white/5">
                💡 <strong>Mode Plume :</strong> Activez le tracé, puis cliquez à plusieurs endroits sur le canevas pour poser des points. Validez en cliquant sur le HUD du plateau ou en appuyant sur <code>Entrée</code>.
              </span>

              <button
                type="button"
                onClick={() => {
                  if (isDrawingMode && drawModeType === 'vector') {
                    setIsDrawingMode(false);
                  } else {
                    setDrawModeType('vector');
                    setDrawTimeRange({ start: vectorStart, end: vectorEnd });
                    setIsDrawingMode(true);
                  }
                }}
                className={`w-full py-1.5 font-semibold rounded-lg transition ${
                  isDrawingMode && drawModeType === 'vector'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isDrawingMode && drawModeType === 'vector' ? 'Annuler le tracé vectoriel' : 'Activer le tracé vectoriel'}
              </button>
            </div>
          )}

          {activeCreatorMode === 'freehand' && (
            <div className="flex flex-col gap-2.5 animate-fade-in text-[11px]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-0.5">Début (s)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    max={project.duration}
                    value={freehandStart}
                    onChange={(e) => setFreehandStart(parseFloat(e.target.value) || 0)}
                    className="glass-input w-full p-1.5 font-mono text-center text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-0.5">Fin (s)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    max={project.duration}
                    value={freehandEnd}
                    onChange={(e) => setFreehandEnd(parseFloat(e.target.value) || 0)}
                    className="glass-input w-full p-1.5 font-mono text-center text-xs"
                  />
                </div>
              </div>

              <span className="text-[10px] text-slate-400 leading-normal block py-1 bg-black/20 px-2 rounded-lg border border-white/5">
                ✍️ <strong>Main Levée :</strong> Activez le tracé, puis cliquez et glissez librement sur le plateau pour dessiner une courbe. Le tracé sera enregistré à la libération de la souris.
              </span>

              <button
                type="button"
                onClick={() => {
                  if (isDrawingMode && drawModeType === 'freehand') {
                    setIsDrawingMode(false);
                  } else {
                    setDrawModeType('freehand');
                    setDrawTimeRange({ start: freehandStart, end: freehandEnd });
                    setIsDrawingMode(true);
                  }
                }}
                className={`w-full py-1.5 font-semibold rounded-lg transition ${
                  isDrawingMode && drawModeType === 'freehand'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isDrawingMode && drawModeType === 'freehand' ? 'Annuler le tracé libre' : 'Activer le tracé libre'}
              </button>
            </div>
          )}

          {activeCreatorMode === 'realtime' && (
            <div className="flex flex-col gap-2.5 animate-fade-in text-[11px]">
              <span className="text-[10px] text-slate-400 leading-normal block py-1 bg-black/20 px-2 rounded-lg border border-white/5">
                🔴 <strong>En direct (DAW) :</strong> Activez l'enregistrement, puis maintenez le clic et glissez le figurant en direct pendant la lecture de la bande-son pour enregistrer sa trajectoire.
              </span>

              <button
                type="button"
                onClick={() => {
                  setIsRecordingMode(!isRecordingMode);
                }}
                className={`w-full py-2 font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  isRecordingMode
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                {isRecordingMode ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement en direct"}
              </button>
            </div>
          )}
        </div>

        {/* Keyframes (Jalons) Manager */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onCreateKeypointAtCurrentTime(activeArtist.id)}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
            style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
          >
            <Plus size={14} /> Poser un Jalon à {currentTime.toFixed(2)}s
          </button>

          <div className="flex items-center justify-between mt-2 border-b border-white/5 pb-1.5">
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <span>Jalons de positionnement</span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-slate-400 font-mono font-bold">
                {
                  (() => {
                    let count = 1;
                    const sorted = [...activeArtist.movements].sort((a, b) => a.startTime - b.startTime);
                    sorted.forEach((mov, idx) => {
                      const prev = sorted[idx - 1];
                      const isGap = prev ? (mov.startTime > prev.endTime) : (mov.startTime > 0);
                      if (isGap) count++;
                      count++;
                    });
                    return count;
                  })()
                }
              </span>
            </h3>
            <label className="flex items-center gap-1 text-[10px] text-slate-450 hover:text-slate-200 cursor-pointer select-none font-bold">
              <input 
                type="checkbox" 
                checked={showMiniPaths} 
                onChange={() => setShowMiniPaths(!showMiniPaths)}
                className="rounded border-white/10 bg-black/45 text-indigo-650 focus:ring-indigo-500 accent-indigo-500"
              />
              Miniatures
            </label>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {(() => {
              const wPx = project.stageWidth * 100;
              const hPx = project.stageHeight * 100;
              const list: {
                id: string;
                time: number;
                x: number;
                y: number;
                isStart: boolean;
                movId?: string;
                transitionType?: 'linear' | 'curved';
              }[] = [];
              
              const sorted = [...activeArtist.movements].sort((a, b) => a.startTime - b.startTime);
              const hasMovementAtZero = sorted.length > 0 && sorted[0].startTime === 0;

              if (!hasMovementAtZero) {
                list.push({
                  id: 'initial',
                  time: 0,
                  x: (activeArtist.initialPosition.x - wPx / 2) / 100,
                  y: (hPx / 2 - activeArtist.initialPosition.y) / 100,
                  isStart: true
                });
              }
              
              sorted.forEach((mov, idx) => {
                const prev = sorted[idx - 1];
                const isGap = prev ? (mov.startTime > prev.endTime) : (mov.startTime > 0);
                const isFirstAndStartsAtZero = idx === 0 && mov.startTime === 0;
                
                if (isGap || isFirstAndStartsAtZero) {
                  list.push({
                    id: mov.id + '_start',
                    time: mov.startTime,
                    x: (mov.points[0].x - wPx / 2) / 100,
                    y: (hPx / 2 - mov.points[0].y) / 100,
                    isStart: true,
                    movId: mov.id
                  });
                }
                
                list.push({
                  id: mov.id + '_end',
                  time: mov.endTime,
                  x: (mov.points[mov.points.length - 1].x - wPx / 2) / 100,
                  y: (hPx / 2 - mov.points[mov.points.length - 1].y) / 100,
                  isStart: false,
                  movId: mov.id,
                  transitionType: mov.transitionType || 'linear'
                });
              });

              list.sort((a, b) => a.time - b.time);

              return list.map((kp) => {
                const isInitial = kp.id === 'initial';
                const isSelected = kp.movId && kp.movId === activeMovementId;
                
                return (
                  <div 
                    key={kp.id} 
                    onClick={() => kp.movId && onSelectMovement(kp.movId)}
                    className={`flex flex-col gap-2 p-3 rounded-lg border text-xs hover:border-slate-800 hover:bg-slate-900/30 transition-all ${
                      isSelected 
                        ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_8px_rgba(99,102,241,0.15)] z-10' 
                        : 'bg-slate-900/20 border-white/5'
                    }`}
                    style={{ borderLeftWidth: '3px', borderLeftColor: isInitial ? '#64748b' : kp.isStart ? '#10b981' : '#6366f1' }}
                  >
                    <div className="flex items-center font-semibold gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTimelineScrub(kp.time);
                            if (kp.movId) onSelectMovement(kp.movId);
                          }}
                          className="font-mono text-slate-300 hover:text-indigo-400 transition text-left flex items-center gap-1 shrink-0"
                          title="Déplacer la playhead à ce jalon"
                        >
                          ⏱️ {isInitial || kp.time === 0 ? "Départ" : formatHMS(kp.time)}
                        </button>

                        {!isInitial && kp.movId && (
                          <input
                            type="text"
                            placeholder="Note / Libellé..."
                            value={activeArtist.movements.find(m => m.id === kp.movId)?.label || ''}
                            onChange={(e) => onUpdateMovementLabel?.(activeArtist.id, kp.movId!, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-input text-[10px] py-0.5 px-2 min-w-0 flex-1 h-6 bg-[#050608]/40 border-white/5 focus:border-indigo-500/50"
                            title="Libellé du déplacement"
                          />
                        )}
                      </div>
                      
                      {!isInitial && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Supprimer ce jalon de position ?")) {
                              onDeleteKeypoint(activeArtist.id, kp.id);
                            }
                          }}
                          className="p-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 transition shrink-0"
                          title="Supprimer ce jalon"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-end gap-1.5">
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 flex-1 min-w-0">
                        <div>
                          <label className="block mb-0.5">Temps (s)</label>
                          <input 
                            type="number"
                            min="0"
                            step="0.1"
                            max={project.duration}
                            disabled={isInitial}
                            value={kp.time}
                            onChange={(e) => onUpdateKeypointTime(activeArtist.id, kp.id, parseFloat(e.target.value) || 0)}
                            className="glass-input w-full p-1 text-[10px] font-mono text-center disabled:opacity-45 bg-[#050608]"
                          />
                        </div>
                        <div>
                          <label className="block mb-0.5">X (m)</label>
                          <input 
                            type="number"
                            step="0.05"
                            value={parseFloat(kp.x.toFixed(2))}
                            onChange={(e) => {
                              const valM = parseFloat(e.target.value) || 0;
                              const valPx = valM * 100 + wPx / 2;
                              const currentYPx = kp.isStart 
                                ? (kp.movId ? (activeArtist.movements.find(m => m.id === kp.movId)?.points[0].y || activeArtist.initialPosition.y) : activeArtist.initialPosition.y)
                                : (kp.movId ? (activeArtist.movements.find(m => m.id === kp.movId)?.points[activeArtist.movements.find(m => m.id === kp.movId)!.points.length - 1].y || activeArtist.initialPosition.y) : activeArtist.initialPosition.y);
                              onUpdateKeypointPosition(activeArtist.id, kp.id, { x: valPx, y: currentYPx });
                            }}
                            className="glass-input w-full p-1 text-[10px] font-mono text-center bg-[#050608]"
                          />
                        </div>
                        <div>
                          <label className="block mb-0.5">Y (m)</label>
                          <input 
                            type="number"
                            step="0.05"
                            value={parseFloat(kp.y.toFixed(2))}
                            onChange={(e) => {
                              const valM = parseFloat(e.target.value) || 0;
                              const valPx = hPx / 2 - valM * 100;
                              const currentXPx = kp.isStart 
                                ? (kp.movId ? (activeArtist.movements.find(m => m.id === kp.movId)?.points[0].x || activeArtist.initialPosition.x) : activeArtist.initialPosition.x)
                                : (kp.movId ? (activeArtist.movements.find(m => m.id === kp.movId)?.points[activeArtist.movements.find(m => m.id === kp.movId)!.points.length - 1].x || activeArtist.initialPosition.x) : activeArtist.initialPosition.x);
                              onUpdateKeypointPosition(activeArtist.id, kp.id, { x: currentXPx, y: valPx });
                            }}
                            className="glass-input w-full p-1 text-[10px] font-mono text-center bg-[#050608]"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0 pb-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCopiedPosition({ x: kp.x, y: kp.y });
                          }}
                          className={`p-1 rounded border transition ${
                            copiedPosition && copiedPosition.x === kp.x && copiedPosition.y === kp.y
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-700/30 border-white/5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                          }`}
                          title={`Copier la position (${kp.x.toFixed(2)}, ${kp.y.toFixed(2)})`}
                        >
                          <Copy size={11} />
                        </button>
                        {copiedPosition && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newXPx = copiedPosition.x * 100 + wPx / 2;
                              const newYPx = hPx / 2 - copiedPosition.y * 100;
                              onUpdateKeypointPosition(activeArtist.id, kp.id, { x: newXPx, y: newYPx });
                            }}
                            className="p-1 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 hover:text-indigo-300 transition"
                            title={`Coller la position (${copiedPosition.x.toFixed(2)}, ${copiedPosition.y.toFixed(2)})`}
                          >
                            <ClipboardPaste size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Transition Type dropdown leading to this Keypoint */}
                    {!kp.isStart && kp.movId && (
                      <div className="flex items-center justify-between mt-1.5 pt-2 border-t border-white/5 text-[10px]">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-500 font-semibold">Transition précédente :</span>
                          <button
                            type="button"
                            onClick={() => onToggleTransitionType(activeArtist.id, kp.movId!)}
                            className={`px-2 py-0.5 rounded font-bold border transition text-[9px] w-fit ${
                              kp.transitionType === 'curved'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.05)]'
                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.05)]'
                            }`}
                          >
                            {kp.transitionType === 'curved' ? '➰ Courbe' : '📏 Linéaire'}
                          </button>
                        </div>
                        {showMiniPaths && (() => {
                          const mov = activeArtist.movements.find(m => m.id === kp.movId);
                          if (mov) {
                            const pts = mov.lut.length > 0 ? mov.lut : mov.points;
                            return getMiniPathSvg(pts);
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

const getMiniPathSvg = (points: Point[]) => {
  if (points.length < 2) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  points.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const width = 60;
  const height = 30;
  const pad = 4;

  const dx = maxX - minX;
  const dy = maxY - minY;

  if (dx < 1 && dy < 1) {
    return (
      <svg width={width} height={height} className="bg-black/40 rounded border border-white/5 shrink-0 select-none">
        <circle cx={width / 2} cy={height / 2} r={3} fill="#6366f1" />
      </svg>
    );
  }

  const availableW = width - 2 * pad;
  const availableH = height - 2 * pad;

  let scale = 1;
  if (dx > 0 && dy > 0) {
    scale = Math.min(availableW / dx, availableH / dy);
  } else if (dx > 0) {
    scale = availableW / dx;
  } else if (dy > 0) {
    scale = availableH / dy;
  }

  const offsetX = pad + (availableW - dx * scale) / 2;
  const offsetY = pad + (availableH - dy * scale) / 2;

  const sampleRate = Math.max(1, Math.floor(points.length / 50));
  const svgPoints: Point[] = [];
  for (let i = 0; i < points.length; i += sampleRate) {
    svgPoints.push({
      x: offsetX + (points[i].x - minX) * scale,
      y: offsetY + (points[i].y - minY) * scale
    });
  }
  if (points.length > 1 && (points.length - 1) % sampleRate !== 0) {
    svgPoints.push({
      x: offsetX + (points[points.length - 1].x - minX) * scale,
      y: offsetY + (points[points.length - 1].y - minY) * scale
    });
  }

  let pathD = `M ${svgPoints[0].x.toFixed(1)} ${svgPoints[0].y.toFixed(1)}`;
  for (let i = 1; i < svgPoints.length; i++) {
    pathD += ` L ${svgPoints[i].x.toFixed(1)} ${svgPoints[i].y.toFixed(1)}`;
  }

  return (
    <svg width={width} height={height} className="bg-black/40 rounded border border-white/5 shrink-0 select-none">
      <title>Aperçu du déplacement</title>
      <path 
        d={pathD} 
        fill="none" 
        stroke="#818cf8" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <circle cx={svgPoints[0].x} cy={svgPoints[0].y} r={2.5} fill="#10b981" />
      <circle cx={svgPoints[svgPoints.length - 1].x} cy={svgPoints[svgPoints.length - 1].y} r={2.5} fill="#ef4444" />
    </svg>
  );
};
