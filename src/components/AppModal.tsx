import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface AppModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  icon?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  showColorPicker?: boolean;
  defaultColor?: string;
  onConfirm: (value: string, color: string) => void;
  onCancel: () => void;
}

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#14b8a6',
];

export const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  title,
  subtitle,
  icon,
  placeholder = '',
  defaultValue = '',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  showColorPicker = false,
  defaultColor = '#6366f1',
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(defaultValue);
  const [color, setColor] = useState(defaultColor);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setColor(defaultColor);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultValue, defaultColor]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  const handleConfirm = () => {
    if (value.trim()) onConfirm(value.trim(), color);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center animate-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      <div
        className="relative flex flex-col gap-5 rounded-2xl border border-white/10 shadow-2xl w-[360px] p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(17,19,30,0.98) 0%, rgba(11,13,22,0.98) 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 24px 60px rgba(0,0,0,0.6), 0 0 80px rgba(99,102,241,0.08)',
          animation: 'modalEnter 0.18s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition"
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: `${color}22`, border: `1px solid ${color}44` }}
            >
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Text Input */}
        <div className="flex flex-col gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') onCancel();
            }}
            placeholder={placeholder}
            className="glass-input w-full text-sm py-2.5 px-3"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${value.trim() ? color + '66' : 'rgba(255,255,255,0.08)'}`,
              boxShadow: value.trim() ? `0 0 0 3px ${color}18` : 'none',
              transition: 'border 0.2s, box-shadow 0.2s',
            }}
          />
        </div>

        {/* Color Picker */}
        {showColorPicker && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Couleur</span>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-5 h-5 rounded-full transition-transform duration-150 hover:scale-125"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : '2px solid transparent',
                    outlineOffset: '2px',
                    boxShadow: color === c ? `0 0 8px ${c}88` : 'none',
                  }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-5 h-5 rounded-full border border-white/20 cursor-pointer bg-transparent"
                title="Couleur personnalisée"
              />
            </div>
            {/* Color preview strip */}
            <div
              className="h-1 rounded-full transition-all duration-300"
              style={{ background: `linear-gradient(90deg, ${color}00, ${color}, ${color}00)` }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/8 border border-white/5 hover:border-white/10 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!value.trim()}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200"
            style={{
              background: value.trim()
                ? `linear-gradient(135deg, ${color}cc, ${color}88)`
                : 'rgba(255,255,255,0.05)',
              boxShadow: value.trim() ? `0 0 20px ${color}44` : 'none',
              border: value.trim() ? `1px solid ${color}66` : '1px solid rgba(255,255,255,0.05)',
              opacity: value.trim() ? 1 : 0.4,
              cursor: value.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
