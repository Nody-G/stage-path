import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Star, Trash2, Route, Smile } from 'lucide-react';
import { Artist } from '../../types';

interface ArtistRowItemProps {
  artist: Artist;
  isSelected: boolean;
  onSelect: () => void;
  onToggleHighlight: () => void;
  onToggleVisibility: () => void;
  onTogglePathVisibility?: () => void;
  onRemoveOrDelete: () => void;
  mode: 'ungrouped' | 'grouped';
  onUpdateColor?: (id: string, color: string) => void;
  onUpdateIcon?: (id: string, icon: string | null) => void;
  onUpdateName?: (id: string, name: string) => void;
}

export const ArtistRowItem: React.FC<ArtistRowItemProps> = ({
  artist,
  isSelected,
  onSelect,
  onToggleHighlight,
  onToggleVisibility,
  onTogglePathVisibility,
  onRemoveOrDelete,
  mode,
  onUpdateColor,
  onUpdateIcon,
  onUpdateName,
}) => {
  const isUngrouped = mode === 'ungrouped';
  
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(artist.name);
  
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
    setShowPicker(prev => !prev);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingName(true);
    setEditNameValue(artist.name);
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    if (editNameValue.trim() && editNameValue.trim() !== artist.name) {
      onUpdateName?.(artist.id, editNameValue.trim());
    }
  };

  return (
    <div
      onClick={onSelect}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', artist.id);
        e.dataTransfer.effectAllowed = 'copyMove';
      }}
      className={`flex items-center justify-between rounded-lg border cursor-pointer transition-all duration-200 select-none active:scale-[0.98] ${
        isUngrouped
          ? `py-1.5 px-2.5 text-xs ${
              isSelected
                ? 'border-indigo-500/40 bg-indigo-500/10 text-white font-semibold shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                : 'border-white/5 bg-slate-900/10 text-slate-300 hover:bg-slate-800/20 hover:border-slate-800'
            }`
          : `py-1 px-2 text-[11px] ${
              isSelected
                ? 'border-indigo-500/30 bg-indigo-500/5 text-white font-medium shadow-[0_0_10px_rgba(99,102,241,0.03)]'
                : 'border-transparent bg-slate-900/5 text-slate-400 hover:bg-slate-800/10 hover:border-white/5 hover:text-slate-200'
            }`
      }`}
    >
      <div className="flex items-center gap-2.5 truncate mr-1">
        {/* Clickable Color/Icon Bubble */}
        <div className="relative shrink-0">
          <button
            ref={dotButtonRef}
            type="button"
            onClick={handleOpenPicker}
            className="flex items-center justify-center p-0.5 rounded-full hover:bg-white/10 transition shrink-0"
            title="Modifier l'icône ou la couleur"
          >
            {artist.icon ? (
              <span className="text-sm select-none" style={{ transform: 'scale(1.1)' }}>
                {artist.icon}
              </span>
            ) : (
              <span
                className={`${isUngrouped ? 'w-2.5 h-2.5 shadow-[0_0_6px_var(--color)]' : 'w-1.5 h-1.5'} rounded-full`}
                style={{ backgroundColor: artist.color, '--color': artist.color } as React.CSSProperties}
              />
            )}
          </button>

          {/* Floating Color & Icon Picker Popover */}
          {showPicker && (
            <div
              ref={popoverRef}
              onClick={(e) => e.stopPropagation()}
              className="fixed p-3 bg-slate-950/95 border border-white/10 rounded-xl shadow-2xl z-[9999] flex flex-col gap-2.5 w-60 animate-fade-in text-left text-xs"
              style={{ top: pickerPos.top, left: pickerPos.left }}
            >
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Couleur</span>
              
              {/* Swatches Grid */}
              <div className="flex flex-wrap gap-1.5">
                {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#f97316', '#ef4444', '#3b82f6', '#14b8a6'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onUpdateColor?.(artist.id, color); setShowPicker(false); }}
                    className="w-4 h-4 rounded-full border border-white/20 transition-transform duration-150 hover:scale-125 hover:border-white/60"
                    style={{ backgroundColor: color }}
                  />
                ))}
                {/* Custom Color Native Picker */}
                <input
                  type="color"
                  value={artist.color}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { e.stopPropagation(); onUpdateColor?.(artist.id, e.target.value); }}
                  className="w-4 h-4 rounded-full border border-white/20 cursor-pointer bg-transparent"
                  title="Couleur personnalisée"
                />
              </div>

              <div className="h-px bg-white/5" />

              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Icône (Rôle)</span>
              
              {/* Emojis Grid */}
              <div className="grid grid-cols-6 gap-1 max-h-[100px] overflow-y-auto pr-1">
                {['🧔', '👩', '🧙', '🧑', '👑', '👸', '🤴', '💂', '🏇', '⚔️', '🛡️', '🏹', '🚂', '⛏️', '🔥', '🕯️', '🌟', '🐎', '🐑', '🦆', '🐕', '🕊️'].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onUpdateIcon?.(artist.id, emoji); }}
                    className={`p-1 text-sm rounded hover:bg-white/10 transition-all ${
                      artist.icon === emoji ? 'bg-indigo-500/20 border border-indigo-500/40' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Reset to initial letters */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onUpdateIcon?.(artist.id, null); }}
                className="w-full py-1 text-[10px] bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded transition text-center font-bold text-slate-300 flex items-center justify-center gap-1"
              >
                <Smile size={10} /> Initiales (Aa)
              </button>
            </div>
          )}
        </div>

        {/* Double-Click Editable Name */}
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
                setEditNameValue(artist.name);
              }
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            className="glass-input text-[11px] py-0.5 px-1.5 w-28 h-6"
          />
        ) : (
          <span 
            className="truncate font-medium hover:text-white transition-colors" 
            onDoubleClick={handleDoubleClick}
            title="Double-cliquez pour renommer"
          >
            {artist.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onToggleHighlight}
          className={`p-1 rounded hover:bg-white/5 transition ${
            artist.highlighted ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-slate-300'
          }`}
          title={artist.highlighted ? 'Retirer de la mise en avant' : 'Mettre en avant (opacifier les autres)'}
        >
          <Star size={isUngrouped ? 12 : 11} className={artist.highlighted ? 'fill-amber-400' : ''} />
        </button>

        <button
          onClick={onToggleVisibility}
          className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition"
          title={artist.visible ? 'Masquer' : 'Afficher'}
        >
          {artist.visible ? (
            <Eye size={isUngrouped ? 12 : 11} />
          ) : (
            <EyeOff size={isUngrouped ? 12 : 11} className="text-red-400" />
          )}
        </button>

        <button
          onClick={onTogglePathVisibility}
          className={`p-1 rounded hover:bg-white/5 transition ${
            artist.showPath !== false ? 'text-indigo-400 hover:text-indigo-300' : 'text-slate-500 hover:text-slate-300'
          }`}
          title={artist.showPath !== false ? 'Masquer la trajectoire' : 'Afficher la trajectoire'}
        >
          <Route size={isUngrouped ? 12 : 11} className={artist.showPath !== false ? 'opacity-100' : 'opacity-40'} />
        </button>

        <button
          onClick={onRemoveOrDelete}
          className={`p-1 rounded transition ${
            isUngrouped
              ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300'
              : 'hover:bg-white/5 text-slate-500 hover:text-red-400'
          }`}
          title={isUngrouped ? 'Supprimer définitivement' : 'Retirer du groupe'}
        >
          {isUngrouped ? <Trash2 size={12} /> : <span className="text-[10px] font-bold px-0.5">×</span>}
        </button>
      </div>
    </div>
  );
};
