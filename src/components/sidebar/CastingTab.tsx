import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Project } from '../../types';
import { ArtistRowItem } from './ArtistRowItem';
import { GroupRow } from './GroupRow';

interface CastingTabProps {
  project: Project;
  activeArtistId: string | null;
  onSelectArtist: (id: string | null) => void;
  onToggleArtistVisibility: (id: string) => void;
  onToggleArtistHighlight: (id: string) => void;
  onToggleArtistPathVisibility: (id: string) => void;
  onToggleGroupPathVisibility: (id: string) => void;
  onCreateGroup: (name: string, color: string, parentId?: string) => void;
  onDeleteGroup: (id: string) => void;
  onToggleGroupVisibility: (id: string) => void;
  onToggleArtistGroup: (artistId: string, groupId: string) => void;
  onCreateArtist: (name: string, color: string) => void;
  onDeleteArtist: (id: string) => void;
  onUpdateGroupColor: (id: string, color: string) => void;
  onUpdateGroupName: (id: string, name: string) => void;
  onUpdateArtistColor: (id: string, color: string) => void;
  onUpdateArtistIcon: (id: string, icon: string | null) => void;
  onUpdateArtistName: (id: string, name: string) => void;
}

export const CastingTab: React.FC<CastingTabProps> = ({
  project,
  activeArtistId,
  onSelectArtist,
  onToggleArtistVisibility,
  onToggleArtistHighlight,
  onToggleArtistPathVisibility,
  onToggleGroupPathVisibility,
  onCreateGroup,
  onDeleteGroup,
  onToggleGroupVisibility,
  onToggleArtistGroup,
  onCreateArtist,
  onDeleteArtist,
  onUpdateGroupColor,
  onUpdateGroupName,
  onUpdateArtistColor,
  onUpdateArtistIcon,
  onUpdateArtistName,
}) => {
  // Local form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#6366f1');
  const [showAddGroup, setShowAddGroup] = useState(false);

  const [newArtistName, setNewArtistName] = useState('');
  const [newArtistColor, setNewArtistColor] = useState('#ec4899');
  const [showAddArtist, setShowAddArtist] = useState(false);

  // Drag-and-drop state for groups
  const [draggedOverGroupId, setDraggedOverGroupId] = useState<string | null>(null);
  const [draggedOverUngrouped, setDraggedOverUngrouped] = useState(false);

  // Collapsed groups state
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<string[]>([]);
  const toggleGroupCollapsed = (groupId: string) => {
    setCollapsedGroupIds(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) 
        : [...prev, groupId]
    );
  };

  const handleAddGroupSubmit = () => {
    if (!newGroupName.trim()) return;
    onCreateGroup(newGroupName.trim(), newGroupColor);
    setNewGroupName('');
    setShowAddGroup(false);
  };

  const handleAddArtistSubmit = () => {
    if (!newArtistName.trim()) return;
    onCreateArtist(newArtistName.trim(), newArtistColor);
    setNewArtistName('');
    setShowAddArtist(false);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      
      {/* Acteurs Section */}
      <div>
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            👥 Acteurs <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-slate-400 font-bold">{project.artists.filter(a => a.groupIds.length === 0).length}</span>
          </span>
          <button 
            onClick={() => setShowAddArtist(!showAddArtist)}
            className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition border border-transparent hover:border-white/5"
            title="Ajouter un acteur"
          >
            <Plus size={12} />
          </button>
        </div>

        {showAddArtist && (
          <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-slate-900/30 border border-white/5 mb-3 animate-fade-in">
            <input 
              type="text" 
              placeholder="Nom de l'acteur..." 
              value={newArtistName}
              onChange={(e) => setNewArtistName(e.target.value)}
              className="glass-input w-full text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleAddArtistSubmit()}
            />
            <div className="flex items-center justify-between gap-2">
              <input 
                type="color" 
                value={newArtistColor}
                onChange={(e) => setNewArtistColor(e.target.value)}
                className="w-9 h-9 rounded-lg border border-white/10 cursor-pointer bg-transparent"
              />
              <button 
                onClick={handleAddArtistSubmit}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-all"
              >
                Ajouter
              </button>
            </div>
          </div>
        )}

        <div 
          onDragOver={(e) => {
            e.preventDefault();
            setDraggedOverUngrouped(true);
          }}
          onDragLeave={() => {
            setDraggedOverUngrouped(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDraggedOverUngrouped(false);
            const artistId = e.dataTransfer.getData('text/plain');
            if (artistId) {
              const artist = project.artists.find(a => a.id === artistId);
              if (artist) {
                artist.groupIds.forEach(gId => {
                  onToggleArtistGroup(artistId, gId);
                });
              }
            }
          }}
          className={`flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1 p-2 rounded-lg border transition-all duration-200 ${
            draggedOverUngrouped 
              ? 'border-indigo-500/40 bg-indigo-500/5' 
              : 'border-transparent'
          }`}
        >
          {(() => {
            const ungroupedArtists = project.artists
              .filter(a => a.groupIds.length === 0)
              .sort((a, b) => a.name.localeCompare(b.name));
            if (ungroupedArtists.length === 0) {
              return (
                <div className="text-center text-slate-500 text-xs py-6 border border-dashed border-white/5 rounded-lg italic">
                  Aucun acteur hors groupe. Glissez un acteur ici pour le retirer de son groupe.
                </div>
              );
            }
            return ungroupedArtists.map(artist => (
              <ArtistRowItem
                key={artist.id}
                artist={artist}
                isSelected={artist.id === activeArtistId}
                onSelect={() => onSelectArtist(artist.id)}
                onToggleHighlight={() => onToggleArtistHighlight(artist.id)}
                onToggleVisibility={() => onToggleArtistVisibility(artist.id)}
                onTogglePathVisibility={() => onToggleArtistPathVisibility(artist.id)}
                onRemoveOrDelete={() => {
                  onDeleteArtist(artist.id);
                }}
                mode="ungrouped"
                onUpdateColor={onUpdateArtistColor}
                onUpdateIcon={onUpdateArtistIcon}
                onUpdateName={onUpdateArtistName}
              />
            ));
          })()}
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

        <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
          {(() => {
            const topGroups = project.groups
              .filter(g => !g.parentId)
              .sort((a, b) => a.name.localeCompare(b.name));
            return topGroups.map(group => (
              <GroupRow
                key={group.id}
                group={group}
                depth={0}
                project={project}
                activeArtistId={activeArtistId}
                draggedOverGroupId={draggedOverGroupId}
                setDraggedOverGroupId={setDraggedOverGroupId}
                collapsedGroupIds={collapsedGroupIds}
                toggleGroupCollapsed={toggleGroupCollapsed}
                onSelectArtist={onSelectArtist}
                onToggleArtistVisibility={onToggleArtistVisibility}
                onToggleArtistHighlight={onToggleArtistHighlight}
                onToggleArtistPathVisibility={onToggleArtistPathVisibility}
                onToggleArtistGroup={onToggleArtistGroup}
                onCreateGroup={onCreateGroup}
                onDeleteGroup={onDeleteGroup}
                onToggleGroupVisibility={onToggleGroupVisibility}
                onToggleGroupPathVisibility={onToggleGroupPathVisibility}
                onUpdateGroupColor={onUpdateGroupColor}
                onUpdateGroupName={onUpdateGroupName}
                onUpdateArtistColor={onUpdateArtistColor}
                onUpdateArtistIcon={onUpdateArtistIcon}
                onUpdateArtistName={onUpdateArtistName}
              />
            ));
          })()}
        </div>
      </div>

    </div>
  );
};
