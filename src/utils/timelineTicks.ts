export interface TimelineTick {
  time: number;
  isMajor: boolean;
  leftPercent: number;
  label: string;
}

// Generate the ruler ticks dynamically based on zoom and duration to prevent overlapping, virtualized to avoid rendering lag
export const getTimelineTicks = (
  duration: number,
  zoom: number,
  viewportWidth: number,
  scrollLeft: number,
  formatTime: (t: number) => string
): TimelineTick[] => {
  if (isNaN(duration) || duration <= 0 || isNaN(viewportWidth) || viewportWidth <= 0) return [];
  
  const contentWidth = viewportWidth * zoom;
  if (isNaN(contentWidth) || contentWidth <= 0) return [];
  
  const pixelsPerSecond = contentWidth / duration;
  if (isNaN(pixelsPerSecond) || pixelsPerSecond <= 0) return [];

  // Minimum spacing between labels (pixels)
  const minLabelSpacing = 90;
  const minTimeInterval = minLabelSpacing / pixelsPerSecond;

  // Clean time intervals (in seconds)
  const cleanIntervals = [
    0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 
    60, 120, 300, 600, 1800, 3600
  ];

  let majorInterval = 10;
  if (!isNaN(minTimeInterval)) {
    const found = cleanIntervals.find(val => val >= minTimeInterval);
    if (found !== undefined) {
      majorInterval = found;
    } else {
      // For very large intervals (longer projects fully zoomed out), scale up cleanly in multiples of 1 hour
      majorInterval = Math.ceil(minTimeInterval / 3600) * 3600;
    }
  }

  // Determine minor subdivisions
  let minorInterval: number | null = null;
  if ((majorInterval / 10) * pixelsPerSecond >= 12) {
    minorInterval = majorInterval / 10;
  } else if ((majorInterval / 5) * pixelsPerSecond >= 10) {
    minorInterval = majorInterval / 5;
  } else if ((majorInterval / 2) * pixelsPerSecond >= 8) {
    minorInterval = majorInterval / 2;
  }

  let step = minorInterval || majorInterval;
  if (isNaN(step) || step <= 0) return [];

  // Virtualization window with 200px boundary padding
  const visibleStartPx = Math.max(0, scrollLeft - 200);
  const visibleEndPx = scrollLeft + viewportWidth + 200;
  
  const startTime = (visibleStartPx / contentWidth) * duration;
  const endTime = Math.min(duration, (visibleEndPx / contentWidth) * duration);
  
  if (isNaN(startTime) || isNaN(endTime) || startTime > endTime) return [];

  // Align start to the step multiple
  const startAligned = Math.floor(startTime / step) * step;

  // Safeguard against infinite or excessive loops
  const expectedIterations = (endTime - startAligned) / step;
  if (expectedIterations > 1000) {
    step = Math.max(step, (endTime - startAligned) / 1000);
  }

  const ticks: TimelineTick[] = [];
  for (let t = startAligned; t <= endTime; t += step) {
    const time = Math.round(t * 1000) / 1000;
    if (time < 0 || time > duration || isNaN(time)) continue;

    const isMajor = Math.abs(time % majorInterval) < 0.001 || time === 0 || Math.abs(time - duration) < 0.001;

    ticks.push({
      time,
      isMajor,
      leftPercent: (time / duration) * 100,
      label: isMajor ? formatTime(time) : ''
    });
  }

  // Ensure the final duration tick is always present if it is in the visible range
  const finalVisible = duration >= startTime && duration <= endTime;
  if (finalVisible && (ticks.length === 0 || Math.abs(ticks[ticks.length - 1].time - duration) > 0.001)) {
    ticks.push({
      time: duration,
      isMajor: true,
      leftPercent: 100,
      label: formatTime(duration)
    });
  }

  return ticks;
};
