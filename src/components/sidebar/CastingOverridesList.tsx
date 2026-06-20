import React from 'react';
import { Route } from 'lucide-react';
import { Project, Group } from '../../types';
import { ExportSettings, ArtistVisibility } from '../../hooks/useVideoExport';

interface CastingOverridesListProps {
  project: Project;
  settings: ExportSettings;
  setSettings: React.Dispatch<React.SetStateAction<ExportSettings>>;
  isExporting: boolean;
  onArtistOverrideChange: (artistId: string, value: ArtistVisibility) => void;
}

export const CastingOverridesList: React.FC<CastingOverridesListProps> = ({
  project,
  settings,
  setSettings,
  isExporting,
  onArtistOverrideChange,
}) => {
  const renderExportGroupTree = (group: Group, depth = 0) => {
    const groupArtists = project.artists.filter(a => a.groupIds.includes(group.id));
    const childGroups = project.groups.filter(g => g.parentId === group.id);
    
    const isPathOverridden = settings.groupPathOverrides[group.id] !== undefined;
    const showGroupPath = isPathOverridden ? settings.groupPathOverrides[group.id] : (group.showPath !== false);
    const currentGroupVisibility = settings.groupOverrides[group.id] || 'normal';

    const handleToggleGroupPath = () => {
      setSettings((prev: ExportSettings) => ({
        ...prev,
        groupPathOverrides: {
          ...prev.groupPathOverrides,
          [group.id]: !showGroupPath,
        },
      }));
    };

    const handleGroupOverrideChange = (value: ArtistVisibility) => {
      setSettings((prev: ExportSettings) => ({
        ...prev,
        groupOverrides: {
          ...prev.groupOverrides,
          [group.id]: value,
        },
      }));
    };

    return (
      <div key={group.id} className="flex flex-col gap-1" style={{ marginLeft: depth > 0 ? `${depth * 8}px` : '0px' }}>
        {/* Group header row */}
        <div className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
          <div className="flex items-center gap-1.5 truncate mr-2">
            <span className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_4px_var(--color)]" style={{ backgroundColor: group.color, '--color': group.color } as React.CSSProperties} />
            <span className="text-slate-350 font-bold truncate text-[11px]">{group.name}</span>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {settings.showMovementPaths && (
              <button
                type="button"
                onClick={handleToggleGroupPath}
                disabled={isExporting}
                className={`p-1 rounded hover:bg-white/5 transition scale-[0.9] origin-right ${
                  showGroupPath ? 'text-indigo-400 hover:text-indigo-300' : 'text-slate-500 hover:text-slate-350'
                }`}
                title={showGroupPath ? "Masquer la trajectoire du groupe" : "Afficher la trajectoire du groupe"}
              >
                <Route size={12} className={showGroupPath ? 'opacity-100' : 'opacity-40'} />
              </button>
            )}

            <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5 scale-[0.85] origin-right shrink-0">
              <button
                type="button"
                onClick={() => handleGroupOverrideChange('normal')}
                disabled={isExporting}
                className={`px-1.5 py-0.5 rounded-md font-bold text-[8px] transition ${
                  currentGroupVisibility === 'normal'
                    ? 'bg-indigo-650 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => handleGroupOverrideChange('faible')}
                disabled={isExporting}
                className={`px-1.5 py-0.5 rounded-md font-bold text-[8px] transition ${
                  currentGroupVisibility === 'faible'
                    ? 'bg-amber-600/30 text-amber-350 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Faible
              </button>
              <button
                type="button"
                onClick={() => handleGroupOverrideChange('masque')}
                disabled={isExporting}
                className={`px-1.5 py-0.5 rounded-md font-bold text-[8px] transition ${
                  currentGroupVisibility === 'masque'
                    ? 'bg-red-550/15 text-red-400 border border-red-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Masqué
              </button>
            </div>
          </div>
        </div>

        {/* Children */}
        {(childGroups.length > 0 || groupArtists.length > 0) && (
          <div className="flex flex-col gap-1 ml-2 pl-2 border-l border-white/5">
            {childGroups.map(sub => renderExportGroupTree(sub, depth + 1))}
            {groupArtists.map(artist => {
              const currentOverride = settings.castingOverrides[artist.id] || 'normal';
              const isArtistPathOverridden = settings.castingPathOverrides[artist.id] !== undefined;
              const showArtistPath = isArtistPathOverridden ? settings.castingPathOverrides[artist.id] : (artist.showPath !== false);

              const handleToggleArtistPath = () => {
                setSettings((prev: ExportSettings) => ({
                  ...prev,
                  castingPathOverrides: {
                    ...prev.castingPathOverrides,
                    [artist.id]: !showArtistPath,
                  },
                }));
              };

              return (
                <div key={artist.id} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2 truncate mr-2">
                    {artist.icon ? (
                      <span className="text-xs shrink-0 select-none mr-0.5">{artist.icon}</span>
                    ) : (
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_6px_var(--color)]" 
                        style={{ backgroundColor: artist.color, '--color': artist.color } as React.CSSProperties} 
                      />
                    )}
                    <span className="text-slate-300 font-medium truncate text-[11px]">{artist.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {settings.showMovementPaths && (
                      <button
                        type="button"
                        onClick={handleToggleArtistPath}
                        disabled={isExporting}
                        className={`p-1 rounded hover:bg-white/5 transition scale-[0.9] ${
                          showArtistPath ? 'text-indigo-400' : 'text-slate-500'
                        }`}
                        title={showArtistPath ? "Masquer la trajectoire" : "Afficher la trajectoire"}
                      >
                        <Route size={11} className={showArtistPath ? 'opacity-100' : 'opacity-40'} />
                      </button>
                    )}

                    <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5 scale-[0.85] origin-right shrink-0">
                      <button
                        type="button"
                        onClick={() => onArtistOverrideChange(artist.id, 'normal')}
                        disabled={isExporting}
                        className={`px-1.5 py-0.5 rounded-md font-bold text-[8px] transition ${
                          currentOverride === 'normal'
                            ? 'bg-indigo-650 text-white font-semibold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Normal
                      </button>
                      <button
                        type="button"
                        onClick={() => onArtistOverrideChange(artist.id, 'faible')}
                        disabled={isExporting}
                        className={`px-1.5 py-0.5 rounded-md font-bold text-[8px] transition ${
                          currentOverride === 'faible'
                            ? 'bg-amber-600/30 text-amber-350 border border-amber-500/20'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Faible
                      </button>
                      <button
                        type="button"
                        onClick={() => onArtistOverrideChange(artist.id, 'masque')}
                        disabled={isExporting}
                        className={`px-1.5 py-0.5 rounded-md font-bold text-[8px] transition ${
                          currentOverride === 'masque'
                            ? 'bg-red-550/15 text-red-400 border border-red-500/10'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Masqué
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const topGroups = project.groups.filter(g => !g.parentId);
  const ungroupedArtists = project.artists.filter(a => a.groupIds.length === 0);

  return (
    <div className="flex flex-col gap-2">
      {topGroups.map(group => renderExportGroupTree(group))}
      
      {ungroupedArtists.length > 0 && (
        <div className="flex flex-col gap-1 mt-1.5 border-t border-white/5 pt-1.5">
          <span className="text-[10px] text-slate-500 block font-semibold mb-1">Acteurs libres :</span>
          {ungroupedArtists.map(artist => {
            const currentOverride = settings.castingOverrides[artist.id] || 'normal';
            const isArtistPathOverridden = settings.castingPathOverrides[artist.id] !== undefined;
            const showArtistPath = isArtistPathOverridden ? settings.castingPathOverrides[artist.id] : (artist.showPath !== false);

            const handleToggleArtistPath = () => {
              setSettings((prev: ExportSettings) => ({
                ...prev,
                castingPathOverrides: {
                  ...prev.castingPathOverrides,
                  [artist.id]: !showArtistPath,
                },
              }));
            };

            return (
              <div key={artist.id} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2 truncate mr-2">
                  {artist.icon ? (
                    <span className="text-xs shrink-0 select-none mr-0.5">{artist.icon}</span>
                  ) : (
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_6px_var(--color)]" 
                      style={{ backgroundColor: artist.color, '--color': artist.color } as React.CSSProperties} 
                    />
                  )}
                  <span className="text-slate-300 font-medium truncate text-[11px]">{artist.name}</span>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {settings.showMovementPaths && (
                    <button
                      type="button"
                      onClick={handleToggleArtistPath}
                      disabled={isExporting}
                      className={`p-1 rounded hover:bg-white/5 transition scale-[0.9] ${
                        showArtistPath ? 'text-indigo-400' : 'text-slate-500'
                      }`}
                      title={showArtistPath ? "Masquer la trajectoire" : "Afficher la trajectoire"}
                    >
                      <Route size={11} className={showArtistPath ? 'opacity-100' : 'opacity-40'} />
                    </button>
                  )}

                  <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5 scale-[0.85] origin-right shrink-0">
                    <button
                      type="button"
                      onClick={() => onArtistOverrideChange(artist.id, 'normal')}
                      disabled={isExporting}
                      className={`px-1.5 py-0.5 rounded-md font-bold text-[8px] transition ${
                        currentOverride === 'normal'
                          ? 'bg-indigo-650 text-white font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => onArtistOverrideChange(artist.id, 'faible')}
                      disabled={isExporting}
                      className={`px-1.5 py-0.5 rounded-md font-bold text-[8px] transition ${
                        currentOverride === 'faible'
                          ? 'bg-amber-600/30 text-amber-350 border border-amber-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Faible
                    </button>
                    <button
                      type="button"
                      onClick={() => onArtistOverrideChange(artist.id, 'masque')}
                      disabled={isExporting}
                      className={`px-1.5 py-0.5 rounded-md font-bold text-[8px] transition ${
                        currentOverride === 'masque'
                          ? 'bg-red-550/15 text-red-400 border border-red-500/10'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Masqué
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
