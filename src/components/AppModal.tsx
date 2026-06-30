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
  clientX?: number;
  clientY?: number;
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
  clientX,
  clientY,
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

  // Compute positioning style
  let cardStyle: React.CSSProperties = {};
  const isPositioned = clientX !== undefined && clientY !== undefined;

  if (isPositioned) {
    const modalWidth = 360;
    const modalHeight = showColorPicker ? 300 : 180;
    
    let left = clientX - modalWidth / 2;
    let top = clientY + 15;
    
    // Boundary checks to keep modal completely on screen
    if (left + modalWidth > window.innerWidth) {
      left = window.innerWidth - modalWidth - 20;
    }
    if (left < 20) {
      left = 20;
    }
    if (top + modalHeight > window.innerHeight) {
      top = clientY - modalHeight - 15;
    }
    if (top < 20) {
      top = 20;
    }
    
    cardStyle = {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
    };
  }

  return (
    <div
      className={`app-modal-overlay animate-fade-in${isPositioned ? ' pos-coords' : ''}`}
      onClick={onCancel}
    >
      <div
        className="app-modal-card"
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onCancel}
          className="app-modal-close-btn"
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
                  className="app-modal-color-btn"
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
            className="app-modal-btn-cancel"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!value.trim()}
            className="app-modal-btn-confirm"
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
