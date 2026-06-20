import React from 'react';

interface DrawingHUDProps {
  isDrawingMode: boolean;
  drawModeType: 'freehand' | 'vector';
  drawTimeRange: { start: number; end: number };
  vectorTransitionType: 'linear' | 'curved';
  setVectorTransitionType: (val: 'linear' | 'curved') => void;
  vectorPointsLength: number;
  onValidateVectorDrawing: () => void;
  onCancelDrawing: () => void;
}

export const DrawingHUD: React.FC<DrawingHUDProps> = ({
  isDrawingMode,
  drawModeType,
  drawTimeRange,
  vectorTransitionType,
  setVectorTransitionType,
  vectorPointsLength,
  onValidateVectorDrawing,
  onCancelDrawing,
}) => {
  if (!isDrawingMode) return null;

  return (
    <div 
      className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel p-3 flex items-center gap-4 border border-indigo-500/30 shadow-lg shadow-indigo-950/20 z-10 animate-fade-in text-xs rounded-xl" 
      style={{ backgroundColor: 'rgba(11, 13, 19, 0.95)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
        </span>
        <span className="font-bold text-slate-200">
          {drawModeType === 'vector' ? 'Tracé Vectoriel (Plume)' : 'Tracé Libre (Main Levée)'}
        </span>
      </div>
      
      <div className="h-4 w-px bg-white/10" />
      
      <span className="text-slate-400 font-medium">
        Temps : <span className="font-mono text-indigo-300 font-bold">{drawTimeRange.start.toFixed(1)}s ➔ {drawTimeRange.end.toFixed(1)}s</span>
      </span>
      
      {drawModeType === 'vector' && (
        <>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Type :</span>
            <button
              type="button"
              onClick={() => setVectorTransitionType('linear')}
              className={`px-2 py-0.5 rounded font-bold border transition text-[10px] ${
                vectorTransitionType === 'linear'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/10'
              }`}
            >
              Droit
            </button>
            <button
              type="button"
              onClick={() => setVectorTransitionType('curved')}
              className={`px-2 py-0.5 rounded font-bold border transition text-[10px] ${
                vectorTransitionType === 'curved'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/10'
              }`}
            >
              Courbe
            </button>
          </div>
          
          <div className="h-4 w-px bg-white/10" />
          <span className="text-slate-400 font-mono">
            {vectorPointsLength} point{vectorPointsLength > 1 ? 's' : ''}
          </span>
          
          <div className="h-4 w-px bg-white/10" />
          <button
            type="button"
            onClick={onValidateVectorDrawing}
            disabled={vectorPointsLength < 2}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold rounded-lg transition"
          >
            Valider (Entrée)
          </button>
        </>
      )}
      
      <button
        type="button"
        onClick={onCancelDrawing}
        className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 font-semibold rounded-lg transition"
      >
        Annuler
      </button>
    </div>
  );
};
