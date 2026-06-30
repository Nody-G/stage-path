import React, { useState } from 'react';

interface UseTimelineScrubParams {
  onTimelineScrub: (time: number) => void;
  duration: number;
  timelineTracksRef: React.RefObject<HTMLDivElement | null>;
}

export const useTimelineScrub = ({
  onTimelineScrub,
  duration,
  timelineTracksRef,
}: UseTimelineScrubParams) => {
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Core scrubbing function on target element
  const scrubTime = (clientX: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const width = rect.width;
    if (width > 0) {
      const percent = Math.max(0, Math.min(1, clickX / width));
      onTimelineScrub(percent * duration);
    }
  };

  // Ruler pointer handlers
  const handleRulerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsScrubbing(true);
    scrubTime(e.clientX, e.currentTarget);
  };

  const handleRulerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      scrubTime(e.clientX, e.currentTarget);
    }
  };

  const handleRulerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsScrubbing(false);
    }
  };

  // Dedicated Playhead Handle pointer handlers
  const handlePlayheadHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsScrubbing(true);
  };

  const handlePlayheadHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing || !timelineTracksRef.current) return;
    e.stopPropagation();
    const tracksDiv = timelineTracksRef.current;
    const rect = tracksDiv.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const trackWidth = rect.width;
    if (trackWidth > 0) {
      const percent = Math.max(0, Math.min(1, clickX / trackWidth));
      onTimelineScrub(percent * duration);
    }
  };

  const handlePlayheadHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsScrubbing(false);
  };

  return {
    isScrubbing,
    handleRulerPointerDown,
    handleRulerPointerMove,
    handleRulerPointerUp,
    handlePlayheadHandlePointerDown,
    handlePlayheadHandlePointerMove,
    handlePlayheadHandlePointerUp,
  };
};
