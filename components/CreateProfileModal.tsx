
import React, { useState } from 'react';
import { X, Save, Layers, Palette, User, Briefcase, Home, ShoppingBag, Landmark, Heart, Smartphone, Zap } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string, icon: string) => void;
}

const AVAILABLE_COLORS = [
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#ef4444' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Slate', hex: '#64748b' },
];

const AVAILABLE_ICONS = [
  'User', 'Briefcase', 'Home', 'ShoppingBag', 'Landmark', 'Heart', 'Smartphone', 'Zap', 'Globe', 'Gift', 'Car', 'Utensils'
];

const IconRenderer: React.FC<{ name: string; className?: string; color?: string }> = ({ name, className, color }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Layers;
  return <IconComponent className={className} style={{ color }} />;
};

const CreateProfileModal: React.FC<Props> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0].hex);
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), selectedColor, selectedIcon);
    setName('');
    setSelectedIcon(AVAILABLE_ICONS[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            New Interface
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Interface Name</label>
            <input
              type="text"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Business Ledger, Home Budget"
              className="w-full rounded-2xl border-slate-200 text-sm py-3 px-4 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Interface Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {AVAILABLE_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`p-2 rounded-xl transition-all border-2 flex items-center justify-center ${
                    selectedIcon === icon ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <IconRenderer name={icon} className="w-5 h-5" color={selectedIcon === icon ? '#4f46e5' : '#94a3b8'} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Theme Color</label>
            <div className="grid grid-cols-4 gap-3">
              {AVAILABLE_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setSelectedColor(color.hex)}
                  className={`h-10 rounded-xl transition-all border-2 ${
                    selectedColor === color.hex ? 'border-indigo-600 scale-110 shadow-md' : 'border-transparent opacity-70'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 text-sm font-extrabold text-slate-500 rounded-2xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-4 bg-indigo-600 text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Create Interface
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProfileModal;
