import { Project, Movement, Point } from '../types';
import { insertMovementSegment, updateMovementLUT } from '../utils/projectHelper';
import { getArtistPositionAtTime, generateDefaultCurvedPoints, smoothPoints, simplifyPathRDP } from '../utils/math';

interface UseMovementEngineProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  activeMovementId: string | null;
  setActiveMovementId: (id: string | null) => void;
  currentTime: number;
  broadcastProject: (updatedProj: Project) => void;
  onTimelineScrub?: (time: number) => void;
}

export function useMovementEngine({
  project,
  setProject,
  activeMovementId,
  setActiveMovementId,
  currentTime,
  broadcastProject,
  onTimelineScrub,
}: UseMovementEngineProps) {

  const handleUpdateArtistPositionAtTime = (artistId: string, time: number, position: Point) => {
    const roundedTime = Math.round(time * 100) / 100;

    const updatedArtists = project.artists.map(art => {
      if (art.id !== artistId) return art;

      // Case A: No movements yet
      if (art.movements.length === 0) {
        if (roundedTime <= 0.05) {
          return {
            ...art,
            initialPosition: position
          };
        } else {
          const newMov: Movement = {
            id: 'mov_' + Math.random().toString(36).substring(2, 9),
            startTime: 0,
            endTime: roundedTime,
            points: [art.initialPosition, position],
            lut: [],
            totalLength: 0,
            transitionType: 'linear'
          };
          const updatedMov = updateMovementLUT(newMov);
          return {
            ...art,
            movements: [updatedMov]
          };
        }
      }

      // Case B: Has movements
      const sorted = [...art.movements].sort((a, b) => a.startTime - b.startTime);
      const activeMovIndex = sorted.findIndex(m => roundedTime >= m.startTime && roundedTime <= m.endTime);
      
      const updatedMovements = [...art.movements];

      if (activeMovIndex !== -1) {
        const mov = sorted[activeMovIndex];
        const isNearStart = Math.abs(roundedTime - mov.startTime) < 0.2;
        const isNearEnd = Math.abs(roundedTime - mov.endTime) < 0.2;

        if (isNearStart) {
          const origMovIndex = art.movements.findIndex(m => m.id === mov.id);
          const points = [...mov.points];
          points[0] = position;
          if (mov.transitionType === 'linear') {
            points[points.length - 1] = mov.points[mov.points.length - 1]; // keep end
            updatedMovements[origMovIndex] = updateMovementLUT({
              ...mov,
              points: [position, points[points.length - 1]]
            });
          } else {
            updatedMovements[origMovIndex] = updateMovementLUT({
              ...mov,
              points
            });
          }

          // Update preceding movement's end point
          const prevMov = sorted[activeMovIndex - 1];
          if (prevMov) {
            const prevOrigIndex = art.movements.findIndex(m => m.id === prevMov.id);
            const prevPoints = [...prevMov.points];
            prevPoints[prevPoints.length - 1] = position;
            if (prevMov.transitionType === 'linear') {
              updatedMovements[prevOrigIndex] = updateMovementLUT({
                ...prevMov,
                points: [prevMov.points[0], position]
              });
            } else {
              updatedMovements[prevOrigIndex] = updateMovementLUT({
                ...prevMov,
                points: prevPoints
              });
            }
          } else {
            art.initialPosition = position;
          }
        } else if (isNearEnd) {
          const origMovIndex = art.movements.findIndex(m => m.id === mov.id);
          const points = [...mov.points];
          points[points.length - 1] = position;
          if (mov.transitionType === 'linear') {
            updatedMovements[origMovIndex] = updateMovementLUT({
              ...mov,
              points: [mov.points[0], position]
            });
          } else {
            updatedMovements[origMovIndex] = updateMovementLUT({
              ...mov,
              points
            });
          }

          // Update succeeding movement's start point
          const nextMov = sorted[activeMovIndex + 1];
          if (nextMov) {
            const nextOrigIndex = art.movements.findIndex(m => m.id === nextMov.id);
            const nextPoints = [...nextMov.points];
            nextPoints[0] = position;
            if (nextMov.transitionType === 'linear') {
              updatedMovements[nextOrigIndex] = updateMovementLUT({
                ...nextMov,
                points: [position, nextMov.points[nextMov.points.length - 1]]
              });
            } else {
              updatedMovements[nextOrigIndex] = updateMovementLUT({
                ...nextMov,
                points: nextPoints
              });
            }
          }
        } else {
          // Split segment
          const origMovIndex = art.movements.findIndex(m => m.id === mov.id);
          if (origMovIndex !== -1) {
            const startPt = mov.points[0];
            const endPt = mov.points[mov.points.length - 1];
            const transitionType = mov.transitionType || 'linear';

            const m1: Movement = {
              id: 'mov_' + Math.random().toString(36).substring(2, 9),
              startTime: mov.startTime,
              endTime: roundedTime,
              points: transitionType === 'curved'
                ? generateDefaultCurvedPoints(startPt, position)
                : [startPt, position],
              lut: [],
              totalLength: 0,
              transitionType
            };

            const m2: Movement = {
              id: 'mov_' + Math.random().toString(36).substring(2, 9),
              startTime: roundedTime,
              endTime: mov.endTime,
              points: transitionType === 'curved'
                ? generateDefaultCurvedPoints(position, endPt)
                : [position, endPt],
              lut: [],
              totalLength: 0,
              transitionType
            };

            updatedMovements.splice(origMovIndex, 1, updateMovementLUT(m1), updateMovementLUT(m2));
          }
        }

        return {
          ...art,
          movements: updatedMovements
        };
      }

      // Time falls in a gap
      const prevMov = [...sorted].reverse().find(m => m.endTime < roundedTime);
      const nextMov = sorted.find(m => m.startTime > roundedTime);

      const startPt = prevMov ? prevMov.points[prevMov.points.length - 1] : art.initialPosition;
      const startTime = prevMov ? prevMov.endTime : 0;

      const newMov: Movement = {
        id: 'mov_' + Math.random().toString(36).substring(2, 9),
        startTime,
        endTime: roundedTime,
        points: [startPt, position],
        lut: [],
        totalLength: 0,
        transitionType: 'linear'
      };

      // If there is a next movement, update its start point
      if (nextMov) {
        const nextOrigIndex = art.movements.findIndex(m => m.id === nextMov.id);
        if (nextOrigIndex !== -1) {
          const nextPoints = [...nextMov.points];
          nextPoints[0] = position;
          if (nextMov.transitionType === 'linear') {
            updatedMovements[nextOrigIndex] = updateMovementLUT({
              ...nextMov,
              points: [position, nextMov.points[nextMov.points.length - 1]]
            });
          } else {
            updatedMovements[nextOrigIndex] = updateMovementLUT({
              ...nextMov,
              points: nextPoints
            });
          }
        }
      }

      return {
        ...art,
        movements: [...updatedMovements, updateMovementLUT(newMov)]
      };
    });

    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleUpdateKeypointTime = (artistId: string, keypointId: string, newTime: number) => {
    const roundedTime = Math.round(newTime * 100) / 100;
    if (keypointId === 'initial') return; // cannot change initial keypoint time

    const updatedArtists = project.artists.map(art => {
      if (art.id !== artistId) return art;

      const isStart = keypointId.endsWith('_start');
      const movId = keypointId.replace(isStart ? '_start' : '_end', '');
      
      const mov = art.movements.find(m => m.id === movId);
      if (!mov) return art;

      const otherMovs = art.movements.filter(m => m.id !== movId).sort((a, b) => a.startTime - b.startTime);

      let clampedTime = roundedTime;

      if (isStart) {
        // Find closest preceding movement
        const prevMov = [...otherMovs].reverse().find(m => m.endTime <= mov.startTime);
        const minVal = prevMov ? prevMov.endTime : 0;
        const maxVal = mov.endTime - 0.1;
        clampedTime = Math.max(minVal, Math.min(maxVal, roundedTime));
      } else {
        // Find closest succeeding movement
        const nextMov = otherMovs.find(m => m.startTime >= mov.endTime);
        let maxVal = project.duration;
        if (nextMov) {
          const isConnected = Math.abs(nextMov.startTime - mov.endTime) < 0.01;
          if (isConnected) {
            maxVal = nextMov.endTime - 0.1;
          } else {
            maxVal = nextMov.startTime;
          }
        }
        const minVal = mov.startTime + 0.1;
        clampedTime = Math.max(minVal, Math.min(maxVal, roundedTime));
      }

      const updatedMovements = art.movements.map(m => {
        if (m.id !== movId) return m;
        if (isStart) {
          return { ...m, startTime: clampedTime };
        } else {
          return { ...m, endTime: clampedTime };
        }
      });

      // Update succeeding movement start time if connected
      const oldMov = art.movements.find(m => m.id === movId);
      if (oldMov && !isStart) {
        const nextMov = art.movements.find(m => m.startTime === oldMov.endTime);
        if (nextMov) {
          const nextIdx = updatedMovements.findIndex(m => m.id === nextMov.id);
          if (nextIdx !== -1) {
            updatedMovements[nextIdx] = {
              ...updatedMovements[nextIdx],
              startTime: clampedTime
            };
          }
        }
      }

      return {
        ...art,
        movements: updatedMovements
      };
    });

    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleUpdateKeypointPosition = (artistId: string, keypointId: string, position: Point) => {
    const updatedArtists = project.artists.map(art => {
      if (art.id !== artistId) return art;

      const updatedMovements = [...art.movements];

      if (keypointId === 'initial') {
        art.initialPosition = position;
        const sorted = [...art.movements].sort((a, b) => a.startTime - b.startTime);
        if (sorted[0] && sorted[0].startTime === 0) {
          const firstOrigIdx = art.movements.findIndex(m => m.id === sorted[0].id);
          const firstMov = sorted[0];
          const points = [...firstMov.points];
          points[0] = position;
          if (firstMov.transitionType === 'linear') {
            points[points.length - 1] = firstMov.points[firstMov.points.length - 1];
            updatedMovements[firstOrigIdx] = updateMovementLUT({
              ...firstMov,
              points: [position, points[points.length - 1]]
            });
          } else {
            updatedMovements[firstOrigIdx] = updateMovementLUT({
              ...firstMov,
              points
            });
          }
        }
      } else {
        const isStart = keypointId.endsWith('_start');
        const movId = keypointId.replace(isStart ? '_start' : '_end', '');
        
        const movIdx = updatedMovements.findIndex(m => m.id === movId);
        if (movIdx !== -1) {
          const mov = updatedMovements[movIdx];
          const points = [...mov.points];
          if (isStart) {
            points[0] = position;
            if (mov.startTime === 0) {
              art.initialPosition = position;
            }
            if (mov.transitionType === 'linear') {
              updatedMovements[movIdx] = updateMovementLUT({
                ...mov,
                points: [position, points[points.length - 1]]
              });
            } else {
              updatedMovements[movIdx] = updateMovementLUT({
                ...mov,
                points
              });
            }

            const prevMov = art.movements.find(m => m.endTime === mov.startTime);
            if (prevMov) {
              const prevIdx = updatedMovements.findIndex(m => m.id === prevMov.id);
              const prevPoints = [...prevMov.points];
              prevPoints[prevPoints.length - 1] = position;
              if (prevMov.transitionType === 'linear') {
                updatedMovements[prevIdx] = updateMovementLUT({
                  ...prevMov,
                  points: [prevMov.points[0], position]
                });
              } else {
                updatedMovements[prevIdx] = updateMovementLUT({
                  ...prevMov,
                  points: prevPoints
                });
              }
            }
          } else {
            points[points.length - 1] = position;
            if (mov.transitionType === 'linear') {
              updatedMovements[movIdx] = updateMovementLUT({
                ...mov,
                points: [mov.points[0], position]
              });
            } else {
              updatedMovements[movIdx] = updateMovementLUT({
                ...mov,
                points
              });
            }

            const nextMov = art.movements.find(m => m.startTime === mov.endTime);
            if (nextMov) {
              const nextIdx = updatedMovements.findIndex(m => m.id === nextMov.id);
              const nextPoints = [...nextMov.points];
              nextPoints[0] = position;
              if (nextMov.transitionType === 'linear') {
                updatedMovements[nextIdx] = updateMovementLUT({
                  ...nextMov,
                  points: [position, nextMov.points[nextMov.points.length - 1]]
                });
              } else {
                updatedMovements[nextIdx] = updateMovementLUT({
                  ...nextMov,
                  points: nextPoints
                });
              }
            }
          }
        }
      }

      return {
        ...art,
        movements: updatedMovements
      };
    });

    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleToggleTransitionType = (artistId: string, movId: string) => {
    const updatedArtists = project.artists.map(art => {
      if (art.id !== artistId) return art;

      const updatedMovements = art.movements.map(mov => {
        if (mov.id !== movId) return mov;
        const currentType = mov.transitionType || 'linear';
        const nextType = currentType === 'linear' ? 'curved' : 'linear';

        const startPt = mov.points[0];
        const endPt = mov.points[mov.points.length - 1];

        const points = nextType === 'curved'
          ? generateDefaultCurvedPoints(startPt, endPt)
          : [startPt, endPt];

        return updateMovementLUT({
          ...mov,
          transitionType: nextType,
          points
        });
      });

      return {
        ...art,
        movements: updatedMovements
      };
    });

    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleDeleteKeypoint = (artistId: string, keypointId: string) => {
    if (keypointId === 'initial') return;

    const isStart = keypointId.endsWith('_start');
    const movId = keypointId.replace(isStart ? '_start' : '_end', '');

    const updatedArtists = project.artists.map(art => {
      if (art.id !== artistId) return art;
      return {
        ...art,
        movements: art.movements.filter(m => m.id !== movId)
      };
    });

    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleCreateKeypointAtCurrentTime = (artistId: string) => {
    const artist = project.artists.find(a => a.id === artistId);
    if (!artist) return;
    const pos = getArtistPositionAtTime(artist, currentTime, project.stageWidth, project.stageHeight);
    handleUpdateArtistPositionAtTime(artistId, currentTime, pos);
  };

  const handleUpdateMovementControlPoint = (artistId: string, movId: string, position: Point) => {
    const updatedArtists = project.artists.map(art => {
      if (art.id !== artistId) return art;
      const updatedMovements = art.movements.map(mov => {
        if (mov.id !== movId) return mov;
        const points = [...mov.points];
        if (points.length >= 3) {
          points[1] = position; // midpoint
        }
        return updateMovementLUT({
          ...mov,
          points
        });
      });
      return {
        ...art,
        movements: updatedMovements
      };
    });

    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleCreateManualMovement = (
    artistId: string,
    startTime: number,
    endTime: number,
    targetX: number,
    targetY: number,
    transitionType: 'linear' | 'curved' = 'linear'
  ) => {
    const roundedStart = Math.max(0, Math.round(startTime * 100) / 100);
    const roundedEnd = Math.min(project.duration, Math.round(endTime * 100) / 100);
    if (roundedStart >= roundedEnd) {
      alert("Le temps de début doit être inférieur au temps de fin.");
      return;
    }

    const updatedArtists = project.artists.map(art => {
      if (art.id !== artistId) return art;

      const startPos = getArtistPositionAtTime(art, roundedStart, project.stageWidth, project.stageHeight);
      
      const newMov: Movement = {
        id: 'mov_' + Math.random().toString(36).substring(2, 9),
        startTime: roundedStart,
        endTime: roundedEnd,
        points: transitionType === 'curved'
          ? generateDefaultCurvedPoints(startPos, { x: targetX, y: targetY })
          : [startPos, { x: targetX, y: targetY }],
        lut: [],
        totalLength: 0,
        transitionType
      };

      const updatedMovements = insertMovementSegment(art.movements, newMov);

      return {
        ...art,
        movements: updatedMovements
      };
    });

    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
    if (onTimelineScrub) {
      setTimeout(() => {
        onTimelineScrub(roundedEnd);
      }, 50);
    }
  };

  const handleFinishDrawingPath = (
    artistId: string,
    startTime: number,
    endTime: number,
    points: Point[],
    transitionType: 'linear' | 'curved' = 'linear'
  ) => {
    const roundedStart = Math.max(0, Math.round(startTime * 100) / 100);
    const roundedEnd = Math.min(project.duration, Math.round(endTime * 100) / 100);
    if (roundedStart >= roundedEnd) return;
    if (points.length < 2) return;

    const updatedArtists = project.artists.map(art => {
      if (art.id !== artistId) return art;

      const startPos = getArtistPositionAtTime(art, roundedStart, project.stageWidth, project.stageHeight);
      const adjustedPoints = [...points];
      adjustedPoints[0] = startPos;

      const newMov: Movement = {
        id: 'mov_' + Math.random().toString(36).substring(2, 9),
        startTime: roundedStart,
        endTime: roundedEnd,
        points: adjustedPoints,
        lut: [],
        totalLength: 0,
        transitionType
      };

      const updatedMovements = insertMovementSegment(art.movements, newMov);

      let initialPos = art.initialPosition;
      if (roundedStart === 0) {
        initialPos = startPos;
      }

      return {
        ...art,
        initialPosition: initialPos,
        movements: updatedMovements
      };
    });

    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
    if (onTimelineScrub) {
      setTimeout(() => {
        onTimelineScrub(roundedEnd);
      }, 50);
    }
  };

  const handleFinishRealtimeRecording = (
    artistId: string,
    recorded: { x: number; y: number; t: number }[]
  ) => {
    if (recorded.length < 5) return;

    const sortedPoints = [...recorded].sort((a, b) => a.t - b.t);
    const S = Math.round(sortedPoints[0].t * 100) / 100;
    const E = Math.round(sortedPoints[sortedPoints.length - 1].t * 100) / 100;

    if (S >= E - 0.2) return;

    const rawPoints = sortedPoints.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    
    const smoothed = smoothPoints(rawPoints, 2);
    const downsampled = simplifyPathRDP(smoothed, 15);

    const updatedArtists = project.artists.map(art => {
      if (art.id !== artistId) return art;

      const startPos = getArtistPositionAtTime(art, S, project.stageWidth, project.stageHeight);
      downsampled[0] = startPos;

      const newMov: Movement = {
        id: 'mov_' + Math.random().toString(36).substring(2, 9),
        startTime: S,
        endTime: E,
        points: downsampled,
        lut: [],
        totalLength: 0,
        transitionType: 'linear'
      };

      const updatedMovements = insertMovementSegment(art.movements, newMov);

      let initialPos = art.initialPosition;
      if (S === 0) {
        initialPos = startPos;
      }

      return {
        ...art,
        initialPosition: initialPos,
        movements: updatedMovements
      };
    });

    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
    if (onTimelineScrub) {
      setTimeout(() => {
        onTimelineScrub(E);
      }, 50);
    }
  };

  const handleUpdateMovementPoint = (
    artistId: string,
    movId: string,
    pointIndex: number,
    position: Point
  ) => {
    const updatedArtists = project.artists.map(art => {
      if (art.id !== artistId) return art;

      const updatedMovements = art.movements.map(mov => {
        if (mov.id !== movId) return mov;

        const points = [...mov.points];
        points[pointIndex] = position;

        return updateMovementLUT({
          ...mov,
          points
        });
      });

      const targetMov = art.movements.find(m => m.id === movId);
      if (targetMov) {
        if (pointIndex === 0) {
          const prevMovIndex = updatedMovements.findIndex(m => m.endTime === targetMov.startTime);
          if (prevMovIndex !== -1) {
            const pm = updatedMovements[prevMovIndex];
            const pPoints = [...pm.points];
            pPoints[pPoints.length - 1] = position;
            updatedMovements[prevMovIndex] = updateMovementLUT({
              ...pm,
              points: pPoints
            });
          } else if (targetMov.startTime === 0) {
            art.initialPosition = position;
          }
        }
        else if (pointIndex === targetMov.points.length - 1) {
          const nextMovIndex = updatedMovements.findIndex(m => m.startTime === targetMov.endTime);
          if (nextMovIndex !== -1) {
            const nm = updatedMovements[nextMovIndex];
            const nPoints = [...nm.points];
            nPoints[0] = position;
            updatedMovements[nextMovIndex] = updateMovementLUT({
              ...nm,
              points: nPoints
            });
          }
        }
      }

      return {
        ...art,
        movements: updatedMovements
      };
    });

    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleAddMovementPoint = (
    artistId: string,
    movId: string,
    insertIndex: number,
    position: Point
  ) => {
    const updatedArtists = project.artists.map(art => {
      if (art.id !== artistId) return art;

      const updatedMovements = art.movements.map(mov => {
        if (mov.id !== movId) return mov;

        const points = [...mov.points];
        points.splice(insertIndex, 0, position);

        return updateMovementLUT({
          ...mov,
          points
        });
      });

      return {
        ...art,
        movements: updatedMovements
      };
    });

    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleDeleteMovementPoint = (artistId: string, movId: string, pointIndex: number) => {
    const updatedArtists = project.artists.map(art => {
      if (art.id !== artistId) return art;

      const updatedMovements = art.movements.map(mov => {
        if (mov.id !== movId) return mov;
        if (mov.points.length <= 2) return mov;

        const points = mov.points.filter((_, idx) => idx !== pointIndex);
        return updateMovementLUT({
          ...mov,
          points
        });
      });

      return {
        ...art,
        movements: updatedMovements
      };
    });

    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleDeleteMovement = (artistId: string, movementId: string) => {
    const updatedArtists = project.artists.map(art => {
      if (art.id === artistId) {
        return {
          ...art,
          movements: art.movements.filter(m => m.id !== movementId)
        };
      }
      return art;
    });
    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
    if (activeMovementId === movementId) {
      setActiveMovementId(null);
    }
  };

  const handleUpdateMovementTimeRange = (
    artistId: string,
    movementId: string,
    newStart: number,
    newEnd: number
  ) => {
    const roundedStart = Math.max(0, Math.round(newStart * 100) / 100);
    const roundedEnd = Math.min(project.duration, Math.round(newEnd * 100) / 100);
    if (roundedStart >= roundedEnd) return;

    const updatedArtists = project.artists.map(art => {
      if (art.id !== artistId) return art;

      const oldMov = art.movements.find(m => m.id === movementId);
      if (!oldMov) return art;

      // Find other movements
      const otherMovs = art.movements.filter(m => m.id !== movementId).sort((a, b) => a.startTime - b.startTime);

      // Find neighbors
      const prevMov = [...otherMovs].reverse().find(m => m.endTime <= oldMov.startTime);
      const nextMov = otherMovs.find(m => m.startTime >= oldMov.endTime);

      let finalStart = roundedStart;
      let finalEnd = roundedEnd;

      // Determine drag type based on what changed
      const changedStart = Math.abs(oldMov.startTime - roundedStart) > 0.01;
      const changedEnd = Math.abs(oldMov.endTime - roundedEnd) > 0.01;

      if (changedStart && !changedEnd) {
        // resize-start
        const minVal = prevMov ? prevMov.endTime : 0;
        const maxVal = oldMov.endTime - 0.1;
        finalStart = Math.max(minVal, Math.min(maxVal, roundedStart));
      } else if (changedEnd && !changedStart) {
        // resize-end
        const minVal = oldMov.startTime + 0.1;
        let maxVal = nextMov ? nextMov.startTime : project.duration;
        finalEnd = Math.max(minVal, Math.min(maxVal, roundedEnd));
      } else if (changedStart && changedEnd) {
        // move
        const segmentDuration = oldMov.endTime - oldMov.startTime;
        const minStart = prevMov ? prevMov.endTime : 0;
        const maxEnd = nextMov ? nextMov.startTime : project.duration;
        
        finalStart = Math.max(minStart, Math.min(maxEnd - segmentDuration, roundedStart));
        finalEnd = finalStart + segmentDuration;
      }

      const updatedMovements = art.movements.map(m => {
        if (m.id === movementId) {
          return {
            ...m,
            startTime: finalStart,
            endTime: finalEnd
          };
        }
        return m;
      });

      // Update succeeding movement start time if connected
      if (changedEnd) {
        const nextConnectedMov = otherMovs.find(m => m.startTime === oldMov.endTime);
        if (nextConnectedMov) {
          const nextIdx = updatedMovements.findIndex(m => m.id === nextConnectedMov.id);
          if (nextIdx !== -1) {
            // Also clamp next connected movement start time to not exceed its end time
            const nextNewStart = Math.min(updatedMovements[nextIdx].endTime - 0.1, finalEnd);
            updatedMovements[nextIdx] = {
              ...updatedMovements[nextIdx],
              startTime: nextNewStart
            };
          }
        }
      }

      // Also support preceding movement end time if connected and we did resize-start!
      if (changedStart) {
        const prevConnectedMov = otherMovs.find(m => m.endTime === oldMov.startTime);
        if (prevConnectedMov) {
          const prevIdx = updatedMovements.findIndex(m => m.id === prevConnectedMov.id);
          if (prevIdx !== -1) {
            // Clamp preceding movement end time to not be less than its start time
            const prevNewEnd = Math.max(updatedMovements[prevIdx].startTime + 0.1, finalStart);
            updatedMovements[prevIdx] = {
              ...updatedMovements[prevIdx],
              endTime: prevNewEnd
            };
          }
        }
      }

      return {
        ...art,
        movements: updatedMovements.sort((a, b) => a.startTime - b.startTime)
      };
    });

    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleUpdateMovementLabel = (artistId: string, movementId: string, label: string) => {
    const updatedArtists = project.artists.map(art => {
      if (art.id !== artistId) return art;

      const updatedMovements = art.movements.map(m => {
        if (m.id === movementId) {
          return {
            ...m,
            label
          };
        }
        return m;
      });

      return {
        ...art,
        movements: updatedMovements
      };
    });

    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  return {
    handleUpdateArtistPositionAtTime,
    handleUpdateKeypointTime,
    handleUpdateKeypointPosition,
    handleToggleTransitionType,
    handleDeleteKeypoint,
    handleCreateKeypointAtCurrentTime,
    handleUpdateMovementControlPoint,
    handleCreateManualMovement,
    handleFinishDrawingPath,
    handleFinishRealtimeRecording,
    handleUpdateMovementPoint,
    handleAddMovementPoint,
    handleDeleteMovementPoint,
    handleDeleteMovement,
    handleUpdateMovementTimeRange,
    handleUpdateMovementLabel,
  };
}
