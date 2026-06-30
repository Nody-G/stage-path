import React, { useState, useEffect, useRef } from 'react';
import { Artist } from '../types';
import { useAudioWaveform } from '../hooks/useAudioWaveform';
import { useTimelineDrag } from '../hooks/useTimelineDrag';
import { translations } from '../utils/i18n';
import { getTimelineTicks } from '../utils/timelineTicks';
import { useTimelineScrub } from '../hooks/useTimelineScrub';
import { PerformerNamesColumn } from './timeline/PerformerNamesColumn';
import { TimelineAudioWaveform } from './timeline/TimelineAudioWaveform';
import { TimelinePlayhead } from './timeline/TimelinePlayhead';
import { TimelineRuler } from './timeline/TimelineRuler';
import { TimelineTracks } from './timeline/TimelineTracks';
import { useTimelineHeightResize } from '../hooks/useTimelineHeightResize';
import { useTimelineAutoScroll } from '../hooks/useTimelineAutoScroll';

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
  timelineHeight: number;
  onTimelineResize: (height: number) => void;
  onTimelineScrub: (time: number) => void;
  onUpdateMovementTimeRange: (artistId: string, movementId: string, newStart: number, newEnd: number) => void;
  onAddMovementAtTime?: (artistId: string, time: number) => void;
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
  timelineHeight,
  onTimelineResize,
  onTimelineScrub,
  onUpdateMovementTimeRange,
  onAddMovementAtTime,
  formatTime,
  onUpdateDuration: _onUpdateDuration,
}) => {
  const [timelineZoom, setTimelineZoom] = useState<number>(1);
  const [viewportWidth, setViewportWidth] = useState<number>(1000);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const {
    isResizing,
    handleResizeMouseDown,
  } = useTimelineHeightResize({
    timelineHeight,
    onTimelineResize,
  });
  const [isPlaying, setIsPlaying] = useState(false);

  const timelineTracksRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);

  // Track viewportWidth dynamically with a ResizeObserver on the stable footer element
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        // Visible tracks width is footer width minus PerformerNamesColumn width (144px)
        const footerWidth = entry.contentRect.width;
        setViewportWidth(Math.max(100, footerWidth - 144));
      }
    });
    observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  // Track scrollLeft horizontally to handle ticks virtualization
  useEffect(() => {
    const tracksDiv = timelineTracksRef.current;
    if (!tracksDiv) return;

    const handleScroll = () => {
      setScrollLeft(tracksDiv.scrollLeft);
    };

    tracksDiv.addEventListener('scroll', handleScroll);
    return () => {
      tracksDiv.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Sync isPlaying state by watching the playhead changes over short windows
  const lastTimeRef = useRef(currentTime);
  useEffect(() => {
    const diff = Math.abs(currentTime - lastTimeRef.current);
    // If time is moving forward, we are playing
    if (diff > 0 && diff < 0.25) {
      setIsPlaying(true);
    } else if (diff === 0) {
      setIsPlaying(false);
    }
    lastTimeRef.current = currentTime;
  }, [currentTime]);
  useTimelineAutoScroll({
    timelineTracksRef,
    isPlaying,
    currentTime,
    duration,
    timelineZoom,
    viewportWidth,
  });
  const t = translations[lang];
  const maxZoom = Math.min(50, Math.max(10, Math.round((150 * duration) / (viewportWidth || 1000))));
  const lastZoomRef = useRef<number>(5);
  const handleZoomChange = (updater: number | ((prev: number) => number)) => {
    const tracksDiv = timelineTracksRef.current;
    if (!tracksDiv) return;

    const viewportWidthVal = viewportWidth;
    if (viewportWidthVal <= 0) return;

    setTimelineZoom(prev => {
      const nextZoom = typeof updater === 'function' ? updater(prev) : updater;
      const clampedZoom = Math.min(maxZoom, Math.max(1, nextZoom));
      const roundedZoom = Math.round(clampedZoom * 100) / 100;

      if (roundedZoom !== prev) {
        const ratio = roundedZoom / prev;
        
        // Anchor zoom calculations around the playhead time
        const oldContentWidth = viewportWidthVal * prev;
        const anchorXContent = (currentTime / duration) * oldContentWidth;
        
        // If playhead is currently visible in viewport, keep its exact relative offset
        const playheadViewportX = anchorXContent - tracksDiv.scrollLeft;
        const anchorXViewport = (playheadViewportX >= 0 && playheadViewportX <= viewportWidthVal)
          ? playheadViewportX
          : viewportWidthVal / 2;

        const newScrollLeft = anchorXContent * ratio - anchorXViewport;
        requestAnimationFrame(() => {
          tracksDiv.scrollLeft = newScrollLeft;
        });
      }

      return roundedZoom;
    });
  };

  // Keyboard shortcuts (+ / - keys and Shift + Z fit key)
  useEffect(() => {
    const isTyping = () => {
      const active = document.activeElement;
      if (!active) return false;
      const tagName = active.tagName.toLowerCase();
      return tagName === 'input' || tagName === 'textarea' || active.getAttribute('contenteditable') === 'true';
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTyping()) return;

      const isCtrl = e.ctrlKey || e.metaKey;

      if ((isCtrl && (e.key === '=' || e.key === '+')) || e.key === '+' || (!isCtrl && e.key === '=')) {
        e.preventDefault(); handleZoomChange(prev => prev * 1.10); return;
      }
      if ((isCtrl && e.key === '-') || e.key === '-') {
        e.preventDefault(); handleZoomChange(prev => prev / 1.10); return;
      }

      // Shift + Z -> Toggle Fit / Last Zoom
      if (e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setTimelineZoom(prev => {
          if (prev > 1.01) {
            lastZoomRef.current = prev;
            requestAnimationFrame(() => {
              if (timelineTracksRef.current) timelineTracksRef.current.scrollLeft = 0;
            });
            return 1;
          } else {
            const targetZoom = lastZoomRef.current;
            const playheadXContent = (currentTime / duration) * viewportWidth * targetZoom;
            requestAnimationFrame(() => {
              if (timelineTracksRef.current) {
                timelineTracksRef.current.scrollLeft = playheadXContent - viewportWidth / 2;
              }
            });
            return targetZoom;
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [duration, currentTime, viewportWidth, maxZoom]);

  // Ctrl + Wheel listener for horizontal timeline zooming
  useEffect(() => {
    const tracksDiv = timelineTracksRef.current;
    if (!tracksDiv) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          handleZoomChange(prev => prev * 1.10);
        } else {
          handleZoomChange(prev => prev / 1.10);
        }
      }
    };

    tracksDiv.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      tracksDiv.removeEventListener('wheel', handleWheel);
    };
  }, [currentTime, duration, maxZoom]);

  // Setup movement blocks dragging & resizing
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
  const {
    isDecoding,
    pathD,
    waveformWidthPercent: _waveformWidthPercent,
    playedWidth,
  } = useAudioWaveform({
    audioFileName,
    audioFileUrl,
    audioDuration,
    duration,
    currentTime,
  });
  const contentWidth = viewportWidth * timelineZoom;
  const ticks = getTimelineTicks(duration, timelineZoom, viewportWidth, scrollLeft, formatTime);
  const {
    isScrubbing: _isScrubbing,
    handleRulerPointerDown,
    handleRulerPointerMove,
    handleRulerPointerUp,
    handlePlayheadHandlePointerDown,
    handlePlayheadHandlePointerMove,
    handlePlayheadHandlePointerUp,
  } = useTimelineScrub({
    onTimelineScrub,
    duration,
    timelineTracksRef,
  });
  const playheadLeftPx = (currentTime / duration) * contentWidth;
  const waveformWidthPx = audioFileName && audioDuration > 0 
    ? (audioDuration / duration) * contentWidth 
    : contentWidth;

  return (
    <footer 
      ref={footerRef}
      className="footer-timeline flex flex-col border-t border-white/5 shrink-0 select-none w-full bg-slate-950/40 relative overflow-hidden"
      style={{ height: `${timelineHeight}px`, transition: isResizing ? "none" : "height 0.2s ease" }}
    >
      {/* Resize handle at very top */}
      <div
        onMouseDown={handleResizeMouseDown}
        className={`w-full h-1.5 cursor-row-resize flex items-center justify-center shrink-0 transition-colors duration-150 z-45 ${
          isResizing ? "bg-indigo-500" : "hover:bg-indigo-500/30"
        }`}
        title="Faites glisser pour redimensionner la timeline"
      >
        <div className="w-10 h-0.5 rounded-full bg-slate-600" />
      </div>

      {/* Main Timeline workspace */}
      <div className="w-full flex-1 min-h-0 flex bg-slate-950/10 relative overflow-y-auto">
        
        {/* COLUMN 1: Fixed Headers and Performers Names */}
        <PerformerNamesColumn
          artists={artists}
          currentTime={currentTime}
          duration={duration}
          audioFileName={audioFileName}
          formatTime={formatTime}
          onSelectArtist={onSelectArtist}
        />

        {/* COLUMN 2: Scrollable Tracks & Timeline Ruler */}
        <div 
          ref={timelineTracksRef}
          className="flex-1 min-w-0 overflow-x-auto overflow-y-visible relative"
        >
          <div 
            className="relative pb-2" 
            style={{ width: `${contentWidth}px`, minWidth: '100%' }}
            onDoubleClick={(e) => {
              const target = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null) || (e.target as HTMLElement);
              const track = target.closest('[data-timeline-track="true"]');
              if (track) {
                const artistId = track.getAttribute('data-artist-id');
                if (artistId && onAddMovementAtTime) {
                  const rect = track.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const trackWidth = rect.width;
                  if (trackWidth > 0) {
                    const clickPercent = clickX / trackWidth;
                    const clickedTime = clickPercent * duration;
                    onAddMovementAtTime(artistId, clickedTime);
                  }
                }
              }
            }}
          >
            {/* Time Ruler & Vertical Grid Lines */}
            <TimelineRuler
              ticks={ticks}
              duration={duration}
              contentWidth={contentWidth}
              onRulerPointerDown={handleRulerPointerDown}
              onRulerPointerMove={handleRulerPointerMove}
              onRulerPointerUp={handleRulerPointerUp}
            />

            {/* Scrollable Audio Track Waveform */}
            <TimelineAudioWaveform
              waveformWidthPx={waveformWidthPx}
              playedWidth={playedWidth}
              pathD={pathD}
              isDecoding={isDecoding}
              lang={lang}
            />

            {/* Playhead Indicator (Overlay) */}
            <TimelinePlayhead
              playheadLeftPx={playheadLeftPx}
              onPlayheadPointerDown={handlePlayheadHandlePointerDown}
              onPlayheadPointerMove={handlePlayheadHandlePointerMove}
              onPlayheadPointerUp={handlePlayheadHandlePointerUp}
            />

            {/* Performer tracks stack */}
            <TimelineTracks
              artists={artists}
              duration={duration}
              contentWidth={contentWidth}
              activeMovementId={activeMovementId}
              dragInfo={dragInfo}
              tempTimes={tempTimes}
              onSelectArtist={onSelectArtist}
              handleBlockPointerDown={handleBlockPointerDown}
              handleBlockPointerMove={handleBlockPointerMove}
              handleBlockPointerUp={handleBlockPointerUp}
              noArtistsMessage={t.noArtistsOnStage}
            />
          </div>
        </div>
      </div>

      {/* Floating Zoom Controls */}
      <div className="timeline-zoom-controls">
        <span className="timeline-zoom-label">Zoom :</span>
        <button 
          onClick={() => handleZoomChange(prev => prev / 1.10)}
          className="timeline-zoom-btn"
          title="Dézoomer"
        >
          -
        </button>
        <input 
          type="range" 
          min="1" 
          max={maxZoom} 
          step="0.05"
          value={timelineZoom} 
          onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
          className="timeline-zoom-slider"
        />
        <button 
          onClick={() => handleZoomChange(prev => prev * 1.10)}
          className="timeline-zoom-btn"
          title="Zoomer"
        >
          +
        </button>
        <button 
          onClick={() => handleZoomChange(1)}
          className="timeline-zoom-fit-btn"
          title="Ajuster à l'écran (100%)"
        >
          FIT
        </button>
      </div>
    </footer>
  );
};
