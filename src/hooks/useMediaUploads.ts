import { Project } from '../types';
import { saveMedia } from '../utils/indexedDBHelper';

interface UseMediaUploadsProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  audioRef: React.RefObject<HTMLAudioElement>;
  setIsPlaying: (playing: boolean) => void;
  broadcastProject: (updatedProj: Project) => void;
}

export function useMediaUploads({
  project,
  setProject,
  audioRef,
  setIsPlaying,
  broadcastProject,
}: UseMediaUploadsProps) {

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      const dur = audioRef.current.duration;
      if (isFinite(dur) && dur > 0) {
        const roundedDur = Math.round(dur * 100) / 100;
        setProject(prev => {
          if (prev.duration === roundedDur && prev.audioSettings.duration === roundedDur) {
            return prev;
          }
          const updatedArtists = prev.artists.map(art => {
            const clampedMovements = art.movements.map(mov => {
              if (mov.endTime > roundedDur) {
                const newEndTime = Math.min(roundedDur, mov.endTime);
                const newStartTime = Math.min(newEndTime - 0.25, mov.startTime);
                return {
                  ...mov,
                  startTime: newStartTime,
                  endTime: newEndTime
                };
              }
              return mov;
            }).filter(mov => mov.startTime < roundedDur);

            return {
              ...art,
              movements: clampedMovements,
              exitTime: art.exitTime && art.exitTime > roundedDur ? roundedDur : art.exitTime
            };
          });

          const updated = {
            ...prev,
            duration: roundedDur,
            artists: updatedArtists,
            audioSettings: {
              ...prev.audioSettings,
              duration: roundedDur
            }
          };
          broadcastProject(updated);
          return updated;
        });
      }
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset playback state
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const url = URL.createObjectURL(file);
    setProject(prev => ({
      ...prev,
      audioSettings: {
        fileName: file.name,
        fileUrl: url,
        duration: prev.duration,
      }
    }));

    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
    }

    saveMedia(project.id, 'audio', file).catch(err => {
      console.error("Failed to save audio to IndexedDB", err);
    });
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const updatedProj: Project = {
      ...project,
      backgroundSettings: {
        ...project.backgroundSettings,
        fileName: file.name,
        fileUrl: url,
      }
    };
    setProject(updatedProj);
    broadcastProject(updatedProj);

    saveMedia(project.id, 'background', file).catch(err => {
      console.error("Failed to save background to IndexedDB", err);
    });
  };

  const handleBackgroundSettingsChange = (key: keyof Project['backgroundSettings'], val: number) => {
    const updatedProj: Project = {
      ...project,
      backgroundSettings: {
        ...project.backgroundSettings,
        [key]: val
      }
    };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  return {
    handleAudioLoadedMetadata,
    handleAudioUpload,
    handleBackgroundUpload,
    handleBackgroundSettingsChange,
  };
}
