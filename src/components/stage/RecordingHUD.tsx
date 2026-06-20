import React from 'react';

interface RecordingHUDProps {
  isRecordingMode: boolean;
  isRecordingInProgress: boolean;
}

export const RecordingHUD: React.FC<RecordingHUDProps> = ({
  isRecordingMode,
  isRecordingInProgress,
}) => {
  if (!isRecordingMode) return null;

  return (
    <div 
      className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel p-2.5 flex items-center gap-3 border border-red-500/30 shadow-lg shadow-red-950/20 z-10 text-xs rounded-xl" 
      style={{ backgroundColor: 'rgba(20, 10, 10, 0.95)', backdropFilter: 'blur(12px)' }}
    >
      <span className="flex h-2.5 w-2.5 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
      </span>
      <span className="font-bold text-red-400 tracking-wider">● ENREGISTREMENT EN DIRECT</span>
      <div className="h-4 w-px bg-white/10" />
      <span className="text-slate-300">
        {isRecordingInProgress ? "Enregistrement en cours... Glissez le figurant !" : "Glissez le figurant pour démarrer l'enregistrement."}
      </span>
    </div>
  );
};
