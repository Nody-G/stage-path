import React, { useState } from 'react';
import { Artist } from '../types';

interface UseTimelineDragParams {
  duration: number;
  onSelectArtist: (id: string | null) => void;
  onSelectMovement: (id: string | null) => void;
  onTimelineScrub: (time: number) => void;
  onUpdateMovementTimeRange: (artistId: string, movementId: string, newStart: number, newEnd: number) => void;
  artists?: Artist[];
}

export interface DragInfo {
  type: 'move' | 'resize-start' | 'resize-end';
  artistId: string;
  movementId: string;
  initialStart: number;
  initialEnd: number;
  initialMouseX: number;
  trackWidth: number;
}

export const useTimelineDrag = ({
  duration,
  onSelectArtist,
  onSelectMovement,
  onTimelineScrub,
  onUpdateMovementTimeRange,
  artists,
}: UseTimelineDragParams) => {
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const [tempTimes, setTempTimes] = useState<{ start: number; end: number } | null>(null);

  const handleBlockPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    artistId: string,
    mov: { id: string; startTime: number; endTime: number }
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const blockWidth = rect.width;
    
    // Check if clicked near edges (within 8px) for resizing
    const isLeftEdge = clickX < 8;
    const isRightEdge = clickX > blockWidth - 8;
    const dragType = isLeftEdge ? 'resize-start' : (isRightEdge ? 'resize-end' : 'move');

    const parentWidth = e.currentTarget.parentElement?.getBoundingClientRect().width || 1;

    setDragInfo({
      type: dragType,
      artistId,
      movementId: mov.id,
      initialStart: mov.startTime,
      initialEnd: mov.endTime,
      initialMouseX: e.clientX,
      trackWidth: parentWidth,
    });
    
    setTempTimes({
      start: mov.startTime,
      end: mov.endTime
    });

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleBlockPointerMove = (
    e: React.PointerEvent<HTMLDivElement>,
    artistId: string,
    movId: string
  ) => {
    if (!dragInfo || dragInfo.movementId !== movId || dragInfo.artistId !== artistId || !tempTimes) return;
    e.stopPropagation();

    const deltaX = e.clientX - dragInfo.initialMouseX;
    const deltaSeconds = (deltaX / dragInfo.trackWidth) * duration;

    let newStart = dragInfo.initialStart;
    let newEnd = dragInfo.initialEnd;

    // Find neighboring movements to clamp dragging
    const artist = artists?.find(a => a.id === artistId);
    const otherMovs = artist
      ? artist.movements.filter(m => m.id !== movId).sort((a, b) => a.startTime - b.startTime)
      : [];

    const prevMov = [...otherMovs].reverse().find(m => m.endTime <= dragInfo.initialStart);
    const nextMov = otherMovs.find(m => m.startTime >= dragInfo.initialEnd);

    if (dragInfo.type === 'resize-start') {
      const minVal = prevMov ? prevMov.endTime : 0;
      newStart = Math.max(minVal, Math.min(dragInfo.initialEnd - 0.25, dragInfo.initialStart + deltaSeconds));
    } else if (dragInfo.type === 'resize-end') {
      const maxVal = nextMov ? nextMov.startTime : duration;
      newEnd = Math.max(dragInfo.initialStart + 0.25, Math.min(maxVal, dragInfo.initialEnd + deltaSeconds));
    } else if (dragInfo.type === 'move') {
      const segmentDuration = dragInfo.initialEnd - dragInfo.initialStart;
      const minStart = prevMov ? prevMov.endTime : 0;
      const maxEnd = nextMov ? nextMov.startTime : duration;

      newStart = dragInfo.initialStart + deltaSeconds;
      newStart = Math.max(minStart, Math.min(maxEnd - segmentDuration, newStart));
      newEnd = newStart + segmentDuration;
    }

    // Round to 2 decimal places for visual/logic stability
    newStart = Math.round(newStart * 100) / 100;
    newEnd = Math.round(newEnd * 100) / 100;

    setTempTimes({ start: newStart, end: newEnd });
  };

  const handleBlockPointerUp = (
    e: React.PointerEvent<HTMLDivElement>,
    artistId: string,
    movId: string
  ) => {
    if (!dragInfo || dragInfo.movementId !== movId || dragInfo.artistId !== artistId) return;
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);

    const deltaX = Math.abs(e.clientX - dragInfo.initialMouseX);
    const isClick = deltaX < 3; // minimal movement treated as a selection click

    if (isClick) {
      onSelectArtist(artistId);
      onSelectMovement(movId);
      onTimelineScrub(dragInfo.initialStart);
    } else if (tempTimes) {
      onUpdateMovementTimeRange(artistId, movId, tempTimes.start, tempTimes.end);
      onSelectArtist(artistId);
      onSelectMovement(movId);
    }

    setDragInfo(null);
    setTempTimes(null);
  };

  return {
    dragInfo,
    tempTimes,
    handleBlockPointerDown,
    handleBlockPointerMove,
    handleBlockPointerUp,
  };
};
