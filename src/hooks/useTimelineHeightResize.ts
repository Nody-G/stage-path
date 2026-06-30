import React, { useState, useEffect } from 'react';

interface UseTimelineHeightResizeParams {
  timelineHeight: number;
  onTimelineResize: (height: number) => void;
}

export const useTimelineHeightResize = ({
  timelineHeight,
  onTimelineResize,
}: UseTimelineHeightResizeParams) => {
  const [isResizing, setIsResizing] = useState(false);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      const clamped = Math.min(Math.max(newHeight, 100), 600);
      onTimelineResize(clamped);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem("stage_path_timeline_height", timelineHeight.toString());
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "row-resize";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, timelineHeight, onTimelineResize]);

  return {
    isResizing,
    handleResizeMouseDown,
  };
};
