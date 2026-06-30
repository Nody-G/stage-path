import React from 'react';

interface TimelineAudioWaveformProps {
  waveformWidthPx: number;
  playedWidth: number;
  pathD: string;
  isDecoding: boolean;
  lang: 'fr' | 'en';
}

export const TimelineAudioWaveform: React.FC<TimelineAudioWaveformProps> = ({
  waveformWidthPx,
  playedWidth,
  pathD,
  isDecoding,
  lang,
}) => {
  return (
    <div className="timeline-audio-track">
      <div 
        className="timeline-audio-waveform-container"
        style={{
          width: `${waveformWidthPx}px`,
        }}
      >
        <svg 
          viewBox="0 0 1000 100" 
          preserveAspectRatio="none" 
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <defs>
            <linearGradient id="waveform-grad-timeline" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <clipPath id="waveform-clip-timeline">
              <rect x="0" y="0" width={playedWidth} height="100" />
            </clipPath>
          </defs>
          
          {/* Unplayed/Background waveform */}
          <path 
            d={pathD} 
            fill="rgba(255, 255, 255, 0.08)" 
          />
          
          {/* Played/Foreground waveform */}
          <path 
            d={pathD} 
            fill="url(#waveform-grad-timeline)" 
            clipPath="url(#waveform-clip-timeline)" 
          />
        </svg>

        {/* Decoding Overlay */}
        {isDecoding && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10 transition-all duration-300 animate-fade-in">
            <div className="flex items-center gap-2 text-[9px] font-bold text-cyan-300 font-mono tracking-widest animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>{lang === 'fr' ? "DÉCODAGE..." : "DECODING..."}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
