
import React, { useState, useMemo } from 'react';
import { Category, TransactionType, Transaction,Profile } from '../types';
import * as LucideIcons from 'lucide-react';
import {X, Plus, Trash2, LayoutGrid, Edit2, Undo, Check, Layers, 
  ArrowUp, ArrowDown, Sparkles, Loader2, IndianRupee, Activity, 
  WifiOff } from 'lucide-react';
import { suggestCategories } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  transactions: Transaction[];
  profiles: Profile[];
  activeProfileId: string;
  onCreateProfile: () => void;
  onDeleteProfile: (id: string) => void;
  onUpdateProfile: (profile: Profile) => void;
  onUpdate: (cat: Category) => void;
  onDelete: (id: string) => void;
  onAdd: (name: string, type: TransactionType, color: string, icon: string) => string;
  onReorder: (newOrder: Category[]) => void;
  onClearData: () => void;
  isOnline: boolean;
}

const AVAILABLE_ICONS = [
  'Tag', 'Home', 'ShoppingCart', 'Coffee', 'Car', 'Tv', 'Zap', 'Heart', 
  'Banknote', 'Briefcase', 'TrendingUp', 'Plane', 'Book', 'Gift', 
  'Utensils', 'Smartphone', 'Stethoscope', 'Music', 'Dumbbell'
];
const SELECTABLE_ICONS = [
  'User', 'Briefcase', 'Home', 'ShoppingBag', 'Landmark', 'Heart', 'Smartphone', 'Zap', 
  'Globe', 'Gift', 'Car', 'Utensils', 'Truck', 'Tag', 'Coffee'
];
const AVAILABLE_COLORS = [
{ name: 'Red', hex: '#ef4444' }, { name: 'Orange', hex: '#f97316' }, 
  { name: 'Amber', hex: '#f59e0b' }, { name: 'Emerald', hex: '#10b981' }, 
  { name: 'Teal', hex: '#14b8a6' }, { name: 'Cyan', hex: '#06b6d4' }, 
  { name: 'Blue', hex: '#3b82f6' }, { name: 'Indigo', hex: '#6366f1' }, 
  { name: 'Violet', hex: '#8b5cf6' }, { name: 'Purple', hex: '#a855f7' }, 
  { name: 'Fuchsia', hex: '#d946ef' }, { name: 'Pink', hex: '#ec4899' }, 
  { name: 'Rose', hex: '#f43f5e' }, { name: 'Slate', hex: '#64748b' }
];

const IconRenderer: React.FC<{ name: string; className?: string; color?: string }> = ({ name, className, color }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Tag;
  return <IconComponent className={className} style={{ color }} />;
};

