import { useEffect } from 'react';
import { Project } from '../types';
import { Lang } from '../utils/i18n';
import { getMedia } from '../utils/indexedDBHelper';
import { updateMovementLUT } from '../utils/projectHelper';

interface UseProjectSyncProps {
  view: 'dashboard' | 'editor';
  project: Project;
  setProject: (value: React.SetStateAction<Project>) => void;
  lang: Lang;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function useProjectSync({
  view,
  project,
  setProject,
  lang,
  audioRef,
}: UseProjectSyncProps) {
  // Save view and active project ID to localStorage to survive reloads
  useEffect(() => {
    localStorage.setItem('stagepath_view', view);
    if (view === 'editor' && project && project.id) {
      localStorage.setItem('stagepath_active_project_id', project.id);
    } else {
      localStorage.removeItem('stagepath_active_project_id');
    }
  }, [view, project.id]);

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('stagepath_lang', lang);
  }, [lang]);

  // Load project media files from IndexedDB on startup or active project change
  useEffect(() => {
    if (!project.id) return;
    
    let isMounted = true;
    
    const loadProjectMedia = async () => {
      try {
        const [audioBlob, bgBlob] = await Promise.all([
          getMedia(project.id, 'audio'),
          getMedia(project.id, 'background')
        ]);
        
        if (!isMounted) return;
        
        let needsUpdate = false;
        let updatedAudioUrl = project.audioSettings.fileUrl;
        let updatedBgUrl = project.backgroundSettings.fileUrl;
        
        if (audioBlob) {
          updatedAudioUrl = URL.createObjectURL(audioBlob);
          needsUpdate = true;
        }
        if (bgBlob) {
          updatedBgUrl = URL.createObjectURL(bgBlob);
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          setProject(prev => {
            if (prev.id !== project.id) return prev;
            return {
              ...prev,
              audioSettings: {
                ...prev.audioSettings,
                fileUrl: updatedAudioUrl
              },
              backgroundSettings: {
                ...prev.backgroundSettings,
                fileUrl: updatedBgUrl
              }
            };
          });

          if (audioRef.current && updatedAudioUrl) {
            audioRef.current.src = updatedAudioUrl;
            audioRef.current.load();
          }
        } else {
          // If no stored media is found but there's a transient blob URL, clear it to avoid broken links
          const clearBlobUrl = (url: string | null) => {
            if (url && url.startsWith('blob:')) {
              return null;
            }
            return url;
          };
          
          const clearedAudioUrl = clearBlobUrl(project.audioSettings.fileUrl);
          const clearedBgUrl = clearBlobUrl(project.backgroundSettings.fileUrl);
          
          if (clearedAudioUrl !== project.audioSettings.fileUrl || clearedBgUrl !== project.backgroundSettings.fileUrl) {
            setProject(prev => {
              if (prev.id !== project.id) return prev;
              return {
                ...prev,
                audioSettings: {
                  ...prev.audioSettings,
                  fileUrl: clearedAudioUrl
                },
                backgroundSettings: {
                  ...prev.backgroundSettings,
                  fileUrl: clearedBgUrl
                }
              };
            });
            if (audioRef.current) {
              audioRef.current.src = clearedAudioUrl || '';
              audioRef.current.load();
            }
          }
        }
      } catch (err) {
        console.error("Error loading media from IndexedDB", err);
      }
    };
    
    loadProjectMedia();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  // Synchronize stage aspect ratio with background image ratio
  useEffect(() => {
    const url = project.backgroundSettings.fileUrl;
    if (!url) return;

    const img = new Image();
    img.src = url;
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (isFinite(ratio) && ratio > 0) {
        setProject(prev => {
          const newHeight = Math.round((prev.stageWidth / ratio) * 100) / 100;
          if (prev.stageHeight === newHeight) return prev;
          
          const scaleY = newHeight / prev.stageHeight;
          const updatedArtists = prev.artists.map(art => {
            const scaledInitialPosition = {
              x: art.initialPosition.x,
              y: Math.round(art.initialPosition.y * scaleY)
            };
            const scaledMovements = art.movements.map(mov => {
              const scaledPoints = mov.points.map(p => ({
                x: p.x,
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
            ...prev,
            stageHeight: newHeight,
            artists: updatedArtists
          };
          return updated;
        });
      }
    };
  }, [project.backgroundSettings.fileUrl, project.stageWidth, setProject]);
}
