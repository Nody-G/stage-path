import React, { useState } from 'react';
import { 
  Plus, Trash2, Eye, EyeOff, ChevronRight, ChevronDown, Route
} from 'lucide-react';
import { Project } from '../../types';
import { ArtistRowItem } from './ArtistRowItem';
import { ArtistEditPanel } from './ArtistEditPanel';

interface CastingTabProps {
  project: Project;
  activeArtistId: string | null;
  onSelectArtist: (id: string | null) => void;
  onCreateArtist: (name: string, color: string) => void;
  onDeleteArtist: (id: string) => void;
  onToggleArtistVisibility: (id: string) => void;
  onToggleArtistHighlight: (id: string) => void;
  onToggleArtistPathVisibility: (id: string) => void;
  onToggleGroupPathVisibility: (id: string) => void;
  onCreateGroup: (name: string, color: string, parentId?: string) => void;
  onDeleteGroup: (id: string) => void;
  onToggleGroupVisibility: (id: string) => void;
  onToggleArtistGroup: (artistId: string, groupId: string) => void;
  onUpdateArtistName: (id: string, name: string) => void;
  onUpdateArtistColor: (id: string, color: string) => void;
  onUpdateArtistIcon: (id: string, icon: string | null) => void;
}

export const CastingTab: React.FC<CastingTabProps> = ({
  project,
  activeArtistId,
  onSelectArtist,
  onCreateArtist,
  onDeleteArtist,
  onToggleArtistVisibility,
  onToggleArtistHighlight,
  onToggleArtistPathVisibility,
  onToggleGroupPathVisibility,
  onCreateGroup,
  onDeleteGroup,
  onToggleGroupVisibility,
  onToggleArtistGroup,
  onUpdateArtistName,
  onUpdateArtistColor,
  onUpdateArtistIcon,
}) => {
  // Local form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#6366f1');
  const [showAddGroup, setShowAddGroup] = useState(false);

  const [newArtistName, setNewArtistName] = useState('');
  const [newArtistColor, setNewArtistColor] = useState('#10b981');

  // Drag-and-drop state for groups
  const [draggedOverGroupId, setDraggedOverGroupId] = useState<string | null>(null);

  // Drag-and-drop state for ungrouped list area
  const [isDraggedOverUngrouped, setIsDraggedOverUngrouped] = useState(false);

  // Collapsed groups state
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<string[]>([]);
  const toggleGroupCollapsed = (groupId: string) => {
    setCollapsedGroupIds(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) 
        : [...prev, groupId]
    );
  };

  const handleAddArtistStage = () => {
    if (!newArtistName.trim()) return;
    onCreateArtist(newArtistName.trim(), newArtistColor);
    setNewArtistName('');
  };

  const handleAddGroupSubmit = () => {
    if (!newGroupName.trim()) return;
    onCreateGroup(newGroupName.trim(), newGroupColor);
    setNewGroupName('');
    setShowAddGroup(false);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      
      {/* Quick Add Character to Stage */}
      <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
        <span className="text-[10px] text-indigo-300 font-bold tracking-wider block">NOUVEAU FIGURANT / ACTEUR</span>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Nom du personnage..." 
            value={newArtistName}
            onChange={(e) => setNewArtistName(e.target.value)}
            className="glass-input flex-1 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleAddArtistStage()}
          />
          <input 
            type="color" 
            value={newArtistColor}
            onChange={(e) => setNewArtistColor(e.target.value)}
            className="w-9 h-9 rounded-lg border border-white/10 cursor-pointer bg-transparent"
          />
        </div>
        <button
          onClick={handleAddArtistStage}
          className="w-full py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg transition-all duration-200 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
          style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
        >
          Créer et ajouter au plateau
        </button>
      </div>

      {/* Selected Character Editor */}
      {activeArtistId && (
        <ArtistEditPanel
          project={project}
          activeArtistId={activeArtistId}
          onDeleteArtist={onDeleteArtist}
          onUpdateArtistName={onUpdateArtistName}
          onUpdateArtistColor={onUpdateArtistColor}
          onUpdateArtistIcon={onUpdateArtistIcon}
          onToggleArtistPathVisibility={onToggleArtistPathVisibility}
          onToggleArtistGroup={onToggleArtistGroup}
        />
      )}

      {/* Performers List (Ungrouped) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggedOverUngrouped(true);
        }}
        onDragLeave={() => {
          setIsDraggedOverUngrouped(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggedOverUngrouped(false);
          const artistId = e.dataTransfer.getData('text/plain');
          if (artistId) {
            const artist = project.artists.find(a => a.id === artistId);
            if (artist && artist.groupIds.length > 0) {
              // Remove from all groups
              artist.groupIds.forEach(gId => {
                onToggleArtistGroup(artistId, gId);
              });
            }
          }
        }}
        className={`rounded-xl transition-all duration-200 ${
          isDraggedOverUngrouped 
            ? 'bg-indigo-500/5 border border-dashed border-indigo-500/30 p-2 shadow-[inset_0_0_10px_rgba(99,102,241,0.05)]' 
            : ''
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            🎭 Acteurs libres <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-slate-400 font-bold">{project.artists.filter(a => a.groupIds.length === 0).length}</span>
          </span>
          {isDraggedOverUngrouped && (
            <span className="text-[9px] text-indigo-400 font-bold animate-pulse">Retirer des groupes</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1">
          {project.artists.filter(artist => artist.groupIds.length === 0).map(artist => (
            <ArtistRowItem
              key={artist.id}
              artist={artist}
              isSelected={artist.id === activeArtistId}
              onSelect={() => onSelectArtist(artist.id)}
              onToggleHighlight={() => onToggleArtistHighlight(artist.id)}
              onToggleVisibility={() => onToggleArtistVisibility(artist.id)}
              onTogglePathVisibility={() => onToggleArtistPathVisibility(artist.id)}
              onRemoveOrDelete={() => {
                if (confirm(`Supprimer définitivement ${artist.name} ?`)) {
                  onDeleteArtist(artist.id);
                }
              }}
              mode="ungrouped"
            />
          ))}
          {project.artists.filter(artist => artist.groupIds.length === 0).length === 0 && (
            <span className="text-[10px] text-slate-500 italic block text-center py-4">
              Aucun acteur libre. Glissez un acteur hors des groupes pour le détacher.
            </span>
          )}
        </div>
      </div>

      {/* Groups Section */}
      <div>
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            📁 Groupes <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-slate-400 font-bold">{project.groups.length}</span>
          </span>
          <button 
            onClick={() => setShowAddGroup(!showAddGroup)}
            className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition border border-transparent hover:border-white/5"
          >
            <Plus size={12} />
          </button>
        </div>

        {showAddGroup && (
          <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-slate-900/30 border border-white/5 mb-3 animate-fade-in">
            <input 
              type="text" 
              placeholder="Nom du groupe..." 
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="glass-input w-full text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleAddGroupSubmit()}
            />
            <div className="flex items-center justify-between gap-2">
              <input 
                type="color" 
                value={newGroupColor}
                onChange={(e) => setNewGroupColor(e.target.value)}
                className="w-9 h-9 rounded-lg border border-white/10 cursor-pointer bg-transparent"
              />
              <button 
                onClick={handleAddGroupSubmit}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-all"
              >
                Ajouter
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
          {(() => {
            const renderGroupTree = (group: any, depth = 0) => {
              const groupArtists = project.artists.filter(a => a.groupIds.includes(group.id));
              const childGroups = project.groups.filter(g => g.parentId === group.id);
              const memberCount = groupArtists.length;
              const isDraggedOver = draggedOverGroupId === group.id;
              const isCollapsed = collapsedGroupIds.includes(group.id);

              const handleCreateSubgroup = (e: React.MouseEvent) => {
                e.stopPropagation();
                const name = prompt(`Nom du sous-groupe sous "${group.name}" :`);
                if (name && name.trim()) {
                  onCreateGroup(name.trim(), group.color, group.id);
                }
              };

              return (
                <div key={group.id} className="flex flex-col gap-1" style={{ marginLeft: depth > 0 ? `${depth * 8}px` : '0px' }}>
                  {/* Group Header Row */}
                  <div 
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggedOverGroupId !== group.id) {
                        setDraggedOverGroupId(group.id);
                      }
                    }}
                    onDragLeave={() => {
                      setDraggedOverGroupId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggedOverGroupId(null);
                      const artistId = e.dataTransfer.getData('text/plain');
                      if (artistId) {
                        const artist = project.artists.find(a => a.id === artistId);
                        if (artist && !artist.groupIds.includes(group.id)) {
                          onToggleArtistGroup(artistId, group.id);
                        }
                      }
                    }}
                    onClick={() => toggleGroupCollapsed(group.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all duration-200 cursor-pointer ${
                      isDraggedOver
                        ? 'border-emerald-500/60 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.2)] scale-[1.02]'
                        : 'bg-slate-900/15 border-white/5 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate mr-1">
                      <button 
                        type="button"
                        className="text-slate-400 hover:text-white transition p-0.5 rounded shrink-0 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroupCollapsed(group.id);
                        }}
                      >
                        {(childGroups.length > 0 || memberCount > 0) ? (isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />) : <span className="w-3" />}
                      </button>
                      <span className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_var(--color)]" style={{ backgroundColor: group.color, ['--color' as any]: group.color }} />
                      <span className="truncate text-slate-300 font-bold">{group.name}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-[9px] text-slate-400 font-bold shrink-0">
                        {memberCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={handleCreateSubgroup}
                        className="p-1 rounded hover:bg-white/5 text-slate-450 hover:text-white transition"
                        title="Créer un sous-groupe"
                      >
                        <Plus size={11} />
                      </button>
                      <button 
                        onClick={() => onToggleGroupVisibility(group.id)}
                        className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition"
                        title={group.visible ? "Masquer le groupe" : "Afficher le groupe"}
                      >
                        {group.visible ? <Eye size={12} /> : <EyeOff size={12} className="text-red-400" />}
                      </button>
                      <button 
                        onClick={() => onToggleGroupPathVisibility(group.id)}
                        className={`p-1 rounded hover:bg-white/5 transition ${
                          group.showPath !== false ? 'text-indigo-400 hover:text-indigo-300' : 'text-slate-500 hover:text-slate-350'
                        }`}
                        title={group.showPath !== false ? "Masquer les trajectoires du groupe" : "Afficher les trajectoires du groupe"}
                      >
                        <Route size={12} className={group.showPath !== false ? 'opacity-100' : 'opacity-40'} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Supprimer le groupe "${group.name}" et tous ses sous-groupes ?`)) {
                            onDeleteGroup(group.id);
                          }
                        }}
                        className="p-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 transition"
                        title="Supprimer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Group Members & Child Groups List */}
                  {!isCollapsed && (childGroups.length > 0 || memberCount > 0) && (
                    <div className="flex flex-col gap-1 ml-3.5 pl-2.5 border-l border-white/5 animate-fade-in">
                      {/* Subgroups */}
                      {childGroups.map(sub => renderGroupTree(sub, depth + 1))}

                      {groupArtists.map(artist => (
                        <ArtistRowItem
                          key={artist.id}
                          artist={artist}
                          isSelected={artist.id === activeArtistId}
                          onSelect={() => onSelectArtist(artist.id)}
                          onToggleHighlight={() => onToggleArtistHighlight(artist.id)}
                          onToggleVisibility={() => onToggleArtistVisibility(artist.id)}
                          onTogglePathVisibility={() => onToggleArtistPathVisibility(artist.id)}
                          onRemoveOrDelete={() => onToggleArtistGroup(artist.id, group.id)}
                          mode="grouped"
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            };

            const topGroups = project.groups.filter(g => !g.parentId);
            return topGroups.map(group => renderGroupTree(group));
          })()}
        </div>
      </div>

    </div>
  );
};
