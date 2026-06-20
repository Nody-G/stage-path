import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Smile } from 'lucide-react';
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
  onCreateArtist: (name: string, color: string, icon?: string | null) => void;
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
  const [newArtistIcon, setNewArtistIcon] = useState<string | null>(null);
  const [showAddArtist, setShowAddArtist] = useState(false);

  // Popover States for creation forms
  const [showArtistColorPicker, setShowArtistColorPicker] = useState(false);
  const [artistColorPickerPos, setArtistColorPickerPos] = useState({ top: 0, left: 0 });
  const [showGroupColorPicker, setShowGroupColorPicker] = useState(false);
  const [groupColorPickerPos, setGroupColorPickerPos] = useState({ top: 0, left: 0 });

  const artistDotRef = useRef<HTMLButtonElement>(null);
  const artistPopoverRef = useRef<HTMLDivElement>(null);
  const groupDotRef = useRef<HTMLButtonElement>(null);
  const groupPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        showArtistColorPicker &&
        artistPopoverRef.current && !artistPopoverRef.current.contains(e.target as Node) &&
        artistDotRef.current && !artistDotRef.current.contains(e.target as Node)
      ) {
        setShowArtistColorPicker(false);
      }
      if (
        showGroupColorPicker &&
        groupPopoverRef.current && !groupPopoverRef.current.contains(e.target as Node) &&
        groupDotRef.current && !groupDotRef.current.contains(e.target as Node)
      ) {
        setShowGroupColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showArtistColorPicker, showGroupColorPicker]);

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
    onCreateArtist(newArtistName.trim(), newArtistColor, newArtistIcon);
    setNewArtistName('');
    setNewArtistIcon(null);
    setShowAddArtist(false);
  };

  const handleOpenArtistColorPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showArtistColorPicker && artistDotRef.current) {
      const rect = artistDotRef.current.getBoundingClientRect();
      const popoverWidth = 224;
      const margin = 10;
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - margin;
      }
      setArtistColorPickerPos({ top: rect.bottom + 6, left });
    }
    setShowArtistColorPicker(prev => !prev);
  };

  const handleOpenGroupColorPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showGroupColorPicker && groupDotRef.current) {
      const rect = groupDotRef.current.getBoundingClientRect();
      const popoverWidth = 224;
      const margin = 10;
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - margin;
      }
      setGroupColorPickerPos({ top: rect.bottom + 6, left });
    }
    setShowGroupColorPicker(prev => !prev);
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
              <button
                ref={artistDotRef}
                type="button"
                onClick={handleOpenArtistColorPicker}
                className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-sm transition-all hover:bg-white/5 active:scale-[0.95]"
                style={{ backgroundColor: newArtistColor }}
                title="Choisir la couleur ou l'icône"
              >
                {newArtistIcon ? (
                  <span className="text-base select-none">{newArtistIcon}</span>
                ) : (
                  <span className="text-[10px] text-white/80 font-bold uppercase">
                    {newArtistName ? newArtistName.slice(0, 2) : 'Aa'}
                  </span>
                )}
              </button>
              
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
              <button
                ref={groupDotRef}
                type="button"
                onClick={handleOpenGroupColorPicker}
                className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-sm transition-all hover:bg-white/5 active:scale-[0.95]"
                style={{ backgroundColor: newGroupColor }}
                title="Choisir la couleur"
              >
                <span className="text-[10px] text-white/80 font-bold uppercase">
                  {newGroupName ? newGroupName.slice(0, 2) : 'Gr'}
                </span>
              </button>
              
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

      {/* Artist creation color & icon picker popover */}
      {showArtistColorPicker && createPortal(
        <div
          ref={artistPopoverRef}
          onClick={(e) => e.stopPropagation()}
          className="actor-picker-popover animate-fade-in"
          style={{ top: artistColorPickerPos.top, left: artistColorPickerPos.left }}
        >
          <div className="picker-section-header">
            <span className="picker-section-title">Couleur de l'acteur</span>
          </div>
          
          <div className="picker-color-grid">
            {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#f97316', '#ef4444', '#3b82f6', '#14b8a6', '#d946ef'].map(color => (
              <button
                key={color}
                type="button"
                onClick={(e) => { e.stopPropagation(); setNewArtistColor(color); setShowArtistColorPicker(false); }}
                className={`picker-color-swatch ${newArtistColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color, '--swatch-color': color } as React.CSSProperties}
                title={color}
              />
            ))}
            
            <div className="picker-custom-color-btn" title="Couleur personnalisée">
              <input
                type="color"
                value={newArtistColor}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => { e.stopPropagation(); setNewArtistColor(e.target.value); }}
                className="picker-custom-color-input"
              />
              <span className="text-[10px] text-white font-bold pointer-events-none">+</span>
            </div>
          </div>

          <div className="picker-divider" />

          <div className="picker-section-header">
            <span className="picker-section-title">Icône (Rôle)</span>
          </div>
          
          <div className="picker-emoji-grid">
            {['🧔', '👩', '🧙', '🧑', '👑', '👸', '🤴', '💂', '🏇', '⚔️', '🛡️', '🏹', '🚂', '⛏️', '🔥', '🕯️', '🌟', '🐎', '🐑', '🦆', '🐕', '🕊️'].map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => { e.stopPropagation(); setNewArtistIcon(emoji); setShowArtistColorPicker(false); }}
                className={`picker-emoji-btn ${newArtistIcon === emoji ? 'active' : ''}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setNewArtistIcon(null); setShowArtistColorPicker(false); }}
            className="picker-reset-btn"
          >
            <Smile size={10} /> Initiales (Aa)
          </button>
        </div>,
        document.body
      )}

      {/* Group creation color picker popover */}
      {showGroupColorPicker && createPortal(
        <div
          ref={groupPopoverRef}
          onClick={(e) => e.stopPropagation()}
          className="actor-picker-popover animate-fade-in"
          style={{ top: groupColorPickerPos.top, left: groupColorPickerPos.left }}
        >
          <div className="picker-section-header">
            <span className="picker-section-title">Couleur du groupe</span>
          </div>
          
          <div className="picker-color-grid">
            {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#f97316', '#ef4444', '#3b82f6', '#14b8a6', '#d946ef'].map(color => (
              <button
                key={color}
                type="button"
                onClick={(e) => { e.stopPropagation(); setNewGroupColor(color); setShowGroupColorPicker(false); }}
                className={`picker-color-swatch ${newGroupColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color, '--swatch-color': color } as React.CSSProperties}
                title={color}
              />
            ))}
            
            <div className="picker-custom-color-btn" title="Couleur personnalisée">
              <input
                type="color"
                value={newGroupColor}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => { e.stopPropagation(); setNewGroupColor(e.target.value); }}
                className="picker-custom-color-input"
              />
              <span className="text-[10px] text-white font-bold pointer-events-none">+</span>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
