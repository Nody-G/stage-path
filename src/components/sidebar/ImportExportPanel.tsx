import React from 'react';
import { Upload, Download } from 'lucide-react';

interface ImportExportPanelProps {
  onImportProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportProject: () => void;
  t: (key: string) => string;
}

export const ImportExportPanel: React.FC<ImportExportPanelProps> = ({
  onImportProject,
  onExportProject,
  t,
}) => {
  return (
    <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl flex flex-col gap-4">
      <span className="text-[10px] text-cyan-400 font-bold block tracking-wider flex items-center gap-1.5">
        <Upload size={11} /> {t('exportImportSection').toUpperCase()}
      </span>

      {/* Export */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-slate-200">{t('exportSectionTitle')}</span>
        <span className="text-[9px] text-slate-500 leading-normal">{t('exportSectionDesc')}</span>
        <button
          type="button"
          onClick={onExportProject}
          className="w-full mt-1.5 py-2 px-3 rounded-lg border border-white/10 hover:border-indigo-500/30 bg-white/5 hover:bg-indigo-600/10 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition duration-150 shadow-sm"
        >
          <Download size={13} /> {t('exportProject')}
        </button>
      </div>

      <div className="h-px bg-white/5" />

      {/* Import */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-slate-200">{t('importSectionTitle')}</span>
        <span className="text-[9px] text-slate-500 leading-normal">{t('importSectionDesc')}</span>
        <label className="w-full mt-1.5 py-2 px-3 rounded-lg border border-dashed border-white/10 hover:border-indigo-500/30 bg-white/5 hover:bg-indigo-600/5 cursor-pointer font-bold text-xs flex items-center justify-center gap-2 text-indigo-300 transition duration-150 select-none text-center">
          <Upload size={13} /> {t('importInputLabel')}
          <input type="file" accept=".stagepath" onChange={onImportProject} className="hidden" />
        </label>
      </div>
    </div>
  );
};
