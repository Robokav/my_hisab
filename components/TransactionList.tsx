
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, PaymentMode, TransactionType, Category } from '../types';
import * as LucideIcons from 'lucide-react';
import { 
  Trash2, TrendingDown, TrendingUp, Calendar, Tag, Package, CreditCard, Banknote, 
  Smartphone, Landmark, MoreHorizontal, Search, ChevronDown, Filter, Wallet as WalletIcon, 
  Globe, X, ChevronUp, IndianRupee, Edit2, CalendarRange, ListFilter, Download, Upload, Check, AlertCircle, HelpCircle, ChevronRight,
  History, Info, FileSpreadsheet, Undo, ArrowLeftRight, Clock, ShieldCheck, Plus
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onAddTransactions?: (transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  onAddCategory?: (name: string, type: TransactionType) => string;
}

const ITEMS_PER_PAGE = 3;
const LOAD_MORE_INCREMENT = 5;

type DateFilterType = 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_30_DAYS' | 'CUSTOM' | 'RANGE';

const IconRenderer: React.FC<{ name: string; className?: string; color?: string }> = ({ name, className, color }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Tag;
  return <IconComponent className={className} style={{ color }} />;
};

const formatSystemDate = (isoString?: string) => {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
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

const parseCSV = (text: string) => {
  const lines = text.split(/\r?\n/);
  return lines.filter(line => line.trim()).map(line => {
    const result = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuote && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  });
};

const DescriptionCell: React.FC<{ description: string; quantity: number; unit: string }> = ({ description, quantity, unit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = description.length > 15;
  const displayDescription = isExpanded ? description : (isLong ? `${description.substring(0, 77)}...` : description);

  return (
    <div className={`flex flex-col gap-1.5 max-w-xs sm:max-w-md lg:max-w-lg transition-all duration-300 ${isExpanded ? 'bg-indigo-50/30 p-2 rounded-2xl ring-1 ring-indigo-100' : ''}`}>
      <div className={`relative pl-3 border-l-2 transition-colors ${isExpanded ? 'border-indigo-500' : 'border-slate-100 group-hover:border-indigo-200'}`}>
        <span className={`text-[13px] font-semibold text-slate-800 leading-relaxed block break-words whitespace-pre-wrap ${isExpanded ? 'text-slate-900' : ''}`}>
          {displayDescription}
        </span>
        
        {isLong && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className={`mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all ${
              isExpanded 
                ? 'bg-white text-indigo-400 hover:text-indigo-600 hover:shadow-sm' 
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-sm shadow-indigo-100/50'
            }`}
          >
            {isExpanded ? (
              <><ChevronUp className="w-3 h-3" /> Show Less</>
            ) : (
              <><ChevronDown className="w-3 h-3" /> Read full note</>
            )}
          </button>
        )}
      </div>
      
      {(quantity > 1 || unit) && (
        <div className={`flex items-center gap-1.5 transition-all ${isExpanded ? 'ml-3 mt-1' : 'ml-3'}`}>
          <div className="bg-white/80 backdrop-blur-sm text-slate-500 px-1.5 py-0.5 rounded-lg flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter border border-slate-200/50 shadow-sm">
            <Package className="w-2.5 h-2.5" />
            {quantity} {unit || 'Units'}
          </div>
        </div>
      )}
    </div>
  );
};

const TransactionList: React.FC<Props> = ({ transactions, categories, onDelete, onEdit, onAddTransactions, onAddCategory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<PaymentMode | 'ALL'>('ALL');
  const [filterCategoryId, setFilterCategoryId] = useState<string | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [customDate, setCustomDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingTxs, setPendingTxs] = useState<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]>([]);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchTerm, filterMode, filterCategoryId, dateFilter, customDate, startDate, endDate, minAmount, maxAmount, filterType]);

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
        const matchesCategory = filterCategoryId === 'ALL' || t.categoryId === filterCategoryId;
        const matchesType = filterType === 'ALL' || t.type === filterType;
        const amount = t.amount;
        const matchesMin = minAmount === '' || amount >= parseFloat(minAmount);
        const matchesMax = maxAmount === '' || amount <= parseFloat(maxAmount);
        
        let matchesDate = true;
        const txDateStr = t.date;

        if (dateFilter === 'CUSTOM' && customDate) matchesDate = txDateStr === customDate;
        else if (dateFilter === 'RANGE' && startDate && endDate) matchesDate = txDateStr >= startDate && txDateStr <= endDate;
        else if (dateFilter === 'TODAY') matchesDate = txDateStr === todayStr;
        else if (dateFilter === 'YESTERDAY') matchesDate = txDateStr === yesterdayStr;
        else if (dateFilter === 'THIS_WEEK') {
          const startOfWeek = new Date();
          startOfWeek.setDate(now.getDate() - now.getDay());
          matchesDate = txDateStr >= startOfWeek.toISOString().split('T')[0];
        } else if (dateFilter === 'LAST_7_DAYS') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          matchesDate = txDateStr >= sevenDaysAgo.toISOString().split('T')[0];
        } else if (dateFilter === 'THIS_MONTH') {
          const txDate = new Date(t.date);
          matchesDate = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === 'LAST_30_DAYS') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          matchesDate = txDateStr >= thirtyDaysAgo.toISOString().split('T')[0];
        }

        return matchesSearch && matchesMode && matchesCategory && matchesDate && matchesMin && matchesMax && matchesType;
      })
      .sort((a, b) => {
        const dateComp = b.date.localeCompare(a.date);
        if (dateComp !== 0) return dateComp;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [transactions, searchTerm, filterMode, filterCategoryId, dateFilter, customDate, startDate, endDate, minAmount, maxAmount, filterType]);

  const displayedTransactions = filteredTransactions.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTransactions.length;

  const resetFilters = () => {
    setSearchTerm('');
    setFilterMode('ALL');
    setFilterCategoryId('ALL');
    setDateFilter('ALL');
    setCustomDate('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setFilterType('ALL');
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const handleExportFiltered = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Payment Mode', 'Quantity', 'Unit'];
    const rows = filteredTransactions.map(t => [t.date, `"${t.description.replace(/"/g, '""')}"`, `"${t.categoryName}"`, t.type, t.amount, t.paymentMode, t.quantity, `"${t.unit || ''}"`]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Filtered_Hisab_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length > 1) {
        setCsvHeaders(parsed[0]);
        setCsvRows(parsed.slice(1));
        const initialMapping: Record<string, number> = {};
        parsed[0].forEach((header, idx) => {
          const h = header.toLowerCase();
          if (h.includes('date')) initialMapping['date'] = idx;
          if (h.includes('desc')) initialMapping['description'] = idx;
          if (h.includes('amount')) initialMapping['amount'] = idx;
          if (h.includes('cat')) initialMapping['category'] = idx;
          if (h.includes('type')) initialMapping['type'] = idx;
          if (h.includes('mode')) initialMapping['paymentMode'] = idx;
        });
        setMapping(initialMapping);
        setIsImportModalOpen(true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePrepareImport = () => {
    if (!onAddTransactions || !onAddCategory) return;
    const newTxs: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const localCategories = [...categories];
    csvRows.forEach(row => {
      const amountVal = parseFloat(row[mapping['amount']]) || 0;
      const descVal = row[mapping['description']] || 'Imported Entry';
      const dateVal = row[mapping['date']] || new Date().toISOString().split('T')[0];
      const typeVal = (row[mapping['type']]?.toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE') as TransactionType;
      const categoryNameVal = row[mapping['category']] || 'Imported';
      const modeVal = (row[mapping['paymentMode']]?.toUpperCase() || 'CASH') as PaymentMode;
      let cat = localCategories.find(c => c.name.toLowerCase() === categoryNameVal.toLowerCase() && c.type === typeVal);
      let catId = '';
      if (!cat) {
        catId = onAddCategory(categoryNameVal, typeVal);
        localCategories.push({ id: catId, name: categoryNameVal, type: typeVal, color: '#6366f1', icon: 'Tag' });
      } else catId = cat.id;
      newTxs.push({ amount: amountVal, quantity: 1, unit: '', description: descVal, categoryId: catId, categoryName: categoryNameVal, type: typeVal, paymentMode: modeVal, date: dateVal });
    });
    
    setPendingTxs(newTxs);
    setShowImportConfirm(true);
    setIsImportModalOpen(false);
  };

  const handleFinalizeImport = () => {
    if (onAddTransactions && pendingTxs.length > 0) {
      onAddTransactions(pendingTxs as any);
    }
    setPendingTxs([]);
    setShowImportConfirm(false);
  };

  const confirmDelete = () => {
    if (deletingId) {
      onDelete(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      {/* Transaction Detail Modal Overlay */}
      {detailTx && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDetailTx(null)}>
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl shadow-sm ${detailTx.type === 'INCOME' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                  {detailTx.type === 'INCOME' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none">Entry Audit</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Full System Metadata</p>
                </div>
              </div>
              <button onClick={() => setDetailTx(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            
            <div className="p-6 sm:p-8 space-y-8 overflow-y-auto max-h-[70vh] no-scrollbar">
              {/* Financial Breakdown */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-indigo-600" />
                   <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Financial Identity</h4>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</label>
                      <p className="text-lg font-black text-slate-900">₹{detailTx.amount.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</label>
                      <p className="text-sm font-bold text-slate-800 truncate">{detailTx.categoryName}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Method</label>
                      <p className="text-sm font-bold text-slate-800">{detailTx.paymentMode}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantity/Unit</label>
                      <p className="text-sm font-bold text-slate-800">{detailTx.quantity} {detailTx.unit || 'Units'}</p>
                    </div>
                 </div>
                 <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Description</label>
                    <p className="text-sm font-medium text-slate-800 leading-relaxed">{detailTx.description}</p>
                 </div>
              </div>

              {/* System Audit */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2">
                   <Clock className="w-4 h-4 text-indigo-600" />
                   <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Audit Logs</h4>
                 </div>
                 <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Transaction Date</p>
                        <p className="text-xs font-bold text-slate-800">{new Date(detailTx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <Calendar className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">System Created On</p>
                        <p className="text-xs font-bold text-slate-800">{formatSystemDate(detailTx.createdAt)}</p>
                      </div>
                      <Plus className="w-4 h-4 text-slate-300" />
                    </div>
                    {detailTx.updatedAt && detailTx.updatedAt !== detailTx.createdAt && (
                      <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <div>
                          <p className="text-[9px] font-black text-indigo-400 uppercase">Last Updated On</p>
                          <p className="text-xs font-bold text-indigo-900">{formatSystemDate(detailTx.updatedAt)}</p>
                        </div>
                        <Edit2 className="w-4 h-4 text-indigo-300" />
                      </div>
                    )}
                 </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
               <button onClick={() => setDetailTx(null)} className="flex-1 py-4 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all">Close Inspector</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {deletingId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-10 h-10 text-red-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Permanently Delete?</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Are you sure you want to remove this entry from your ledger? This action cannot be undone.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDelete}
                  className="w-full py-4 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Yes, Delete
                </button>
                <button 
                  onClick={() => setDeletingId(null)}
                  className="w-full py-3 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600"
                >
                  <Undo className="w-3.5 h-3.5 inline mr-1" /> No, Keep It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
              Ledger History
              {filteredTransactions.length !== transactions.length && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-in fade-in">
                  {filteredTransactions.length}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={handleExportFiltered} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-indigo-100 flex items-center gap-2 text-xs font-bold" title="Export Filtered">
                <Download className="w-4 h-4" />
                <span className="hidden md:inline uppercase">Export</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-indigo-100 flex items-center gap-2 text-xs font-bold" title="Import CSV">
                <Upload className="w-4 h-4" />
                <span className="hidden md:inline uppercase">Import</span>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportFileChange} />
              </button>
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors uppercase tracking-widest border border-slate-100">
                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <Filter className="w-3 h-3" />}
                <span className="hidden sm:inline">{showAdvanced ? 'Hide' : 'More'}</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 w-full bg-white shadow-sm" />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)} className="pl-9 pr-4 py-2 rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white w-full appearance-none shadow-sm">
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="THIS_WEEK">This Week</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="LAST_30_DAYS">Last 30 Days</option>
                <option value="CUSTOM">Exact Date...</option>
                <option value="RANGE">Date Range...</option>
              </select>
            </div>
            <div className="relative">
              <ArrowLeftRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="pl-9 pr-4 py-2 rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white w-full appearance-none shadow-sm">
                <option value="ALL">All Flow</option>
                <option value="EXPENSE">Expenses</option>
                <option value="INCOME">Income</option>
              </select>
            </div>
            <div className="relative">
              <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select value={filterCategoryId} onChange={(e) => setFilterCategoryId(e.target.value)} className="pl-9 pr-4 py-2 rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white w-full appearance-none shadow-sm">
                <option value="ALL">All Categories</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select value={filterMode} onChange={(e) => setFilterMode(e.target.value as any)} className="pl-9 pr-4 py-2 rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white w-full appearance-none shadow-sm">
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
            <button onClick={resetFilters} className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 py-2 border border-dashed border-slate-200 hover:border-red-100 rounded-xl transition-all">
              <X className="w-3 h-3" />
              Reset
            </button>
          </div>

          {(showAdvanced || dateFilter === 'CUSTOM' || dateFilter === 'RANGE') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-white rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2 shadow-sm">
              {dateFilter === 'CUSTOM' && (
                <div className="relative">
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 ml-1 tracking-[0.2em]">Select Date</label>
                  <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="w-full px-4 py-2 rounded-xl border-slate-100 text-xs font-bold focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50" />
                </div>
              )}
              {dateFilter === 'RANGE' && (
                <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 ml-1 tracking-[0.2em]">From</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-2 rounded-xl border-slate-100 text-xs font-bold focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50" />
                  </div>
                  <div className="relative">
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 ml-1 tracking-[0.2em]">To</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-2 rounded-xl border-slate-100 text-xs font-bold focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50" />
                  </div>
                </div>
              )}
              <div className="relative">
                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 ml-1 tracking-[0.2em]">Min (₹)</label>
                <input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="w-full px-4 py-2 rounded-xl border-slate-100 text-xs font-bold focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50" />
              </div>
              <div className="relative">
                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 ml-1 tracking-[0.2em]">Max (₹)</label>
                <input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="w-full px-4 py-2 rounded-xl border-slate-100 text-xs font-bold focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left min-w-[600px] sm:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
              <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
              <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
              <th className="px-4 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedTransactions.length > 0 ? displayedTransactions.map((t) => {
              const cat = categories.find(c => c.id === t.categoryId);
              return (
                <tr 
                  key={t.id} 
                  className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                  onClick={() => setDetailTx(t)}
                >
                  <td className="px-4 sm:px-6 py-5 sm:py-6 whitespace-nowrap text-xs text-slate-500 font-bold">
                    {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 sm:px-6 py-5 sm:py-6">
                    <DescriptionCell description={t.description} quantity={t.quantity} unit={t.unit} />
                  </td>
                  <td className="px-4 sm:px-6 py-5 sm:py-6 whitespace-nowrap">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black w-fit border shadow-sm" style={{ backgroundColor: (cat?.color || '#cbd5e1') + '10', color: cat?.color || '#64748b', borderColor: (cat?.color || '#cbd5e1') + '20' }}>
                        {cat && <IconRenderer name={cat.icon} className="w-3 h-3" color={cat.color} />}
                        {t.categoryName}
                      </div>
                      <PaymentModeBadge mode={t.paymentMode} />
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-5 sm:py-6 whitespace-nowrap text-right">
                    <div className={`flex items-center justify-end gap-1 text-[13px] font-black ${t.type === 'INCOME' ? 'text-green-600' : 'text-slate-900'}`}>
                      {t.type === 'INCOME' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                      ₹{t.amount.toLocaleString()}
                    </div>
                    {t.updatedAt && t.updatedAt !== t.createdAt && (
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <Clock className="w-2.5 h-2.5 text-indigo-400" />
                        <span className="text-[7px] font-black text-indigo-400 uppercase tracking-tighter">Updated</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-5 sm:py-6 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 sm:opacity-20 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(t)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDeletingId(t.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-300">
                    <History className="w-12 h-12 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest">No matching history</p>
                    <button onClick={resetFilters} className="text-[10px] font-black text-indigo-500 underline uppercase tracking-widest">Reset View</button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="p-6 border-t border-slate-100 flex justify-center bg-slate-50/20">
          <button onClick={() => setVisibleCount(prev => prev + LOAD_MORE_INCREMENT)} className="group flex items-center gap-3 px-8 py-3 bg-white text-xs font-black uppercase tracking-widest text-slate-900 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md active:scale-95 transition-all">
            Load More History
            <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* CSV Column Mapping Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl"><Upload className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-none">Map Columns</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Import from CSV</p>
                </div>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh] no-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {['date', 'description', 'amount', 'category', 'type', 'paymentMode'].map((field) => (
                  <div key={field} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field}</label>
                    <div className="relative">
                      <select value={mapping[field] ?? ''} onChange={(e) => setMapping({ ...mapping, [field]: parseInt(e.target.value) })} className="w-full text-xs font-bold border-slate-200 rounded-xl px-4 py-3 focus:ring-indigo-500 bg-slate-50 appearance-none">
                        <option value="">-- Choose --</option>
                        {csvHeaders.map((header, idx) => <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
              <button onClick={() => setIsImportModalOpen(false)} className="flex-1 px-6 py-4 text-xs font-black text-slate-500 uppercase rounded-2xl hover:bg-slate-200">Cancel</button>
              <button onClick={handlePrepareImport} className="flex-1 px-6 py-4 bg-indigo-600 text-white text-xs font-black uppercase rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Next Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirmation Summary Modal */}
      {showImportConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <FileSpreadsheet className="w-10 h-10 text-indigo-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Import Summary</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  We processed your CSV and found <span className="font-black text-indigo-600">{pendingTxs.length}</span> entries ready for your ledger.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-4 border border-slate-100">
                <div className="text-center border-r border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expenses</p>
                  <p className="text-lg font-black text-red-600">{pendingTxs.filter(t => t.type === 'EXPENSE').length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Incomes</p>
                  <p className="text-lg font-black text-green-600">{pendingTxs.filter(t => t.type === 'INCOME').length}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleFinalizeImport}
                  className="w-full py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Confirm & Import
                </button>
                <button 
                  onClick={() => { setShowImportConfirm(false); setIsImportModalOpen(true); }}
                  className="w-full py-3 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600"
                >
                  <Undo className="w-3.5 h-3.5 inline mr-1" /> Back to Mapping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
