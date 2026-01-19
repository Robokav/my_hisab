
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, HisabStats, Category, ReportPeriod, TransactionType } from './types';
import Layout from './components/Layout';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Dashboard from './components/Dashboard';
import AiAssistant from './components/AiAssistant';
import CategoryManager from './components/CategoryManager';
import { Wallet, Download, Settings2, WifiOff, Database } from 'lucide-react';

const STORAGE_KEY = 'hisab_pro_transactions_v2';
const CATEGORY_KEY = 'hisab_pro_categories';

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Salary', type: 'INCOME', color: '#10b981', icon: 'Banknote' },
  { id: '2', name: 'Freelance', type: 'INCOME', color: '#6366f1', icon: 'Briefcase' },
  { id: '3', name: 'Investment', type: 'INCOME', color: '#f59e0b', icon: 'TrendingUp' },
  { id: '4', name: 'Groceries', type: 'EXPENSE', color: '#ef4444', icon: 'ShoppingCart' },
  { id: '5', name: 'Rent', type: 'EXPENSE', color: '#8b5cf6', icon: 'Home' },
  { id: '6', name: 'Utilities', type: 'EXPENSE', color: '#06b6d4', icon: 'Zap' },
  { id: '7', name: 'Entertainment', type: 'EXPENSE', color: '#ec4899', icon: 'Tv' },
  { id: '8', name: 'Transport', type: 'EXPENSE', color: '#f43f5e', icon: 'Car' },
  { id: '9', name: 'Food', type: 'EXPENSE', color: '#f97316', icon: 'Coffee' },
  { id: '10', name: 'Health', type: 'EXPENSE', color: '#14b8a6', icon: 'Heart' },
];

const App: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(CATEGORY_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [period, setPeriod] = useState<ReportPeriod>('MONTH');
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
  }, [categories]);

  const stats = useMemo<HisabStats>(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const filtered = transactions.filter(t => {
      const txDate = new Date(t.date);
      if (period === 'TODAY') {
        return t.date === todayStr;
      } else if (period === 'YESTERDAY') {
        return t.date === yesterdayStr;
      } else if (period === 'WEEK') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return txDate >= weekAgo;
      } else if (period === 'MONTH') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      } else {
        return txDate.getFullYear() === now.getFullYear();
      }
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryAgg: Record<string, { value: number, color: string }> = {};
    const timeMap: Record<string, { income: number; expense: number }> = {};

    filtered.forEach(t => {
      if (t.type === 'INCOME') totalIncome += t.amount;
      else {
        totalExpense += t.amount;
        const category = categories.find(c => c.id === t.categoryId);
        const catName = t.categoryName;
        if (!categoryAgg[catName]) {
          categoryAgg[catName] = { value: 0, color: category?.color || '#cbd5e1' };
        }
        categoryAgg[catName].value += t.amount;
      }

      let label = t.date;
      const d = new Date(t.date);
      if (period === 'MONTH') {
        label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } else if (period === 'YEAR') {
        label = d.toLocaleDateString('en-IN', { month: 'short' });
      } else if (period === 'TODAY' || period === 'YESTERDAY') {
        label = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      } else {
        label = d.toLocaleDateString('en-IN', { weekday: 'short' });
      }

      if (!timeMap[label]) timeMap[label] = { income: 0, expense: 0 };
      if (t.type === 'INCOME') timeMap[label].income += t.amount;
      else timeMap[label].expense += t.amount;
    });

    const categoryData = Object.entries(categoryAgg).map(([name, data]) => ({ name, ...data }));
    const timeSeriesData = Object.entries(timeMap).map(([label, vals]) => ({ label, ...vals }));

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categoryData,
      timeSeriesData
    };
  }, [transactions, period, categories]);

  const addTransaction = (newTx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [...prev, transaction]);
  };

  const addTransactions = (newTxs: Omit<Transaction, 'id' | 'createdAt'>[]) => {
    const newItems: Transaction[] = newTxs.map(tx => ({
      ...tx,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString()
    }));
    setTransactions(prev => [...prev, ...newItems]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addCategory = (name: string, type: TransactionType, color?: string, icon?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newCat: Category = { 
      id, 
      name, 
      type, 
      color: color || '#6366f1', 
      icon: icon || 'Tag' 
    };
    setCategories(prev => [...prev, newCat]);
    return id;
  };

  const updateCategory = (updatedCat: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
    setTransactions(prev => prev.map(t => 
      t.categoryId === updatedCat.id ? { ...t, categoryName: updatedCat.name } : t
    ));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const clearAllData = () => {
    if (confirm("Are you sure? This will delete all your hisab entries forever!")) {
      setTransactions([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const reorderCategories = (newOrder: Category[]) => {
    setCategories(newOrder);
  };

  const exportToCSV = () => {
    if (transactions.length === 0) return;
    
    const headers = ['Date', 'Description', 'Type', 'Category', 'Qty', 'Unit', 'Payment Mode', 'Amount'];
    const rows = transactions.map(t => [
      t.date,
      t.description,
      t.type,
      t.categoryName,
      t.quantity,
      t.unit,
      t.paymentMode,
      t.amount
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hisab_pro_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-100">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">My Hisab</h1>
                <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-200">
                  <Database className="w-3 h-3" />
                  SAVED LOCALLY
                </div>
                {!isOnline && (
                  <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">
                    <WifiOff className="w-3 h-3" />
                    OFFLINE
                  </div>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-1">Data stays on your device forever</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsCategoryManagerOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-700 px-3 sm:px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={exportToCSV}
              className="bg-white hover:bg-slate-50 text-slate-700 px-3 sm:px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </header>

        <section>
          <AiAssistant transactions={transactions} isOnline={isOnline} />
        </section>

        <section>
          <Dashboard 
            stats={stats} 
            period={period} 
            onPeriodChange={setPeriod} 
          />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xl font-bold text-slate-900">Record New Entry</h2>
          </div>
          <TransactionForm 
            categories={categories} 
            onAddTransaction={addTransaction} 
            onAddTransactions={addTransactions}
            onAddCategory={addCategory}
            isOnline={isOnline}
          />
        </section>

        <section>
          <TransactionList transactions={transactions} categories={categories} onDelete={deleteTransaction} />
        </section>
      </div>

      <CategoryManager 
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        transactions={transactions}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
        onAdd={addCategory}
        onReorder={reorderCategories}
        onClearData={clearAllData}
        isOnline={isOnline}
      />
    </Layout>
  );
};

export default App;
