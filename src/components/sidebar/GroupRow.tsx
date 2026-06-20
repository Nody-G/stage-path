import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Eye, EyeOff, ChevronRight, ChevronDown, Route } from 'lucide-react';
import { Project, Group } from '../../types';
import { ArtistRowItem } from './ArtistRowItem';
import { AppModal } from '../AppModal';

interface GroupRowProps {
  group: Group;
  depth: number;
  project: Project;
  activeArtistId: string | null;
  draggedOverGroupId: string | null;
  setDraggedOverGroupId: (id: string | null) => void;
  collapsedGroupIds: string[];
  toggleGroupCollapsed: (id: string) => void;
  onSelectArtist: (id: string | null) => void;
  onToggleArtistVisibility: (id: string) => void;
  onToggleArtistHighlight: (id: string) => void;
  onToggleArtistPathVisibility: (id: string) => void;
  onToggleArtistGroup: (artistId: string, groupId: string) => void;
  onCreateGroup: (name: string, color: string, parentId?: string) => void;
  onDeleteGroup: (id: string) => void;
  onToggleGroupVisibility: (id: string) => void;
  onToggleGroupPathVisibility: (id: string) => void;
  onUpdateGroupColor: (id: string, color: string) => void;
  onUpdateGroupName: (id: string, name: string) => void;
  onUpdateArtistColor: (id: string, color: string) => void;
  onUpdateArtistIcon: (id: string, icon: string | null) => void;
  onUpdateArtistName: (id: string, name: string) => void;
}

export const GroupRow: React.FC<GroupRowProps> = ({
  group,
  depth,
  project,
  activeArtistId,
  draggedOverGroupId,
  setDraggedOverGroupId,
  collapsedGroupIds,
  toggleGroupCollapsed,
  onSelectArtist,
  onToggleArtistVisibility,
  onToggleArtistHighlight,
  onToggleArtistPathVisibility,
  onToggleArtistGroup,
  onCreateGroup,
  onDeleteGroup,
  onToggleGroupVisibility,
  onToggleGroupPathVisibility,
  onUpdateGroupColor,
  onUpdateGroupName,
  onUpdateArtistColor,
  onUpdateArtistIcon,
  onUpdateArtistName,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(group.name);
  const [showSubgroupModal, setShowSubgroupModal] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dotButtonRef = useRef<HTMLButtonElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    if (!showPicker) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        dotButtonRef.current && !dotButtonRef.current.contains(e.target as Node)
      ) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showPicker]);

  const handleOpenPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showPicker && dotButtonRef.current) {
      const rect = dotButtonRef.current.getBoundingClientRect();
      setPickerPos({ top: rect.bottom + 6, left: rect.left });
    }
    setShowPicker(!showPicker);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingName(true);
    setEditNameValue(group.name);
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    if (editNameValue.trim() && editNameValue.trim() !== group.name) {
      onUpdateGroupName(group.id, editNameValue.trim());
    }
  };

  const groupArtists = project.artists
    .filter(a => a.groupIds.includes(group.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const childGroups = project.groups
    .filter(g => g.parentId === group.id)
    .sort((a, b) => a.name.localeCompare(b.name));
  const memberCount = groupArtists.length;
  const isDraggedOver = draggedOverGroupId === group.id;
  const isCollapsed = collapsedGroupIds.includes(group.id);

  const handleCreateSubgroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSubgroupModal(true);
  };

  return (
    <>
    <div className="flex flex-col gap-1 animate-fade-in" style={{ marginLeft: depth > 0 ? `${depth * 8}px` : '0px' }}>
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
        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs transition-all duration-200 cursor-pointer ${
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
          
          {/* Clickable Group Color Dot */}
          <div className="relative shrink-0 flex items-center">
            <button
              ref={dotButtonRef}
              type="button"
              onClick={handleOpenPicker}
              className="flex items-center justify-center p-0.5 rounded-full hover:bg-white/10 transition shrink-0"
              title="Modifier la couleur du groupe"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_6px_var(--color)]" style={{ backgroundColor: group.color, '--color': group.color } as React.CSSProperties} />
            </button>
            
            {showPicker && (
              <div
                ref={popoverRef}
                onClick={(e) => e.stopPropagation()}
                className="fixed p-3 bg-slate-950/95 border border-white/10 rounded-xl shadow-2xl z-[9999] flex flex-col gap-2 w-44 animate-fade-in text-left text-xs"
                style={{ top: pickerPos.top, left: pickerPos.left }}
              >
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">Couleur du groupe</span>
                <div className="flex flex-wrap gap-1.5">
                  {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#f97316', '#ef4444', '#3b82f6', '#14b8a6'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateGroupColor(group.id, color);
                        setShowPicker(false);
                      }}
                      className="w-4 h-4 rounded-full border border-white/20 transition-transform duration-150 hover:scale-125 hover:border-white/60"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={group.color}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => { e.stopPropagation(); onUpdateGroupColor(group.id, e.target.value); }}
                    className="w-4 h-4 rounded-full border border-white/20 cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Group Name (Double click to edit) */}
          {isEditingName ? (
            <input
              type="text"
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSave();
                if (e.key === 'Escape') {
                  setIsEditingName(false);
                  setEditNameValue(group.name);
                }
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              className="glass-input text-[11px] py-0.5 px-1.5 w-28 h-6"
            />
          ) : (
            <span 
              className="truncate text-slate-300 font-bold hover:text-white transition-colors"
              onDoubleClick={handleDoubleClick}
              title="Double-cliquez pour renommer"
            >
              {group.name}
            </span>
          )}
          
          <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-[9px] text-slate-400 font-bold shrink-0">
            {memberCount}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button 
            onClick={handleCreateSubgroup}
            className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition"
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
              onDeleteGroup(group.id);
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
          {childGroups.map(sub => (
            <GroupRow
              key={sub.id}
              group={sub}
              depth={depth + 1}
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
          ))}

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
              onUpdateColor={onUpdateArtistColor}
              onUpdateIcon={onUpdateArtistIcon}
              onUpdateName={onUpdateArtistName}
            />
          ))}
        </div>
      )}
    </div>

    {/* Subgroup Creation Modal */}
    <AppModal
      isOpen={showSubgroupModal}
      title={`Nouveau sous-groupe`}
      subtitle={`dans "${group.name}"`}
      icon="📁"
      placeholder="Nom du sous-groupe..."
      confirmLabel="Créer"
      cancelLabel="Annuler"
      showColorPicker
      defaultColor={group.color}
      onConfirm={(name, color) => {
        onCreateGroup(name, color, group.id);
        setShowSubgroupModal(false);
      }}
      onCancel={() => setShowSubgroupModal(false)}
    />
    </>
  );
};
