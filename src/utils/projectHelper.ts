import { Project, Artist, Group, Movement } from '../types';
import { generateCurveLUT } from './math';

export function createNewProject(
  name: string,
  directorName: string = '',
  stageWidth: number = 16,
  stageHeight: number = 10,
  duration: number = 120
): Project {
  return {
    id: Math.random().toString(36).substring(2, 9),
    name: name || 'Nouveau Spectacle',
    directorName,
    artists: [],
    groups: [],
    audioSettings: {
      fileName: null,
      fileUrl: null,
      duration: duration,
    },
    backgroundSettings: {
      fileName: null,
      fileUrl: null,
      opacity: 1.0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    },
    duration: duration,
    stageWidth,
    stageHeight,
    settings: {
      constantScale: true,
      constantScaleMeters: false,
      constantScaleArtistSize: 1.0,
      constantScaleMetersSize: 1.0,
      showGrid: true,
      gridSpacing: 1.0,
      loopAudio: false,
      showArtistNames: true,
      showArtistPositions: false,
      showMovementPointLabels: false,
      showGraduations: false,
    }
  };
}

export function createDemoProject(): Project {
  const baseProject = createNewProject('Démo - Le Lac des Cygnes', 'Rudolf Noureev', 16, 10, 120);
  
  const groups: Group[] = [
    { id: 'solistes', name: 'Solistes', color: '#ff4b82', visible: true },
    { id: 'corps-de-ballet', name: 'Corps de ballet', color: '#00e5ff', visible: true },
    { id: 'comediens', name: 'Comédiens', color: '#ffb300', visible: true },
  ];
  
  baseProject.groups = groups;

  const artists: Artist[] = [
    {
      id: 'a1',
      name: 'Odette (Cygne Blanc)',
      color: '#ffffff',
      groupIds: ['solistes'],
      initialPosition: { x: 800, y: 150 }, // adjusted for 1600x1000 stage center
      visible: true,
      onStage: true,
      entryTime: 0,
      exitTime: 120,
      movements: [
        {
          id: 'm1_odette',
          startTime: 2,
          endTime: 12,
          points: [
            { x: 800, y: 150 },
            { x: 600, y: 200 },
            { x: 500, y: 350 },
            { x: 800, y: 400 },
            { x: 1100, y: 350 },
            { x: 1000, y: 200 },
            { x: 800, y: 150 }
          ],
          lut: [],
          totalLength: 0
        }
      ]
    },
    {
      id: 'a2',
      name: 'Siegfried (Prince)',
      color: '#448aff',
      groupIds: ['solistes'],
      initialPosition: { x: 800, y: 500 },
      visible: true,
      onStage: true,
      entryTime: 0,
      exitTime: 120,
      movements: [
        {
          id: 'm1_siegfried',
          startTime: 5,
          endTime: 15,
          points: [
            { x: 800, y: 500 },
            { x: 600, y: 450 },
            { x: 400, y: 350 },
            { x: 800, y: 250 },
            { x: 800, y: 150 }
          ],
          lut: [],
          totalLength: 0
        }
      ]
    },
    {
      id: 'a3',
      name: 'Cygne 1',
      color: '#00e5ff',
      groupIds: ['corps-de-ballet'],
      initialPosition: { x: 300, y: 100 },
      visible: true,
      onStage: true,
      entryTime: 0,
      exitTime: 120,
      movements: []
    },
    {
      id: 'a4',
      name: 'Cygne 2',
      color: '#00e5ff',
      groupIds: ['corps-de-ballet'],
      initialPosition: { x: 300, y: 200 },
      visible: true,
      onStage: true,
      entryTime: 0,
      exitTime: 120,
      movements: []
    },
    {
      id: 'a5',
      name: 'Cygne 3',
      color: '#00e5ff',
      groupIds: ['corps-de-ballet'],
      initialPosition: { x: 300, y: 300 },
      visible: true,
      onStage: true,
      entryTime: 0,
      exitTime: 120,
      movements: []
    },
    {
      id: 'a6',
      name: 'Cygne 4',
      color: '#00e5ff',
      groupIds: ['corps-de-ballet'],
      initialPosition: { x: 1300, y: 100 },
      visible: true,
      onStage: true,
      entryTime: 0,
      exitTime: 120,
      movements: []
    },
    {
      id: 'a7',
      name: 'Cygne 5',
      color: '#00e5ff',
      groupIds: ['corps-de-ballet'],
      initialPosition: { x: 1300, y: 200 },
      visible: true,
      onStage: true,
      entryTime: 0,
      exitTime: 120,
      movements: []
    },
    {
      id: 'a8',
      name: 'Garde 1',
      color: '#ffb300',
      groupIds: ['comediens'],
      initialPosition: { x: 200, y: 500 },
      visible: true,
      onStage: true,
      entryTime: 10,
      exitTime: 120,
      movements: [
        {
          id: 'm1_garde1',
          startTime: 10,
          endTime: 20,
          points: [
            { x: 200, y: 500 },
            { x: 300, y: 400 },
            { x: 400, y: 500 }
          ],
          lut: [],
          totalLength: 0
        }
      ]
    }
  ];

  // Precalculate LUTs for demo movements
  baseProject.artists = artists.map(artist => {
    return {
      ...artist,
      movements: artist.movements.map(mov => {
        const lut = generateCurveLUT(mov.points);
        const totalLength = lut.length > 0 ? lut[lut.length - 1].s : 0;
        return {
          ...mov,
          lut,
          totalLength
        };
      })
    };
  });

  return baseProject;
}

