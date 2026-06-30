import { useState, useEffect, useRef } from 'react';
import { Project, Artist } from '../types';
import { drawStage, wingsPadding } from '../utils/canvasRenderers';
import { Muxer, ArrayBufferTarget, FileSystemWritableFileStreamTarget } from 'mp4-muxer';

export type ResolutionOption = '720p' | '1080p' | '1440p' | '2160p';
export type CodecOption = 'x264' | 'x265';
export type ArtistVisibility = 'normal' | 'faible' | 'masque';

export interface ExportSettings {
  fileName: string;
  resolution: ResolutionOption;
  codec: CodecOption;
  bitrate: number; // in kbps
  overlays: {
    showName: boolean;
    showDirector: boolean;
    showExportTime: boolean;
    showCasting: boolean;
    showCustomNote: boolean;
    showScale: boolean;
  };
  customNote: string;
  overlayOpacity: number; // 0 to 1
  castingOverrides: Record<string, ArtistVisibility>;
  groupOverrides: Record<string, ArtistVisibility>;
  showMovementPaths: boolean;
  groupPathOverrides: Record<string, boolean>;
  castingPathOverrides: Record<string, boolean>;
}

// Default bitrates in kbps
export const DEFAULT_BITRATES: Record<CodecOption, Record<ResolutionOption, number>> = {
  x264: {
    '720p': 2500,
    '1080p': 5000,
    '1440p': 10000,
    '2160p': 20000,
  },
  x265: {
    '720p': 1500,
    '1080p': 3000,
    '1440p': 6000,
    '2160p': 12000,
  },
};

export const RESOLUTION_SIZES: Record<ResolutionOption, { width: number; height: number }> = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '1440p': { width: 2560, height: 1440 },
  '2160p': { width: 3840, height: 2160 },
};

export interface PrecalculatedLayout {
  scale: number;
  margin: number;
  padding: number;
  cardWidth: number;
  cardHeight: number;
  lines: {
    type: 'title' | 'subtitle' | 'body' | 'separator';
    wrappedLines: string[];
    font: string;
    heightOffset: number;
    height: number;
  }[];
}

