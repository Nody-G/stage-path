import React, { useState, useEffect } from 'react';
import { Trash2, Smile } from 'lucide-react';
import { Project } from '../../types';

const ICON_CATEGORIES = [
  {
    name: 'Land of the Vikings : Personnages',
    icons: ['🧔', '👩', '🪓', '🧙', '🏹', '🧑‍🌾', '⚔️', '👶', '🐦', '🐺', '🐻', '🐍']
  },
  {
    name: 'Kynren : Royaux, Chevaliers & Soldats',
    icons: ['👑', '👸', '🤴', '💂', '🏇', '⚔️', '🛡️', '🏹', '🌹', '⚜️']
  },
  {
    name: 'Kynren : Mineurs & Révolution (Locomotion No. 1)',
    icons: ['⛏️', '🚂', '🎩', '🔦', '🪙', '⚙️', '🔔', '📜']
  },
  {
    name: 'Kynren : Animaux de Scène',
    icons: ['🐎', '🐑', '🦆', '🐐', '🐂', '🐕', '🐓', '🕊️']
  },
  {
    name: 'Kynren : Invasions & Légendes (Vikings, Romains, St George)',
    icons: ['⛵', '🪓', '🏛️', '🐉', '🧙', '🔥', '🚩']
  },
  {
    name: 'Têtes & Héros',
    icons: ['🧔', '👩', '🥷', '🤡', '👽', '👹', '👻', '🤖']
  },
  {
    name: 'Magie & Occulte',
    icons: ['🪄', '🔮', '🧪', '🕯️', '🧹', '🌟', '🧿', '🗝️', '🌌', '👁️']
  }
];

const EMOJI_NAMES: Record<string, string> = {
  // Category: Land of the Vikings
  '🧑‍🌾': 'Villageois',
  '👶': 'Skane (Nouveau-né)',
  '🐦': 'Totem Corbeau',
  '🐺': 'Totem Loup',
  '🐻': 'Totem Ours',
  '🐍': 'Totem Serpent',

  // Category 1: Royaux, Chevaliers & Soldats
  '👑': 'Couronne',
  '👸': 'Princesse',
  '🤴': 'Prince',
  '💂': 'Garde',
  '🏇': 'Cavalier',
  '⚔️': 'Assaillant / Épées',
  '🛡️': 'Bouclier',
  '🏹': 'Freydis / Arc',
  '🌹': 'Rose',
  '⚜️': 'Fleur de lys',
  
  // Category 2: Mineurs & Révolution
  '⛏️': 'Pioche',
  '🚂': 'Locomotive',
  '🎩': 'Haut-de-forme',
  '🔦': 'Lampe torche',
  '🪙': 'Pièce',
  '⚙️': 'Engrenage',
  '🔔': 'Cloche',
  '📜': 'Parchemin',
  
  // Category 3: Animaux de Scène
  '🐎': 'Cheval',
  '🐑': 'Mouton',
  '🦆': 'Canard',
  '🐐': 'Chèvre',
  '🐂': 'Bœuf',
  '🐕': 'Chien',
  '🐓': 'Coq',
  '🕊️': 'Colombe',
  
  // Category 4: Invasions & Légendes
  '⛵': 'Bateau',
  '🪓': 'Skarde / Hache',
  '🏛️': 'Monument',
  '🐉': 'Dragon',
  '🧙': 'Le Gothi / Magicien',
  '🔥': 'Feu',
  '🚩': 'Drapeau',
  
  // Category 5: Héros
  '🧔': 'Eirik (Chef du village)',
  '👩': 'Sigrid (Femme du Chef)',
  '🥷': 'Ninja',
  '🤡': 'Clown',
  '👽': 'Alien',
  '👹': 'Ogre',
  '👻': 'Fantôme',
  '🤖': 'Robot',
  
  // Category 6: Magie
  '🪄': 'Baguette magique',
  '🔮': 'Boule de cristal',
  '🧪': 'Potion',
  '🕯️': 'Bougie',
  '🧹': 'Balai',
  '🌟': 'Étoile',
  '🧿': 'Amulette',
  '🗝️': 'Clé',
  '🌌': 'Galaxie',
  '👁️': 'Œil',
  
  // Reset
  'Aa': 'Initiales de lettres'
};

interface ArtistEditPanelProps {
  project: Project;
  activeArtistId: string | null;
  onDeleteArtist: (id: string) => void;
  onUpdateArtistName: (id: string, name: string) => void;
  onUpdateArtistColor: (id: string, color: string) => void;
  onUpdateArtistIcon: (id: string, icon: string | null) => void;
  onToggleArtistPathVisibility: (id: string) => void;
  onToggleArtistGroup: (artistId: string, groupId: string) => void;
}