export function exportProject(project: Project) {
  // Strip local object URLs so we don't save useless temporary pointers
  const cleanProject = {
    ...project,
    audioSettings: {
      ...project.audioSettings,
      fileUrl: null, // needs to be reloaded on open
    },
    backgroundSettings: {
      ...project.backgroundSettings,
      fileUrl: null, // needs to be reloaded on open
    }
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanProject, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `${project.name.toLowerCase().replace(/\s+/g, '_')}.stagepath`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Insère un segment de mouvement spatiotemporel tout en résolvant
 * automatiquement les chevauchements de timecode sur la ligne de temps existante.
 */
export function insertMovementSegment(
  movements: Movement[],
  newMov: Movement
): Movement[] {
  const S = newMov.startTime;
  const E = newMov.endTime;
  
  if (S >= E) return movements;

  const result: Movement[] = [];

  movements.forEach(mov => {
    const s = mov.startTime;
    const e = mov.endTime;

    // Cas 1 : Le segment existant est entièrement avant [S, E]
    if (e <= S) {
      result.push(mov);
    }
    // Cas 2 : Le segment existant est entièrement après [S, E]
    else if (s >= E) {
      result.push(mov);
    }
    // Cas 3 : Le segment existant chevauche S (commence avant S, finit après S)
    else if (s < S && e > S && e <= E) {
      const pointsRatio = (S - s) / (e - s);
      const truncateIndex = Math.max(1, Math.floor(mov.points.length * pointsRatio));
      const truncatedPoints = mov.points.slice(0, truncateIndex + 1);
      
      const newEndPt = truncatedPoints[truncatedPoints.length - 1] || mov.points[0];
      
      const updatedMov: Movement = {
        ...mov,
        endTime: S,
        points: truncatedPoints.length >= 2 ? truncatedPoints : [mov.points[0], newEndPt],
        lut: [],
        totalLength: 0
      };
      
      const lut = generateCurveLUT(updatedMov.points);
      updatedMov.lut = lut;
      updatedMov.totalLength = lut.length > 0 ? lut[lut.length - 1].s : 0;
      
      result.push(updatedMov);
    }
    // Cas 4 : Le segment existant chevauche E (commence avant E, finit après E)
    else if (s >= S && s < E && e > E) {
      const pointsRatio = (E - s) / (e - s);
      const truncateIndex = Math.max(1, Math.floor(mov.points.length * pointsRatio));
      const truncatedPoints = mov.points.slice(truncateIndex);
      
      const newStartPt = truncatedPoints[0] || mov.points[mov.points.length - 1];

      const updatedMov: Movement = {
        ...mov,
        startTime: E,
        points: truncatedPoints.length >= 2 ? truncatedPoints : [newStartPt, mov.points[mov.points.length - 1]],
        lut: [],
        totalLength: 0
      };
      
      const lut = generateCurveLUT(updatedMov.points);
      updatedMov.lut = lut;
      updatedMov.totalLength = lut.length > 0 ? lut[lut.length - 1].s : 0;

      result.push(updatedMov);
    }
    // Cas 5 : Le segment existant englobe totalement [S, E] (découpe en deux)
    else if (s < S && e > E) {
      // Première partie : [s, S]
      const ratioS = (S - s) / (e - s);
      const indexS = Math.max(1, Math.floor(mov.points.length * ratioS));
      const points1 = mov.points.slice(0, indexS + 1);
      const endPt1 = points1[points1.length - 1] || mov.points[0];
      
      const updatedMov1: Movement = {
        ...mov,
        id: mov.id + '_split1',
        endTime: S,
        points: points1.length >= 2 ? points1 : [mov.points[0], endPt1],
        lut: [],
        totalLength: 0
      };
      const lut1 = generateCurveLUT(updatedMov1.points);
      updatedMov1.lut = lut1;
      updatedMov1.totalLength = lut1.length > 0 ? lut1[lut1.length - 1].s : 0;
      result.push(updatedMov1);

      // Deuxième partie : [E, e]
      const ratioE = (E - s) / (e - s);
      const indexE = Math.max(1, Math.floor(mov.points.length * ratioE));
      const points2 = mov.points.slice(indexE);
      const startPt2 = points2[0] || mov.points[mov.points.length - 1];

      const updatedMov2: Movement = {
        ...mov,
        id: mov.id + '_split2',
        startTime: E,
        points: points2.length >= 2 ? points2 : [startPt2, mov.points[mov.points.length - 1]],
        lut: [],
        totalLength: 0
      };
      const lut2 = generateCurveLUT(updatedMov2.points);
      updatedMov2.lut = lut2;
      updatedMov2.totalLength = lut2.length > 0 ? lut2[lut2.length - 1].s : 0;
      result.push(updatedMov2);
    }
    // Cas 6 : Le segment existant est entièrement contenu dans [S, E] (supprimé)
  });

  const finalLut = generateCurveLUT(newMov.points);
  const finalTotalLength = finalLut.length > 0 ? finalLut[finalLut.length - 1].s : 0;
  
  result.push({
    ...newMov,
    lut: finalLut,
    totalLength: finalTotalLength
  });

  return result.sort((a, b) => a.startTime - b.startTime);
}

export function updateMovementLUT(mov: Movement): Movement {
  const lut = generateCurveLUT(mov.points);
  const totalLength = lut.length > 0 ? lut[lut.length - 1].s : 0;
  return {
    ...mov,
    lut,
    totalLength
  };
}