export function useVideoExport(project: Project) {
  // --- 1. Settings State ---
  const [settings, setSettings] = useState<ExportSettings>({
    fileName: `${project.name.trim().replace(/[^a-zA-Z0-9]/g, '_')}_export.mp4`,
    resolution: '1080p',
    codec: 'x264',
    bitrate: DEFAULT_BITRATES.x264['1080p'],
    overlays: {
      showName: true,
      showDirector: true,
      showExportTime: true,
      showCasting: true,
      showCustomNote: false,
      showScale: true,
    },
    customNote: '',
    overlayOpacity: 0.8,
    castingOverrides: {},
    groupOverrides: {},
    showMovementPaths: project.settings?.showMovementPaths !== false,
    groupPathOverrides: {},
    castingPathOverrides: {},
  });

  // Sync showMovementPaths when project settings change
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      showMovementPaths: project.settings?.showMovementPaths !== false,
    }));
  }, [project.settings?.showMovementPaths]);

  // Update suggested filename when project name changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      fileName: `${project.name.trim().replace(/[^a-zA-Z0-9]/g, '_')}_export.mp4`,
    }));
  }, [project.name]);

  // Keep bitrate in sync when resolution or codec changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      bitrate: DEFAULT_BITRATES[prev.codec][prev.resolution],
    }));
  }, [settings.resolution, settings.codec]);

  // Sync castingOverrides when artists list changes in the project
  useEffect(() => {
    if (!project.artists) return;
    setSettings(prev => {
      const updatedOverrides = { ...prev.castingOverrides };
      let changed = false;
      project.artists.forEach(a => {
        if (!(a.id in updatedOverrides)) {
          updatedOverrides[a.id] = a.visible ? 'normal' : 'masque';
          changed = true;
        }
      });
      return changed ? { ...prev, castingOverrides: updatedOverrides } : prev;
    });
  }, [project.artists]);

  // --- 2. Process State ---
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  const cancelRef = useRef(false);

  // Helper to load background image
  const loadBgImage = (url: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      if (!url) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.error("Failed to load background image for export");
        resolve(null);
      };
    });
  };

  // Main Export Process
  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress(0);
    setExportError(null);
    cancelRef.current = false;

    let encoder: VideoEncoder | null = null;
    let fileHandle: FileSystemFileHandle | null = null;
    let writableStream: FileSystemWritableFileStream | null = null;
    let useFilePicker = false;
    let exportSuccessful = false;
    let muxerTarget: ArrayBufferTarget | FileSystemWritableFileStreamTarget | null = null;
    let suggestedFileName = '';

    try {
      // 1. Deciding File Name and Destination via showSaveFilePicker if supported
      suggestedFileName = settings.fileName.endsWith('.mp4') ? settings.fileName : `${settings.fileName}.mp4`;
      if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        try {
          fileHandle = await (window as Window & { showSaveFilePicker?: (options?: object) => Promise<FileSystemFileHandle> }).showSaveFilePicker!({
            suggestedName: suggestedFileName,
            types: [{
              description: 'Vidéo MP4',
              accept: { 'video/mp4': ['.mp4'] }
            }]
          });
          useFilePicker = true;
        } catch (err) {
          const error = err as Error;
          if (error.name === 'AbortError') {
            setIsExporting(false);
            return; // User cancelled the path selection dialog
          }
          console.warn("showSaveFilePicker unsupported or declined, falling back to download link:", err);
        }
      }

      if (typeof VideoEncoder === 'undefined') {
        throw new Error("L'API WebCodecs (VideoEncoder) n'est pas supportée par votre navigateur.");
      }

      const { width, height } = RESOLUTION_SIZES[settings.resolution];
      const fps = 30;
      const totalFrames = Math.ceil(project.duration * fps);
      
      // 2. Configure Codecs & Fallbacks
      let selectedCodec: CodecOption = settings.codec;
      let codecString = selectedCodec === 'x265' ? 'hvc1.1.6.L93.B0' : 'avc1.4d002a';
      
      const config: VideoEncoderConfig = {
        codec: codecString,
        width,
        height,
        bitrate: settings.bitrate * 1000, // kbps to bps
        framerate: fps,
        latencyMode: 'quality',
      };

      const support = await VideoEncoder.isConfigSupported(config);
      if (!support.supported) {
        if (selectedCodec === 'x265') {
          selectedCodec = 'x264';
          codecString = 'avc1.4d002a';
          config.codec = codecString;
          config.bitrate = DEFAULT_BITRATES.x264[settings.resolution] * 1000;
          
          const fallbackSupport = await VideoEncoder.isConfigSupported(config);
          if (!fallbackSupport.supported) {
            throw new Error("Le format vidéo H.264 n'est pas supporté par votre navigateur.");
          }
          alert("Le codec H.265 n'est pas supporté par votre système. Repli automatique sur le codec H.264 (x264).");
        } else {
          throw new Error("La configuration d'encodage vidéo n'est pas supportée par votre navigateur.");
        }
      }

      // 3. Load background image if URL exists
      let bgImage: HTMLImageElement | null = null;
      if (project.backgroundSettings.fileUrl) {
        bgImage = await loadBgImage(project.backgroundSettings.fileUrl);
      }
      // 4. Setup Muxer and Encoder
      let fastStartOption: 'in-memory' | false = 'in-memory';

      if (useFilePicker && fileHandle) {
        writableStream = await fileHandle.createWritable();
        muxerTarget = new FileSystemWritableFileStreamTarget(writableStream);
        fastStartOption = false; // Streams directly to disk, using minimal RAM
      } else {
        muxerTarget = new ArrayBufferTarget();
        fastStartOption = 'in-memory';
      }

      const muxer = new Muxer({
        target: muxerTarget,
        video: {
          codec: selectedCodec === 'x265' ? 'hevc' : 'avc',
          width,
          height,
        },
        fastStart: fastStartOption,
      });

      encoder = new VideoEncoder({
        output: (chunk, metadata) => {
          muxer.addVideoChunk(chunk, metadata);
        },
        error: (e) => {
          console.error("VideoEncoder error:", e);
          setExportError(`Erreur d'encodage : ${e.message}`);
        },
      });

      encoder.configure(config);

      // 5. Create virtual canvas
      const offlineCanvas = document.createElement('canvas');
      offlineCanvas.width = width;
      offlineCanvas.height = height;
      const ctx = offlineCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error("Impossible d'obtenir le contexte 2D.");

      // Calculate centering Zoom and Pan for the stage fitting 16:9 aspect ratio
      const stageW = project.stageWidth * 100;
      const stageH = project.stageHeight * 100;
      const virtualW = stageW + wingsPadding * 2;
      const virtualH = stageH + wingsPadding * 2;

      const videoAspect = width / height;
      const stageAspect = virtualW / virtualH;

      let zoom = 1;
      let pan = { x: 0, y: 0 };

      if (stageAspect > videoAspect) {
        zoom = width / virtualW;
        const paddingY = (height - virtualH * zoom) / 2;
        pan = { x: 0, y: paddingY / zoom };
      } else {
        zoom = height / virtualH;
        const paddingX = (width - virtualW * zoom) / 2;
        pan = { x: paddingX / zoom, y: 0 };
      }

      // Prepare overrides list
      const renderedArtists: Artist[] = project.artists.map(artist => {
        let effectiveVisibility: ArtistVisibility = settings.castingOverrides[artist.id] || 'normal';

        let hasFaibleGroup = false;
        let hasMasqueGroup = false;

        artist.groupIds.forEach(groupId => {
          let currentId: string | undefined = groupId;
          while (currentId) {
            const gOverride = settings.groupOverrides[currentId] || 'normal';
            if (gOverride === 'masque') {
              hasMasqueGroup = true;
            } else if (gOverride === 'faible') {
              hasFaibleGroup = true;
            }
            const g = project.groups.find(group => group.id === currentId);
            currentId = g?.parentId;
          }
        });

        if (effectiveVisibility === 'masque' || hasMasqueGroup) {
          effectiveVisibility = 'masque';
        } else if (effectiveVisibility === 'faible' || hasFaibleGroup) {
          effectiveVisibility = 'faible';
        }

        const pathOverride = settings.castingPathOverrides[artist.id] !== undefined
          ? settings.castingPathOverrides[artist.id]
          : (artist.showPath !== false);
        return {
          ...artist,
          visible: effectiveVisibility !== 'masque',
          opacity: effectiveVisibility === 'faible' ? 0.2 : 1.0,
          showPath: pathOverride
        };
      });

      const renderedGroups = project.groups.map(g => {
        const groupPathOverride = settings.groupPathOverrides[g.id] !== undefined
          ? settings.groupPathOverrides[g.id]
          : (g.showPath !== false);
        return {
          ...g,
          showPath: groupPathOverride
        };
      });

      const displayedArtistsNames = renderedArtists
        .filter(a => a.visible)
        .map(a => a.name);

      const projectForRendering = {
        ...project,
        groups: renderedGroups,
        settings: {
          ...project.settings,
          showGrid: settings.overlays.showScale,
          showMovementPaths: settings.showMovementPaths,
        },
      };

      // 6. Pre-calculate layout of the metadata overlay (Optimization!)
      const overlayLayout = calculateOverlayLayout(
        ctx,
        height,
        project.name,
        project.directorName,
        displayedArtistsNames,
        settings
      );

      // 7. Render Loop
      for (let i = 0; i < totalFrames; i++) {
        if (cancelRef.current) {
          throw new Error("EXPORT_CANCELLED");
        }

        const t = i / fps;

        // Draw Stage Background and Performers
        drawStage({
          ctx,
          canvasWidth: width,
          canvasHeight: height,
          resolutionScale: 1,
          project: projectForRendering,
          artists: renderedArtists,
          activeArtistId: null,
          currentTime: t,
          zoom,
          pan,
          bgImage,
          isDrawingMode: false,
          isDrawingFreehand: false,
          freehandPoints: [],
          isRecordingMode: false,
          recordedPoints: [],
          isRecordingInProgress: false,
          recordingCurrentPos: null,
          hoverInfo: null,
          isPlaying: true,
        });

        // Draw pre-calculated Overlay Card (Optimized!)
        if (overlayLayout) {
          drawPrecalculatedOverlay(ctx, height, overlayLayout, settings.overlayOpacity);
        }

        // Convert frame
        const frameTimestampUs = Math.round(t * 1000000);
        const frame = new VideoFrame(offlineCanvas, { timestamp: frameTimestampUs });
        const insertKeyframe = i % (fps * 2) === 0;
        
        encoder.encode(frame, { keyFrame: insertKeyframe });
        frame.close();

        setProgress(Math.round((i / totalFrames) * 100));

        // Yield execution optimization: only yield to event loop when encoder queue is full,
        // or periodically (every 15 frames) to update the UI progress bar.
        if (encoder.encodeQueueSize > 10) {
          await new Promise(resolve => setTimeout(resolve, 8));
        } else if (i % 15 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // 8. Finalize Video
      await encoder.flush();
      muxer.finalize();
      
      exportSuccessful = true;
      setProgress(100);
      setIsExporting(false);

    } catch (err) {
      const error = err as Error;
      if (error.message === "EXPORT_CANCELLED") {
        console.log("Exportation annulée par l'utilisateur.");
        setIsExporting(false);
      } else {
        console.error("Export failed:", err);
        setExportError(error.message || "Une erreur est survenue lors de l'export.");
        setIsExporting(false);
      }
    } finally {
      if (encoder && encoder.state !== 'closed') {
        try {
          encoder.close();
        } catch (e) {
          console.error("Error closing encoder:", e);
        }
      }
      if (useFilePicker && writableStream) {
        try {
          if (exportSuccessful && !cancelRef.current) {
            await writableStream.close();
          } else {
            await writableStream.abort();
          }
        } catch (e) {
          console.error("Error closing/aborting writableStream:", e);
        }
      } else if (!useFilePicker && exportSuccessful && !cancelRef.current) {
        // Fallback for standard download
        try {
          const { buffer } = muxerTarget as ArrayBufferTarget;
          const blob = new Blob([buffer], { type: 'video/mp4' });
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = suggestedFileName;
          a.click();
          URL.revokeObjectURL(downloadUrl);
        } catch (e) {
          console.error("Error generating fallback download:", e);
        }
      }
    }
  };

  const handleCancelExport = () => {
    cancelRef.current = true;
  };

  return {
    settings,
    setSettings,
    isExporting,
    progress,
    exportError,
    startExport: handleStartExport,
    cancelExport: handleCancelExport,
  };
}

