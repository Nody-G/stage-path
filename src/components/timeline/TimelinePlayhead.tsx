import React from 'react';

interface TimelinePlayheadProps {
  playheadLeftPx: number;
  onPlayheadPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPlayheadPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPlayheadPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export const TimelinePlayhead: React.FC<TimelinePlayheadProps> = ({
  playheadLeftPx,
  onPlayheadPointerDown,
  onPlayheadPointerMove,
  onPlayheadPointerUp,
}) => {
  return (
    <div 
      className="timeline-playhead"
      style={{ left: `${playheadLeftPx}px` }}
    >
      {/* Vertical Playhead Needle Line */}
      <div className="timeline-playhead-line" />
      
      {/* Playhead Handle (header) */}
      <div 
        className="timeline-playhead-handle"
        onPointerDown={onPlayheadPointerDown}
        onPointerMove={onPlayheadPointerMove}
        onPointerUp={onPlayheadPointerUp}
      >
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
          <path d="M0 0H12V8L6 14L0 8V0Z" />
          <circle cx="6" cy="4" r="1.2" fill="white" />
        </svg>
      </div>
    </div>
  );
};
