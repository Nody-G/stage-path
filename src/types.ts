import { Point, LUTEntry } from './utils/math';
export type { Point, LUTEntry };

export interface Group {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  parentId?: string;
  showPath?: boolean;
}

export interface Movement {
  id: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  points: Point[];   // control points drawn by mouse
  lut: LUTEntry[];   // Arc-Length Lookup Table
  totalLength: number; // Total length of path in pixels
  transitionType?: 'linear' | 'curved';
  label?: string;
}

export interface Artist {
  id: string;
  name: string;
  color: string;
  groupIds: string[]; // Associated groups
  initialPosition: Point; // Position at t = 0
  visible: boolean; // Individual visibility override
  highlighted?: boolean; // Highlight/Focus mode
  movements: Movement[];
  icon?: string;
  
  // Backstage and timing properties
  onStage?: boolean;    // Whether they are placed on stage or stay backstage
  entryTime?: number;   // Timecode when they enter the stage (seconds)
  exitTime?: number;    // Timecode when they leave the stage (seconds)
  opacity?: number;     // Render opacity override (0 to 1)
  showPath?: boolean;    // Whether to show this performer's path
}

export interface AudioSettings {
  fileName: string | null;
  fileUrl: string | null; // object URL or external URL
  duration: number; // in seconds
}

export interface BackgroundSettings {
  fileName: string | null;
  fileUrl: string | null; // object URL or external URL
  opacity: number; // 0 to 1
  scale: number; // factor
  offsetX: number; // in pixels
  offsetY: number; // in pixels
}

export interface Project {
  id: string;
  name: string;
  directorName?: string;
  artists: Artist[];
  groups: Group[];
  audioSettings: AudioSettings;
  backgroundSettings: BackgroundSettings;
  duration: number; // Global duration in seconds (default 120s)
  stageWidth: number; // Physical stage width in meters
  stageHeight: number; // Physical stage depth in meters
  createdAt?: number; // timestamp
  updatedAt?: number; // timestamp
  settings?: {
    constantScale?: boolean;
    constantScaleMeters?: boolean;
    constantScaleArtistSize?: number;
    constantScaleMetersSize?: number;
    showGrid?: boolean;
    gridSpacing?: number;
    loopAudio?: boolean;
    highlightOpacity?: number;
    showIconBackground?: boolean;
    showInitialsBackground?: boolean;
    showMovementPaths?: boolean;
    showArtistNames?: boolean;
    showArtistPositions?: boolean;
    showMovementPointLabels?: boolean;
    showGraduations?: boolean;
  };
}


