import React, { useState, useEffect, useRef } from 'react';
import { Artist, Point, Project } from '../types';
import { getDistance, getArtistPositionAtTime, smoothPoints, simplifyPathRDP } from '../utils/math';
import { wingsPadding } from '../utils/canvasRenderers';

interface UseCanvasInteractionsProps {
  project: Project;
  artists: Artist[];
  activeArtistId: string | null;
  currentTime: number;
  onUpdateArtistPosition: (artistId: string, time: number, position: Point) => void;
  onUpdateMovementControlPoint: (artistId: string, movId: string, position: Point) => void;
  isPlaying: boolean;
  onSelectArtist: (id: string) => void;
  onDoubleClickStage?: (position: Point) => void;
  placementArtistId: string | null;
  setPlacementArtistId: (id: string | null) => void;

  isDrawingMode: boolean;
  setIsDrawingMode: (val: boolean) => void;
  drawModeType: 'freehand' | 'vector';
  drawTimeRange: { start: number; end: number };
  isRecordingMode: boolean;
  setIsRecordingMode: (val: boolean) => void;
  onFinishDrawingPath: (
    artistId: string,
    startTime: number,
    endTime: number,
    points: Point[],
    transitionType: 'linear' | 'curved'
  ) => void;
  onFinishRealtimeRecording: (
    artistId: string,
    recorded: { x: number; y: number; t: number }[]
  ) => void;
  onUpdateMovementPoint: (
    artistId: string,
    movId: string,
    pointIndex: number,
    position: Point
  ) => void;
  onDeleteMovementPoint: (
    artistId: string,
    movId: string,
    pointIndex: number
  ) => void;
  onAddMovementPoint: (
    artistId: string,
    movId: string,
    insertIndex: number,
    position: Point
  ) => void;
  setIsPlaying: (playing: boolean) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function useCanvasInteractions({
  project,
  artists,
  activeArtistId,
  currentTime,
  onUpdateArtistPosition,
  onSelectArtist,
  onDoubleClickStage,
  placementArtistId,
  setPlacementArtistId,
  isDrawingMode,
  setIsDrawingMode,
  drawModeType,
  drawTimeRange,
  isRecordingMode,
  setIsRecordingMode,
  onFinishDrawingPath,
  onFinishRealtimeRecording,
  onUpdateMovementPoint,
  onDeleteMovementPoint,
  onAddMovementPoint,
  setIsPlaying,
  canvasRef,
  onDragStart,
  onDragEnd,
}: UseCanvasInteractionsProps) {
  const lastClickTimeRef = useRef<number>(0);

  const getArtistClickRadius = () => {
    const cs = !!project.settings?.constantScale;
    const tokenScale = cs
      ? 10 * (1 / zoom) * (project.settings?.constantScaleArtistSize ?? 1.0)
      : 5 * (project.settings?.constantScaleArtistSize ?? 1.0);
    return 17.5 * tokenScale;
  };
  
  const [isDragging, setIsDragging] = useState(false);
  const [draggedArtistId, setDraggedArtistId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  
  const [isDraggingMovPoint, setIsDraggingMovPoint] = useState(false);
  const [draggedMovId, setDraggedMovId] = useState<string | null>(null);
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ movId: string; pointIdx: number } | null>(null);

  const [vectorPoints, setVectorPoints] = useState<Point[]>([]);
  const [vectorTransitionType, setVectorTransitionType] = useState<'linear' | 'curved'>('curved');
  const [previewCursorPos, setPreviewCursorPos] = useState<Point | null>(null);
  
  const [isDrawingFreehand, setIsDrawingFreehand] = useState(false);
  const freehandPointsRef = useRef<Point[]>([]);
  
  const isRecordingInProgressRef = useRef(false);
  const recordedPointsRef = useRef<{ x: number; y: number; t: number }[]>([]);
  const recordingCurrentPosRef = useRef<Point | null>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ clientX: number; clientY: number; panX: number; panY: number }>({
    clientX: 0,
    clientY: 0,
    panX: 0,
    panY: 0
  });

  const zoomRef = useRef<number>(1);
  const panRef = useRef<Point>({ x: 0, y: 0 });
  const projectRef = useRef(project);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  const handleValidateVectorDrawing = () => {
    if (vectorPoints.length >= 2 && activeArtistId) {
      onFinishDrawingPath(
        activeArtistId,
        drawTimeRange.start,
        drawTimeRange.end,
        vectorPoints,
        vectorTransitionType
      );
    }
    setVectorPoints([]);
    setPreviewCursorPos(null);
    setIsDrawingMode(false);
  };

  const handleCancelDrawing = () => {
    setVectorPoints([]);
    setPreviewCursorPos(null);
    setIsDrawingMode(false);
  };

