import React, { useState } from 'react';
import { 
  Folder, Search, Plus, Upload, Download, Edit, Trash2, 
  Sparkles, User, X
} from 'lucide-react';
import { Project } from '../types';
import { translations, Lang } from '../utils/i18n';

interface DashboardProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onCreateNewProject: () => void;
  onLoadDemoProject: () => void;
  onDeleteProject: (id: string) => void;
  onImportProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportProject: (project: Project) => void;
  onUpdateProjectMeta: (
    id: string, 
    meta: { 
      name: string; 
      directorName: string; 
      stageWidth: number; 
      stageHeight: number; 
      duration: number; 
    }
  ) => void;
  lang: Lang;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onSelectProject,
  onCreateNewProject,
  onLoadDemoProject,
  onDeleteProject,
  onImportProject,
  onExportProject,
  onUpdateProjectMeta,
  lang,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  
  const t = (key: keyof typeof translations['fr']) => {
    return translations[lang][key] || translations['fr'][key] || key;
  };
  
  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editDirector, setEditDirector] = useState('');
  const [editWidth, setEditWidth] = useState<number>(14);
  const [editHeight, setEditHeight] = useState<number>(10);
  const [editDuration, setEditDuration] = useState<number>(120);

  const handleStartEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setEditName(project.name);
    setEditDirector(project.directorName || '');
    setEditWidth(project.stageWidth);
    setEditHeight(project.stageHeight);
    setEditDuration(project.duration);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectId || !editName.trim()) return;

    onUpdateProjectMeta(editingProjectId, {
      name: editName.trim(),
      directorName: editDirector.trim(),
      stageWidth: Math.max(4, editWidth),
      stageHeight: Math.max(3, editHeight),
      duration: Math.max(10, editDuration),
    });

    setEditingProjectId(null);
  };

  // Filter projects by search query
  const filteredProjects = projects.filter(p => {
    const query = searchQuery.toLowerCase();
    const nameMatch = p.name.toLowerCase().includes(query);
    const directorMatch = (p.directorName || '').toLowerCase().includes(query);
    return nameMatch || directorMatch;
  });

  const formatTime = (timeInSec: number): string => {
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return lang === 'fr' ? 'Récemment' : 'Recently';
    return new Date(timestamp).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-layout bg-[#07080a] min-h-screen text-[#f8fafc] p-6 md:p-10 flex flex-col items-center">
      
      {/* Dashboard container */}
      <div className="w-full max-w-6xl flex flex-col gap-8">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <span className="text-4xl select-none filter drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]">🎭</span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 50%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                StagePath
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {t('subtitle')}
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={onCreateNewProject}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold transition-all duration-200 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25 hover:-translate-y-[2px]"
              style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
            >
              <Plus size={15} /> {t('newProject')}
            </button>
            
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-xs font-bold cursor-pointer transition-all duration-200 hover:-translate-y-[2px]">
              <Upload size={14} /> {t('importLabel')}
              <input type="file" accept=".stagepath" onChange={onImportProject} className="hidden" />
            </label>

            <button 
              onClick={onLoadDemoProject}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/15 hover:border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all duration-200 hover:-translate-y-[2px] shadow-[0_0_15px_rgba(99,102,241,0.05)]"
            >
              <Sparkles size={14} /> {t('loadDemoLabel')}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-10 text-xs py-3 rounded-xl"
            style={{ width: '100%' }}
          />
        </div>

        {/* Projects Grid */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
            <Folder size={18} className="text-indigo-400" />
            {t('recentProjects')} ({filteredProjects.length})
          </h2>

          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div 
                  key={project.id}
                  className="dashboard-card glass-panel group relative flex flex-col p-5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => onSelectProject(project.id)}
                  style={{ minHeight: '180px' }}
                >
                  {/* Subtle ambient hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Top card metadata */}
                  <div className="flex justify-between items-start gap-2 mb-3 z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(99,102,241,0.05)] text-indigo-400 group-hover:bg-indigo-600/15 group-hover:text-indigo-300 transition-colors">
                        🎭
                      </div>
                      <div className="truncate">
                        <h3 className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors truncate max-w-[200px]" title={project.name}>
                          {project.name}
                        </h3>
                        {project.directorName && (
                          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5 truncate max-w-[180px]">
                            <User size={10} className="text-indigo-300 shrink-0" /> {project.directorName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges/Specs */}
                  <div className="grid grid-cols-3 gap-2 my-3 z-10">
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{t('specsArtists')}</span>
                      <span className="text-xs font-bold text-slate-300 mt-0.5">{project.artists.length}</span>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{t('specsStage')}</span>
                      <span className="text-xs font-bold text-slate-300 mt-0.5 font-mono">{project.stageWidth}x{project.stageHeight}m</span>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{t('specsDuration')}</span>
                      <span className="text-xs font-bold text-slate-300 mt-0.5 font-mono">{formatTime(project.duration)}</span>
                    </div>
                  </div>

                  {/* Footer metadata & actions */}
                  <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between z-10 text-[10px]">
                    <span className="text-slate-500 font-medium font-mono">
                      {formatDate(project.updatedAt || project.createdAt)}
                    </span>
                    
                    {/* Action buttons inside card */}
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleStartEdit(project)}
                        className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-300 transition-all hover:scale-105"
                        title={t('editMeta')}
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => onExportProject(project)}
                        className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/30 text-slate-400 hover:text-cyan-300 transition-all hover:scale-105"
                        title={t('exportFile')}
                      >
                        <Download size={12} />
                      </button>
                      <button
                        onClick={() => {
                          const confirmMsg = `${t('deleteConfirm')} "${project.name}" ?`;
                          if (confirm(confirmMsg)) {
                            onDeleteProject(project.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-red-500/30 text-slate-400 hover:text-rose-400 transition-all hover:scale-105"
                        title={t('deleteProject')}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 bg-slate-900/10 border border-dashed border-white/5 rounded-3xl text-center">
              <span className="text-5xl mb-4 select-none filter opacity-30">🎭</span>
              <p className="text-sm font-semibold text-slate-400">{t('noProjects')}</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                {searchQuery 
                  ? (lang === 'fr' ? "Modifiez votre recherche ou créez un nouveau projet." : "Modify your search or create a new project.") 
                  : (lang === 'fr' ? "Créez votre premier projet de spectacle ou chargez la démo pour démarrer !" : "Create your first show project or load the demo to get started!")}
              </p>
              {!searchQuery && (
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={onCreateNewProject}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/10"
                  >
                    {lang === 'fr' ? "+ Créer un Projet" : "+ Create a Project"}
                  </button>
                  <button 
                    onClick={onLoadDemoProject}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-all"
                  >
                    {t('loadDemoLabel')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* METADATA EDIT MODAL */}
      {editingProjectId && (
        <div className="wizard-overlay">
          <form 
            onSubmit={handleSaveEdit}
            className="wizard-card glass-panel" 
            style={{ border: '1px solid rgba(99, 102, 241, 0.2)', width: '450px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Edit size={18} className="text-indigo-400" /> {lang === 'fr' ? "Modifier le Spectacle" : "Edit Show"}
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingProjectId(null)} 
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="wizard-form-group">
                <label>{lang === 'fr' ? "Nom du spectacle *" : "Show name *"}</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="glass-input w-full text-xs"
                  required
                />
              </div>

              <div className="wizard-form-group">
                <label>{lang === 'fr' ? "Chorégraphe / Metteur en scène" : "Choreographer / Director"}</label>
                <input 
                  type="text" 
                  value={editDirector}
                  onChange={(e) => setEditDirector(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>

              <div className="wizard-form-grid-3">
                <div className="wizard-form-group">
                  <label>{lang === 'fr' ? "Largeur (m)" : "Width (m)"}</label>
                  <input 
                    type="number" 
                    min="4"
                    max="1000"
                    value={editWidth}
                    onChange={(e) => setEditWidth(Math.max(4, Number(e.target.value)))}
                    className="glass-input w-full font-mono text-xs text-center"
                  />
                </div>
                <div className="wizard-form-group">
                  <label>{lang === 'fr' ? "Profondeur (m)" : "Depth (m)"}</label>
                  <input 
                    type="number" 
                    min="3"
                    max="1000"
                    value={editHeight}
                    onChange={(e) => setEditHeight(Math.max(3, Number(e.target.value)))}
                    className="glass-input w-full font-mono text-xs text-center"
                  />
                </div>
                <div className="wizard-form-group">
                  <label>{lang === 'fr' ? "Durée (sec)" : "Duration (sec)"}</label>
                  <input 
                    type="number" 
                    min="10"
                    max="3600"
                    value={editDuration}
                    onChange={(e) => setEditDuration(Math.max(10, Number(e.target.value)))}
                    className="glass-input w-full font-mono text-xs text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-white/5 pt-4">
              <button 
                type="button" 
                onClick={() => setEditingProjectId(null)} 
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition"
              >
                {lang === 'fr' ? "Annuler" : "Cancel"}
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition shadow-md shadow-indigo-600/15"
              >
                {lang === 'fr' ? "Enregistrer" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
