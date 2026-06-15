import { Project, Artist, Point } from '../types';

interface UseArtistManagementProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  broadcastProject: (updatedProj: Project) => void;
  activeArtistId: string | null;
  setActiveArtistId: (id: string | null) => void;
  handleSelectArtist: (id: string | null) => void;
}

export function useArtistManagement({
  project,
  setProject,
  broadcastProject,
  activeArtistId,
  setActiveArtistId,
  handleSelectArtist,
}: UseArtistManagementProps) {

  const handleCreateArtist = (name: string, color: string) => {
    const newArt: Artist = {
      id: 'art_' + Math.random().toString(36).substring(2, 9),
      name,
      color,
      groupIds: [],
      initialPosition: { x: project.stageWidth * 50, y: project.stageHeight * 50 },
      visible: true,
      movements: [],
      onStage: true,
      entryTime: 0,
      exitTime: project.duration
    };
    const updatedProj = {
      ...project,
      artists: [...project.artists, newArt]
    };
    setProject(updatedProj);
    broadcastProject(updatedProj);
    handleSelectArtist(newArt.id);
  };

  const handleDeleteArtist = (artistId: string) => {
    const updatedProj = {
      ...project,
      artists: project.artists.filter(art => art.id !== artistId)
    };
    setProject(updatedProj);
    broadcastProject(updatedProj);
    if (activeArtistId === artistId) setActiveArtistId(null);
  };

  const handleToggleArtistVisibility = (artistId: string) => {
    const updatedArtists = project.artists.map(art => {
      if (art.id === artistId) {
        return { ...art, visible: !art.visible };
      }
      return art;
    });
    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleToggleArtistHighlight = (artistId: string) => {
    const updatedArtists = project.artists.map(art => {
      if (art.id === artistId) {
        return { ...art, highlighted: !art.highlighted };
      }
      return art;
    });
    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleToggleArtistPathVisibility = (artistId: string) => {
    const updatedArtists = project.artists.map(art => {
      if (art.id === artistId) {
        return { ...art, showPath: art.showPath === false ? true : false };
      }
      return art;
    });
    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleUpdateArtistName = (id: string, name: string) => {
    const updatedArtists = project.artists.map(art => {
      if (art.id === id) {
        return { ...art, name };
      }
      return art;
    });
    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleUpdateArtistColor = (id: string, color: string) => {
    const updatedArtists = project.artists.map(art => {
      if (art.id === id) {
        return { ...art, color };
      }
      return art;
    });
    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleUpdateArtistIcon = (id: string, icon: string | null) => {
    const updatedArtists = project.artists.map(art => {
      if (art.id === id) {
        return { ...art, icon: icon || undefined };
      }
      return art;
    });
    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleToggleArtistGroup = (artistId: string, groupId: string) => {
    const updatedArtists = project.artists.map(art => {
      if (art.id === artistId) {
        const exists = art.groupIds.includes(groupId);
        const groupIds = exists 
          ? art.groupIds.filter(id => id !== groupId)
          : [...art.groupIds, groupId];
        return { ...art, groupIds };
      }
      return art;
    });
    const updatedProj = { ...project, artists: updatedArtists };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleDoubleClickStage = (position: Point) => {
    const defaultName = `Figurant ${project.artists.length + 1}`;
    const name = prompt("Nom du nouvel acteur ou figurant :", defaultName);
    if (name === null) return;
    
    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
    const color = colors[project.artists.length % colors.length];
    
    const newArt: Artist = {
      id: 'art_' + Math.random().toString(36).substring(2, 9),
      name: name.trim() || defaultName,
      color,
      groupIds: [],
      initialPosition: position,
      visible: true,
      movements: [],
      onStage: true,
      entryTime: 0,
      exitTime: project.duration
    };
    
    const updatedProj = {
      ...project,
      artists: [...project.artists, newArt]
    };
    setProject(updatedProj);
    broadcastProject(updatedProj);
    handleSelectArtist(newArt.id);
  };

  return {
    handleCreateArtist,
    handleDeleteArtist,
    handleToggleArtistVisibility,
    handleToggleArtistHighlight,
    handleToggleArtistPathVisibility,
    handleUpdateArtistName,
    handleUpdateArtistColor,
    handleUpdateArtistIcon,
    handleToggleArtistGroup,
    handleDoubleClickStage,
  };
}
