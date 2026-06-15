import { useEffect } from 'react';
import { Project } from '../types';

interface UseAudioPlaybackProps {
  project: Project;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  playbackSpeed: number;
  audioRef: React.RefObject<HTMLAudioElement>;
  prevTimeRef: React.MutableRefObject<number | null>;
  requestRef: React.MutableRefObject<number | null>;
}

export function useAudioPlayback({
  project,
  isPlaying,
  setIsPlaying,
  setCurrentTime,
  playbackSpeed,
  audioRef,
  prevTimeRef,
  requestRef,
}: UseAudioPlaybackProps) {

  // Synchronize playback rate when speed changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, audioRef]);

  // Synchronize loop setting
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = !!project.settings?.loopAudio;
    }
  }, [project.settings?.loopAudio, audioRef]);

  const handleTimelineScrub = (timeVal: number) => {
    const clampedTime = Math.max(0, Math.min(timeVal, project.duration));
    setCurrentTime(clampedTime);
    if (audioRef.current && project.audioSettings.fileUrl) {
      audioRef.current.currentTime = clampedTime;
    }
  };

  const handleTogglePlay = () => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    
    if (project.audioSettings.fileUrl && audioRef.current) {
      if (nextPlaying) {
        audioRef.current.play().catch((err) => {
          console.warn("La lecture audio a été bloquée par le navigateur :", err);
        });
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    handleTimelineScrub(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Main animation frame sync loop
  useEffect(() => {
    if (!isPlaying) {
      prevTimeRef.current = null;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      return;
    }

    const loop = (timestamp: number) => {
      if (project.audioSettings.fileUrl && audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        
        if (audioRef.current.ended) {
          if (project.settings?.loopAudio) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => console.warn(err));
          } else {
            setIsPlaying(false);
            setCurrentTime(0);
            audioRef.current.currentTime = 0;
          }
        }
      } else {
        if (prevTimeRef.current !== null) {
          const delta = (timestamp - prevTimeRef.current) / 1000;
          setCurrentTime(prev => {
            const nextVal = prev + delta * playbackSpeed;
            if (nextVal >= project.duration) {
              if (project.settings?.loopAudio) {
                return 0;
              }
              setIsPlaying(false);
              return 0;
            }
            return nextVal;
          });
        }
      }
      prevTimeRef.current = timestamp;
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, playbackSpeed, project.duration, project.audioSettings.fileUrl, project.settings?.loopAudio, audioRef, prevTimeRef, requestRef, setIsPlaying, setCurrentTime]);

  return {
    handleTogglePlay,
    handleStop,
    handleTimelineScrub,
  };
}
