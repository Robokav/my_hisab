
import React, { useState, useMemo } from 'react';
import { Transaction, PaymentMode, TransactionType, Category } from '../types';
import * as LucideIcons from 'lucide-react';
import { 
  Trash2, TrendingDown, TrendingUp, Calendar, Tag, Package, CreditCard, Banknote, 
  Smartphone, Landmark, MoreHorizontal, Search, ChevronDown, Filter, Wallet as WalletIcon, 
  Globe, X, ChevronUp, IndianRupee, Edit2
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

const ITEMS_PER_PAGE = 3;
const LOAD_MORE_INCREMENT = 10;
type DateFilterType = 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_30_DAYS' | 'CUSTOM';

const IconRenderer: React.FC<{ name: string; className?: string; color?: string }> = ({ name, className, color }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Tag;
  return <IconComponent className={className} style={{ color }} />;
};

const PaymentModeBadge: React.FC<{ mode: PaymentMode }> = ({ mode }) => {
  const icons = {
    CASH: <Banknote className="w-3 h-3" />,
    UPI: <Smartphone className="w-3 h-3" />,
    CARD: <CreditCard className="w-3 h-3" />,
    BANK: <Landmark className="w-3 h-3" />,
    WALLET: <WalletIcon className="w-3 h-3" />,
    NET_BANKING: <Globe className="w-3 h-3" />,
    OTHER: <MoreHorizontal className="w-3 h-3" />,
  };

  const colors = {
    CASH: 'bg-green-50 text-green-700 border-green-100',
    UPI: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    CARD: 'bg-blue-50 text-blue-700 border-blue-100',
    BANK: 'bg-slate-50 text-slate-700 border-slate-100',
    WALLET: 'bg-orange-50 text-orange-700 border-orange-100',
    NET_BANKING: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    OTHER: 'bg-slate-50 text-slate-700 border-slate-100',
  };

  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold tracking-wider ${colors[mode]}`}>
      {icons[mode]}
      {mode.replace('_', ' ')}
    </div>
  );
};

const TransactionList: React.FC<Props> = ({ transactions, categories, onDelete, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<PaymentMode | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [customDate, setCustomDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    return transactions
      .filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             t.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMode = filterMode === 'ALL' || t.paymentMode === filterMode;
        const matchesType = filterType === 'ALL' || t.type === filterType;
        const amount = t.amount;
        const matchesMin = minAmount === '' || amount >= parseFloat(minAmount);
        const matchesMax = maxAmount === '' || amount <= parseFloat(maxAmount);
        
        let matchesDate = true;
        const txDate = new Date(t.date);
        const txDateStr = t.date;

        if (dateFilter === 'CUSTOM' && customDate) {
          matchesDate = txDateStr === customDate;
        } else if (dateFilter === 'TODAY') {
          matchesDate = txDateStr === todayStr;
        } else if (dateFilter === 'YESTERDAY') {
          matchesDate = txDateStr === yesterdayStr;
        } else if (dateFilter === 'THIS_WEEK') {
          const startOfWeek = new Date();
          startOfWeek.setDate(now.getDate() - now.getDay());
          matchesDate = txDate >= startOfWeek;
        } else if (dateFilter === 'LAST_7_DAYS') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          matchesDate = txDate >= sevenDaysAgo;
        } else if (dateFilter === 'THIS_MONTH') {
          matchesDate = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === 'LAST_30_DAYS') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          matchesDate = txDate >= thirtyDaysAgo;
        }

        return matchesSearch && matchesMode && matchesDate && matchesMin && matchesMax && matchesType;
      })
      .sort((a, b) => {
        const dateComp = b.date.localeCompare(a.date);
        if (dateComp !== 0) return dateComp;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [transactions, searchTerm, filterMode, dateFilter, customDate, minAmount, maxAmount, filterType]);

  const displayedTransactions = filteredTransactions.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTransactions.length;

  const resetFilters = () => {
    setSearchTerm('');
    setFilterMode('ALL');
    setDateFilter('ALL');
    setCustomDate('');
    setMinAmount('');
    setMaxAmount('');
    setFilterType('ALL');
  };

  const activeFiltersCount = [
    searchTerm !== '',
    filterMode !== 'ALL',
    dateFilter !== 'ALL',
    minAmount !== '',
    maxAmount !== '',
    filterType !== 'ALL'
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-900">Ledger History</h3>
              {activeFiltersCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {activeFiltersCount} ACTIVE
                </span>
              )}
            </div>
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest"
            >
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <Filter className="w-3 h-3" />}
              {showAdvanced ? 'Hide Advanced' : 'More Filters'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 w-full"
              />
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="pl-9 pr-4 py-2 rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white w-full appearance-none"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="THIS_WEEK">This Week</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="LAST_30_DAYS">Last 30 Days</option>
                <option value="CUSTOM">Custom Date...</option>
              </select>
            </div>

            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as any)}
                className="pl-9 pr-4 py-2 rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white w-full appearance-none"
              >
                <option value="ALL">All Payments</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK">Bank Transfer</option>
                <option value="WALLET">Wallet</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
               <button 
                onClick={resetFilters}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors py-2 border border-transparent hover:border-red-100 rounded-xl"
               >
                 <X className="w-3 h-3" />
                 Reset All
               </button>
            </div>
          </div>

          {(showAdvanced || dateFilter === 'CUSTOM') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-white rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
              {dateFilter === 'CUSTOM' && (
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Pick Exact Date</label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                  />
                </div>
              )}
              
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Min Amount (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                  <input
                    type="number"
                    placeholder="Min"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="pl-8 pr-4 py-2 rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 w-full bg-slate-50"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Max Amount (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="pl-8 pr-4 py-2 rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 w-full bg-slate-50"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-slate-50 appearance-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="EXPENSE">Expense Only</option>
                  <option value="INCOME">Income Only</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category & Mode</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedTransactions.length > 0 ? (
              displayedTransactions.map((t) => {
                const cat = categories.find(c => c.id === t.categoryId);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{t.description}</span>
                        {(t.quantity > 1 || t.unit) && (
                          <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Package className="w-3 h-3" />
                            {t.quantity} {t.unit}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5">
                        <div 
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold w-fit border"
                          style={{ 
                            backgroundColor: (cat?.color || '#cbd5e1') + '15', 
                            color: cat?.color || '#64748b',
                            borderColor: (cat?.color || '#cbd5e1') + '30'
                          }}
                        >
                          {cat && <IconRenderer name={cat.icon} className="w-3 h-3" color={cat.color} />}
                          {!cat && <Tag className="w-3 h-3" />}
                          {t.categoryName}
                        </div>
                        <PaymentModeBadge mode={t.paymentMode} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`flex items-center justify-end gap-1.5 text-sm font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'INCOME' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        ₹{t.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(t)}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                          title="Edit Transaction"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(t.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Search className="w-8 h-8 opacity-20" />
                    <p className="text-sm font-medium">No matching transactions found.</p>
                    <button onClick={resetFilters} className="text-xs text-indigo-500 font-bold underline">Clear all filters</button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/30">
          <button
            onClick={() => setVisibleCount(prev => prev + LOAD_MORE_INCREMENT)}
            className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-white px-6 py-2 rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            Load More History
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