const CategoryManager: React.FC<Props> = ({ isOpen, onClose, categories, transactions, onUpdate, onDelete, onAdd, onReorder, onClearData, isOnline, profiles, activeProfileId, onCreateProfile, onDeleteProfile,
  onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState<'PROFILES' | 'CATEGORIES' | 'DATA'>('PROFILES');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editType, setEditType] = useState<TransactionType>('EXPENSE');

  const [isAdding, setIsAdding] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number, total: number }> = {};
    transactions.forEach(t => {
      if (!stats[t.categoryId]) stats[t.categoryId] = { count: 0, total: 0 };
      stats[t.categoryId].count++;
      stats[t.categoryId].total += t.amount;
    });
    return stats;
  }, [transactions]);


  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditIcon(cat.icon);
    setEditType(cat.type);
    setIsAdding(false);
    setIsBulkAdding(false);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      onUpdate({
        id: editingId,
        name: editName,
        type: editType,
        color: editColor,
        icon: editIcon
      });
      setEditingId(null);
    }
  };

  const handleAdd = () => {
    if (!editName) return;
    onAdd(editName, editType, editColor, editIcon);
    setIsAdding(false);
    setEditName('');
  };

  const handleBulkGenerate = async () => {
    if (!bulkInput.trim() || !isOnline) return;
    setIsGenerating(true);
    const suggestions = await suggestCategories(bulkInput);
    setIsGenerating(false);
    
    if (suggestions.length > 0) {
      suggestions.forEach(s => {
        const exists = categories.find(c => c.name.toLowerCase() === s.name.toLowerCase() && c.type === s.type);
        if (!exists) {
          onAdd(s.name, s.type, s.color, s.icon);
        }
      });
      setBulkInput('');
      setIsBulkAdding(false);
    }
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newCategories.length) {
      [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
      onReorder(newCategories);
    }
  };
  // Profile Edit State
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editProfName, setEditProfName] = useState('');
  const [editProfColor, setEditProfColor] = useState('');
  const [editProfIcon, setEditProfIcon] = useState('');

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  // Profile Edit Logic
  const startEditingProfile = (p: Profile) => {
    setEditingProfileId(p.id);
    setEditProfName(p.name);
    setEditProfColor(p.color);
    setEditProfIcon(p.icon);
  };

  const saveProfileEdit = (p: Profile) => {
    onUpdateProfile({
      ...p,
      name: editProfName,
      color: editProfColor,
      icon: editProfIcon
    });
    setEditingProfileId(null);
  };
  
  if (!isOpen) return null;
  return (
   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-600" />
            Control Center
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
          {(['PROFILES', 'CATEGORIES', 'DATA'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[100px] py-4 text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all relative ${
                activeTab === tab 
                  ? 'text-indigo-600' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 no-scrollbar">
          {activeTab === 'PROFILES' && (
            <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Interfaces</h3>
                <button 
                  onClick={onCreateProfile}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Quick Create
                </button>
              </div>
              <div className="grid gap-3">
                {profiles.map(p => (
                  <div key={p.id} className={`flex flex-col p-4 rounded-2xl border transition-all ${editingProfileId === p.id ? 'border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-100 shadow-md' : activeProfileId === p.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    {editingProfileId === p.id ? (
                      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Interface Name</label>
                            <input 
                              type="text" 
                              value={editProfName}
                              autoFocus
                              onChange={(e) => setEditProfName(e.target.value)}
                              className="w-full text-sm font-bold border-slate-200 rounded-xl px-3 py-1.5 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="flex flex-col items-center">
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1">Preview</label>
                            <div className="p-2 rounded-xl border border-slate-200 shadow-sm bg-white">
                              <IconRenderer name={editProfIcon} className="w-6 h-6" color={editProfColor} />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase mb-2 block ml-1">Theme Color</label>
                          <div className="flex flex-wrap gap-2">
                            {AVAILABLE_COLORS.map(c => (
                              <button 
                                key={c.hex}
                                onClick={() => setEditProfColor(c.hex)}
                                className={`w-7 h-7 rounded-lg border-2 transition-transform active:scale-90 ${editProfColor === c.hex ? 'border-slate-900 scale-110' : 'border-transparent opacity-80'}`}
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase mb-2 block ml-1">Icon</label>
                          <div className="flex flex-wrap gap-2">
                            {SELECTABLE_ICONS.map(icon => (
                              <button 
                                key={icon}
                                onClick={() => setEditProfIcon(icon)}
                                className={`p-1.5 rounded-lg border-2 transition-all active:scale-90 ${editProfIcon === icon ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                              >
                                <IconRenderer name={icon} className="w-4 h-4" color={editProfIcon === icon ? '#4f46e5' : '#94a3b8'} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button onClick={() => setEditingProfileId(null)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600">
                            <Undo className="w-3 h-3" />
                            Cancel
                          </button>
                          <button 
                            onClick={() => saveProfileEdit(p)} 
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-md active:scale-95"
                          >
                            <Check className="w-3 h-3" />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: p.color + '15' }}>
                            <IconRenderer name={p.icon} className="w-5 h-5" color={p.color} />
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${activeProfileId === p.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                              {p.name}
                              {activeProfileId === p.id && <span className="ml-2 text-[8px] bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase">Active</span>}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Hisab Ledger</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => startEditingProfile(p)}
                            className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit Interface"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {profiles.length > 1 && (
                            <button 
                              onClick={() => onDeleteProfile(p.id)} 
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Interface"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories Section */}
            {activeTab === 'CATEGORIES' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage Categories</h3>
              <div className="flex gap-2">
                {!isAdding && !editingId && !isBulkAdding && (
                  <>
                    <button 
                      onClick={() => isOnline && setIsBulkAdding(true)}
                      disabled={!isOnline}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                        isOnline ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-slate-400 bg-slate-100 cursor-not-allowed'
                      }`}
                    >
                      {isOnline ? <Sparkles className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      Bulk AI
                    </button>
                    <button 
                      onClick={() => {
                        setIsAdding(true);
                        setEditName('');
                        setEditColor(AVAILABLE_COLORS[0]);
                        setEditIcon(AVAILABLE_ICONS[0]);
                        setEditType('EXPENSE');
                      }}
                      className="text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Single
                    </button>
                  </>
                )}
              </div>
            </div>

            {isBulkAdding && isOnline && (
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4 animate-in slide-in-from-top-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-indigo-900">Bulk Smart Entry</h3>
                </div>
                <p className="text-xs text-indigo-600 leading-relaxed">
                  Describe the categories you want to create. Example: "I buy 10 apples and 10 pens, I need fruit and stationery categories."
                </p>
                <textarea 
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="Type your sentence here..."
                  className="w-full h-24 rounded-xl border-indigo-100 text-sm focus:ring-indigo-500 bg-white p-3"
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setIsBulkAdding(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleBulkGenerate}
                    disabled={isGenerating || !bulkInput.trim()}
                    className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate
                  </button>
                </div>
              </div>
            )}

            {(isAdding || editingId) && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 animate-in slide-in-from-top-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{isAdding ? 'Add Category' : 'Edit Category'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl border-slate-200 text-sm focus:ring-indigo-500"
                      placeholder="e.g. Subscriptions"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                    <select 
                      value={editType} 
                      onChange={(e) => setEditType(e.target.value as TransactionType)}
                      className="w-full rounded-xl border-slate-200 text-sm focus:ring-indigo-500"
                    >
                      <option value="EXPENSE">Expense</option>
                      <option value="INCOME">Income</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_COLORS.map(c => (
                      <button 
                        key={c} 
                        onClick={() => setEditColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${editColor === c ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Icon</label>
                  <div className="flex flex-wrap gap-3">
                    {AVAILABLE_ICONS.map(i => (
                      <button 
                        key={i} 
                        onClick={() => setEditIcon(i)}
                        className={`p-2 rounded-xl border-2 transition-all hover:bg-white ${editIcon === i ? 'border-indigo-600 bg-white ring-2 ring-indigo-100' : 'border-transparent bg-slate-100'}`}
                      >
                        <IconRenderer name={i} className="w-5 h-5" color={editIcon === i ? editColor : '#64748b'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    onClick={() => { setEditingId(null); setIsAdding(false); }}
                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={isAdding ? handleAdd : handleSaveEdit}
                    disabled={!editName}
                    className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {isAdding ? 'Create' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Your Ledger Pillars</h3>
              {categories.map((cat, idx) => {
                const stats = categoryStats[cat.id] || { count: 0, total: 0 };
                return (
                  <div key={cat.id} className="flex items-center gap-4 p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 group transition-all">
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => moveCategory(idx, 'up')} disabled={idx === 0} className="p-1 hover:text-indigo-600 disabled:opacity-0">
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveCategory(idx, 'down')} disabled={idx === categories.length - 1} className="p-1 hover:text-indigo-600 disabled:opacity-0">
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color + '15' }}
                    >
                      <IconRenderer name={cat.icon} className="w-6 h-6" color={cat.color} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 truncate">{cat.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest ${cat.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {cat.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3 text-slate-300" />
                          <span className="text-xs font-medium">{stats.count} items</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-3 h-3 text-slate-300" />
                          <span className="text-xs font-bold text-slate-600">₹{stats.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEditing(cat)}
                        className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(cat.id)}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
            )}
            {activeTab === 'DATA' && (
            <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
              {/* Profile Deletion Section */}
              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <p className="text-base font-extrabold text-amber-900">Delete This Profile</p>
                  </div>
                  <p className="text-xs text-amber-600">Permanently remove the active ledger: <strong>"{activeProfile?.name}"</strong>.</p>
                </div>
                <button 
                  onClick={() => activeProfile && onDeleteProfile(activeProfile.id)} 
                  disabled={profiles.length <= 1}
                  className={`w-full sm:w-auto px-6 py-3 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all active:scale-95 ${profiles.length <= 1 ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'}`}
                >
                  DELETE PROFILE
                </button>
              </div>

              {/* Full System Reset Section */}
              <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <p className="text-base font-extrabold text-red-900">Factory Reset</p>
                  </div>
                  <p className="text-xs text-red-600 mt-1">This will permanently delete all profiles and transactions from this phone.</p>
                </div>
                <button 
                  onClick={onClearData} 
                  className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white text-xs font-extrabold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 active:scale-95"
                >
                  WIPE ALL DATA
                </button>
              </div>
              
              {profiles.length <= 1 && (
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest px-6">
                  Note: You must have at least one profile. To delete this one, create another first.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
