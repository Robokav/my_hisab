
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, HisabStats, Category, ReportPeriod, Profile, TransactionType } from './types';
import Layout from './components/Layout';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Dashboard from './components/Dashboard';
import AiAssistant from './components/AiAssistant';
import MonthlyInspector from './components/MonthlyInspector';
import MathematicalIntelligence from './components/MathematicalIntelligence';
import CategoryManager from './components/CategoryManager';
import EditTransactionModal from './components/EditTransactionModal';
import CreateProfileModal from './components/CreateProfileModal';
import InstallGuide from './components/InstallGuide';
import { dbService } from './services/dbService';
import { Wallet, Settings2, Plus, ChevronDown, CheckCircle2, Download, WifiOff, CalendarSearch, ChevronRight, BrainCircuit, Sparkles } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// Run migrations before App starts
dbService.migrate();

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Salary', type: 'INCOME', color: '#10b981', icon: 'Banknote' },
  { id: '2', name: 'Freelance', type: 'INCOME', color: '#6366f1', icon: 'Briefcase' },
  { id: '3', name: 'Groceries', type: 'EXPENSE', color: '#ef4444', icon: 'ShoppingCart' },
  { id: '4', name: 'Rent', type: 'EXPENSE', color: '#8b5cf6', icon: 'Home' },
  { id: '5', name: 'Food', type: 'EXPENSE', color: '#f97316', icon: 'Coffee' },
];

const IconRenderer: React.FC<{ name: string; className?: string; color?: string }> = ({ name, className, color }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.User;
  return <IconComponent className={className} style={{ color }} />;
};

