
import React, { useState, useRef, useMemo } from 'react';
import { Category, TransactionType, Transaction, Profile, PaymentMode } from '../types';
import { 
  X, Plus, Trash2, LayoutGrid, GripVertical, Edit2, Save, Undo, Check, Layers, 
  Database, ShieldCheck, UploadCloud, DownloadCloud, ChevronUp, ChevronDown, 
  TrendingUp, Activity, Tag, HelpCircle, Sparkles, Loader2, Wand2
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { suggestCategories } from '../services/geminiService';
import * as LucideIcons from 'lucide-react';

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
  onUpdateCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategories: (newCategories: Category[]) => void;
  onAddCategory: (name: string, type: TransactionType, color: string, icon: string) => string;
  onClearData: () => void;
  onRestoreBackup: (json: string) => void;
  isOnline: boolean;
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

const SELECTABLE_ICONS = [
  'User', 'Briefcase', 'Home', 'ShoppingBag', 'Landmark', 'Heart', 'Smartphone', 'Zap', 
  'Globe', 'Gift', 'Car', 'Utensils', 'Truck', 'Tag', 'Coffee', 'ShoppingCart', 'Dumbbell', 'Gamepad', 'Music', 'Plane'
];

const IconRenderer: React.FC<{ name: string; className?: string; color?: string }> = ({ name, className, color }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Tag;
  return <IconComponent className={className} style={{ color }} />;
};

const CategoryManager: React.FC<Props> = ({ 
  isOpen, onClose, profiles, activeProfileId, onCreateProfile, onDeleteProfile,
  onUpdateProfile, onClearData, categories, onUpdateCategory, onDeleteCategory, 
  onReorderCategories, onAddCategory, onRestoreBackup, transactions, isOnline
}) => {
  const [activeTab, setActiveTab] = useState<'PROFILES' | 'CATEGORIES' | 'DATA'>('PROFILES');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Interface Editing State
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editProfName, setEditProfName] = useState('');
  const [editProfColor, setEditProfColor] = useState('');
  const [editProfIcon, setEditProfIcon] = useState('');
  
  // Category Editing State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('');

  // Single Category Creation State
  const [isAddingSingle, setIsAddingSingle] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<TransactionType>('EXPENSE');
  const [newCatColor, setNewCatColor] = useState(AVAILABLE_COLORS[0].hex);
  const [newCatIcon, setNewCatIcon] = useState(SELECTABLE_ICONS[0]);

  // Bulk AI State
  const [isBulkAiLoading, setIsBulkAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  const getCatStats = (catId: string) => {
    const filtered = transactions.filter(t => t.categoryId === catId);
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    return { count: filtered.length, total };
  };

  const handleFullBackup = () => {
    const backupJson = dbService.exportFullBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `Hisab_Pro_Full_Vault_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') onRestoreBackup(result);
    };
    reader.readAsText(file);
  };

  const startEditingProfile = (p: Profile) => {
    setEditingProfileId(p.id);
    setEditProfName(p.name);
    setEditProfColor(p.color);
    setEditProfIcon(p.icon);
  };

  const saveProfileEdit = (p: Profile) => {
    onUpdateProfile({ ...p, name: editProfName, color: editProfColor, icon: editProfIcon });
    setEditingProfileId(null);
  };

  const startEditingCat = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setEditCatName(cat.name);
    setEditCatColor(cat.color);
    setEditCatIcon(cat.icon);
  };

  const saveCatEdit = (cat: Category) => {
    onUpdateCategory({ ...cat, name: editCatName, color: editCatColor, icon: editCatIcon });
    setEditingCategoryId(null);
  };

  const handleAddSingleCategory = () => {
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim(), newCatType, newCatColor, newCatIcon);
    setIsAddingSingle(false);
    setNewCatName('');
  };

  const handleFetchAiSuggestions = async () => {
    if (!isOnline) return;
    setIsBulkAiLoading(true);
    const context = activeProfile ? `Suggest smart finance categories for a ledger named "${activeProfile.name}".` : "Suggest common personal finance categories.";
    try {
      const suggestions = await suggestCategories(context);
      // Filter out duplicates
      const filtered = suggestions.filter(s => !categories.some(c => c.name.toLowerCase() === s.name.toLowerCase()));
      setAiSuggestions(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBulkAiLoading(false);
    }
  };

  const handleAddAiSuggestion = (s: any) => {
    onAddCategory(s.name, s.type, s.color, s.icon);
    setAiSuggestions(prev => prev.filter(item => item !== s));
  };

  const moveCategory = (index: number, direction: 'UP' | 'DOWN') => {
    const newIndex = direction === 'UP' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;
    const newItems = [...categories];
    const [movedItem] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, movedItem);
    onReorderCategories(newItems);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
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
              className={`flex-1 min-w-[100px] py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/20 no-scrollbar">
          {activeTab === 'PROFILES' && (
            <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Interfaces</h3>
                <button onClick={onCreateProfile} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95 transition-all">
                  <Plus className="w-4 h-4" /> Quick Create
                </button>
              </div>
              <div className="grid gap-3">
                {profiles.map(p => (
                  <div key={p.id} className={`flex flex-col p-4 rounded-2xl border transition-all ${editingProfileId === p.id ? 'border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-100 shadow-md' : activeProfileId === p.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    {editingProfileId === p.id ? (
                      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Interface Name</label>
                          <input type="text" value={editProfName} autoFocus onChange={(e) => setEditProfName(e.target.value)} className="w-full text-sm font-bold border-slate-200 rounded-xl px-3 py-1.5 focus:ring-indigo-500" />
                        </div>
                        <div className="flex flex-col sm:flex-row items-start gap-4">
                           <div className="w-full">
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-2 block ml-1">Theme Color</label>
                            <div className="flex flex-wrap gap-2">
                              {AVAILABLE_COLORS.map(c => (
                                <button key={c.hex} onClick={() => setEditProfColor(c.hex)} className={`w-7 h-7 rounded-lg border-2 transition-transform active:scale-90 ${editProfColor === c.hex ? 'border-slate-900 scale-110' : 'border-transparent opacity-80'}`} style={{ backgroundColor: c.hex }} />
                              ))}
                            </div>
                          </div>
                          <div className="w-full">
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-2 block ml-1">Icon</label>
                            <div className="flex flex-wrap gap-2">
                              {SELECTABLE_ICONS.map(icon => (
                                <button key={icon} onClick={() => setEditProfIcon(icon)} className={`p-1.5 rounded-lg border-2 transition-all active:scale-90 ${editProfIcon === icon ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                                  <IconRenderer name={icon} className="w-4 h-4" color={editProfIcon === icon ? '#4f46e5' : '#94a3b8'} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button onClick={() => setEditingProfileId(null)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600"><Undo className="w-3 h-3" /> Cancel</button>
                          <button onClick={() => saveProfileEdit(p)} className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-md active:scale-95"><Check className="w-3 h-3" /> Save</button>
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
                              {p.name} {activeProfileId === p.id && <span className="ml-2 text-[8px] bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase">Active</span>}
                            </p>
                            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Standard Ledger</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEditingProfile(p)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                          {profiles.length > 1 && <button onClick={() => onDeleteProfile(p.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'CATEGORIES' && (
            <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Our Ledger Pillars</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={handleFetchAiSuggestions}
                    disabled={isBulkAiLoading || !isOnline}
                    className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {isBulkAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Bulk AI
                  </button>
                  <button 
                    onClick={() => setIsAddingSingle(!isAddingSingle)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 transition-all shadow-sm active:scale-95 ${isAddingSingle ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    <Plus className="w-3 h-3" /> Single
                  </button>
                </div>
              </div>

              {isAddingSingle && (
                <div className="p-6 bg-white border border-indigo-200 rounded-3xl shadow-xl shadow-indigo-50 space-y-4 animate-in slide-in-from-top-4 duration-300">
                   <div className="flex items-center justify-between mb-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Pillar</p>
                     <div className="flex bg-slate-100 p-0.5 rounded-lg">
                       {(['EXPENSE', 'INCOME'] as const).map(t => (
                         <button key={t} onClick={() => setNewCatType(t)} className={`px-2 py-1 text-[9px] font-black rounded-md transition-all ${newCatType === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{t}</button>
                       ))}
                     </div>
                   </div>
                   <input type="text" placeholder="Category Name..." value={newCatName} autoFocus onChange={(e) => setNewCatName(e.target.value)} className="w-full text-sm font-bold border-slate-200 rounded-xl px-4 py-3 focus:ring-indigo-500" />
                   <div className="space-y-4">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-2 block ml-1">Color Theme</label>
                        <div className="flex flex-wrap gap-2">
                          {AVAILABLE_COLORS.map(c => <button key={c.hex} onClick={() => setNewCatColor(c.hex)} className={`w-7 h-7 rounded-lg border-2 transition-transform active:scale-90 ${newCatColor === c.hex ? 'border-slate-900 scale-110' : 'border-transparent opacity-80'}`} style={{ backgroundColor: c.hex }} />)}
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-2 block ml-1">Identity Icon</label>
                        <div className="flex flex-wrap gap-2">
                          {SELECTABLE_ICONS.map(icon => <button key={icon} onClick={() => setNewCatIcon(icon)} className={`p-1.5 rounded-lg border-2 transition-all active:scale-90 ${newCatIcon === icon ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}><IconRenderer name={icon} className="w-4 h-4" color={newCatIcon === icon ? '#4f46e5' : '#94a3b8'} /></button>)}
                        </div>
                      </div>
                   </div>
                   <div className="flex gap-2 pt-2">
                     <button onClick={() => setIsAddingSingle(false)} className="flex-1 py-3 text-xs font-bold text-slate-400 rounded-xl hover:bg-slate-50">Cancel</button>
                     <button onClick={handleAddSingleCategory} disabled={!newCatName.trim()} className="flex-1 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50">Add Category</button>
                   </div>
                </div>
              )}

              {aiSuggestions.length > 0 && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1"><Wand2 className="w-3 h-3" /> AI Suggested Pillars</p>
                    <button onClick={() => setAiSuggestions([])} className="text-[9px] font-black text-slate-300 uppercase">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.map((s, idx) => (
                      <button key={idx} onClick={() => handleAddAiSuggestion(s)} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95 group">
                        <IconRenderer name={s.icon} className="w-3.5 h-3.5" color={s.color} />
                        <span className="text-xs font-bold text-indigo-900">{s.name}</span>
                        <Plus className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                {categories.map((cat, index) => {
                  const stats = getCatStats(cat.id);
                  const isEditing = editingCategoryId === cat.id;
                  return (
                    <div key={cat.id} className={`flex flex-col p-3 rounded-2xl border transition-all ${isEditing ? 'border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-100 shadow-md' : 'border-slate-100 bg-white hover:border-indigo-100 hover:shadow-sm'}`}>
                      {isEditing ? (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Category Name</label>
                              <input type="text" value={editCatName} autoFocus onChange={(e) => setEditCatName(e.target.value)} className="w-full text-sm font-bold border-slate-200 rounded-xl px-3 py-1.5 focus:ring-indigo-500" />
                            </div>
                            <div className="flex flex-col items-center">
                              <label className="text-[9px] font-bold text-slate-400 uppercase mb-1">Preview</label>
                              <div className="p-2 rounded-xl border border-slate-200 shadow-sm bg-white"><IconRenderer name={editCatIcon} className="w-6 h-6" color={editCatColor} /></div>
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-2 block ml-1">Theme Color</label>
                            <div className="flex flex-wrap gap-2">
                              {AVAILABLE_COLORS.map(c => <button key={c.hex} onClick={() => setEditCatColor(c.hex)} className={`w-7 h-7 rounded-lg border-2 transition-transform active:scale-90 ${editCatColor === c.hex ? 'border-slate-900 scale-110' : 'border-transparent opacity-80'}`} style={{ backgroundColor: c.hex }} />)}
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-2 block ml-1">Icon</label>
                            <div className="flex flex-wrap gap-2">
                              {SELECTABLE_ICONS.map(icon => <button key={icon} onClick={() => setEditCatIcon(icon)} className={`p-1.5 rounded-lg border-2 transition-all active:scale-90 ${editCatIcon === icon ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}><IconRenderer name={icon} className="w-4 h-4" color={editCatIcon === icon ? '#4f46e5' : '#94a3b8'} /></button>)}
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button onClick={() => setEditingCategoryId(null)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600"><Undo className="w-3 h-3" /> Cancel</button>
                            <button onClick={() => saveCatEdit(cat)} className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-md active:scale-95"><Check className="w-3 h-3" /> Update</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-0.5">
                            <button onClick={(e) => { e.stopPropagation(); moveCategory(index, 'UP'); }} disabled={index === 0} className={`p-1 rounded-md transition-colors ${index === 0 ? 'text-slate-100' : 'text-slate-400 hover:bg-slate-100'}`}><ChevronUp className="w-3.5 h-3.5" /></button>
                            <button onClick={(e) => { e.stopPropagation(); moveCategory(index, 'DOWN'); }} disabled={index === categories.length - 1} className={`p-1 rounded-md transition-colors ${index === categories.length - 1 ? 'text-slate-100' : 'text-slate-400 hover:bg-slate-100'}`}><ChevronDown className="w-3.5 h-3.5" /></button>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center min-w-[48px] min-h-[48px]" style={{ backgroundColor: cat.color + '10' }}>
                            <IconRenderer name={cat.icon} className="w-5 h-5" color={cat.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[13px] font-black text-slate-800 truncate">{cat.name}</p>
                              <span className={`text-[7px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full border ${cat.type === 'INCOME' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{cat.type}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400"><Activity className="w-2.5 h-2.5" /> {stats.count}</div>
                              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400"><TrendingUp className="w-2.5 h-2.5" /> ₹{stats.total.toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button onClick={(e) => { e.stopPropagation(); startEditingCat(cat); }} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); if(confirm(`Confirm delete: "${cat.name}"?`)) onDeleteCategory(cat.id); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'DATA' && (
            <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
              <div className="p-6 bg-slate-900 rounded-[2rem] border border-slate-800 text-white relative overflow-hidden group">
                <Database className="absolute top-0 right-0 p-4 w-24 h-24 text-white/5 group-hover:scale-110 transition-transform" />
                <div className="relative z-10 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base font-black uppercase tracking-widest">Full System Vault</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed">Absolute protection. Backup all profiles, transactions, and settings into a single JSON file.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleFullBackup} className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-900/40"><DownloadCloud className="w-4 h-4" /> Backup Vault</button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 border border-slate-700"><UploadCloud className="w-4 h-4" /> Restore Vault</button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileUpload} />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <p className="text-base font-extrabold text-amber-900">Delete This Profile</p>
                  </div>
                  <p className="text-xs text-amber-600">Permanently remove: <strong>"{activeProfile?.name}"</strong>.</p>
                </div>
                <button onClick={() => activeProfile && onDeleteProfile(activeProfile.id)} disabled={profiles.length <= 1} className={`w-full sm:w-auto px-6 py-3 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all active:scale-95 ${profiles.length <= 1 ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'}`}>DELETE PROFILE</button>
              </div>
              <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start"><Trash2 className="w-4 h-4 text-red-600" /><p className="text-base font-extrabold text-red-900">Factory Reset</p></div>
                  <p className="text-xs text-red-600 mt-1">Permanently delete all data from this phone.</p>
                </div>
                <button onClick={onClearData} className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white text-xs font-extrabold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 active:scale-95">WIPE ALL DATA</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;