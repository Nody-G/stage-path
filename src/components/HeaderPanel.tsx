import { ArrowLeft } from 'lucide-react';
import { translations, Lang } from '../utils/i18n';

interface HeaderPanelProps {
  projectName: string;
  onRenameProject: (newName: string) => void;
  onBackToDashboard: () => void;
  lang: Lang;
}

export const HeaderPanel: React.FC<HeaderPanelProps> = ({
  projectName,
  onRenameProject,
  onBackToDashboard,
  lang,
}) => {
  const t = (key: keyof typeof translations['fr']) => {
    return translations[lang][key] || translations['fr'][key] || key;
  };

  return (
    <header className="glass-panel mx-4 mt-3 flex items-center justify-between px-6 rounded-xl shrink-0 h-[56px] border border-white/5 bg-slate-900/40">
      {/* Left section: Dashboard link */}
      <div className="flex-1 flex justify-start">
        <button 
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white text-[11px] font-semibold transition-all duration-200"
          title={t('dashboard')}
        >
          <ArrowLeft size={13} /> {t('dashboard')}
        </button>
      </div>

      {/* Center section: Logo + Application Name + Separator + Project Title Input */}
      <div className="flex-initial flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xl select-none filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">🎭</span>
          <div>
            <h1 className="text-sm font-bold leading-none tracking-tight bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 50%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StagePath</h1>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t('spatiotemporalPlanning')}</p>
          </div>
        </div>

        <div className="h-5 w-px bg-white/10" />

        <input 
          type="text" 
          value={projectName}
          onChange={(e) => onRenameProject(e.target.value)}
          className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-indigo-500 focus:outline-none transition-all px-2 py-1 font-semibold text-xs text-slate-100 max-w-[200px] text-center"
          title={t('renameProject')}
        />
      </div>

      {/* Right section: Empty spacer to balance the layout and keep the center section perfectly centered */}
      <div className="flex-1 flex justify-end" />
    </header>
  );
};