// Optimization: Pre-calculate layout parameters once before rendering loop
function calculateOverlayLayout(
  ctx: CanvasRenderingContext2D,
  height: number,
  projectName: string,
  directorName: string | undefined,
  displayedArtistNames: string[],
  exportSettings: ExportSettings
): PrecalculatedLayout | null {
  const scale = height / 1080;
  const margin = 30 * scale;
  const padding = 20 * scale;
  const cardWidth = 480 * scale;
  
  const lines: { type: 'title' | 'subtitle' | 'body' | 'separator'; text: string }[] = [];
  
  if (exportSettings.overlays.showName) {
    lines.push({ type: 'title', text: projectName });
  }
  if (exportSettings.overlays.showDirector && directorName) {
    lines.push({ type: 'subtitle', text: `Mise en scène : ${directorName}` });
  }
  
  const hasHeader = exportSettings.overlays.showName || (exportSettings.overlays.showDirector && directorName);
  const hasBody = exportSettings.overlays.showExportTime || exportSettings.overlays.showCasting || (exportSettings.overlays.showCustomNote && exportSettings.customNote.trim());
  
  if (hasHeader && hasBody) {
    lines.push({ type: 'separator', text: '' });
  }
  
  if (exportSettings.overlays.showExportTime) {
    const nowStr = new Date().toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    lines.push({ type: 'body', text: `Exporté le : ${nowStr}` });
  }
  
  if (exportSettings.overlays.showCasting && displayedArtistNames.length > 0) {
    lines.push({ type: 'body', text: `Distribution : ${displayedArtistNames.join(', ')}` });
  }
  
  if (exportSettings.overlays.showCustomNote && exportSettings.customNote.trim()) {
    lines.push({ type: 'body', text: `Note : ${exportSettings.customNote.trim()}` });
  }
  
  if (lines.length === 0) return null;
  
  ctx.save();
  
  const titleFont = `bold ${Math.round(22 * scale)}px Outfit, sans-serif`;
  const subtitleFont = `italic ${Math.round(15 * scale)}px Outfit, sans-serif`;
  const bodyFont = `${Math.round(13 * scale)}px Outfit, sans-serif`;
  
  const linesWithHeights = lines.map(line => {
    let font = bodyFont;
    let heightOffset = 20 * scale;
    if (line.type === 'title') {
      font = titleFont;
      heightOffset = 28 * scale;
    } else if (line.type === 'subtitle') {
      font = subtitleFont;
      heightOffset = 22 * scale;
    } else if (line.type === 'separator') {
      heightOffset = 15 * scale;
    }
    
    ctx.font = font;
    const maxTextW = cardWidth - padding * 2;
    const words = line.text.split(' ');
    let linesArr: string[] = [];
    let currentLine = '';
    
    if (line.type === 'separator') {
      linesArr = [''];
    } else {
      for (let w = 0; w < words.length; w++) {
        const testLine = currentLine ? currentLine + ' ' + words[w] : words[w];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTextW && w > 0) {
          linesArr.push(currentLine);
          currentLine = words[w];
        } else {
          currentLine = testLine;
        }
      }
      linesArr.push(currentLine);
    }
    
    const totalLineHeight = linesArr.length * heightOffset;
    return { 
      type: line.type,
      wrappedLines: linesArr,
      font,
      heightOffset,
      height: totalLineHeight
    };
  });
  
  const cardHeight = linesWithHeights.reduce((acc, curr) => acc + curr.height, 0) + padding * 2;
  ctx.restore();

  return {
    scale,
    margin,
    padding,
    cardWidth,
    cardHeight,
    lines: linesWithHeights
  };
}

