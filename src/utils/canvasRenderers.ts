import { Artist, Point, Project } from '../types';
import { getArtistPositionAtTime, generateCurveLUT } from './math';


export const wingsPadding = 40; // 0.4 meters of wings all around

const getContrastColor = (hexcolor: string) => {
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
};

export function getArtistInitials(name: string): string {
  const parts = name.split(/[\s\-_]+/);
  const initials = parts.map(n => n[0] || '').join('').toUpperCase();
  return initials.substring(0, 3);
}

interface DrawStageParams {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  resolutionScale: number;
  project: Project;
  artists: Artist[];
  activeArtistId: string | null;
  currentTime: number;
  zoom: number;
  pan: Point;
  bgImage: HTMLImageElement | null;
  vectorPoints: Point[];
  vectorTransitionType: 'linear' | 'curved';
  previewCursorPos: Point | null;
  isDrawingMode: boolean;
  drawModeType: 'freehand' | 'vector';
  isDrawingFreehand: boolean;
  freehandPoints: Point[];
  isRecordingMode: boolean;
  recordedPoints: { x: number; y: number; t: number }[];
  isRecordingInProgress: boolean;
  recordingCurrentPos: Point | null;
  hoverInfo: { movId: string; pointIdx: number } | null;
  isPlaying: boolean;
}

