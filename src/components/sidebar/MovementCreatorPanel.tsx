import React, { useState, useEffect } from 'react';
import { Project, Artist } from '../../types';
import { getArtistPositionAtTime } from '../../utils/math';

interface MovementCreatorPanelProps {
  project: Project;
  activeArtist: Artist;
  currentTime: number;
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
}

export const MovementCreatorPanel: React.FC<MovementCreatorPanelProps> = ({
  project,
  activeArtist,
  currentTime,
  isDrawingMode,
  setIsDrawingMode,
  drawModeType,
  setDrawModeType,
  setDrawTimeRange,
  isRecordingMode,
  setIsRecordingMode,
  onCreateManualMovement,
}) => {
  const [activeCreatorMode, setActiveCreatorMode] = useState<'p2p' | 'vector' | 'freehand' | 'realtime'>('p2p');

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

  // Sync timing with currentTime and selected performer when they change
  useEffect(() => {
    const roundedTime = parseFloat(currentTime.toFixed(2));
    setManualStart(roundedTime);
    setManualEnd(parseFloat(Math.min(project.duration, currentTime + 5).toFixed(2)));
    setVectorStart(roundedTime);
    setVectorEnd(parseFloat(Math.min(project.duration, currentTime + 5).toFixed(2)));
    setFreehandStart(roundedTime);
    setFreehandEnd(parseFloat(Math.min(project.duration, currentTime + 5).toFixed(2)));
  }, [currentTime, activeArtist.id, project.duration]);

  // Sync manual X/Y destination coordinates with the performer's position at manualStart
  useEffect(() => {
    const currentPos = getArtistPositionAtTime(activeArtist, manualStart, project.stageWidth, project.stageHeight);
    const currentXM = (currentPos.x - (project.stageWidth * 100) / 2) / 100;
    const currentYM = (((project.stageHeight * 100) / 2) - currentPos.y) / 100;
    setManualX(parseFloat(currentXM.toFixed(2)));
    setManualY(parseFloat(currentYM.toFixed(2)));
  }, [manualStart, activeArtist.id, activeArtist.movements, activeArtist.initialPosition, project.stageWidth, project.stageHeight]);

  return (
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
  );
};