export const ArtistEditPanel: React.FC<ArtistEditPanelProps> = ({
  project,
  activeArtistId,
  onDeleteArtist,
  onUpdateArtistName,
  onUpdateArtistColor,
  onUpdateArtistIcon,
  onToggleArtistPathVisibility,
  onToggleArtistGroup,
}) => {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  useEffect(() => {
    setShowIconPicker(false);
    setHoveredEmoji(null);
  }, [activeArtistId]);

  const activeArtist = project.artists.find(art => art.id === activeArtistId);
  if (!activeArtist) return null;

  return (
    <div className="bg-slate-900/30 border border-indigo-500/20 p-4 rounded-xl flex flex-col gap-3 animate-fade-in">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-indigo-300 font-bold tracking-wider">ÉDITION DU FIGURANT</span>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Supprimer définitivement le figurant ${activeArtist.name} ?`)) {
              onDeleteArtist(activeArtist.id);
            }
          }}
          className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 transition"
          title="Supprimer définitivement"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={activeArtist.name}
          onChange={(e) => onUpdateArtistName(activeArtist.id, e.target.value)}
          className="glass-input flex-1 text-xs"
        />
        <input 
          type="color" 
          value={activeArtist.color}
          onChange={(e) => onUpdateArtistColor(activeArtist.id, e.target.value)}
          className="w-9 h-9 rounded-lg border border-white/10 cursor-pointer bg-transparent"
          title="Choisir la couleur"
        />
        <button
          type="button"
          onClick={() => setShowIconPicker(!showIconPicker)}
          className={`w-9 h-9 rounded-lg border flex items-center justify-center text-sm transition-all select-none ${
            showIconPicker 
              ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' 
              : 'border-white/10 bg-slate-900/40 text-slate-400 hover:border-white/20 hover:text-white'
          }`}
          title="Choisir l'icône"
        >
          {activeArtist.icon || <Smile size={14} />}
        </button>
      </div>

      {/* Icon Selection Popover */}
      {showIconPicker && (
        <div className="bg-[#050608]/40 border border-white/5 p-3 rounded-xl flex flex-col gap-2 mt-1 animate-fade-in">
          <div className="flex items-center justify-between h-5 min-h-[20px] border-b border-white/5 pb-1 mb-1">
            {hoveredEmoji ? (
              <div className="flex items-center gap-1.5 animate-fade-in">
                <span className="text-sm">{hoveredEmoji}</span>
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                  {EMOJI_NAMES[hoveredEmoji] || 'Rôle'}
                </span>
              </div>
            ) : (
              <span className="text-[9px] text-slate-400 font-bold tracking-wider">ICÔNES DE RÔLE</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1 select-none pt-0.5">
            <button
              type="button"
              onClick={() => {
                onUpdateArtistIcon(activeArtist.id, null);
                setShowIconPicker(false);
              }}
              onMouseEnter={() => setHoveredEmoji('Aa')}
              onMouseLeave={() => setHoveredEmoji(null)}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold transition-all hover:scale-[1.3] hover:z-10 hover:border-indigo-400/50 hover:bg-indigo-600/20 ${
                !activeArtist.icon 
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' 
                  : 'border-white/5 bg-slate-900/40 text-slate-450 hover:border-white/15'
              }`}
              title="Aucune (Initiales de lettres)"
            >
              Aa
            </button>
            
            {Array.from(new Set(ICON_CATEGORIES.flatMap(c => c.icons))).map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onUpdateArtistIcon(activeArtist.id, emoji);
                  setShowIconPicker(false);
                }}
                onMouseEnter={() => setHoveredEmoji(emoji)}
                onMouseLeave={() => setHoveredEmoji(null)}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center text-base transition-all hover:scale-[1.3] hover:z-10 hover:border-indigo-400/50 hover:bg-indigo-600/20 ${
                  activeArtist.icon === emoji 
                    ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-[0_0_8px_rgba(99,102,241,0.2)]' 
                    : 'border-white/5 bg-slate-900/20 hover:border-white/10 hover:bg-slate-900/40'
                }`}
                title={EMOJI_NAMES[emoji] || emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toggle individual path visibility */}
      <label className="flex items-center justify-between cursor-pointer group mt-1.5 pt-1.5 border-t border-white/5">
        <span className="text-[11px] text-slate-300 font-medium">Afficher la trajectoire</span>
        <div className="relative font-sans">
          <input
            type="checkbox"
            checked={activeArtist.showPath !== false}
            onChange={() => onToggleArtistPathVisibility(activeArtist.id)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition-colors duration-200" />
          <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
        </div>
      </label>

      {/* Associate Groups */}
      <div className="mt-1 pt-3 border-t border-white/5">
        <span className="text-[10px] text-slate-400 block mb-2 font-semibold">Groupes associés :</span>
        <div className="flex flex-wrap gap-1">
          {project.groups.map(group => {
            const isAssoc = activeArtist.groupIds.includes(group.id);
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => onToggleArtistGroup(activeArtist.id, group.id)}
                className={`px-2 py-0.5 rounded text-[10px] transition border ${
                  isAssoc 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 font-semibold' 
                    : 'bg-transparent border-white/5 text-slate-400 hover:border-white/10'
                }`}
              >
                {group.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
