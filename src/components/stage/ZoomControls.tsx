import React from 'react';

interface ZoomControlsProps {
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  zoomIn,
  zoomOut,
  resetZoom,
}) => {
  return (
    <div className="stage-zoom-controls">
      <button
        type="button"
        onClick={zoomOut}
        className="w-6 h-6 rounded hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center justify-center font-bold text-sm"
        title="Dézoomer"
      >
        -
      </button>
      <span className="w-12 text-center text-slate-300 font-mono text-[10px] font-bold">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        onClick={zoomIn}
        className="w-6 h-6 rounded hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center justify-center font-bold text-sm"
        title="Zoomer"
      >
        +
      </button>
      <div className="w-px h-4 bg-white/10 mx-1" />
      <button
        type="button"
        onClick={resetZoom}
        className="px-2 py-0.5 rounded hover:bg-indigo-600/30 text-indigo-300 hover:text-white transition text-[9px] font-bold"
        title="Réinitialiser à 100%"
      >
        100%
      </button>
    </div>
  );
};
