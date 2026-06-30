import React from 'react';
import { Artist } from '../../types';

interface PerformerNamesColumnProps {
  artists: Artist[];
  currentTime: number;
  duration: number;
  audioFileName: string | null;
  formatTime: (time: number) => string;
  onSelectArtist: (id: string | null) => void;
}

export const PerformerNamesColumn: React.FC<PerformerNamesColumnProps> = ({
  artists,
  currentTime,
  duration,
  audioFileName,
  formatTime,
  onSelectArtist,
}) => {
  return (
    <div className="w-36 flex flex-col shrink-0 select-none border-r border-white/5 pr-3 relative">
      {/* Sticky top-left timecode counter & title */}
      <div className="timeline-sticky-header flex flex-col justify-center items-end text-right font-mono pr-1">
        <span className="text-[10px] text-indigo-400 font-bold tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(currentTime)}
        </span>
        <span className="text-[8px] text-slate-500 font-semibold">
          / {formatTime(duration)}
        </span>
      </div>

      {/* Audio track label (sticky spacer aligning with audio track) */}
      <div className="timeline-audio-spacer text-indigo-400/80">
        <span className="truncate max-w-full" title={audioFileName || "Audio"}>
          🎵 {audioFileName ? audioFileName.substring(0, 12) + "..." : "SYNTH"}
        </span>
      </div>
      
      {/* Performer names vertical stack */}
      <div className="flex flex-col gap-2 pt-2">
        {artists.map(artist => (
          <div 
            key={artist.id} 
            className="h-6 flex items-center justify-end text-slate-400 text-[10px] font-bold font-mono tracking-tight text-right truncate hover:text-slate-200 transition shrink-0 cursor-pointer"
            title={artist.name}
            onClick={() => onSelectArtist(artist.id)}
          >
            {artist.name}
          </div>
        ))}
      </div>
    </div>
  );
};
