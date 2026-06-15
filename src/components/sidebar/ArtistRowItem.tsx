import { Eye, EyeOff, Star, Trash2, Route } from 'lucide-react';
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
}) => {
  const isUngrouped = mode === 'ungrouped';

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
          ? `p-2.5 text-xs ${
              isSelected
                ? 'border-indigo-500/40 bg-indigo-500/10 text-white font-semibold shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                : 'border-white/5 bg-slate-900/10 text-slate-300 hover:bg-slate-800/20 hover:border-slate-800'
            }`
          : `p-2 text-[11px] ${
              isSelected
                ? 'border-indigo-500/30 bg-indigo-500/5 text-white font-medium shadow-[0_0_10px_rgba(99,102,241,0.03)]'
                : 'border-transparent bg-slate-900/5 text-slate-400 hover:bg-slate-800/10 hover:border-white/5 hover:text-slate-200'
            }`
      }`}
    >
      <div className="flex items-center gap-2.5 truncate mr-1">
        {artist.icon ? (
          <span className="text-sm shrink-0 select-none mr-0.5" style={{ transform: 'scale(1.2)' }}>
            {artist.icon}
          </span>
        ) : (
          <span
            className={`${isUngrouped ? 'w-2.5 h-2.5 shadow-[0_0_6px_var(--color)]' : 'w-1.5 h-1.5'} rounded-full shrink-0`}
            style={{ backgroundColor: artist.color, ['--color' as any]: artist.color }}
          />
        )}
        <span className="truncate font-medium">{artist.name}</span>
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