  // Keyboard shortcut listener for vector drawing
  useEffect(() => {
    if (!isDrawingMode || drawModeType !== 'vector') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (vectorPoints.length >= 2) {
          handleValidateVectorDrawing();
        }
      } else if (e.key === 'Escape') {
        handleCancelDrawing();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        setVectorPoints(prev => prev.slice(0, -1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingMode, drawModeType, vectorPoints, vectorTransitionType, activeArtistId]);

  // Native wheel event listener for zoom centered on mouse
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      const rect = canvas.getBoundingClientRect();
      const virtualW = projectRef.current.stageWidth * 100 + wingsPadding * 2;
      const virtualH = projectRef.current.stageHeight * 100 + wingsPadding * 2;
      const mouseX = ((e.clientX - rect.left) / rect.width) * virtualW;
      const mouseY = ((e.clientY - rect.top) / rect.height) * virtualH;

      const stageX = (mouseX - panRef.current.x) / zoomRef.current;
      const stageY = (mouseY - panRef.current.y) / zoomRef.current;

      let nextZoom = zoomRef.current;
      if (e.deltaY < 0) {
        nextZoom = Math.min(5, zoomRef.current * zoomFactor);
      } else {
        nextZoom = Math.max(0.3, zoomRef.current / zoomFactor);
      }

      const nextPanX = mouseX - stageX * nextZoom;
      const nextPanY = mouseY - stageY * nextZoom;

      setZoom(nextZoom);
      setPan({ x: nextPanX, y: nextPanY });
    };

    canvas.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheelNative);
    };
  }, [canvasRef]);

  const zoomIn = () => {
    const nextZoom = Math.min(5, zoom * 1.25);
    const virtualW = project.stageWidth * 100 + wingsPadding * 2;
    const virtualH = project.stageHeight * 100 + wingsPadding * 2;
    const centerX = virtualW / 2;
    const centerY = virtualH / 2;
    const stageX = (centerX - pan.x) / zoom;
    const stageY = (centerY - pan.y) / zoom;
    setZoom(nextZoom);
    setPan({ x: centerX - stageX * nextZoom, y: centerY - stageY * nextZoom });
  };

  const zoomOut = () => {
    const nextZoom = Math.max(0.3, zoom / 1.25);
    const virtualW = project.stageWidth * 100 + wingsPadding * 2;
    const virtualH = project.stageHeight * 100 + wingsPadding * 2;
    const centerX = virtualW / 2;
    const centerY = virtualH / 2;
    const stageX = (centerX - pan.x) / zoom;
    const stageY = (centerY - pan.y) / zoom;
    setZoom(nextZoom);
    setPan({ x: centerX - stageX * nextZoom, y: centerY - stageY * nextZoom });
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const virtualW = project.stageWidth * 100 + wingsPadding * 2;
    const virtualH = project.stageHeight * 100 + wingsPadding * 2;
    const x = ((e.clientX - rect.left) / rect.width) * virtualW;
    const y = ((e.clientY - rect.top) / rect.height) * virtualH;
    return { x, y };
  };

  const getStageCoords = (canvasCoords: Point): Point => {
    return {
      x: (canvasCoords.x - pan.x) / zoom - wingsPadding,
      y: (canvasCoords.y - pan.y) / zoom - wingsPadding,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvasCoords = getCanvasCoords(e);
    const coords = getStageCoords(canvasCoords);
    const now = Date.now();
    const timeDiff = now - lastClickTimeRef.current;
    
    // Intercept Double Click
    if (timeDiff < 280) {
      handleManualDoubleClick(coords);
      lastClickTimeRef.current = 0;
      return;
    }
    lastClickTimeRef.current = now;

    // A. Intercept drawing modes
    if (isDrawingMode) {
      if (drawModeType === 'vector') {
        if (e.button === 0) {
          setVectorPoints(prev => [...prev, coords]);
        }
      } else if (drawModeType === 'freehand') {
        if (e.button === 0) {
          setIsDrawingFreehand(true);
          freehandPointsRef.current = [coords];
        }
      }
      return;
    }

    // B. Intercept recording mode
    if (isRecordingMode) {
      if (e.button === 0 && activeArtistId) {
        const activeArtist = artists.find(a => a.id === activeArtistId);
        if (activeArtist) {
          const pos = getArtistPositionAtTime(activeArtist, currentTime, project.stageWidth, project.stageHeight);
          const clickRadius = getArtistClickRadius();
          if (getDistance(coords, pos) < clickRadius) {
            isRecordingInProgressRef.current = true;
            recordingCurrentPosRef.current = pos;
            recordedPointsRef.current = [{ x: Math.round(pos.x), y: Math.round(pos.y), t: currentTime }];
            setIsPlaying(true); // Auto play timeline
            canvasRef.current?.setPointerCapture(e.pointerId);
          }
        }
      }
      return;
    }

    // C. Intercept Right Click (Delete Control Point)
    if (e.button === 2) {
      e.preventDefault();
      if (activeArtistId) {
        const activeArtist = artists.find(a => a.id === activeArtistId);
        if (activeArtist) {
          const hitRadius = Math.max(12, 10 / zoom);
          let hitPoint: { movId: string; pointIdx: number } | null = null;

          for (const mov of activeArtist.movements) {
            for (let idx = 0; idx < mov.points.length; idx++) {
              const pt = mov.points[idx];
              if (getDistance(coords, pt) < hitRadius) {
                hitPoint = { movId: mov.id, pointIdx: idx };
                break;
              }
            }
            if (hitPoint) break;
          }

          if (hitPoint) {
            onDeleteMovementPoint(activeArtistId, hitPoint.movId, hitPoint.pointIdx);
          }
        }
      }
      return;
    }

    canvasRef.current?.setPointerCapture(e.pointerId);

    if (placementArtistId) {
      onUpdateArtistPosition(placementArtistId, currentTime, coords);
      setPlacementArtistId(null);
      onSelectArtist(placementArtistId);
      return;
    }

    // D. Hit test control point handles of selected artist
    if (activeArtistId) {
      const activeArtist = artists.find(a => a.id === activeArtistId);
      if (activeArtist) {
        const hitRadius = Math.max(12, 10 / zoom);
        let clickedMovId: string | null = null;
        let clickedPtIdx: number | null = null;

        activeArtist.movements.forEach(mov => {
          mov.points.forEach((pt, idx) => {
            if (getDistance(coords, pt) < hitRadius) {
              clickedMovId = mov.id;
              clickedPtIdx = idx;
            }
          });
        });

        if (clickedMovId !== null && clickedPtIdx !== null) {
          setIsDraggingMovPoint(true);
          setDraggedMovId(clickedMovId);
          setDraggedPointIndex(clickedPtIdx);
          setIsPlaying(false);
          onDragStart?.();
          return;
        }
      }
    }

    // E. Find artist under click (performer dragging)
    const clickRadius = getArtistClickRadius(); 
    let foundArtistId: string | null = null;
    let foundArtistPos: Point = { x: 0, y: 0 };

    for (const artist of artists) {
      if (!artist.visible) continue;
      const pos = getArtistPositionAtTime(artist, currentTime, project.stageWidth, project.stageHeight);
      if (getDistance(coords, pos) < clickRadius) {
        foundArtistId = artist.id;
        foundArtistPos = pos;
        break;
      }
    }

    if (foundArtistId) {
      onSelectArtist(foundArtistId);
      setIsDragging(true);
      setDraggedArtistId(foundArtistId);
      setDragOffset({
        x: coords.x - foundArtistPos.x,
        y: coords.y - foundArtistPos.y,
      });
      setIsPlaying(false);
      onDragStart?.();
    } else {
      // Drag background to pan
      if (!placementArtistId) {
        setIsPanning(true);
        setStartPan({
          clientX: e.clientX,
          clientY: e.clientY,
          panX: pan.x,
          panY: pan.y,
        });
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvasCoords = getCanvasCoords(e);
    const coords = getStageCoords(canvasCoords);
    
    // A. Handle drawing previews
    if (isDrawingMode) {
      if (drawModeType === 'vector') {
        setPreviewCursorPos(coords);
      } else if (drawModeType === 'freehand' && isDrawingFreehand) {
        const lastPt = freehandPointsRef.current[freehandPointsRef.current.length - 1];
        if (!lastPt || getDistance(coords, lastPt) > 3) {
          freehandPointsRef.current.push(coords);
        }
      }
      return;
    }

    // B. Handle recording captures
    if (isRecordingMode) {
      if (isRecordingInProgressRef.current && activeArtistId) {
        recordingCurrentPosRef.current = coords;
        recordedPointsRef.current.push({
          x: Math.round(coords.x),
          y: Math.round(coords.y),
          t: currentTime
        });
      }
      return;
    }

    // C. Handle normal dragging / panning
    if (isDraggingMovPoint && draggedMovId && draggedPointIndex !== null && activeArtistId) {
      onUpdateMovementPoint(activeArtistId, draggedMovId, draggedPointIndex, coords);
    } else if (isDragging && draggedArtistId) {
      const targetPos: Point = {
        x: coords.x - dragOffset.x,
        y: coords.y - dragOffset.y,
      };
      onUpdateArtistPosition(draggedArtistId, currentTime, targetPos);
    } else if (isPanning) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const virtualW = project.stageWidth * 100 + wingsPadding * 2;
        const virtualH = project.stageHeight * 100 + wingsPadding * 2;
        const dx = e.clientX - startPan.clientX;
        const dy = e.clientY - startPan.clientY;
        const scaleX = rect.width > 0 ? (virtualW / rect.width) : 1;
        const scaleY = rect.height > 0 ? (virtualH / rect.height) : 1;
        setPan({
          x: startPan.panX + dx * scaleX,
          y: startPan.panY + dy * scaleY,
        });
      }
    }

    // D. Hover tracking for cursor style and glows
    if (!isDragging && !isDraggingMovPoint && !isPanning && activeArtistId) {
      const activeArtist = artists.find(a => a.id === activeArtistId);
      if (activeArtist) {
        const hitRadius = Math.max(12, 10 / zoom);
        let foundHover: { movId: string; pointIdx: number } | null = null;

        activeArtist.movements.forEach(mov => {
          mov.points.forEach((pt, idx) => {
            if (getDistance(coords, pt) < hitRadius) {
              foundHover = { movId: mov.id, pointIdx: idx };
            }
          });
        });
        setHoverInfo(foundHover);
      } else {
        setHoverInfo(null);
      }
    } else {
      setHoverInfo(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    canvasRef.current?.releasePointerCapture(e.pointerId);

    // A. Terminate freehand drawing
    if (isDrawingMode && drawModeType === 'freehand') {
      if (isDrawingFreehand) {
        setIsDrawingFreehand(false);
        const pts = [...freehandPointsRef.current];
        if (pts.length >= 2 && activeArtistId) {
          const smoothed = smoothPoints(pts, 2);
          const simplified = simplifyPathRDP(smoothed, 15);
          onFinishDrawingPath(activeArtistId, drawTimeRange.start, drawTimeRange.end, simplified, 'linear');
        }
        freehandPointsRef.current = [];
        setIsDrawingMode(false);
      }
      return;
    }

    // B. Terminate live recording
    if (isRecordingMode) {
      if (isRecordingInProgressRef.current) {
        isRecordingInProgressRef.current = false;
        recordingCurrentPosRef.current = null;
        setIsPlaying(false); // Pause playback
        
        const recorded = [...recordedPointsRef.current];
        if (recorded.length >= 5 && activeArtistId) {
          onFinishRealtimeRecording(activeArtistId, recorded);
        }
        recordedPointsRef.current = [];
        setIsRecordingMode(false);
      }
      return;
    }

    if (isDraggingMovPoint) {
      setIsDraggingMovPoint(false);
      setDraggedMovId(null);
      setDraggedPointIndex(null);
      onDragEnd?.();
    } else if (isDragging) {
      setIsDragging(false);
      setDraggedArtistId(null);
      onDragEnd?.();
    } else if (isPanning) {
      setIsPanning(false);
    }
  };

  const handleManualDoubleClick = (coords: Point) => {
    // A. Intercept trajectory spline addition on double-click
    if (activeArtistId) {
      const activeArtist = artists.find(a => a.id === activeArtistId);
      if (activeArtist) {
        let closestLutEntry: any = null;
        let closestDist = Infinity;
        let closestMovId = '';

        activeArtist.movements.forEach(mov => {
          mov.lut.forEach(entry => {
            const d = getDistance(coords, entry);
            if (d < closestDist) {
              closestDist = d;
              closestLutEntry = entry;
              closestMovId = mov.id;
            }
          });
        });

        const hitTolerance = Math.max(10, 8 / zoom);
        if (closestDist < hitTolerance && closestLutEntry) {
          const insertIndex = Math.floor(closestLutEntry.u) + 1;
          onAddMovementPoint(activeArtistId, closestMovId, insertIndex, coords);
          return;
        }
      }
    }

    const clickRadius = getArtistClickRadius();
    const isNearArtist = artists.some(artist => {
      if (!artist.visible) return false;
      const pos = getArtistPositionAtTime(artist, currentTime, project.stageWidth, project.stageHeight);
      return getDistance(coords, pos) < clickRadius;
    });

    if (!isNearArtist && onDoubleClickStage) {
      onDoubleClickStage(coords);
    }
  };

  return {
    zoom,
    pan,
    isPanning,
    isDragging,
    isDraggingMovPoint,
    hoverInfo,
    vectorPoints,
    setVectorPoints,
    vectorTransitionType,
    setVectorTransitionType,
    previewCursorPos,
    isDrawingFreehand,
    freehandPointsRef,
    isRecordingInProgressRef,
    recordedPointsRef,
    recordingCurrentPosRef,
    zoomIn,
    zoomOut,
    resetZoom,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleValidateVectorDrawing,
    handleCancelDrawing
  };
}