const App: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = dbService.getProfiles();
    if (saved.length > 0) return saved;
    return [{ id: 'p1', name: 'My Personal Hisab', color: '#6366f1', icon: 'User', createdAt: new Date().toISOString() }];
  });
  
  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return dbService.getActiveProfileId() || (profiles[0]?.id || 'p1');
  });

  const activeProfile = useMemo(() => 
    profiles.find(p => p.id === activeProfileId) || profiles[0]
  , [profiles, activeProfileId]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [period, setPeriod] = useState<ReportPeriod>('MONTH');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isMathIntelOpen, setIsMathIntelOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => { dbService.saveProfiles(profiles); }, [profiles]);
  useEffect(() => { dbService.setActiveProfileId(activeProfileId); }, [activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      const loadedTransactions = dbService.getTransactions(activeProfileId);
      const loadedCategories = dbService.getCategories(activeProfileId);
      setTransactions(loadedTransactions);
      setCategories(loadedCategories.length > 0 ? loadedCategories : DEFAULT_CATEGORIES);
    }
  }, [activeProfileId]);

  useEffect(() => { 
    if (activeProfileId) {
      dbService.saveTransactions(activeProfileId, transactions);
    }
  }, [transactions, activeProfileId]);

  useEffect(() => { 
    if (activeProfileId) {
      dbService.saveCategories(activeProfileId, categories);
    }
  }, [categories, activeProfileId]);

  const stats = useMemo<HisabStats>(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const filtered = transactions.filter(t => {
      const txDate = new Date(t.date);
      if (period === 'TODAY') return t.date === todayStr;
      if (period === 'YESTERDAY') return t.date === yesterdayStr;
      if (period === 'WEEK') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return txDate >= weekAgo;
      }
      if (period === 'MONTH') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      return txDate.getFullYear() === now.getFullYear();
    });

    let totalIncome = 0, totalExpense = 0;
    let incomeCount = 0, expenseCount = 0;
    let minTime = Infinity;
    let maxTime = -Infinity;

    const categoryAgg: Record<string, { value: number, color: string }> = {};
    const timeMap: Record<string, { income: number; expense: number }> = {};
    
    filtered.forEach(t => {
      const tTime = new Date(t.date).getTime();
      if (tTime < minTime) minTime = tTime;
      if (tTime > maxTime) maxTime = tTime;

      if (t.type === 'INCOME') {
        totalIncome += t.amount;
        incomeCount++;
      } else {
        totalExpense += t.amount;
        expenseCount++;
        const cat = categories.find(c => c.id === t.categoryId);
        if (!categoryAgg[t.categoryName]) {
          categoryAgg[t.categoryName] = { value: 0, color: cat?.color || '#cbd5e1' };
        }
        categoryAgg[t.categoryName].value += t.amount;
      }
      
      let label = t.date;
      const d = new Date(t.date);
      if (period === 'MONTH') label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      else if (period === 'YEAR') label = d.toLocaleDateString('en-IN', { month: 'short' });
      else if (period === 'TODAY' || period === 'YESTERDAY') label = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      else label = d.toLocaleDateString('en-IN', { weekday: 'short' });
      
      if (!timeMap[label]) timeMap[label] = { income: 0, expense: 0 };
      if (t.type === 'INCOME') timeMap[label].income += t.amount;
      else timeMap[label].expense += t.amount;
    });

    const daySpan = minTime === Infinity 
      ? 1 
      : Math.max(1, Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24)) + 1);

    return {
      totalIncome, totalExpense, balance: totalIncome - totalExpense,
      incomeCount, expenseCount, totalCount: filtered.length,
      categoryData: Object.entries(categoryAgg).map(([name, data]) => ({ name, ...data })),
      timeSeriesData: Object.entries(timeMap).map(([label, vals]) => ({ label, ...vals })),
      daySpan
    };
  }, [transactions, period, categories]);

  const handleCreateProfile = (name: string, color: string, icon: string) => {
    const id = "p_" + Math.random().toString(36).substring(2, 9);
    const newProfile: Profile = {
      id,
      name,
      color,
      icon,
      createdAt: new Date().toISOString()
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(id);
    setIsProfileMenuOpen(false);
  };

  const deleteProfile = (id: string) => {
    if (profiles.length === 1) {
      alert("You must have at least one Interface.");
      return;
    }
    const targetProfile = profiles.find(p => p.id === id);
    if (confirm(`DANGER: This will permanently delete the "${targetProfile?.name}" interface and ALL its data. This cannot be undone! Continue?`)) {
      setProfiles(prev => prev.filter(p => p.id !== id));
      dbService.deleteProfileData(id);
      if (activeProfileId === id) {
        const remaining = profiles.filter(p => p.id !== id);
        setActiveProfileId(remaining[0].id);
      }
    }
  };

  const handleUpdateProfile = (updatedProfile: Profile) => {
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
    setEditingTransaction(null);
  };

  const handleAddCategory = (name: string, type: TransactionType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setCategories(prev => [...prev, { id, name, type, color: '#6366f1', icon: 'Tag' }]);
    return id;
  };

  const exportAllToCsv = () => {
    if (transactions.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Payment Mode', 'Quantity', 'Unit'];
    const sortedTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
    
    const rows = sortedTransactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.categoryName}"`,
      t.type,
      t.amount,
      t.paymentMode,
      t.quantity,
      `"${t.unit || ''}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split('T')[0];
    const profileName = activeProfile.name.replace(/[^a-z0-9]/gi, '_');
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Hisab_${profileName}_Full_Backup_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      {!isOnline && (
        <div className="fixed top-0 left-0 w-full bg-slate-800 text-white py-1.5 px-4 text-[10px] font-black tracking-widest flex items-center justify-center gap-2 z-[9999] shadow-md animate-in slide-in-from-top duration-300">
          <WifiOff className="w-3 h-3" />
          OFFLINE MODE {"\u2022"} DATA SAVING LOCALLY
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100 hidden sm:block">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-300 transition-all active:scale-95"
                >
                  <div className="p-1.5 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: activeProfile.color + '20' }}>
                    <IconRenderer name={activeProfile.icon} className="w-4 h-4" color={activeProfile.color} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Active Profile</p>
                    <p className="text-sm font-bold text-slate-800 leading-none truncate max-w-[120px] sm:max-w-[200px]">{activeProfile.name}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">My Interfaces</span>
                      <button onClick={() => { setIsCreateProfileOpen(true); setIsProfileMenuOpen(false); }} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                      {profiles.map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => { setActiveProfileId(p.id); setIsProfileMenuOpen(false); }}
                          className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${activeProfileId === p.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl flex items-center justify-center ${activeProfileId === p.id ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                              <IconRenderer name={p.icon} className="w-4 h-4" color={activeProfileId === p.id ? 'white' : p.color} />
                            </div>
                            <span className="text-sm font-bold truncate max-w-[150px]">{p.name}</span>
                          </div>
                          {activeProfileId === p.id && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setIsCreateProfileOpen(true)}
                title="Quick Create New Profile"
                className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all active:scale-95 flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={exportAllToCsv}
              className="flex-1 sm:flex-none bg-white hover:bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export All</span>
            </button>
             <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-95"
            >
              <Settings2 className="w-4 h-4" />
              Settings
            </button>
          </div>
        </header>

        {activeProfile && (
          <>
            <section><AiAssistant transactions={transactions} isOnline={isOnline} /></section>
            <section><Dashboard stats={stats} period={period} onPeriodChange={setPeriod} /></section>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setIsMathIntelOpen(true)}
                className="group p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl border border-slate-800 flex items-center justify-between hover:shadow-2xl hover:scale-[1.01] transition-all active:scale-95"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500 rounded-2xl group-hover:bg-indigo-400 transition-colors">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black">Math Intelligence</h3>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Burn rates, Forecasts & Velocity</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-all" />
              </button>

              <button 
                onClick={() => setIsInspectorOpen(true)}
                className="group p-6 bg-white rounded-[2rem] shadow-sm border border-slate-200 flex items-center justify-between hover:border-indigo-300 hover:shadow-md transition-all active:scale-95"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <CalendarSearch className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-black text-slate-900">Monthly Inspector</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Analyze historical ledger data</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-all" />
              </button>
            </div>

            {isInspectorOpen && (
              <section>
                <MonthlyInspector 
                  transactions={transactions} 
                  categories={categories} 
                  onClose={() => setIsInspectorOpen(false)}
                />
              </section>
            )}

            <section>
              <TransactionForm 
                categories={categories}
                onAddTransaction={(newTx) => setTransactions(prev => [...prev, { ...newTx, id: Math.random().toString(36).substring(2, 9), createdAt: new Date().toISOString() }])} 
                onAddTransactions={(newTxs) => setTransactions(prev => [...prev, ...newTxs.map(tx => ({ ...tx, id: Math.random().toString(36).substring(2, 9), createdAt: new Date().toISOString() }))])}
                onAddCategory={handleAddCategory}
                isOnline={isOnline}
              />
            </section>
            <section>
              <TransactionList 
                transactions={transactions} 
                categories={categories} 
                onDelete={(id) => setTransactions(prev => prev.filter(t => t.id !== id))} 
                onEdit={(tx) => setEditingTransaction(tx)}
              />
            </section>
          </>
        )}
      </div>

      <MathematicalIntelligence 
        transactions={transactions}
        categories={categories}
        isOpen={isMathIntelOpen} 
        onClose={() => setIsMathIntelOpen(false)} 
      />

      <CategoryManager 
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
        categories={categories} transactions={transactions}
        profiles={profiles} activeProfileId={activeProfileId}
        onCreateProfile={() => setIsCreateProfileOpen(true)} 
        onDeleteProfile={deleteProfile}
        onUpdateProfile={handleUpdateProfile}
        onUpdateCategory={(cat) => setCategories(prev => prev.map(c => c.id === cat.id ? cat : c))}
        onDeleteCategory={(id) => setCategories(prev => prev.filter(c => c.id !== id))}
        onReorderCategories={(newCats) => setCategories(newCats)}
        onAddCategory={(name, type, color, icon) => {
           const id = Math.random().toString(36).substring(2, 9);
           setCategories(prev => [...prev, { id, name, type, color, icon }]);
           return id;
        }}
        onClearData={() => {
          if(confirm("DANGER: This will wipe ALL data for ALL interfaces on this phone. Are you sure?")) {
            dbService.clearAll();
            window.location.reload();
          }
        }}
        onRestoreBackup={(json) => {
          if (dbService.importFullBackup(json)) {
             alert("System Restored Successfully!");
             window.location.reload();
          } else {
             alert("Restore Failed. Invalid file format.");
          }
        }}
        isOnline={isOnline}
      />

      {editingTransaction && (
        <EditTransactionModal
          key={editingTransaction.id}
          transaction={editingTransaction}
          categories={categories}
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onUpdate={handleUpdateTransaction}
          onAddCategory={handleAddCategory}
        />
      )}

      <CreateProfileModal
        isOpen={isCreateProfileOpen}
        onClose={() => setIsCreateProfileOpen(false)}
        onCreate={handleCreateProfile}
      />
      
      <InstallGuide />
    </Layout>
  );
};

export default App;
