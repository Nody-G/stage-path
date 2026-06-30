import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Copy, ClipboardPaste } from 'lucide-react';
import { Project, Artist, Point } from '../../types';

interface KeypointsManagerPanelProps {
  project: Project;
  activeArtist: Artist;
  activeMovementId: string | null;
  onSelectMovement: (id: string | null) => void;
  currentTime: number;
  onCreateKeypointAtCurrentTime: (artistId: string) => void;
  onDeleteKeypoint: (artistId: string, keypointId: string) => void;
  onUpdateKeypointTime: (artistId: string, keypointId: string, newTime: number) => void;
  onUpdateKeypointPosition: (artistId: string, keypointId: string, position: Point) => void;
  onTimelineScrub: (time: number) => void;
}

export const KeypointsManagerPanel: React.FC<KeypointsManagerPanelProps> = ({
  project,
  activeArtist,
  activeMovementId,
  onSelectMovement,
  currentTime,
  onCreateKeypointAtCurrentTime,
  onDeleteKeypoint,
  onUpdateKeypointTime,
  onUpdateKeypointPosition,
  onTimelineScrub,
}) => {
  // Copy/Paste position clipboard
  const [copiedPosition, setCopiedPosition] = useState<{ x: number; y: number } | null>(null);

  const [showMiniPaths, setShowMiniPaths] = useState<boolean>(() => {
    const saved = localStorage.getItem('stagepath_show_mini_paths');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('stagepath_show_mini_paths', showMiniPaths.toString());
  }, [showMiniPaths]);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => onCreateKeypointAtCurrentTime(activeArtist.id)}
        className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
        style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
      >
        <Plus size={14} /> Poser un Jalon à {currentTime.toFixed(2)}s
      </button>

      <div className="flex items-center justify-between mt-2 border-b border-white/5 pb-1.5">
        <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <span>Jalons de positionnement</span>
          <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-slate-400 font-mono font-bold">
            {
              (() => {
                let count = 1;
                const sorted = [...activeArtist.movements].sort((a, b) => a.startTime - b.startTime);
                sorted.forEach((mov, idx) => {
                  const prev = sorted[idx - 1];
                  const isGap = prev ? (mov.startTime > prev.endTime) : (mov.startTime > 0);
                  if (isGap) count++;
                  count++;
                });
                return count;
              })()
            }
          </span>
        </h3>
        <label className="flex items-center gap-1 text-[10px] text-slate-450 hover:text-slate-200 cursor-pointer select-none font-bold">
          <input 
            type="checkbox" 
            checked={showMiniPaths} 
            onChange={() => setShowMiniPaths(!showMiniPaths)}
            className="rounded border-white/10 bg-black/45 text-indigo-650 focus:ring-indigo-500 accent-indigo-500"
          />
          Miniatures
        </label>
      </div>

      <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
        {(() => {
          const wPx = project.stageWidth * 100;
          const hPx = project.stageHeight * 100;
          const list: {
            id: string;
            time: number;
            x: number;
            y: number;
            isStart: boolean;
            movId?: string;
            transitionType?: 'linear' | 'curved';
          }[] = [];
          
          const sorted = [...activeArtist.movements].sort((a, b) => a.startTime - b.startTime);
          const hasMovementAtZero = sorted.length > 0 && sorted[0].startTime === 0;

          if (!hasMovementAtZero) {
            list.push({
              id: 'initial',
              time: 0,
              x: (activeArtist.initialPosition.x - wPx / 2) / 100,
              y: (hPx / 2 - activeArtist.initialPosition.y) / 100,
              isStart: true
            });
          }
          
          sorted.forEach((mov, idx) => {
            const prev = sorted[idx - 1];
            const isGap = prev ? (mov.startTime > prev.endTime) : (mov.startTime > 0);
            const isFirstAndStartsAtZero = idx === 0 && mov.startTime === 0;
            
            if (isGap || isFirstAndStartsAtZero) {
              list.push({
                id: mov.id + '_start',
                time: mov.startTime,
                x: (mov.points[0].x - wPx / 2) / 100,
                y: (hPx / 2 - mov.points[0].y) / 100,
                isStart: true,
                movId: mov.id
              });
            }
            
            list.push({
              id: mov.id + '_end',
              time: mov.endTime,
              x: (mov.points[mov.points.length - 1].x - wPx / 2) / 100,
              y: (hPx / 2 - mov.points[mov.points.length - 1].y) / 100,
              isStart: false,
              movId: mov.id,
              transitionType: mov.transitionType || 'linear'
            });
          });

          list.sort((a, b) => a.time - b.time);

          return list.map((kp) => {
            const isInitial = kp.id === 'initial';
            const isSelected = kp.movId && kp.movId === activeMovementId;
            
            return (
              <div 
                key={kp.id} 
                onClick={() => kp.movId && onSelectMovement(kp.movId)}
                className={`flex items-center gap-1.5 p-1.5 rounded-md border text-xs hover:border-slate-800 hover:bg-slate-900/30 transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_8px_rgba(99,102,241,0.15)] z-10' 
                    : 'bg-slate-900/20 border-white/5'
                }`}
                style={{ borderLeftWidth: '3px', borderLeftColor: isInitial ? '#64748b' : kp.isStart ? '#10b981' : '#6366f1' }}
              >
                {/* Inputs Row */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {/* Playhead jump / Time icon */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTimelineScrub(kp.time);
                      if (kp.movId) onSelectMovement(kp.movId);
                    }}
                    className="font-mono text-slate-400 hover:text-indigo-400 transition text-[10px] shrink-0"
                    title="Positionner la tête de lecture"
                  >
                    ⏱️
                  </button>

                  {/* Temps (s) */}
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="text-[10px] text-slate-500 font-bold">T</span>
                    <input 
                      type="number"
                      min="0"
                      step="0.1"
                      max={project.duration}
                      disabled={isInitial}
                      value={kp.time}
                      onChange={(e) => onUpdateKeypointTime(activeArtist.id, kp.id, parseFloat(e.target.value) || 0)}
                      onClick={(e) => e.stopPropagation()}
                      className="glass-input w-full py-0.5 px-1 text-[10px] font-mono text-center disabled:opacity-45 bg-[#050608]/40 border-white/5 focus:border-indigo-500/50 h-6"
                      title="Temps (s)"
                    />
                  </div>

                  {/* X (m) */}
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="text-[10px] text-slate-500 font-bold">X</span>
                    <input 
                      type="number"
                      step="0.05"
                      value={parseFloat(kp.x.toFixed(2))}
                      onChange={(e) => {
                        const valM = parseFloat(e.target.value) || 0;
                        const valPx = valM * 100 + wPx / 2;
                        const currentYPx = kp.isStart 
                          ? (kp.movId ? (activeArtist.movements.find(m => m.id === kp.movId)?.points[0].y || activeArtist.initialPosition.y) : activeArtist.initialPosition.y)
                          : (kp.movId ? (activeArtist.movements.find(m => m.id === kp.movId)?.points[activeArtist.movements.find(m => m.id === kp.movId)!.points.length - 1].y || activeArtist.initialPosition.y) : activeArtist.initialPosition.y);
                        onUpdateKeypointPosition(activeArtist.id, kp.id, { x: valPx, y: currentYPx });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="glass-input w-full py-0.5 px-1 text-[10px] font-mono text-center bg-[#050608]/40 border-white/5 focus:border-indigo-500/50 h-6"
                      title="X (m)"
                    />
                  </div>

                  {/* Y (m) */}
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="text-[10px] text-slate-500 font-bold">Y</span>
                    <input 
                      type="number"
                      step="0.05"
                      value={parseFloat(kp.y.toFixed(2))}
                      onChange={(e) => {
                        const valM = parseFloat(e.target.value) || 0;
                        const valPx = hPx / 2 - valM * 100;
                        const currentXPx = kp.isStart 
                          ? (kp.movId ? (activeArtist.movements.find(m => m.id === kp.movId)?.points[0].x || activeArtist.initialPosition.x) : activeArtist.initialPosition.x)
                          : (kp.movId ? (activeArtist.movements.find(m => m.id === kp.movId)?.points[activeArtist.movements.find(m => m.id === kp.movId)!.points.length - 1].x || activeArtist.initialPosition.x) : activeArtist.initialPosition.x);
                        onUpdateKeypointPosition(activeArtist.id, kp.id, { x: currentXPx, y: valPx });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="glass-input w-full py-0.5 px-1 text-[10px] font-mono text-center bg-[#050608]/40 border-white/5 focus:border-indigo-500/50 h-6"
                      title="Y (m)"
                    />
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Miniature if enabled */}
                  {!kp.isStart && kp.movId && showMiniPaths && (
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const mov = activeArtist.movements.find(m => m.id === kp.movId);
                        if (mov) {
                          const pts = mov.lut.length > 0 ? mov.lut : mov.points;
                          return getMiniPathSvg(pts);
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  {/* Copy Position */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCopiedPosition({ x: kp.x, y: kp.y });
                    }}
                    className={`p-1 rounded border transition shrink-0 ${
                      copiedPosition && copiedPosition.x === kp.x && copiedPosition.y === kp.y
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-700/30 border-white/5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                    }`}
                    title={`Copier la position (${kp.x.toFixed(2)}, ${kp.y.toFixed(2)})`}
                  >
                    <Copy size={10} />
                  </button>

                  {/* Paste Position */}
                  {copiedPosition && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newXPx = copiedPosition.x * 100 + wPx / 2;
                        const newYPx = hPx / 2 - copiedPosition.y * 100;
                        onUpdateKeypointPosition(activeArtist.id, kp.id, { x: newXPx, y: newYPx });
                      }}
                      className="p-1 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 hover:text-indigo-300 transition shrink-0"
                      title={`Coller la position (${copiedPosition.x.toFixed(2)}, ${copiedPosition.y.toFixed(2)})`}
                    >
                      <ClipboardPaste size={10} />
                    </button>
                  )}

                  {/* Delete Button */}
                  {!isInitial && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteKeypoint(activeArtist.id, kp.id);
                      }}
                      className="p-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 transition shrink-0"
                      title="Supprimer ce jalon"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
};

const getMiniPathSvg = (points: Point[]) => {
  if (points.length < 2) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  points.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const dx = maxX - minX;
  const dy = maxY - minY;
  const maxD = Math.max(dx, dy);

  // Target size for drawing area in normalized coords
  const size = 100;
  const padding = 16; // Ensure circles with white borders are not clipped
  const drawSize = size - padding * 2;

  // Scale factor to map dx/dy to drawSize
  const scale = maxD > 0 ? drawSize / maxD : 1;

  // Center the path if it's smaller in one of the dimensions
  const offsetX = padding + (drawSize - dx * scale) / 2;
  const offsetY = padding + (drawSize - dy * scale) / 2;

  const normalizedPoints = points.map(p => {
    const nx = (p.x - minX) * scale + offsetX;
    const ny = (p.y - minY) * scale + offsetY;
    return { x: nx, y: ny };
  });

  const svgPoints = normalizedPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const startPt = normalizedPoints[0];
  const endPt = normalizedPoints[normalizedPoints.length - 1];

  return (
    <svg 
      width="24" 
      height="24" 
      viewBox={`0 0 ${size} ${size}`} 
      className="bg-black/60 border border-white/10 rounded p-0.5 shrink-0 shadow-inner"
    >
      <polyline
        fill="none"
        stroke="#818cf8"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={svgPoints}
      />
      <circle
        cx={startPt.x}
        cy={startPt.y}
        r="8"
        fill="#10b981"
        stroke="#ffffff"
        strokeWidth="2.5"
      />
      <circle
        cx={endPt.x}
        cy={endPt.y}
        r="8"
        fill="#f43f5e"
        stroke="#ffffff"
        strokeWidth="2.5"
      />
    </svg>
  );
};
