import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
      const popoverWidth = 224;
      const margin = 10;
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - margin;
      }
      setPickerPos({ top: rect.bottom + 6, left });
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
          {showPicker && createPortal(
            <div
              ref={popoverRef}
              onClick={(e) => e.stopPropagation()}
              className="actor-picker-popover animate-fade-in"
              style={{ top: pickerPos.top, left: pickerPos.left }}
            >
              <div className="picker-section-header">
                <span className="picker-section-title">Couleur</span>
              </div>
              
              {/* Swatches Grid */}
              <div className="picker-color-grid">
                {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#f97316', '#ef4444', '#3b82f6', '#14b8a6', '#d946ef'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onUpdateColor?.(artist.id, color); setShowPicker(false); }}
                    className={`picker-color-swatch ${artist.color === color ? 'active' : ''}`}
                    style={{ backgroundColor: color, '--swatch-color': color } as React.CSSProperties}
                    title={color}
                  />
                ))}
                
                {/* Custom Color Native Picker */}
                <div className="picker-custom-color-btn" title="Couleur personnalisée">
                  <input
                    type="color"
                    value={artist.color}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => { e.stopPropagation(); onUpdateColor?.(artist.id, e.target.value); }}
                    className="picker-custom-color-input"
                  />
                  <span className="text-[10px] text-white font-bold pointer-events-none">+</span>
                </div>
              </div>

              <div className="picker-divider" />

              <div className="picker-section-header">
                <span className="picker-section-title">Icône (Rôle)</span>
              </div>
              
              {/* Emojis Grid */}
              <div className="picker-emoji-grid">
                {['🧔', '👩', '🧙', '🧑', '👑', '👸', '🤴', '💂', '🏇', '⚔️', '🛡️', '🏹', '🚂', '⛏️', '🔥', '🕯️', '🌟', '🐎', '🐑', '🦆', '🐕', '🕊️'].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onUpdateIcon?.(artist.id, emoji); }}
                    className={`picker-emoji-btn ${artist.icon === emoji ? 'active' : ''}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Reset to initial letters */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onUpdateIcon?.(artist.id, null); }}
                className="picker-reset-btn"
              >
                <Smile size={10} /> Initiales (Aa)
              </button>
            </div>,
            document.body
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
