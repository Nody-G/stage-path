import React, { useRef, useEffect, useState } from 'react';
import { Artist, Point, Project } from '../types';
import { useCanvasInteractions } from '../hooks/useCanvasInteractions';
import { drawStage, wingsPadding } from '../utils/canvasRenderers';
import { DrawingHUD } from './stage/DrawingHUD';
import { RecordingHUD } from './stage/RecordingHUD';

interface StageCanvasProps {
  project: Project;
  artists: Artist[];
  activeArtistId: string | null;
  currentTime: number;
  onUpdateArtistPosition: (artistId: string, time: number, position: Point) => void;
  onUpdateMovementControlPoint: (artistId: string, movId: string, position: Point) => void;
  isPlaying: boolean;
  onSelectArtist: (id: string) => void;
  onDoubleClickStage?: (position: Point, clientX?: number, clientY?: number) => void;
  placementArtistId: string | null;
  setPlacementArtistId: (id: string | null) => void;

  // Advanced movement creation and editing props
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
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onCreateMovementAtTime?: (artistId: string, time: number) => void;
}

export const StageCanvas: React.FC<StageCanvasProps> = (props) => {
  const {
    project,
    artists,
    activeArtistId,
    currentTime,
    isPlaying,
    isDrawingMode,
    drawTimeRange,
    isRecordingMode,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  // Delegate all mouse/pointer gestures & drawing state handling to the hook
  const {
    zoom,
    pan,
    isPanning,
    isDragging,
    isDraggingMovPoint,
    hoverInfo,
    isHoveringPlusBtn,
    isDrawingFreehand,
    freehandPointsRef,
    isRecordingInProgressRef,
    recordedPointsRef,
    recordingCurrentPosRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleCancelDrawing,
  } = useCanvasInteractions({
    ...props,
    canvasRef,
  });

  // Load background image when settings change
  useEffect(() => {
    if (project.backgroundSettings.fileUrl) {
      const img = new Image();
      img.src = project.backgroundSettings.fileUrl;
      img.onload = () => {
        setBgImage(img);
      };
      img.onerror = () => {
        console.error("Erreur de chargement de l'image de fond.");
        setBgImage(null);
      };
    } else {
      setBgImage(null);
    }
  }, [project.backgroundSettings.fileUrl]);

  // Canvas size and rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stageW = project.stageWidth * 100;
    const stageH = project.stageHeight * 100;

    const virtualW = stageW + wingsPadding * 2;
    const virtualH = stageH + wingsPadding * 2;

    // Cap internal rendering resolution to 2500px to avoid memory overflow & lag
    const maxResolution = 2500;
    let resolutionScale = 1;
    if (virtualW > maxResolution || virtualH > maxResolution) {
      if (virtualW > virtualH) {
        resolutionScale = maxResolution / virtualW;
      } else {
        resolutionScale = maxResolution / virtualH;
      }
    }

    canvas.width = virtualW * resolutionScale;
    canvas.height = virtualH * resolutionScale;

    const render = () => {
      drawStage({
        ctx,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        resolutionScale,
        project,
        artists,
        activeArtistId,
        currentTime,
        zoom,
        pan,
        bgImage,
        isDrawingMode,
        isDrawingFreehand,
        freehandPoints: freehandPointsRef.current,
        isRecordingMode,
        recordedPoints: recordedPointsRef.current,
        isRecordingInProgress: isRecordingInProgressRef.current,
        recordingCurrentPos: recordingCurrentPosRef.current,
        hoverInfo,
        isPlaying,
        isHoveringPlusBtn,
      });
    };

    render();

    const needsAnimation = 
      isPlaying || 
      isPanning || 
      isDragging || 
      isDraggingMovPoint || 
      isDrawingFreehand || 
      isRecordingMode || 
      isRecordingInProgressRef.current || 
      isHoveringPlusBtn ||
      !!hoverInfo;

    let animationFrameId: number;
    if (needsAnimation) {
      const loop = () => {
        render();
        animationFrameId = requestAnimationFrame(loop);
      };
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    artists,
    activeArtistId,
    currentTime,
    bgImage,
    project.backgroundSettings,
    project.settings,
    zoom,
    pan,
    isPanning,
    isDragging,
    isDraggingMovPoint,
    isDrawingMode,
    isDrawingFreehand,
    isRecordingMode,
    hoverInfo,
    isPlaying,
    isHoveringPlusBtn,
  ]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-y-auto flex flex-col bg-[#07080a]"
      style={{ touchAction: 'none' }}
    >

      <DrawingHUD
        isDrawingMode={isDrawingMode}
        drawTimeRange={drawTimeRange}
        onCancelDrawing={handleCancelDrawing}
      />

      <RecordingHUD
        isRecordingMode={isRecordingMode}
        isRecordingInProgress={isRecordingInProgressRef.current}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-auto my-auto border border-white/5 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] bg-[#030406]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{ 
          cursor: isDrawingMode ? 'crosshair' : (isRecordingMode ? 'cell' : (hoverInfo || isHoveringPlusBtn ? 'pointer' : (isDraggingMovPoint || isDragging || isPanning ? 'grabbing' : 'grab'))),
          aspectRatio: `${project.stageWidth * 100 + wingsPadding * 2}/${project.stageHeight * 100 + wingsPadding * 2}`,
        }}
      />
    </div>
  );
};
