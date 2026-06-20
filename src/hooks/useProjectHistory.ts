import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../types';

interface UseProjectHistoryProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  broadcastProject: (p: Project) => void;
}

export function useProjectHistory({
  project,
  setProject,
  broadcastProject,
}: UseProjectHistoryProps) {
  const [history, setHistory] = useState<Project[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isDraggingRef = useRef<boolean>(false);
  const lastPushTimeRef = useRef<number>(0);

  const setProjectWithHistory = (value: React.SetStateAction<Project>) => {
    setProject(prev => {
      const nextProject = typeof value === 'function' ? value(prev) : value;
      
      if (!isDraggingRef.current) {
        const now = Date.now();
        const timeSinceLastPush = now - lastPushTimeRef.current;
        
        setHistory(hPrev => {
          const nextHistory = hPrev.slice(0, historyIndex + 1);
          if (nextHistory.length >= 50) nextHistory.shift();
          
          const lastInHistory = nextHistory[nextHistory.length - 1];
          if (lastInHistory && 
              JSON.stringify({ ...lastInHistory, updatedAt: 0, createdAt: 0 }) === 
              JSON.stringify({ ...nextProject, updatedAt: 0, createdAt: 0 })) {
            return hPrev;
          }

          const shouldOverwrite = lastInHistory && timeSinceLastPush < 1200;
          
          let updatedHistory;
          if (shouldOverwrite && nextHistory.length > 1) {
            updatedHistory = [...nextHistory.slice(0, -1), nextProject];
          } else {
            updatedHistory = [...nextHistory, nextProject];
          }
          
          setHistoryIndex(updatedHistory.length - 1);
          lastPushTimeRef.current = now;
          return updatedHistory;
        });
      }
      
      return nextProject;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const prevProject = history[newIndex];
      setProject(prevProject);
      broadcastProject(prevProject);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextProject = history[newIndex];
      setProject(nextProject);
      broadcastProject(nextProject);
    }
  };

  const handleDragStart = () => {
    isDraggingRef.current = true;
    setHistory(hPrev => {
      const nextHistory = hPrev.slice(0, historyIndex + 1);
      if (nextHistory.length >= 50) nextHistory.shift();
      const lastInHistory = nextHistory[nextHistory.length - 1];
      if (lastInHistory && 
          JSON.stringify({ ...lastInHistory, updatedAt: 0, createdAt: 0 }) === 
          JSON.stringify({ ...project, updatedAt: 0, createdAt: 0 })) {
        return hPrev;
      }
      const updatedHistory = [...nextHistory, project];
      setHistoryIndex(updatedHistory.length - 1);
      return updatedHistory;
    });
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    setHistory(hPrev => {
      const nextHistory = hPrev.slice(0, historyIndex + 1);
      if (nextHistory.length >= 50) nextHistory.shift();
      const lastInHistory = nextHistory[nextHistory.length - 1];
      if (lastInHistory && 
          JSON.stringify({ ...lastInHistory, updatedAt: 0, createdAt: 0 }) === 
          JSON.stringify({ ...project, updatedAt: 0, createdAt: 0 })) {
        return hPrev;
      }
      const updatedHistory = [...nextHistory, project];
      setHistoryIndex(updatedHistory.length - 1);
      lastPushTimeRef.current = Date.now();
      return updatedHistory;
    });
  };

  // Synchronize history stack on active project switch
  useEffect(() => {
    if (project && project.id) {
      setHistory(prev => {
        if (prev.length === 0 || prev[0].id !== project.id) {
          setHistoryIndex(0);
          return [project];
        }
        return prev;
      });
    }
  }, [project.id]);

  return {
    setProjectWithHistory,
    handleUndo,
    handleRedo,
    handleDragStart,
    handleDragEnd,
  };
}
