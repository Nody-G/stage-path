import React from 'react';
import { Artist } from '../../types';

interface TimelineTracksProps {
  artists: Artist[];
  duration: number;
  contentWidth: number;
  activeMovementId: string | null;
  dragInfo: any;
  tempTimes: any;
  onSelectArtist: (id: string | null) => void;
  handleBlockPointerDown: (e: React.PointerEvent<HTMLDivElement>, artistId: string, mov: any) => void;
  handleBlockPointerMove: (e: React.PointerEvent<HTMLDivElement>, artistId: string, movId: string) => void;
  handleBlockPointerUp: (e: React.PointerEvent<HTMLDivElement>, artistId: string, movId: string) => void;
  noArtistsMessage: string;
}

export const TimelineTracks: React.FC<TimelineTracksProps> = ({
  artists,
  duration,
  contentWidth,
  activeMovementId,
  dragInfo,
  tempTimes,
  onSelectArtist,
  handleBlockPointerDown,
  handleBlockPointerMove,
  handleBlockPointerUp,
  noArtistsMessage,
}) => {
  return (
    <div className="flex flex-col gap-2 pt-2 relative">
      {artists.map(artist => (
        <div 
          key={artist.id} 
          className="h-6 relative flex items-center shrink-0"
          style={{ width: '100%', minWidth: '100%' }}
        >
          <div 
            data-artist-id={artist.id}
            data-timeline-track="true"
            className="w-full h-5 rounded-lg bg-[#050608]/60 border border-white/5 relative overflow-hidden shadow-inner cursor-pointer"
            onPointerDown={() => onSelectArtist(artist.id)}
          >
            {artist.movements.map(mov => {
              const isDragged = dragInfo && dragInfo.movementId === mov.id;
              const displayStart = isDragged && tempTimes ? tempTimes.start : mov.startTime;
              const displayEnd = isDragged && tempTimes ? tempTimes.end : mov.endTime;

              const leftPx = (displayStart / duration) * contentWidth;
              const widthPx = ((displayEnd - displayStart) / duration) * contentWidth;
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
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  className={`timeline-movement-block ${isSelected ? 'selected' : ''}`}
                  style={{
                    left: `${leftPx}px`,
                    width: `${widthPx}px`,
                    backgroundColor: artist.color,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.15)`,
                    touchAction: 'none'
                  }}
                  title={`${artist.name}: ${displayStart.toFixed(2)}s - ${displayEnd.toFixed(2)}s`}
                >
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
          {noArtistsMessage}
        </div>
      )}
    </div>
  );
};
