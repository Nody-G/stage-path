import React, { useState, useEffect } from 'react';
import { Project, Artist } from '../../types';

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
}) => {
  const [activeCreatorMode, setActiveCreatorMode] = useState<'freehand' | 'realtime'>('freehand');

  // Freehand drawing form states
  const [freehandStart, setFreehandStart] = useState<number>(0);
  const [freehandEnd, setFreehandEnd] = useState<number>(5);

  // Sync timing with currentTime and selected performer when they change
  useEffect(() => {
    const roundedTime = parseFloat(currentTime.toFixed(2));
    setFreehandStart(roundedTime);
    setFreehandEnd(parseFloat(Math.min(project.duration, currentTime + 5).toFixed(2)));
  }, [currentTime, activeArtist.id, project.duration]);

  return (
    <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
      <span className="text-[10px] text-indigo-400 font-bold tracking-wider">PROGRAMMER UNE TRAJECTOIRE</span>
      
      {/* Creator Mode Selector Tabs */}
      <div className="grid grid-cols-2 gap-1 p-0.5 bg-black/40 border border-white/5 rounded-lg">
        {([
          { id: 'freehand', label: 'Dessin' },
          { id: 'realtime', label: 'Direct' }
        ] as const).map(mode => (
          <button
            key={mode.id}
            type="button"
            onClick={() => {
              setActiveCreatorMode(mode.id);
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
