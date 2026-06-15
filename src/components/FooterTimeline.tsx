import React, { useState, useEffect } from 'react';
import { Artist } from '../types';
import { useAudioWaveform } from '../hooks/useAudioWaveform';
import { useTimelineDrag } from '../hooks/useTimelineDrag';
import { translations } from '../utils/i18n';

interface FooterTimelineProps {
  lang: 'fr' | 'en';
  artists: Artist[];
  activeMovementId: string | null;
  onSelectArtist: (id: string | null) => void;
  onSelectMovement: (id: string | null) => void;
  currentTime: number;
  duration: number;
  audioFileName: string | null;
  audioFileUrl: string | null;
  audioDuration: number;
  timelineMode: 'full' | 'compact' | 'collapsed';
  onSetMode: (mode: 'full' | 'compact' | 'collapsed') => void;
  onTimelineScrub: (time: number) => void;
  onUpdateMovementTimeRange: (artistId: string, movementId: string, newStart: number, newEnd: number) => void;
  formatTime: (time: number) => string;
  onUpdateDuration: (dur: number) => void;
}

export const FooterTimeline: React.FC<FooterTimelineProps> = ({
  lang,
  artists,
  activeMovementId,
  onSelectArtist,
  onSelectMovement,
  currentTime,
  duration,
  audioFileName,
  audioFileUrl,
  audioDuration,
  timelineMode,
  onSetMode,
  onTimelineScrub,
  onUpdateMovementTimeRange,
  formatTime,
  onUpdateDuration,
}) => {
  const [timelineZoom, setTimelineZoom] = useState<number>(1);
  const timelineTracksRef = React.useRef<HTMLDivElement | null>(null);
  const t = translations[lang];

  // Scroll wheel horizontal zoom centered on mouse cursor
  useEffect(() => {
    const tracksDiv = timelineTracksRef.current;
    if (!tracksDiv) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1.05;
      
      const rect = tracksDiv.getBoundingClientRect();
      const mouseX = e.clientX - rect.left + tracksDiv.scrollLeft;
      
      setTimelineZoom(prev => {
        let nextZoom;
        if (e.deltaY < 0) {
          nextZoom = Math.min(20, prev * zoomFactor);
        } else {
          nextZoom = Math.max(1, prev / zoomFactor);
        }
        nextZoom = Math.round(nextZoom * 100) / 100;
        
        if (nextZoom !== prev) {
          const ratio = nextZoom / prev;
          const newScrollLeft = mouseX * ratio - (e.clientX - rect.left);
          requestAnimationFrame(() => {
            tracksDiv.scrollLeft = newScrollLeft;
          });
        }
        
        return nextZoom;
      });
    };

    tracksDiv.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      tracksDiv.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Custom timeline dragging and resizing hook
  const {
    dragInfo,
    tempTimes,
    handleBlockPointerDown,
    handleBlockPointerMove,
    handleBlockPointerUp,
  } = useTimelineDrag({
    duration,
    onSelectArtist,
    onSelectMovement,
    onTimelineScrub,
    onUpdateMovementTimeRange,
    artists,
  });

  // Custom audio waveform decoding and size metrics hook
  const {
    isDecoding,
    pathD,
    waveformWidthPercent,
    playedWidth,
  } = useAudioWaveform({
    audioFileName,
    audioFileUrl,
    audioDuration,
    duration,
    currentTime,
  });

  // Click on Column 2 track background to scrub playhead
  const handleTracksClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const trackWidth = rect.width;
    if (trackWidth <= 0) return;
    const clickPercent = Math.max(0, Math.min(1, clickX / trackWidth));
    onTimelineScrub(clickPercent * duration);
  };

  // If collapsed, render only a thin handle/bar to restore it
  if (timelineMode === 'collapsed') {
    return (
      <footer 
        onClick={() => onSetMode('compact')}
        className="timeline-collapsed-handle mx-4 mb-2 animate-pulse"
        title={lang === 'fr' ? "Cliquer pour afficher la timeline" : "Click to show timeline"}
      >
        <div className="w-16 h-1 rounded-full bg-slate-500" />
      </footer>
    );
  }

  return (
    <footer className={`footer-timeline flex flex-col justify-between border-t border-white/5 shrink-0 select-none transition-all duration-300 w-full bg-slate-950/40 ${
      timelineMode === 'compact' ? 'h-[74px] gap-0' : 'h-[210px] gap-0'
    }`}>
      <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 w-full bg-slate-950/10 h-[46px]">
        {/* Time display on the left */}
        <span 
          className="text-xs font-mono text-slate-400 font-medium shrink-0 flex items-center gap-1"
          style={{ width: '150px', fontVariantNumeric: 'tabular-nums' }}
        >
          <span className="text-indigo-400 font-bold">{formatTime(currentTime)}</span>
          <span className="text-slate-600">/</span>
          <span>{formatTime(duration)}</span>
        </span>
        
        {/* Custom Waveform Scrubber Wrapper */}
        <div className="timeline-scrubber-wrapper flex-1 relative h-9 border border-white/5 bg-[#050608]">
          {/* Visual Waveform Backing */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: audioFileName && audioDuration > 0 ? `${waveformWidthPercent}%` : '100%',
              pointerEvents: 'none',
            }}
          >
            <svg 
              viewBox="0 0 1000 100" 
              preserveAspectRatio="none" 
              style={{ width: '100%', height: '100%', display: 'block' }}
            >
              <defs>
                <linearGradient id="waveform-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <clipPath id="waveform-clip">
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
                fill="url(#waveform-grad)" 
                clipPath="url(#waveform-clip)" 
              />
            </svg>
            
            {/* Decoding Overlay */}
            {isDecoding && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10 transition-all duration-300 animate-fade-in"
                style={{ borderRadius: 'inherit' }}
              >
                <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-300 font-mono tracking-widest animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>{lang === 'fr' ? "DÉCODAGE DE LA FORME D'ONDE..." : "DECODING WAVEFORM..."}</span>
                </div>
              </div>
            )}
          </div>

          {/* Visual Playhead Needle Line */}
          <div 
            className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 z-10 pointer-events-none shadow-[0_0_8px_#06b6d4]"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
 
          {/* Actual Range input mapped over the top */}
          <input 
            type="range"
            min="0"
            max={duration}
            step="0.01"
            value={currentTime}
            onChange={(e) => onTimelineScrub(parseFloat(e.target.value))}
            className="sequencer-scrubber"
          />
        </div>

        {/* Height Mode Selector on the right */}
        <div className="flex items-center gap-2 shrink-0">
          {timelineMode === 'full' && (
            <div className="flex items-center gap-0.5 bg-[#050608] border border-white/5 rounded-xl p-0.5 text-[10px] font-bold text-slate-400">
              <button
                type="button"
                onClick={() => setTimelineZoom(prev => Math.max(1, Math.round((prev - 0.1) * 10) / 10))}
                className="px-2 py-0.5 rounded-lg hover:text-white hover:bg-white/5 transition text-[10px] font-mono font-bold"
                title={lang === 'fr' ? "Zoom arrière" : "Zoom out"}
              >
                -
              </button>
              <span className="px-1 text-[9px] font-mono text-indigo-300 min-w-[55px] text-center select-none">Zoom {Math.round(timelineZoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setTimelineZoom(prev => Math.min(20, Math.round((prev + 0.1) * 10) / 10))}
                className="px-2 py-0.5 rounded-lg hover:text-white hover:bg-white/5 transition text-[10px] font-mono font-bold"
                title={lang === 'fr' ? "Zoom avant" : "Zoom in"}
              >
                +
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-950/40 px-2 py-1 rounded-lg border border-white/5">
            <input 
              type="number"
              min="10"
              value={duration}
              disabled={!!audioFileName}
              onChange={(e) => {
                const val = Math.max(10, parseInt(e.target.value) || 10);
                onUpdateDuration(val);
              }}
              className={`bg-transparent border-none focus:outline-none text-[10px] w-10 text-center font-mono text-indigo-300 font-bold ${
                audioFileName ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              title={audioFileName ? (lang === 'fr' ? "La durée est synchronisée avec la bande-son" : "Duration is synchronized with soundtrack") : (lang === 'fr' ? "Modifier la durée globale" : "Edit global duration")}
            />
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">sec</span>
          </div>

          <div className="flex items-center gap-0.5 bg-[#050608] border border-white/5 rounded-xl p-0.5 text-[10px] font-bold text-slate-400">
            <button
              type="button"
              onClick={() => onSetMode('collapsed')}
              className="px-2.5 py-1 rounded-lg hover:text-white hover:bg-white/5 transition text-[9px]"
              title={lang === 'fr' ? "Masquer la timeline" : "Hide timeline"}
            >
              {t.timelineCollapsed}
            </button>
            <button
              type="button"
              onClick={() => onSetMode('compact')}
              className={`px-2.5 py-1 rounded-lg transition text-[9px] ${
                timelineMode === 'compact' 
                  ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 font-bold' 
                  : 'hover:text-white hover:bg-white/5'
              }`}
              title={lang === 'fr' ? "Mode compact" : "Compact mode"}
            >
              {t.timelineCompact}
            </button>
            <button
              type="button"
              onClick={() => onSetMode('full')}
              className={`px-2.5 py-1 rounded-lg transition text-[9px] ${
                timelineMode === 'full' 
                  ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 font-bold' 
                  : 'hover:text-white hover:bg-white/5'
              }`}
              title={lang === 'fr' ? "Mode complet" : "Full mode"}
            >
              {t.timelineFull}
            </button>
          </div>
        </div>
      </div>

      {/* Visual Timeline Blocks Track Overview */}
      {timelineMode === 'full' && (
        <div className="w-full flex-1 min-h-0 flex px-4 py-1 animate-fade-in bg-slate-950/10">
          
          {/* Column 1: Performers Names list (outside scroll area) */}
          <div className="w-28 flex flex-col gap-2 shrink-0 select-none border-r border-white/5 pr-3 pt-0.5">
            {artists.map(artist => (
              <div 
                key={artist.id} 
                className="h-6 flex items-center justify-end text-slate-400 text-[10px] font-bold font-mono tracking-tight text-right truncate hover:text-slate-200 transition"
                title={artist.name}
              >
                {artist.name}
              </div>
            ))}
          </div>

          {/* Column 2: Horizontal Scroll Container for tracks */}
          <div 
            ref={timelineTracksRef}
            className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden"
          >
            <div 
              className="flex-1 flex flex-col gap-2 relative cursor-col-resize" 
              style={{ width: `${100 * timelineZoom}%`, minWidth: '100%' }}
              onClick={handleTracksClick}
            >
              {/* Unified playhead needle inside scroll area */}
              {artists.length > 0 && (
                <div 
                  className="absolute top-0 bottom-0 w-[2px] bg-indigo-500 z-20 pointer-events-none shadow-[0_0_10px_#6366f1]"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              )}

              {artists.map(artist => (
                <div key={artist.id} className="h-6 relative flex items-center">
                  {/* Track background & movement blocks */}
                  <div className="w-full h-5 rounded-lg bg-[#050608]/60 border border-white/5 relative overflow-hidden shadow-inner">
                    {artist.movements.map(mov => {
                      const isDragged = dragInfo && dragInfo.movementId === mov.id;
                      const displayStart = isDragged && tempTimes ? tempTimes.start : mov.startTime;
                      const displayEnd = isDragged && tempTimes ? tempTimes.end : mov.endTime;

                      const leftPercent = (displayStart / duration) * 100;
                      const widthPercent = ((displayEnd - displayStart) / duration) * 100;

                      const isSelected = activeMovementId === mov.id;

                      return (
                        <div
                          key={mov.id}
                          onPointerDown={(e) => handleBlockPointerDown(e, artist.id, mov)}
                          onPointerMove={(e) => handleBlockPointerMove(e, artist.id, mov.id)}
                          onPointerUp={(e) => handleBlockPointerUp(e, artist.id, mov.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          className={`absolute top-0.5 bottom-0.5 rounded-md border hover:border-white/20 transition-all shadow flex items-center justify-center text-[9px] font-bold text-white px-2.5 overflow-hidden select-none ${
                            isSelected 
                              ? 'border-white ring-2 ring-white/50 shadow-[0_0_12px_rgba(255,255,255,0.7)] z-10' 
                              : 'border-white/10 opacity-90 hover:opacity-100'
                          }`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            backgroundColor: artist.color,
                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.15)`,
                            touchAction: 'none'
                          }}
                          title={`${artist.name}: ${displayStart.toFixed(2)}s - ${displayEnd.toFixed(2)}s`}
                        >
                          {/* Resize and drag handles cursors overlays */}
                          <div className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize z-20" />
                          <div className="absolute left-2 right-2 top-0 bottom-0 cursor-grab active:cursor-grabbing" />
                          <div className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize z-20" />

                          <span className="truncate filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] select-none pointer-events-none">
                            {displayStart.toFixed(1)}s - {displayEnd.toFixed(1)}s
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {artists.length === 0 && (
                <div className="text-xs text-slate-500 italic text-center py-6 select-none w-full border border-dashed border-white/5 rounded-xl bg-slate-900/5">
                  {t.noArtistsOnStage}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </footer>
  );
};
