import { Project } from '../types';
import { updateMovementLUT } from '../utils/projectHelper';

interface UseProjectMetadataProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  broadcastProject: (updatedProj: Project) => void;
}

export function useProjectMetadata({
  project,
  setProject,
  broadcastProject,
}: UseProjectMetadataProps) {

  const handleRenameProject = (newName: string) => {
    const updated = { ...project, name: newName };
    setProject(updated);
    broadcastProject(updated);
  };

  const handleUpdateDirectorName = (name: string) => {
    const updated = { ...project, directorName: name };
    setProject(updated);
    broadcastProject(updated);
  };

  const handleUpdateStageDimensions = (w: number, h: number) => {
    const scaleX = w / project.stageWidth;
    const scaleY = h / project.stageHeight;

    const updatedArtists = project.artists.map(art => {
      const scaledInitialPosition = {
        x: Math.round(art.initialPosition.x * scaleX),
        y: Math.round(art.initialPosition.y * scaleY)
      };

      const scaledMovements = art.movements.map(mov => {
        const scaledPoints = mov.points.map(p => ({
          x: Math.round(p.x * scaleX),
          y: Math.round(p.y * scaleY)
        }));
        const updatedMov = {
          ...mov,
          points: scaledPoints
        };
        return updateMovementLUT(updatedMov);
      });

      return {
        ...art,
        initialPosition: scaledInitialPosition,
        movements: scaledMovements
      };
    });

    const updated = {
      ...project,
      stageWidth: w,
      stageHeight: h,
      artists: updatedArtists
    };
    setProject(updated);
    broadcastProject(updated);
  };

  const handleUpdateProjectDuration = (dur: number) => {
    const updated = { ...project, duration: dur };
    setProject(updated);
    broadcastProject(updated);
  };

  const handleToggleConstantScale = () => {
    const current = project.settings?.constantScale ?? false;
    const updated = {
      ...project,
      settings: { ...project.settings, constantScale: !current }
    };
    setProject(updated);
    broadcastProject(updated);
  };

  const handleUpdateSetting = (key: string, val: any) => {
    const updated = {
      ...project,
      settings: { ...project.settings, [key]: val }
    };
    setProject(updated);
    broadcastProject(updated);
  };

  return {
    handleRenameProject,
    handleUpdateDirectorName,
    handleUpdateStageDimensions,
    handleUpdateProjectDuration,
    handleToggleConstantScale,
    handleUpdateSetting,
  };
}
