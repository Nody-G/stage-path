import React, { useRef, useEffect, useState } from 'react';
import { Artist, Point, Project } from '../types';
import { useCanvasInteractions } from '../hooks/useCanvasInteractions';
import { drawStage, wingsPadding } from '../utils/canvasRenderers';

interface StageCanvasProps {
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
}

export const StageCanvas: React.FC<StageCanvasProps> = (props) => {
  const {
    project,
    artists,
    activeArtistId,
    currentTime,
    isPlaying,
    isDrawingMode,
    drawModeType,
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
    vectorPoints,
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
        vectorPoints,
        vectorTransitionType,
        previewCursorPos,
        isDrawingMode,
        drawModeType,
        isDrawingFreehand,
        freehandPoints: freehandPointsRef.current,
        isRecordingMode,
        recordedPoints: recordedPointsRef.current,
        isRecordingInProgress: isRecordingInProgressRef.current,
        recordingCurrentPos: recordingCurrentPosRef.current,
        hoverInfo,
        isPlaying,
      });
    };

    let animationFrameId: number;
    const loop = () => {
      render();
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
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
    vectorPoints,
    vectorTransitionType,
    previewCursorPos,
    isDrawingMode,
    drawModeType,
    isDrawingFreehand,
    isRecordingMode,
    hoverInfo,
    isPlaying,
  ]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-y-auto flex flex-col bg-[#07080a]"
      style={{ touchAction: 'none' }}
    >
      {/* Floating Zoom Controls Bar */}
      <div className="stage-zoom-controls">
        <button
          type="button"
          onClick={zoomOut}
          className="w-6 h-6 rounded hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center justify-center font-bold text-sm"
          title="Dézoomer"
        >
          -
        </button>
        <span className="w-12 text-center text-slate-300 font-mono text-[10px] font-bold">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={zoomIn}
          className="w-6 h-6 rounded hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center justify-center font-bold text-sm"
          title="Zoomer"
        >
          +
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          type="button"
          onClick={resetZoom}
          className="px-2 py-0.5 rounded hover:bg-indigo-600/30 text-indigo-300 hover:text-white transition text-[9px] font-bold"
          title="Réinitialiser à 100%"
        >
          100%
        </button>
      </div>

      {/* Drawing mode HUD Overlay */}
      {isDrawingMode && (
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel p-3 flex items-center gap-4 border border-indigo-500/30 shadow-lg shadow-indigo-950/20 z-10 animate-fade-in text-xs rounded-xl" 
          style={{ backgroundColor: 'rgba(11, 13, 19, 0.95)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
            <span className="font-bold text-slate-200">
              {drawModeType === 'vector' ? 'Tracé Vectoriel (Plume)' : 'Tracé Libre (Main Levée)'}
            </span>
          </div>
          
          <div className="h-4 w-px bg-white/10" />
          
          <span className="text-slate-400 font-medium">
            Temps : <span className="font-mono text-indigo-300 font-bold">{drawTimeRange.start.toFixed(1)}s ➔ {drawTimeRange.end.toFixed(1)}s</span>
          </span>
          
          {drawModeType === 'vector' && (
            <>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Type :</span>
                <button
                  type="button"
                  onClick={() => setVectorTransitionType('linear')}
                  className={`px-2 py-0.5 rounded font-bold border transition text-[10px] ${
                    vectorTransitionType === 'linear'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/10'
                  }`}
                >
                  Droit
                </button>
                <button
                  type="button"
                  onClick={() => setVectorTransitionType('curved')}
                  className={`px-2 py-0.5 rounded font-bold border transition text-[10px] ${
                    vectorTransitionType === 'curved'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/10'
                  }`}
                >
                  Courbe
                </button>
              </div>
              
              <div className="h-4 w-px bg-white/10" />
              <span className="text-slate-400 font-mono">
                {vectorPoints.length} point{vectorPoints.length > 1 ? 's' : ''}
              </span>
              
              <div className="h-4 w-px bg-white/10" />
              <button
                type="button"
                onClick={handleValidateVectorDrawing}
                disabled={vectorPoints.length < 2}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold rounded-lg transition"
              >
                Valider (Entrée)
              </button>
            </>
          )}
          
          <button
            type="button"
            onClick={handleCancelDrawing}
            className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 font-semibold rounded-lg transition"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Recording mode HUD Overlay */}
      {isRecordingMode && (
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel p-2.5 flex items-center gap-3 border border-red-500/30 shadow-lg shadow-red-950/20 z-10 text-xs rounded-xl" 
          style={{ backgroundColor: 'rgba(20, 10, 10, 0.95)', backdropFilter: 'blur(12px)' }}
        >
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="font-bold text-red-400 tracking-wider">● ENREGISTREMENT EN DIRECT</span>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-slate-300">
            {isRecordingInProgressRef.current ? "Enregistrement en cours... Glissez le figurant !" : "Glissez le figurant pour démarrer l'enregistrement."}
          </span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-auto my-auto border border-white/5 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] bg-[#030406]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{ 
          cursor: isDrawingMode ? 'crosshair' : (isRecordingMode ? 'cell' : (hoverInfo ? 'pointer' : (isDraggingMovPoint || isDragging || isPanning ? 'grabbing' : 'grab'))),
          aspectRatio: `${project.stageWidth * 100 + wingsPadding * 2}/${project.stageHeight * 100 + wingsPadding * 2}`,
        }}
      />
    </div>
  );
};
