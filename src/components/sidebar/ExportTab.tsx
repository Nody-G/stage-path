import React from 'react';
import { Film, Info, Users, Play, Loader2, AlertCircle, Route } from 'lucide-react';
import { Project } from '../../types';
import { 
  useVideoExport, 
  ResolutionOption, 
  CodecOption, 
  ArtistVisibility 
} from '../../hooks/useVideoExport';
import { CastingOverridesList } from './CastingOverridesList';

interface ExportTabProps {
  project: Project;
}

export const ExportTab: React.FC<ExportTabProps> = ({ project }) => {
  const {
    settings,
    setSettings,
    isExporting,
    progress,
    exportError,
    startExport,
    cancelExport,
  } = useVideoExport(project);

  const isNativeSavingSupported = typeof window !== 'undefined' && 'showSaveFilePicker' in window;
  const showDurationWarning = !isNativeSavingSupported && project.duration > 600;

  // Dynamic file weight calculation
  // Size in MB = (bitrate in kbps * duration in seconds) / 8000
  const estimatedSizeMb = (settings.bitrate * project.duration) / 8000;

  const handleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({
      ...prev,
      resolution: e.target.value as ResolutionOption,
    }));
  };

  const handleCodecChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({
      ...prev,
      codec: e.target.value as CodecOption,
    }));
  };

  const handleBitrateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      bitrate: parseFloat(e.target.value) * 1000, // Mbps to kbps
    }));
  };

  const toggleOverlay = (key: keyof typeof settings.overlays) => {
    setSettings(prev => ({
      ...prev,
      overlays: {
        ...prev.overlays,
        [key]: !prev.overlays[key],
      },
    }));
  };

  const handleArtistOverrideChange = (artistId: string, value: ArtistVisibility) => {
    setSettings(prev => ({
      ...prev,
      castingOverrides: {
        ...prev.castingOverrides,
        [artistId]: value,
      },
    }));
  };

  const handlePresetCasting = (type: 'all' | 'none' | 'faible') => {
    const updated: Record<string, ArtistVisibility> = {};
    project.artists.forEach(a => {
      if (type === 'all') updated[a.id] = 'normal';
      else if (type === 'none') updated[a.id] = 'masque';
      else updated[a.id] = 'faible';
    });
    setSettings(prev => ({
      ...prev,
      castingOverrides: updated,
    }));
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in text-xs">
      
      {/* 1. Video & Quality Settings */}
      <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
        <span className="text-[10px] text-indigo-300 font-bold tracking-wider block flex items-center gap-1.5">
          <Film size={11} /> QUALITÉ & FORMAT VIDÉO
        </span>

        <div>
          <label className="text-[10px] text-slate-400 font-bold block mb-1">NOM DU FICHIER</label>
          <input 
            type="text" 
            value={settings.fileName}
            onChange={(e) => setSettings(prev => ({ ...prev, fileName: e.target.value }))}
            disabled={isExporting}
            className="glass-input w-full text-xs font-mono"
            placeholder="nom_du_fichier.mp4"
          />
          <span className="text-[9px] text-slate-500 mt-1 block">
            Note : L'exportation ouvrira une boîte de dialogue pour choisir le dossier de destination et renommer le fichier.
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">RÉSOLUTION (16/9)</label>
            <select 
              value={settings.resolution} 
              onChange={handleResolutionChange}
              disabled={isExporting}
              className="glass-input w-full text-xs cursor-pointer"
            >
              <option value="720p">720p (1280x720)</option>
              <option value="1080p">1080p (1920x1080)</option>
              <option value="1440p">2440p (2560x1440)</option>
              <option value="2160p">4K UHD (3840x2160)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">CODEC VIDÉO</label>
            <select 
              value={settings.codec} 
              onChange={handleCodecChange}
              disabled={isExporting}
              className="glass-input w-full text-xs cursor-pointer"
            >
              <option value="x264">x264 (H.264 / AVC)</option>
              <option value="x265">x265 (H.265 / HEVC)</option>
            </select>
          </div>
        </div>

        {/* Bitrate Control */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] text-slate-400 font-bold">DÉBIT DU FLUX VIDÉO</label>
            <span className="font-mono text-indigo-300 font-bold">{(settings.bitrate / 1000).toFixed(1)} Mbps</span>
          </div>
          <input 
            type="range"
            min="0.5"
            max="30"
            step="0.5"
            value={settings.bitrate / 1000}
            onChange={handleBitrateChange}
            disabled={isExporting}
            className="w-full accent-indigo-500 bg-white/5 cursor-pointer h-1 rounded"
          />
        </div>

        {/* Dynamic File Size Info */}
        <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
          <span className="text-slate-400">Poids de la vidéo (estimé) :</span>
          <span className="font-mono text-emerald-400 font-bold text-sm">
            {estimatedSizeMb < 1000 ? `${estimatedSizeMb.toFixed(1)} Mo` : `${(estimatedSizeMb / 1000).toFixed(2)} Go`}
          </span>
        </div>
      </div>

      {/* 2. Metadata Overlays */}
      <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
        <span className="text-[10px] text-indigo-300 font-bold tracking-wider block flex items-center gap-1.5">
          <Info size={11} /> INFORMATIONS INCRUSTÉES
        </span>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <label className="flex items-center gap-2 text-slate-350 cursor-pointer hover:text-white transition">
            <input 
              type="checkbox" 
              checked={settings.overlays.showName} 
              onChange={() => toggleOverlay('showName')}
              disabled={isExporting}
              className="rounded border-white/10 bg-black/45 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
            />
            Nom du spectacle
          </label>
          <label className="flex items-center gap-2 text-slate-350 cursor-pointer hover:text-white transition">
            <input 
              type="checkbox" 
              checked={settings.overlays.showDirector} 
              onChange={() => toggleOverlay('showDirector')}
              disabled={isExporting}
              className="rounded border-white/10 bg-black/45 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
            />
            Metteur en scène
          </label>
          <label className="flex items-center gap-2 text-slate-350 cursor-pointer hover:text-white transition">
            <input 
              type="checkbox" 
              checked={settings.overlays.showExportTime} 
              onChange={() => toggleOverlay('showExportTime')}
              disabled={isExporting}
              className="rounded border-white/10 bg-black/45 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
            />
            Heure d'export
          </label>
          <label className="flex items-center gap-2 text-slate-350 cursor-pointer hover:text-white transition">
            <input 
              type="checkbox" 
              checked={settings.overlays.showCasting} 
              onChange={() => toggleOverlay('showCasting')}
              disabled={isExporting}
              className="rounded border-white/10 bg-black/45 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
            />
            Liste des figurants
          </label>
          <label className="flex items-center gap-2 text-slate-350 cursor-pointer hover:text-white transition col-span-2">
            <input 
              type="checkbox" 
              checked={settings.overlays.showScale} 
              onChange={() => toggleOverlay('showScale')}
              disabled={isExporting}
              className="rounded border-white/10 bg-black/45 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
            />
            Échelles en mètres et repères
          </label>
          <label className="flex items-center gap-2 text-slate-350 cursor-pointer hover:text-white transition col-span-2">
            <input 
              type="checkbox" 
              checked={settings.overlays.showCustomNote} 
              onChange={() => toggleOverlay('showCustomNote')}
              disabled={isExporting}
              className="rounded border-white/10 bg-black/45 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
            />
            Ajouter une note personnalisée
          </label>
        </div>

        {settings.overlays.showCustomNote && (
          <textarea 
            placeholder="Écrivez votre note de mise en scène ici..." 
            value={settings.customNote}
            onChange={(e) => setSettings(prev => ({ ...prev, customNote: e.target.value }))}
            disabled={isExporting}
            rows={2}
            className="glass-input w-full text-xs font-sans mt-1 resize-none"
          />
        )}

        {/* Overlay Opacity Control */}
        <div className="mt-1">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] text-slate-400 font-bold">OPACITÉ DE L'INCRUSTATION</label>
            <span className="font-mono text-indigo-300 font-bold">{Math.round(settings.overlayOpacity * 100)}%</span>
          </div>
          <input 
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={settings.overlayOpacity}
            onChange={(e) => setSettings(prev => ({ ...prev, overlayOpacity: parseFloat(e.target.value) }))}
            disabled={isExporting}
            className="w-full accent-indigo-500 bg-white/5 cursor-pointer h-1 rounded"
          />
        </div>
      </div>

      {/* 3. Per-Character Distribution Settings */}
      <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-indigo-300 font-bold tracking-wider block flex items-center gap-1.5">
            <Users size={11} /> DISTRIBUTION DU DÉPLOIEMENT
          </span>
          <div className="flex gap-1.5">
            <button 
              type="button" 
              onClick={() => handlePresetCasting('all')}
              disabled={isExporting}
              className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[9px] text-slate-350 transition font-bold"
            >
              Tous
            </button>
            <button 
              type="button" 
              onClick={() => handlePresetCasting('faible')}
              disabled={isExporting}
              className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[9px] text-slate-350 transition font-bold"
            >
              Faibles
            </button>
            <button 
              type="button" 
              onClick={() => handlePresetCasting('none')}
              disabled={isExporting}
              className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[9px] text-slate-350 transition font-bold"
            >
              Masquer
            </button>
          </div>
        </div>

        {/* Global Switch inside this card */}
        <label className="flex items-center justify-between cursor-pointer group pb-2 border-b border-white/5 mb-1">
          <span className="text-[11px] text-slate-200 font-semibold flex items-center gap-1.5">
            <Route size={11} className="text-slate-400" /> Afficher les trajectoires à l'export
          </span>
          <div className="relative font-sans">
            <input
              type="checkbox"
              checked={settings.showMovementPaths}
              onChange={(e) => setSettings(prev => ({ ...prev, showMovementPaths: e.target.checked }))}
              disabled={isExporting}
              className="sr-only peer"
            />
            <div className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition-colors duration-200" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
        </label>
        <div className="max-h-[350px] overflow-y-auto flex flex-col gap-2 pr-1">
          <CastingOverridesList
            project={project}
            settings={settings}
            setSettings={setSettings}
            isExporting={isExporting}
            onArtistOverrideChange={handleArtistOverrideChange}
          />
        </div>
      </div>

      {showDurationWarning && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2.5 text-amber-450">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <div className="flex-1 flex flex-col gap-0.5">
            <span className="font-bold">Avertissement de mémoire</span>
            <span className="text-[10px] leading-relaxed opacity-95">
              Votre navigateur ne supporte pas l'écriture directe sur le disque (API File System). 
              L'exportation de longues vidéos (&gt;10 min) peut saturer la mémoire et planter. 
              Nous recommandons Google Chrome ou Microsoft Edge.
            </span>
          </div>
        </div>
      )}

      {/* 4. Trigger Export Button */}
      <button
        type="button"
        onClick={startExport}
        disabled={isExporting}
        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center gap-2 mt-1"
        style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
      >
        <Play size={14} /> Générer l'exportation MP4
      </button>

      {/* 5. Progress Modal Overlay */}
      {isExporting && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-panel w-full max-w-sm p-6 border border-white/10 rounded-2xl flex flex-col items-center text-center gap-4 bg-[#0a0d14]/95 shadow-2xl">
            <Loader2 size={36} className="text-indigo-400 animate-spin" />
            
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-slate-100">Génération de la vidéo...</span>
              <span className="text-[10px] text-slate-400 font-mono">Calcul des déplacements en haute résolution</span>
            </div>

            {/* Progress bar */}
            <div className="w-full flex flex-col gap-1.5 mt-2">
              <div className="flex justify-between font-mono text-[10px] text-slate-350">
                <span>Progression :</span>
                <span className="font-bold text-indigo-300">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-150 shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={cancelExport}
              className="mt-2 px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-slate-300 font-semibold transition"
            >
              Annuler l'export
            </button>
          </div>
        </div>
      )}

      {/* 6. Export Error Feedback */}
      {exportError && (
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2.5 text-red-400">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <div className="flex-1 flex flex-col gap-0.5">
            <span className="font-bold">Erreur d'exportation</span>
            <span className="text-[10px] leading-relaxed opacity-90">{exportError}</span>
          </div>
        </div>
      )}

    </div>
  );
};
