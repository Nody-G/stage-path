import React from 'react';
import { TimelineTick } from '../../utils/timelineTicks';

interface TimelineRulerProps {
  ticks: TimelineTick[];
  duration: number;
  contentWidth: number;
  onRulerPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onRulerPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onRulerPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  ticks,
  duration,
  contentWidth,
  onRulerPointerDown,
  onRulerPointerMove,
  onRulerPointerUp,
}) => {
  return (
    <>
      {/* Sticky Time Ruler (top of the scroll container) */}
      <div 
        className="timeline-ruler"
        style={{ width: '100%', minWidth: '100%' }}
        onPointerDown={onRulerPointerDown}
        onPointerMove={onRulerPointerMove}
        onPointerUp={onRulerPointerUp}
      >
        {ticks.map(tick => (
          <div
            key={`tick-${tick.time}`}
            className={`timeline-tick ${tick.isMajor ? 'major' : 'minor'}`}
            style={{ left: `${(tick.time / duration) * contentWidth}px` }}
          >
            {tick.isMajor && (
              <span className="timeline-tick-label">
                {tick.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Vertical grid lines (background layer) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {ticks.filter(tick => tick.isMajor).map(tick => (
          <div
            key={`grid-${tick.time}`}
            className="timeline-grid-line"
            style={{ left: `${(tick.time / duration) * contentWidth}px` }}
          />
        ))}
      </div>
    </>
  );
};
