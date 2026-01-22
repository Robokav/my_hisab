
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Category, MonthlyOpeningBalance, OpeningBalanceEntry } from '../types';
import { CalendarDays, ArrowUpRight, ArrowDownRight, IndianRupee, History, Package, Tag, X, Wallet, Check, Plus, Trash2, Edit3, Landmark, Banknote, Smartphone, ChevronDown, ChevronUp, Edit2, Undo, Copy } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { dbService } from '../services/dbService';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  profileId: string;
  onClose?: () => void;
  onOpeningBalanceChange?: (totalAmount: number) => void;
}

const IconRenderer: React.FC<{ name: string; className?: string; color?: string }> = ({ name, className, color }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Tag;
  return <IconComponent className={className} style={{ color }} />;
};

const MonthlyInspector: React.FC<Props> = ({ transactions, categories, profileId, onClose, onOpeningBalanceChange }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [openingEntries, setOpeningEntries] = useState<OpeningBalanceEntry[]>([]);
  const [isManagingBal, setIsManagingBal] = useState(false);
  
  const [newSource, setNewSource] = useState('');
  const [newAmount, setNewAmount] = useState('');

  // Editing states
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editSource, setEditSource] = useState('');
  const [editAmount, setEditAmount] = useState('');

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = useMemo(() => {
    const arr = [];
    for (let i = currentYear; i >= currentYear - 5; i--) arr.push(i);
    return arr;
  }, [currentYear]);

  useEffect(() => {
    const obj = dbService.getMonthlyOpeningBalanceObj(profileId, selectedYear, selectedMonth);
    setOpeningEntries(obj ? obj.entries : []);
    setEditingEntryId(null);
  }, [profileId, selectedMonth, selectedYear]);

  const totalOpeningBalance = useMemo(() => 
    openingEntries.reduce((sum, e) => sum + e.amount, 0), 
  [openingEntries]);

  const previousMonthData = useMemo(() => {
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear--;
    }
    const obj = dbService.getMonthlyOpeningBalanceObj(profileId, prevYear, prevMonth);
    return {
      entries: obj ? obj.entries : [],
      monthName: months[prevMonth]
    };
  }, [profileId, selectedMonth, selectedYear]);

  const monthData = useMemo(() => {
    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }).sort((a, b) => b.date.localeCompare(a.date));

    const income = filtered.reduce((acc, t) => t.type === 'INCOME' ? acc + t.amount : acc, 0);
    const expense = filtered.reduce((acc, t) => t.type === 'EXPENSE' ? acc + t.amount : acc, 0);

    return {
      filteredTransactions: filtered,
      income,
      expense,
      balance: income - expense + totalOpeningBalance
    };
  }, [transactions, selectedMonth, selectedYear, totalOpeningBalance]);

  const saveEntries = (entries: OpeningBalanceEntry[]) => {
    dbService.saveMonthlyOpeningBalance(profileId, selectedYear, selectedMonth, entries);
    setOpeningEntries(entries);
    if (onOpeningBalanceChange && selectedMonth === currentMonth && selectedYear === currentYear) {
      onOpeningBalanceChange(entries.reduce((sum, e) => sum + e.amount, 0));
    }
  };

  const handleCarryForward = () => {
    if (previousMonthData.entries.length === 0) return;
    // Map to new IDs to avoid conflicts
    const carriedEntries = previousMonthData.entries.map(e => ({
      ...e,
      id: Math.random().toString(36).substring(2, 9)
    }));
    saveEntries(carriedEntries);
  };

  const handleAddEntry = () => {
    if (!newSource || !newAmount) return;
    const newEntry: OpeningBalanceEntry = {
      id: Math.random().toString(36).substring(2, 9),
      source: newSource,
      amount: parseFloat(newAmount) || 0
    };
    const updated = [...openingEntries, newEntry];
    saveEntries(updated);
    setNewSource('');
    setNewAmount('');
  };

  const startEditing = (entry: OpeningBalanceEntry) => {
    setEditingEntryId(entry.id);
    setEditSource(entry.source);
    setEditAmount(entry.amount.toString());
  };

  const handleUpdateEntry = () => {
    if (!editingEntryId || !editSource || !editAmount) return;
    const updated = openingEntries.map(e => 
      e.id === editingEntryId 
        ? { ...e, source: editSource, amount: parseFloat(editAmount) || 0 } 
        : e
    );
    saveEntries(updated);
    setEditingEntryId(null);
  };

  const handleDeleteEntry = (id: string) => {
    const updated = openingEntries.filter(e => e.id !== id);
    saveEntries(updated);
    if (editingEntryId === id) setEditingEntryId(null);
  };

  const getSourceIcon = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('cash') || s.includes('hand')) return <Banknote className="w-3.5 h-3.5 text-green-500" />;
    if (s.includes('upi') || s.includes('phonepe') || s.includes('gpay') || s.includes('paytm')) return <Smartphone className="w-3.5 h-3.5 text-indigo-500" />;
    if (s.includes('bank') || s.includes('hdfc') || s.includes('sbi') || s.includes('icici')) return <Landmark className="w-3.5 h-3.5 text-blue-500" />;
    return <Wallet className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-md shadow-indigo-100">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-none">Monthly Inspector</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Historical Data & Ledger Foundation</p>
              </div>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="sm:hidden p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="pl-3 pr-2 py-1.5 bg-transparent text-xs font-bold focus:ring-0 outline-none cursor-pointer text-slate-700"
              >
                {months.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <div className="w-px h-4 bg-slate-200 my-auto"></div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="pl-2 pr-3 py-1.5 bg-transparent text-xs font-bold focus:ring-0 outline-none cursor-pointer text-slate-700"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-all text-xs font-bold"
              >
                <X className="w-3.5 h-3.5" />
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Opening Balances Management Section */}
      <div className="bg-indigo-50/40 border-b border-indigo-100">
        <button 
          onClick={() => setIsManagingBal(!isManagingBal)}
          className="w-full flex items-center justify-between p-6 hover:bg-indigo-100/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Starting Liquidity</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {openingEntries.length} Sources Totaling ₹{totalOpeningBalance.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {openingEntries.length === 0 && previousMonthData.entries.length > 0 && (
                <div className="hidden sm:flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter animate-pulse">
                  Empty Month Detected
                </div>
             )}
             {isManagingBal ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {isManagingBal && (
          <div className="px-6 pb-6 space-y-6 animate-in slide-in-from-top-2">
            
            {/* Carry Forward Suggestion */}
            {openingEntries.length === 0 && previousMonthData.entries.length > 0 && (
              <div className="p-4 bg-indigo-600 rounded-2xl border border-indigo-500 shadow-xl shadow-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Copy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white uppercase tracking-wider">Carry Forward Liquidity?</h5>
                    <p className="text-[10px] text-indigo-100 font-bold">Copy all {previousMonthData.entries.length} sources from {previousMonthData.monthName}.</p>
                  </div>
                </div>
                <button 
                  onClick={handleCarryForward}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white text-indigo-600 text-xs font-black uppercase rounded-xl hover:bg-indigo-50 transition-all active:scale-95 shadow-lg shadow-black/10"
                >
                  Confirm & Import
                </button>
              </div>
            )}

            {/* New Source Entry */}
            <div className="p-4 bg-white/50 rounded-2xl border border-indigo-100 border-dashed">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 ml-1 tracking-widest">NEW FUNDING SOURCE</label>
                  <input 
                    type="text" 
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    placeholder="e.g., HDFC Bank, Cash..."
                    className="w-full text-xs font-bold bg-white border-none rounded-xl px-4 py-2.5 shadow-sm focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 ml-1 tracking-widest">AMOUNT (₹)</label>
                  <input 
                    type="number" 
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-xs font-bold bg-white border-none rounded-xl px-4 py-2.5 shadow-sm focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <div className="sm:col-span-3">
                  <button 
                    onClick={handleAddEntry}
                    disabled={!newSource || !newAmount}
                    className="w-full bg-indigo-600 text-white rounded-xl py-2.5 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95 disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                    Add Source
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Sources List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {openingEntries.map(entry => {
                const isEditing = editingEntryId === entry.id;
                return (
                  <div key={entry.id} className={`bg-white p-3 rounded-2xl shadow-sm border transition-all ${isEditing ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-indigo-100 hover:border-indigo-200'}`}>
                    {isEditing ? (
                      <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                        <div className="space-y-1">
                          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Edit Source</label>
                          <input 
                            type="text" 
                            autoFocus
                            value={editSource} 
                            onChange={(e) => setEditSource(e.target.value)}
                            className="w-full text-xs font-bold bg-slate-50 border-none rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Edit Amount</label>
                          <input 
                            type="number" 
                            value={editAmount} 
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-full text-xs font-bold bg-slate-50 border-none rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                          <button onClick={() => setEditingEntryId(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                             <Undo className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={handleUpdateEntry} className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 rounded-lg">
                            {getSourceIcon(entry.source)}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-900 leading-tight truncate max-w-[100px]">{entry.source}</p>
                            <p className="text-xs font-black text-indigo-600">₹{entry.amount.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => startEditing(entry)}
                            className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit Source"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Source"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 bg-white">
        <div className="p-4 bg-green-50 rounded-2xl border border-green-100 transition-all hover:shadow-md hover:shadow-green-50/50">
          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Total Income</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-green-700">₹{monthData.income.toLocaleString()}</span>
            <ArrowUpRight className="w-5 h-5 text-green-400" />
          </div>
        </div>
        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 transition-all hover:shadow-md hover:shadow-red-50/50">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Total Expense</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-red-700">₹{monthData.expense.toLocaleString()}</span>
            <ArrowDownRight className="w-5 h-5 text-red-400" />
          </div>
        </div>
        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 transition-all hover:shadow-md hover:shadow-indigo-50/50">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Closing Balance</p>
          <div className="flex items-center justify-between">
            <span className={`text-xl font-black ${monthData.balance >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
              ₹{monthData.balance.toLocaleString()}
            </span>
            <IndianRupee className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        {monthData.filteredTransactions.length > 0 ? (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-sm shadow-sm z-10">
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Details</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {monthData.filteredTransactions.map(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">{t.description}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-slate-400 flex items-center gap-1">
                            {cat ? <IconRenderer name={cat.icon} className="w-2.5 h-2.5" color={cat.color} /> : <Tag className="w-2.5 h-2.5" />}
                            {t.categoryName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-3 text-right text-xs font-black ${t.type === 'INCOME' ? 'text-green-600' : 'text-slate-900'}`}>
                      ₹{t.amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-16 text-center">
            <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">Nothing found for {months[selectedMonth]} {selectedYear}.</p>
            <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-1">Try selecting another month</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyInspector;
