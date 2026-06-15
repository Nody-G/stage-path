import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
import { translations, Lang } from '../../utils/i18n';

interface ScenographyTabProps {
  project: Project;
  onRenameProject: (name: string) => void;
  onUpdateDirectorName: (name: string) => void;
  onUpdateStageDimensions: (w: number, h: number) => void;
  onUpdateProjectDuration: (dur: number) => void;
  onBackgroundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBackgroundSettingsChange: (key: keyof Project['backgroundSettings'], val: number) => void;
  onAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  lang: Lang;
}

export const ScenographyTab: React.FC<ScenographyTabProps> = ({
  project,
  onRenameProject,
  onUpdateDirectorName,
  onUpdateStageDimensions,
  onUpdateProjectDuration,
  onBackgroundUpload,
  onBackgroundSettingsChange,
  onAudioUpload,
  lang,
}) => {
  const t = (key: keyof typeof translations['fr']) => {
    return translations[lang][key] || translations['fr'][key] || key;
  };
  const [localStageWidth, setLocalStageWidth] = useState<number>(project.stageWidth);
  const [localStageHeight, setLocalStageHeight] = useState<number>(project.stageHeight);

  useEffect(() => {
    setLocalStageWidth(project.stageWidth);
    setLocalStageHeight(project.stageHeight);
  }, [project.stageWidth, project.stageHeight]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Show Meta Info */}
      <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3.5">
        <span className="text-[10px] text-cyan-400 font-bold block tracking-wider">{t('projectSpectacle')}</span>
        
        <div className="wizard-form-group">
          <label className="text-[10px] text-slate-400 font-semibold">{t('wizardNameLabel')}</label>
          <input 
            type="text" 
            value={project.name}
            onChange={(e) => onRenameProject(e.target.value)}
            className="glass-input w-full text-xs"
          />
        </div>

        <div className="wizard-form-group">
          <label className="text-[10px] text-slate-400 font-semibold">{t('wizardDirectorLabel')}</label>
          <input 
            type="text" 
            value={project.directorName || ''}
            onChange={(e) => onUpdateDirectorName(e.target.value)}
            className="glass-input w-full text-xs"
            placeholder="Non spécifié"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
          <div>
            <label className="block mb-0.5 font-semibold">{t('sceneWidth')}</label>
            <input 
              type="number" 
              min="4"
              max="1000"
              value={localStageWidth}
              onChange={(e) => {
                const newW = Number(e.target.value);
                setLocalStageWidth(newW);
                if (project.backgroundSettings.fileUrl && project.stageWidth > 0 && project.stageHeight > 0) {
                  const ratio = project.stageWidth / project.stageHeight;
                  setLocalStageHeight(Math.round((newW / ratio) * 100) / 100);
                }
              }}
              className="glass-input w-full p-1 text-[10px] text-center font-mono"
            />
          </div>
          <div>
            <label className="block mb-0.5 font-semibold">{t('sceneDepth')}</label>
            <input 
              type="number" 
              min="3"
              max="1000"
              disabled={!!project.backgroundSettings.fileUrl}
              value={localStageHeight}
              onChange={(e) => setLocalStageHeight(Number(e.target.value))}
              className={`glass-input w-full p-1 text-[10px] text-center font-mono ${
                project.backgroundSettings.fileUrl ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              title={project.backgroundSettings.fileUrl ? "Verrouillé au ratio de l'image de fond" : "Modifier la profondeur"}
            />
          </div>
          <div>
            <label className="block mb-0.5 font-semibold">{t('sceneDuration')}</label>
            <input 
              type="number" 
              min="10"
              max="3600"
              value={project.duration}
              onChange={(e) => onUpdateProjectDuration(Math.max(10, Number(e.target.value)))}
              className="glass-input w-full p-1 text-[10px] text-center font-mono"
            />
          </div>
        </div>

        {/* Validation button for stage size if values differ */}
        {(localStageWidth !== project.stageWidth || localStageHeight !== project.stageHeight) && (
          <button
            type="button"
            onClick={() => {
              const finalW = Math.max(4, localStageWidth);
              const finalH = Math.max(3, localStageHeight);
              onUpdateStageDimensions(finalW, finalH);
            }}
            className="w-full mt-2 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition duration-150 animate-fade-in shadow-[0_0_10px_rgba(99,102,241,0.2)]"
          >
            ✓ {t('applyDimensions')}
          </button>
        )}
      </div>



      {/* Background Image Settings */}
      <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3.5">
        <span className="text-[10px] text-cyan-400 font-bold block tracking-wider">{t('bgMap')}</span>
        
        <label 
          className="w-full py-2 text-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer font-bold text-xs transition duration-150 block truncate px-2"
          title={project.backgroundSettings.fileName || undefined}
        >
          {project.backgroundSettings.fileName ? t('changePlan') : t('loadPlan')}
          <input type="file" accept="image/*" onChange={onBackgroundUpload} className="hidden" />
        </label>

        {project.backgroundSettings.fileName && (
          <div 
            className="text-[10px] text-slate-400 truncate bg-[#050608] px-2 py-1 rounded border border-white/5"
            title={project.backgroundSettings.fileName}
          >
            {t('fileName')} <span className="text-slate-200 font-mono">{project.backgroundSettings.fileName}</span>
          </div>
        )}

        {project.backgroundSettings.fileUrl && (
          <div className="flex flex-col gap-3.5 mt-1 border-t border-white/5 pt-3">
            {/* Opacity with slider and manual input */}
            <div className="flex items-center justify-between text-[11px] gap-2">
              <span className="text-slate-400 font-medium">{t('opacity')}</span>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01"
                value={project.backgroundSettings.opacity}
                onChange={(e) => onBackgroundSettingsChange('opacity', parseFloat(e.target.value))}
                className="w-20 h-1 rounded-lg bg-white/10"
              />
              <div className="flex items-center bg-[#050608] border border-white/5 rounded px-1 w-14 shrink-0">
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(project.backgroundSettings.opacity * 100)}
                  onChange={(e) => {
                    let val = parseFloat(e.target.value);
                    if (isNaN(val)) val = 0;
                    val = Math.max(0, Math.min(100, val));
                    onBackgroundSettingsChange('opacity', val / 100);
                  }}
                  className="w-full bg-transparent border-none text-[10px] text-indigo-300 font-semibold font-mono text-right focus:outline-none p-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-indigo-400 font-mono font-bold ml-0.5">%</span>
              </div>
            </div>

            {/* Scale with slider, manual input, and reset button */}
            <div className="flex items-center justify-between text-[11px] gap-2">
              <span className="text-slate-400 font-medium">{t('scale')}</span>
              <input 
                type="range" 
                min="0.1" 
                max="5" 
                step="0.01"
                value={project.backgroundSettings.scale}
                onChange={(e) => onBackgroundSettingsChange('scale', parseFloat(e.target.value))}
                className="w-20 h-1 rounded-lg bg-white/10"
              />
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex items-center bg-[#050608] border border-white/5 rounded px-1 w-14">
                  <input 
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={parseFloat(project.backgroundSettings.scale.toFixed(2))}
                    onChange={(e) => {
                      let val = parseFloat(e.target.value);
                      if (isNaN(val)) val = 1.0;
                      val = Math.max(0.1, Math.min(10, val));
                      onBackgroundSettingsChange('scale', val);
                    }}
                    className="w-full bg-transparent border-none text-[10px] text-indigo-300 font-semibold font-mono text-right focus:outline-none p-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] text-indigo-400 font-mono font-bold ml-0.5">x</span>
                </div>
                <button
                  type="button"
                  onClick={() => onBackgroundSettingsChange('scale', 1.0)}
                  className="px-1.5 py-0.5 text-[8px] font-bold bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white rounded transition"
                  title="Réinitialiser l'échelle à 1.0x"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Soundtrack Settings */}
      <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
        <span className="text-[10px] text-indigo-300 font-bold block tracking-wider">{t('audioSettings')}</span>
        <label 
          className="w-full py-2 text-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer font-bold text-xs transition duration-150 block truncate px-2"
          title={project.audioSettings.fileName || undefined}
        >
          {project.audioSettings.fileName ? (lang === 'fr' ? "Changer la bande-son" : "Change soundtrack") : (lang === 'fr' ? "Charger un fichier audio" : "Load audio file")}
          <input type="file" accept="audio/*" onChange={onAudioUpload} className="hidden" />
        </label>

        {project.audioSettings.fileName && (
          <div 
            className="text-[10px] text-slate-400 truncate bg-[#050608] px-2 py-1 rounded border border-white/5"
            title={project.audioSettings.fileName}
          >
            {t('fileName')} <span className="text-slate-200 font-mono">{project.audioSettings.fileName}</span>
          </div>
        )}
      </div>
    </div>
  );
};
