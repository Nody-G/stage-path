import { Project, Group } from '../types';

interface UseGroupManagementProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  broadcastProject: (updatedProj: Project) => void;
}

export function useGroupManagement({
  project,
  setProject,
  broadcastProject,
}: UseGroupManagementProps) {

  const handleCreateGroup = (name: string, color: string, parentId?: string) => {
    const newGroup: Group = {
      id: 'g_' + Math.random().toString(36).substring(2, 9),
      name,
      color,
      visible: true,
      parentId
    };
    const updatedProj = {
      ...project,
      groups: [...project.groups, newGroup]
    };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleDeleteGroup = (groupId: string) => {
    // Collect all subgroups recursively to delete them
    const getSubgroupIds = (pId: string): string[] => {
      const direct = project.groups.filter(g => g.parentId === pId).map(g => g.id);
      const recursive = direct.flatMap(id => getSubgroupIds(id));
      return [...direct, ...recursive];
    };

    const idsToDelete = [groupId, ...getSubgroupIds(groupId)];

    const updatedGroups = project.groups.filter(g => !idsToDelete.includes(g.id));
    const updatedArtists = project.artists.map(art => ({
      ...art,
      groupIds: art.groupIds.filter(id => !idsToDelete.includes(id))
    }));
    const updatedProj = {
      ...project,
      groups: updatedGroups,
      artists: updatedArtists
    };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleToggleGroupVisibility = (groupId: string) => {
    const updatedGroups = project.groups.map(g => {
      if (g.id === groupId) {
        return { ...g, visible: !g.visible };
      }
      return g;
    });
    const updatedProj = { ...project, groups: updatedGroups };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleToggleGroupPathVisibility = (groupId: string) => {
    const updatedGroups = project.groups.map(g => {
      if (g.id === groupId) {
        return { ...g, showPath: g.showPath === false ? true : false };
      }
      return g;
    });
    const updatedProj = { ...project, groups: updatedGroups };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleUpdateGroupColor = (groupId: string, color: string) => {
    const updatedGroups = project.groups.map(g => {
      if (g.id === groupId) {
        return { ...g, color };
      }
      return g;
    });
    const updatedProj = { ...project, groups: updatedGroups };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  const handleUpdateGroupName = (groupId: string, name: string) => {
    const updatedGroups = project.groups.map(g => {
      if (g.id === groupId) {
        return { ...g, name };
      }
      return g;
    });
    const updatedProj = { ...project, groups: updatedGroups };
    setProject(updatedProj);
    broadcastProject(updatedProj);
  };

  return {
    handleCreateGroup,
    handleDeleteGroup,
    handleToggleGroupVisibility,
    handleToggleGroupPathVisibility,
    handleUpdateGroupColor,
    handleUpdateGroupName,
  };
}
