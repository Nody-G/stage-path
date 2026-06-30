import { useEffect } from 'react';

interface UseTimelineAutoScrollParams {
  timelineTracksRef: React.RefObject<HTMLDivElement | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  timelineZoom: number;
  viewportWidth: number;
}

export const useTimelineAutoScroll = ({
  timelineTracksRef,
  isPlaying,
  currentTime,
  duration,
  timelineZoom,
  viewportWidth,
}: UseTimelineAutoScrollParams) => {
  useEffect(() => {
    const tracksDiv = timelineTracksRef.current;
    if (!tracksDiv || !isPlaying) return;

    const contentWidth = viewportWidth * timelineZoom;
    const playheadX = (currentTime / duration) * contentWidth;

    const leftThreshold = tracksDiv.scrollLeft + viewportWidth * 0.15;
    const rightThreshold = tracksDiv.scrollLeft + viewportWidth * 0.8;

    if (playheadX > rightThreshold) {
      tracksDiv.scrollLeft = Math.min(
        contentWidth - viewportWidth,
        playheadX - viewportWidth * 0.3
      );
    } else if (playheadX < leftThreshold) {
      tracksDiv.scrollLeft = Math.max(0, playheadX - viewportWidth * 0.3);
    }
  }, [currentTime, duration, isPlaying, timelineZoom, viewportWidth, timelineTracksRef]);
};