// Paint pre-calculated overlay on the canvas context for a frame
function drawPrecalculatedOverlay(
  ctx: CanvasRenderingContext2D,
  height: number,
  layout: PrecalculatedLayout,
  overlayOpacity: number
) {
  const { scale, margin, padding, cardWidth, cardHeight, lines } = layout;
  
  const cardX = margin;
  const cardY = height - margin - cardHeight;
  
  ctx.save();
  
  // Card background
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 12 * scale);
  } else {
    ctx.rect(cardX, cardY, cardWidth, cardHeight);
  }
  ctx.fillStyle = `rgba(15, 23, 42, ${overlayOpacity})`;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();
  
  // Draw pre-wrapped text lines
  let yTracker = cardY + padding;
  lines.forEach(line => {
    if (line.type === 'separator') {
      ctx.beginPath();
      ctx.moveTo(cardX + padding, yTracker + 6 * scale);
      ctx.lineTo(cardX + cardWidth - padding, yTracker + 6 * scale);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
      yTracker += line.height;
    } else {
      ctx.fillStyle = line.type === 'title' ? '#ffffff' : (line.type === 'subtitle' ? '#a5b4fc' : '#e2e8f0');
      ctx.font = line.font;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      line.wrappedLines.forEach((wLine, idx) => {
        ctx.fillText(wLine, cardX + padding, yTracker + idx * line.heightOffset);
      });
      yTracker += line.height;
    }
  });
  
  ctx.restore();
}
