import React from 'react';
import { Project } from '../../types';
import { translations, Lang } from '../../utils/i18n';
import { Globe, Grid, Volume2, Star, Smile, Route } from 'lucide-react';
import { ImportExportPanel } from './ImportExportPanel';

interface OptionsTabProps {
  project: Project;
  lang: Lang;
  onLanguageChange: (lang: Lang) => void;
  onUpdateSetting: (key: string, val: any) => void;
  onImportProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportProject: () => void;
  onToggleConstantScale: () => void;
}

export const OptionsTab: React.FC<OptionsTabProps> = ({
  project,
  lang,
  onLanguageChange,
  onUpdateSetting,
  onImportProject,
  onExportProject,
  onToggleConstantScale,
}) => {
  const t = (key: keyof typeof translations['fr']) => {
    return translations[lang][key] || translations['fr'][key] || key;
  };

  const showGrid = project.settings?.showGrid !== false;
  const gridSpacing = project.settings?.gridSpacing || 1.0;
  const loopAudio = project.settings?.loopAudio === true;
  const highlightOpacity = project.settings?.highlightOpacity !== undefined ? project.settings.highlightOpacity : 0.5;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      
      {/* 1. Language settings */}
      <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
        <span className="text-[10px] text-cyan-400 font-bold block tracking-wider flex items-center gap-1.5">
          <Globe size={11} /> {t('appLanguage').toUpperCase()}
        </span>
        
        <div className="flex gap-2 bg-[#050608] p-1 border border-white/5 rounded-xl">
          <button
            type="button"
            onClick={() => onLanguageChange('fr')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              lang === 'fr'
                ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('langFrench')}
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              lang === 'en'
                ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('langEnglish')}
          </button>
        </div>
      </div>

      {/* 2. Performer Display settings */}
      <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3.5">
        <span className="text-[10px] text-cyan-400 font-bold block tracking-wider flex items-center gap-1.5">
          <Smile size={11} /> {lang === 'fr' ? "AFFICHAGE DES FIGURANTS" : "PERFORMER DISPLAY"}
        </span>

        {/* Toggle constant scale zoom */}
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-200 font-semibold">{t('constantScaleZoom')}</span>
            <span className="text-[9px] text-slate-500 mt-0.5">{t('constantScaleZoomDesc')}</span>
          </div>
          <div className="relative font-sans">
            <input
              type="checkbox"
              checked={!!project.settings?.constantScale}
              onChange={() => onToggleConstantScale()}
              className="sr-only peer"
            />
            <div className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition-colors duration-200" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
        </label>

        {/* Character size factor */}
        <div className="flex items-center justify-between text-[11px] gap-2 mt-1 pt-2 border-t border-white/5">
          <span className="text-slate-400 font-medium">{t('artistSize')}</span>
          <input 
            type="range" 
            min="0.2" 
            max="10.0" 
            step="0.05"
            value={project.settings?.constantScaleArtistSize ?? 1.0}
            onChange={(e) => onUpdateSetting('constantScaleArtistSize', parseFloat(e.target.value))}
            className="w-20 h-1 rounded-lg bg-white/10"
          />
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center bg-[#050608] border border-white/5 rounded px-1 w-14">
              <input 
                type="number"
                min="0.2"
                max="10.0"
                step="0.1"
                value={parseFloat((project.settings?.constantScaleArtistSize ?? 1.0).toFixed(2))}
                onChange={(e) => {
                  let val = parseFloat(e.target.value);
                  if (isNaN(val)) val = 1.0;
                  val = Math.max(0.2, Math.min(10.0, val));
                  onUpdateSetting('constantScaleArtistSize', val);
                }}
                className="w-full bg-transparent border-none text-[10px] text-indigo-300 font-semibold font-mono text-right focus:outline-none p-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[10px] text-indigo-400 font-mono font-bold ml-0.5">x</span>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSetting('constantScaleArtistSize', 1.0)}
              className="px-1.5 py-0.5 text-[8px] font-bold bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white rounded transition"
              title="Réinitialiser la taille à 1.0x"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Toggle initials background */}
        <label className="flex items-center justify-between cursor-pointer group mt-1 pt-2 border-t border-white/5">
          <span className="text-[11px] text-slate-200 font-semibold">
            {lang === 'fr' ? "Arrière-plan des initiales" : "Initials background"}
          </span>
          <div className="relative font-sans">
            <input
              type="checkbox"
              checked={project.settings?.showInitialsBackground !== false}
              onChange={(e) => onUpdateSetting('showInitialsBackground', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition-colors duration-200" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
        </label>

        {/* Toggle icon background */}
        <label className="flex items-center justify-between cursor-pointer group mt-1 pt-2 border-t border-white/5">
          <span className="text-[11px] text-slate-200 font-semibold">
            {lang === 'fr' ? "Arrière-plan des icônes" : "Icons background"}
          </span>
          <div className="relative font-sans">
            <input
              type="checkbox"
              checked={project.settings?.showIconBackground === true}
              onChange={(e) => onUpdateSetting('showIconBackground', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition-colors duration-200" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
        </label>

        {/* Toggle showing artist names */}
        <label className="flex items-center justify-between cursor-pointer group mt-1 pt-2 border-t border-white/5">
          <span className="text-[11px] text-slate-200 font-semibold">
            {lang === 'fr' ? "Afficher le nom des personnages" : "Show character names"}
          </span>
          <div className="relative font-sans">
            <input
              type="checkbox"
              checked={project.settings?.showArtistNames !== false}
              onChange={(e) => onUpdateSetting('showArtistNames', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition-colors duration-200" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
        </label>

        {/* Toggle showing artist positions */}
        <label className="flex items-center justify-between cursor-pointer group mt-1 pt-2 border-t border-white/5">
          <span className="text-[11px] text-slate-200 font-semibold">
            {lang === 'fr' ? "Afficher les coordonnées de position" : "Show position coordinates"}
          </span>
          <div className="relative font-sans">
            <input
              type="checkbox"
              checked={project.settings?.showArtistPositions === true}
              onChange={(e) => onUpdateSetting('showArtistPositions', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition-colors duration-200" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
        </label>
      </div>

      {/* 3. Grid & Graduations settings */}
      <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3.5">
        <span className="text-[10px] text-cyan-400 font-bold block tracking-wider flex items-center gap-1.5">
          <Grid size={11} /> {t('gridSettings').toUpperCase()}
        </span>

        {/* Show Grid */}
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-[11px] text-slate-200 font-semibold">{t('showGridLines')}</span>
          <div className="relative font-sans">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => onUpdateSetting('showGrid', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition-colors duration-200" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
        </label>

        {/* Grid Spacing */}
        {showGrid && (
          <div className="flex items-center justify-between text-[11px] mt-1 pt-2 border-t border-white/5 animate-fade-in">
            <span className="text-slate-400 font-medium">{t('gridCellSize')} :</span>
            <select
              value={gridSpacing}
              onChange={(e) => onUpdateSetting('gridSpacing', parseFloat(e.target.value))}
              className="bg-[#050608] border border-white/10 rounded-lg text-indigo-300 font-mono font-bold text-xs p-1 px-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="0.5">0.5m</option>
              <option value="1">1.0m</option>
              <option value="2">2.0m</option>
              <option value="5">5.0m</option>
            </select>
          </div>
        )}

        {/* Show Graduations */}
        <label className="flex items-center justify-between cursor-pointer group mt-1 pt-2 border-t border-white/5">
          <span className="text-[11px] text-slate-200 font-semibold">{t('showGraduations')}</span>
          <div className="relative font-sans">
            <input
              type="checkbox"
              checked={project.settings?.showGraduations === true}
              onChange={(e) => onUpdateSetting('showGraduations', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition-colors duration-200" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
        </label>

        {/* Constant scale graduations */}
        {project.settings?.showGraduations === true && (
          <>
            <label className="flex items-center justify-between cursor-pointer group mt-1 pt-2 border-t border-white/5 animate-fade-in">
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-200 font-semibold">{t('constantScaleMeters')}</span>
                <span className="text-[9px] text-slate-500 mt-0.5">{t('constantScaleMetersDesc')}</span>
              </div>
              <div className="relative font-sans">
                <input
                  type="checkbox"
                  checked={project.settings?.constantScaleMeters === true}
                  onChange={(e) => onUpdateSetting('constantScaleMeters', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition-colors duration-200" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
              </div>
            </label>

            {/* Meters scale text size factor */}
            <div className="flex items-center justify-between text-[11px] gap-2 mt-1 pt-2 border-t border-white/5 animate-fade-in">
              <span className="text-slate-400 font-medium">{t('graduationSize')}</span>
              <input 
                type="range" 
                min="0.2" 
                max="10.0" 
                step="0.05"
                value={project.settings?.constantScaleMetersSize ?? 1.0}
                onChange={(e) => onUpdateSetting('constantScaleMetersSize', parseFloat(e.target.value))}
                className="w-20 h-1 rounded-lg bg-white/10"
              />
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex items-center bg-[#050608] border border-white/5 rounded px-1 w-14">
                  <input 
                    type="number"
                    min="0.2"
                    max="10.0"
                    step="0.1"
                    value={parseFloat((project.settings?.constantScaleMetersSize ?? 1.0).toFixed(2))}
                    onChange={(e) => {
                      let val = parseFloat(e.target.value);
                      if (isNaN(val)) val = 1.0;
                      val = Math.max(0.2, Math.min(10.0, val));
                      onUpdateSetting('constantScaleMetersSize', val);
                    }}
                    className="w-full bg-transparent border-none text-[10px] text-indigo-300 font-semibold font-mono text-right focus:outline-none p-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] text-indigo-400 font-mono font-bold ml-0.5">x</span>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSetting('constantScaleMetersSize', 1.0)}
                  className="px-1.5 py-0.5 text-[8px] font-bold bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white rounded transition"
                  title="Réinitialiser la taille à 1.0x"
                >
                  Reset
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 4. Movement Paths settings */}
      <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3.5">
        <span className="text-[10px] text-cyan-400 font-bold block tracking-wider flex items-center gap-1.5">
          <Route size={11} /> {lang === 'fr' ? "CHEMINS DE DÉPLACEMENT" : "MOVEMENT PATHS"}
        </span>

        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-[11px] text-slate-200 font-semibold">
            {lang === 'fr' ? "Afficher les chemins de déplacement" : "Show movement paths"}
          </span>
          <div className="relative font-sans">
            <input
              type="checkbox"
              checked={project.settings?.showMovementPaths !== false}
              onChange={(e) => onUpdateSetting('showMovementPaths', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition-colors duration-200" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
        </label>

        {/* Toggle showing movement point values/labels */}
        <label className="flex items-center justify-between cursor-pointer group mt-1 pt-2 border-t border-white/5">
          <span className="text-[11px] text-slate-200 font-semibold">
            {lang === 'fr' ? "Afficher les valeurs des points de déplacement" : "Show movement point values"}
          </span>
          <div className="relative font-sans">
            <input
              type="checkbox"
              checked={project.settings?.showMovementPointLabels === true}
              onChange={(e) => onUpdateSetting('showMovementPointLabels', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition-colors duration-200" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
        </label>
      </div>

      {/* 5. Audio settings */}
      <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3.5">
        <span className="text-[10px] text-cyan-400 font-bold block tracking-wider flex items-center gap-1.5">
          <Volume2 size={11} /> {t('audioSettings').toUpperCase()}
        </span>

        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-[11px] text-slate-200 font-semibold">{t('loopPlayback')}</span>
          <div className="relative font-sans">
            <input
              type="checkbox"
              checked={loopAudio}
              onChange={(e) => onUpdateSetting('loopAudio', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition-colors duration-200" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
        </label>
      </div>

      {/* 6. Highlight settings */}
      <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3.5">
        <span className="text-[10px] text-cyan-400 font-bold block tracking-wider flex items-center gap-1.5">
          <Star size={11} /> {t('highlightSettings').toUpperCase()}
        </span>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-200 font-semibold">{t('highlightOpacityLabel')}</span>
            <span className="font-mono text-indigo-300 font-bold">{Math.round(highlightOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.9"
            step="0.05"
            value={highlightOpacity}
            onChange={(e) => onUpdateSetting('highlightOpacity', parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
          />
          <span className="text-[9px] text-slate-500 leading-normal">{t('highlightOpacityDesc')}</span>
        </div>
      </div>

      {/* 7. Import / Export */}
      <ImportExportPanel
        onImportProject={onImportProject}
        onExportProject={onExportProject}
        t={t}
      />
    </div>
  );
};