export function drawStage({
  ctx,
  canvasWidth,
  canvasHeight,
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
  freehandPoints,
  isRecordingMode,
  recordedPoints,
  isRecordingInProgress,
  recordingCurrentPos,
  hoverInfo,
  isPlaying
}: DrawStageParams) {
  const stageW = project.stageWidth * 100;
  const stageH = project.stageHeight * 100;
  const highlightOpacity = project.settings?.highlightOpacity !== undefined ? project.settings.highlightOpacity : 0.5;

  // 1. Clear Canvas (always un-transformed to clear full view)
  ctx.fillStyle = '#030406'; // wings/coulisses backdrop (darker)
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Save untransformed state
  ctx.save();

  // Apply resolution scaling first
  ctx.scale(resolutionScale, resolutionScale);
  
  // Apply translation and scaling for Zoom and Pan
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  // Draw stage background floor
  ctx.fillStyle = '#0c1017'; // stage floor (slate-dark)
  ctx.fillRect(wingsPadding, wingsPadding, stageW, stageH);

  // Draw stage boundary border
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)'; // indigo border for stage
  ctx.lineWidth = 2.5;
  ctx.strokeRect(wingsPadding, wingsPadding, stageW, stageH);

  // Translate context by wingsPadding to draw everything else in the stage coordinate system
  ctx.save();
  ctx.translate(wingsPadding, wingsPadding);

  // 2. Draw Background Image (underlay)
  if (bgImage) {
    ctx.save();
    ctx.globalAlpha = project.backgroundSettings.opacity;
    const scale = project.backgroundSettings.scale;
    const stageCenterX = stageW / 2;
    const stageCenterY = stageH / 2;
    const x = stageCenterX + project.backgroundSettings.offsetX;
    const y = stageCenterY + project.backgroundSettings.offsetY;
    const w = stageW * scale;
    const h = stageH * scale;
    ctx.drawImage(bgImage, x - w / 2, y - h / 2, w, h);
    ctx.restore();
  }

  // 3. Draw Stage Grid (100px = 1m on our Canvas)
  const showGrid = project.settings?.showGrid !== false;
  const gridSpacing = project.settings?.gridSpacing || 1.0;
  const pxPerMeter = 100;
  const step = gridSpacing * pxPerMeter;

  if (showGrid && step > 0) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let x = 0; x <= stageW; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, stageH);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = 0; y <= stageH; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(stageW, y);
      ctx.stroke();
    }
  }

  // Draw Center Axes (Scène Center-Line et Ligne de charge)
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)'; // Faint Indigo
  ctx.lineWidth = 2;
  
  // Center vertical axis (Ligne médiane)
  ctx.beginPath();
  ctx.moveTo(stageW / 2, 0);
  ctx.lineTo(stageW / 2, stageH);
  ctx.stroke();

  // Center horizontal axis (Ligne de charge)
  ctx.beginPath();
  ctx.moveTo(0, stageH / 2);
  ctx.lineTo(stageW, stageH / 2);
  ctx.stroke();

  const cs = !!project.settings?.constantScale;

  // Grid labels (meters relative to center)
  if (showGrid && project.settings?.showGraduations === true) {
    const csMeters = !!project.settings?.constantScaleMeters;
    const labelScale = csMeters
      ? 10 * (1 / zoom) * (project.settings?.constantScaleMetersSize ?? 1.0)
      : 5 * (project.settings?.constantScaleMetersSize ?? 1.0);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px Outfit';
    ctx.textBaseline = 'middle';
    
    const stepMeters = 5;

    // X labels (from center)
    ctx.textAlign = 'center';
    const halfWidthMeters = (stageW / 2) / pxPerMeter;
    const startMeterX = Math.ceil(-halfWidthMeters / stepMeters) * stepMeters;
    for (let meterVal = startMeterX; meterVal <= halfWidthMeters; meterVal += stepMeters) {
      const roundedVal = Math.round(meterVal);
      if (roundedVal !== 0) {
        const x = stageW / 2 + roundedVal * pxPerMeter;
        if (x > 0 && x < stageW) {
          ctx.save();
          ctx.translate(x, 20 * labelScale);
          ctx.scale(labelScale, labelScale);
          ctx.fillText(`${roundedVal}m`, 0, 0);
          ctx.restore();

          ctx.save();
          ctx.translate(x, stageH - 20 * labelScale);
          ctx.scale(labelScale, labelScale);
          ctx.fillText(`${roundedVal}m`, 0, 0);
          ctx.restore();
        }
      }
    }

    // Y labels
    const halfHeightMeters = (stageH / 2) / pxPerMeter;
    const startMeterY = Math.ceil(-halfHeightMeters / stepMeters) * stepMeters;
    for (let meterVal = startMeterY; meterVal <= halfHeightMeters; meterVal += stepMeters) {
      const roundedVal = Math.round(meterVal);
      if (roundedVal !== 0) {
        const y = stageH / 2 - roundedVal * pxPerMeter; // Y goes up physically
        if (y > 0 && y < stageH) {
          ctx.save();
          ctx.translate(15 * labelScale, y);
          ctx.scale(labelScale, labelScale);
          ctx.textAlign = 'left';
          ctx.fillText(`${roundedVal}m`, 0, 0);
          ctx.restore();

          ctx.save();
          ctx.translate(stageW - 15 * labelScale, y);
          ctx.scale(labelScale, labelScale);
          ctx.textAlign = 'right';
          ctx.fillText(`${roundedVal}m`, 0, 0);
          ctx.restore();
        }
      }
    }
    ctx.textAlign = 'center';
  }

  // 4. Draw Trajectories (Paths) for ALL visible artists
  const hasHighlighted = artists.some(a => a.visible && a.highlighted);

  artists.forEach(artist => {
    if (!artist.visible) return;

    ctx.save();
    const isTargetVisible = artist.highlighted || artist.id === activeArtistId;
    if (hasHighlighted && !isTargetVisible) {
      ctx.globalAlpha = highlightOpacity;
    }
    if (artist.opacity !== undefined) {
      ctx.globalAlpha = ctx.globalAlpha * artist.opacity;
    }

    const isSelected = artist.id === activeArtistId;
    const showPathsGlobal = project.settings?.showMovementPaths !== false;
    const showArtistPath = artist.showPath !== false;

    // Check if any of the groups the artist belongs to has showPath === false (checking up parent groups recursively)
    const hasNoGroups = artist.groupIds.length === 0;
    const isAnyGroupPathVisible = hasNoGroups || artist.groupIds.some(groupId => {
      let currentId: string | undefined = groupId;
      while (currentId) {
        const g = project.groups.find(group => group.id === currentId);
        if (!g) return false;
        if (g.showPath === false) return false;
        currentId = g.parentId;
      }
      return true;
    });

    const shouldDrawPath = (showPathsGlobal && showArtistPath && isAnyGroupPathVisible) || isSelected;

    if (shouldDrawPath) {
      artist.movements.forEach(movement => {
        if (movement.lut.length < 2) return;

        // Draw the smooth path curve
        ctx.beginPath();
        ctx.moveTo(movement.lut[0].x, movement.lut[0].y);
        for (let k = 1; k < movement.lut.length; k++) {
          ctx.lineTo(movement.lut[k].x, movement.lut[k].y);
        }

        if (isSelected) {
          ctx.strokeStyle = artist.color;
          ctx.lineWidth = 4;
          ctx.shadowBlur = 8;
          ctx.shadowColor = artist.color;
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow

        // Draw arrows along path direction (only for selected artist)
        if (isSelected && movement.lut.length > 5) {
          ctx.fillStyle = artist.color;
          const midIndex = Math.floor(movement.lut.length * 0.5);
          const pCurrent = movement.lut[midIndex];
          const pNext = movement.lut[midIndex + 1] || pCurrent;
          const angle = Math.atan2(pNext.y - pCurrent.y, pNext.x - pCurrent.x);

          ctx.save();
          ctx.translate(pCurrent.x, pCurrent.y);
          ctx.rotate(angle);

          ctx.beginPath();
          ctx.moveTo(-6, -4);
          ctx.lineTo(6, 0);
          ctx.lineTo(-6, 4);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }

        // Draw handles for all control points of this movement (only for active selected artist)
        if (isSelected && movement.points.length >= 2) {
          // Draw support dotted lines for curves connecting control polygon
          if (movement.transitionType === 'curved' && movement.points.length >= 3) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(movement.points[0].x, movement.points[0].y);
            for (let pIdx = 1; pIdx < movement.points.length; pIdx++) {
              ctx.lineTo(movement.points[pIdx].x, movement.points[pIdx].y);
            }
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.restore();
          }

          // Draw handles
          movement.points.forEach((pt, idx) => {
            const isStart = idx === 0;
            const isEnd = idx === movement.points.length - 1;
            const ptTime = movement.startTime + (idx / (movement.points.length - 1)) * (movement.endTime - movement.startTime);

            const isHovered = hoverInfo && hoverInfo.movId === movement.id && hoverInfo.pointIdx === idx;

            ctx.beginPath();
            const radius = isHovered ? 7.5 : 5.5;
            ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);

            if (isStart || isEnd) {
              ctx.fillStyle = artist.color;
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
            } else {
              ctx.fillStyle = '#6366f1'; // Indigo control points
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5;
            }

            ctx.save();
            if (isHovered) {
              ctx.shadowColor = isStart || isEnd ? artist.color : '#6366f1';
              ctx.shadowBlur = 10;
            } else {
              ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
              ctx.shadowBlur = 4;
            }
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            if (project.settings?.showMovementPointLabels !== false) {
              const xMeters = (pt.x - stageW / 2) / 100;
              const yMeters = (stageH / 2 - pt.y) / 100;

              if (isStart || isEnd) {
                const label = `${isStart ? 'Début' : 'Fin'} : ${ptTime.toFixed(1)}s (X: ${xMeters.toFixed(1)}m, Y: ${yMeters.toFixed(1)}m)`;
                ctx.font = 'bold 9px Outfit';
                const textWidth = ctx.measureText(label).width;
                
                const tagX = pt.x - textWidth / 2 - 6;
                const tagY = pt.y - radius - 22;
                const tagW = textWidth + 12;
                const tagH = 16;
                
                ctx.fillStyle = 'rgba(7, 8, 10, 0.85)';
                ctx.strokeStyle = isStart ? '#10b981' : '#ef4444'; // green border for start, red for end
                ctx.lineWidth = 1;
                
                ctx.save();
                ctx.beginPath();
                if (ctx.roundRect) {
                  ctx.roundRect(tagX, tagY, tagW, tagH, 4);
                } else {
                  ctx.rect(tagX, tagY, tagW, tagH);
                }
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                
                ctx.fillStyle = '#f8fafc';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, pt.x, tagY + tagH / 2 + 1);
              } else {
                // Draw a tiny tag with timecode for intermediate control points
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = 'bold 9px Outfit';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(`${ptTime.toFixed(1)}s`, pt.x, pt.y - radius - 3);
              }
            }
          });
        }
      });
    }
    ctx.restore();
  });

  // 4b. Draw Active Vector Drawing Path
  if (isDrawingMode && drawModeType === 'vector' && vectorPoints.length > 0) {
    ctx.save();
    
    // Draw preview line to cursor
    if (previewCursorPos) {
      ctx.beginPath();
      ctx.moveTo(vectorPoints[vectorPoints.length - 1].x, vectorPoints[vectorPoints.length - 1].y);
      ctx.lineTo(previewCursorPos.x, previewCursorPos.y);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
    }
    
    // Draw straight vector connections
    ctx.beginPath();
    ctx.moveTo(vectorPoints[0].x, vectorPoints[0].y);
    for (let i = 1; i < vectorPoints.length; i++) {
      ctx.lineTo(vectorPoints[i].x, vectorPoints[i].y);
    }
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw smooth curve preview if curved
    if (vectorTransitionType === 'curved' && vectorPoints.length >= 3) {
      try {
        const lut = generateCurveLUT(vectorPoints);
        if (lut.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(lut[0].x, lut[0].y);
          for (let i = 1; i < lut.length; i++) {
            ctx.lineTo(lut[i].x, lut[i].y);
          }
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      } catch (e) {
        // Fallback to straight lines
      }
    }

    // Draw circles for all placed points
    vectorPoints.forEach((pt, idx) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      
      // Display index
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 10px Outfit';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${idx + 1}`, pt.x, pt.y - 8);
    });

    ctx.restore();
  }

  // 4c. Draw Active Freehand Trail
  if (isDrawingMode && drawModeType === 'freehand' && isDrawingFreehand && freehandPoints.length > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(freehandPoints[0].x, freehandPoints[0].y);
    for (let i = 1; i < freehandPoints.length; i++) {
      ctx.lineTo(freehandPoints[i].x, freehandPoints[i].y);
    }
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3.5;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#6366f1';
    ctx.stroke();
    ctx.restore();
  }

  // 4d. Draw Recording Trail
  if (isRecordingMode && recordedPoints.length > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(recordedPoints[0].x, recordedPoints[0].y);
    for (let i = 1; i < recordedPoints.length; i++) {
      ctx.lineTo(recordedPoints[i].x, recordedPoints[i].y);
    }
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.restore();
  }

  // 5. Draw Artists Tokens
  artists.forEach(artist => {
    if (!artist.visible) return;

    let pos = getArtistPositionAtTime(artist, currentTime, project.stageWidth, project.stageHeight);
    if (isRecordingMode && isRecordingInProgress && artist.id === activeArtistId && recordingCurrentPos) {
      pos = recordingCurrentPos;
    }
    const isSelected = artist.id === activeArtistId;
    const tokenScale = cs
      ? 10 * (1 / zoom) * (project.settings?.constantScaleArtistSize ?? 1.0)
      : 5 * (project.settings?.constantScaleArtistSize ?? 1.0);

    ctx.save();
    const isTargetVisible = artist.highlighted || artist.id === activeArtistId;
    if (hasHighlighted && !isTargetVisible) {
      ctx.globalAlpha = highlightOpacity;
    }
    if (artist.opacity !== undefined) {
      ctx.globalAlpha = ctx.globalAlpha * artist.opacity;
    }

    // Draw selection highlight aura
    if (isSelected) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.scale(tokenScale, tokenScale);
      ctx.beginPath();
      ctx.arc(0, 0, 24.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = artist.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fill();
      
      if (!isPlaying) {
        const pulse = 24.5 + Math.sin(Date.now() / 150) * 2.8;
        ctx.beginPath();
        ctx.arc(0, 0, pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `${artist.color}33`; // 20% opacity hex
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw token at performer position with optional constant scale
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.scale(tokenScale, tokenScale);

    if (artist.icon) {
      const showIconBg = project.settings?.showIconBackground === true;
      if (showIconBg) {
        // Draw a glassmorphic circular token with the performer's color border
        ctx.beginPath();
        ctx.arc(0, 0, 17.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(7, 8, 10, 0.8)';
        ctx.strokeStyle = artist.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }

      // Draw the emoji icon
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(artist.icon, 0, 0);
    } else {
      const showInitialsBg = project.settings?.showInitialsBackground !== false;
      const initials = getArtistInitials(artist.name);
      let initialsFontSize = 16;
      if (initials.length === 2) {
        initialsFontSize = 12;
      } else if (initials.length >= 3) {
        initialsFontSize = 9;
      }

      if (showInitialsBg) {
        // Draw Performer circle
        ctx.beginPath();
        ctx.arc(0, 0, 17.5, 0, Math.PI * 2);
        ctx.fillStyle = artist.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Draw performer label/number inside token
        ctx.fillStyle = getContrastColor(artist.color);
        ctx.font = `bold ${initialsFontSize}px Outfit`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, 0, 0);
      } else {
        // Draw Performer circle outline only (no fill)
        ctx.beginPath();
        ctx.arc(0, 0, 17.5, 0, Math.PI * 2);
        ctx.strokeStyle = artist.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Draw performer initials in performer's color
        ctx.fillStyle = artist.color;
        ctx.font = `bold ${initialsFontSize}px Outfit`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, 0, 0);
      }
    }

    // Draw name label floating below
    if (project.settings?.showArtistNames !== false) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Outfit';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(artist.name, 0, 27);

      if (isSelected && project.settings?.showArtistPositions === true) {
        const liveX = (pos.x - stageW / 2) / 100;
        const liveY = (stageH / 2 - pos.y) / 100;
        ctx.fillStyle = '#a5b4fc';
        ctx.font = 'bold 12px Outfit';
        ctx.fillText(`X: ${liveX.toFixed(2)}m, Y: ${liveY.toFixed(2)}m`, 0, 45);
      }
    } else if (isSelected && project.settings?.showArtistPositions === true) {
      const liveX = (pos.x - stageW / 2) / 100;
      const liveY = (stageH / 2 - pos.y) / 100;
      ctx.fillStyle = '#a5b4fc';
      ctx.font = 'bold 12px Outfit';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`X: ${liveX.toFixed(2)}m, Y: ${liveY.toFixed(2)}m`, 0, 27);
    }

    ctx.restore(); // token scale restore

    ctx.restore(); // globalAlpha restore
  });

  // Restore stage offset context
  ctx.restore();

  // Restore untransformed context
  ctx.restore();
}
