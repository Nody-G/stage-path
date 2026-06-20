import { ArrowLeft, Users, Move, Palette, Settings, Video, Plus, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { translations, Lang } from '../utils/i18n';

type SidebarTab = 'casting' | 'movements' | 'scenography' | 'options' | 'export';

interface HeaderPanelProps {
  projectName: string;
  onRenameProject: (newName: string) => void;
  onBackToDashboard: () => void;
  lang: Lang;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onAddArtist: (name: string, color: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const TAB_CONFIG: { key: SidebarTab; icon: React.ElementType; labelKey: string }[] = [
  { key: 'casting', icon: Users, labelKey: 'tabCasting' },
  { key: 'movements', icon: Move, labelKey: 'tabMovements' },
  { key: 'scenography', icon: Palette, labelKey: 'tabScenography' },
  { key: 'export', icon: Video, labelKey: 'tabExport' },
  { key: 'options', icon: Settings, labelKey: 'tabOptions' },
];

export const HeaderPanel: React.FC<HeaderPanelProps> = ({
  projectName,
  onRenameProject,
  onBackToDashboard,
  lang,
  activeTab,
  onTabChange,
  onAddArtist,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const t = (key: keyof typeof translations['fr']) => {
    return translations[lang][key] || translations['fr'][key] || key;
  };

  const handleAddArtist = () => {
    const colors = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6', '#f97316'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    onAddArtist('Acteur', color);
  };

  return (
    <header className="app-header-bar flex items-center h-[48px] px-3 gap-2 shrink-0 border-b border-white/5 bg-slate-950/80">
      {/* Left: Back + Logo + Project name */}
      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={onBackToDashboard}
          className="header-icon-btn"
          title={t('dashboard')}
        >
          <ArrowLeft size={15} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-base select-none">🎭</span>
          <input 
            type="text" 
            value={projectName}
            onChange={(e) => onRenameProject(e.target.value)}
            className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-indigo-500 focus:outline-none transition-all px-1 py-0.5 font-semibold text-[11px] text-slate-200 max-w-[160px]"
            title={t('renameProject')}
          />
        </div>

        <div className="h-4 w-px bg-white/10 mx-1" />
      </div>

      {/* Center: Tabs */}
      <nav className="flex-1 flex items-center justify-center gap-0.5">
        {TAB_CONFIG.map(({ key, icon: Icon, labelKey }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`header-tab ${activeTab === key ? 'header-tab-active' : ''}`}
            title={t(labelKey as keyof typeof translations['fr'])}
          >
            <Icon size={13} />
            <span>{t(labelKey as keyof typeof translations['fr'])}</span>
          </button>
        ))}
      </nav>

      {/* Right: Add Artist + Toggle Sidebar */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleAddArtist}
          className="header-icon-btn header-add-btn"
          title="Ajouter un acteur"
        >
          <Plus size={15} />
        </button>
        <button
          onClick={onToggleSidebar}
          className="header-icon-btn"
          title={isSidebarOpen ? "Fermer le panneau" : "Ouvrir le panneau"}
        >
          {isSidebarOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
        </button>
      </div>
    </header>
  );
};
