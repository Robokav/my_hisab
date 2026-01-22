
import React, { useState } from 'react';
import { TransactionType, Transaction, Category, PaymentMode, AiParsedTransaction } from '../types';
import { parseNaturalLanguageEntry } from '../services/geminiService';
import { Sparkles, Plus, Loader2, Tag, Check, X, Edit2, Trash2, Layers, ArrowRight, Save, Undo, AlertCircle, Package, ChevronDown, Calendar, Box } from 'lucide-react';

interface Props {
  categories: Category[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onAddTransactions: (transactions: Omit<Transaction, 'id' | 'createdAt'>[]) => void;
  onAddCategory: (name: string, type: TransactionType) => string;
  isOnline: boolean;
}

const TransactionForm: React.FC<Props> = ({ categories, onAddTransaction, onAddTransactions, onAddCategory, isOnline }) => {
  const [aiInput, setAiInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  
  // Draft Queue States
  const [drafts, setDrafts] = useState<AiParsedTransaction[]>([]);
  const [editingDraftIdx, setEditingDraftIdx] = useState<number | null>(null);
  const [tempDraft, setTempDraft] = useState<AiParsedTransaction | null>(null);
  
  // Manual Form States
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const filteredCategories = (t: TransactionType) => categories.filter(c => c.type === t);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedCategoryId) return;

    const category = categories.find(c => c.id === selectedCategoryId);
    if (!category) return;

    onAddTransaction({
      amount: parseFloat(amount),
      quantity: parseFloat(quantity) || 1,
      unit: unit.trim(),
      description,
      categoryId: category.id,
      categoryName: category.name,
      type,
      paymentMode,
      date
    });

    setAmount('');
    setQuantity('1');
    setUnit('');
    setDescription('');
    setSelectedCategoryId('');
  };

  const handleAiParse = async () => {
    if (!aiInput.trim() || !isOnline) return;
    setIsParsing(true);
    const results = await parseNaturalLanguageEntry(aiInput);
    setIsParsing(false);

    if (results && results.length > 0) {
      setDrafts(prev => [...prev, ...results]);
      setAiInput('');
    }
  };

  const handleConfirmDraft = (index: number) => {
    const item = drafts[index];
    if (!item.amount  || !item.category || !item.type) return;

    let cat = categories.find(c => c.name.toLowerCase() === item.category.toLowerCase() && c.type === item.type);
    let catId = '';
    let catName = '';
    
    if (!cat) {
      catId = onAddCategory(item.category, item.type);
      catName = item.category;
    } else {
      catId = cat.id;
      catName = cat.name;
    }

    onAddTransaction({
      amount: item.amount,
      quantity: item.quantity || 1,
      unit: item.unit || '',
      description: item.description,
      categoryId: catId,
      categoryName: catName,
      type: item.type,
      paymentMode: item.paymentMode || 'CASH',
      date: date
    });

    setDrafts(prev => prev.filter((_, i) => i !== index));
    if (editingDraftIdx === index) setEditingDraftIdx(null);
  };

  const handleApproveAllDrafts = () => {
    const bulkTxs: Omit<Transaction, 'id' | 'createdAt'>[] = [];
    const localCategories = [...categories];

    for (const item of drafts) {
      if (!item.amount || !item.category ) continue;

      let cat = localCategories.find(c => c.name.toLowerCase() === item.category.toLowerCase() && c.type === item.type);
      let catId = '';
      let catName = '';
      
      if (!cat) {
        catId = onAddCategory(item.category, item.type);
        catName = item.category;
        localCategories.push({ id: catId, name: catName, type: item.type, color: '#6366f1', icon: 'Tag' });
      } else {
        catId = cat.id;
        catName = cat.name;
      }

      bulkTxs.push({
        amount: item.amount,
        quantity: item.quantity || 1,
        unit: item.unit || '',
        description: item.description,
        categoryId: catId,
        categoryName: catName,
        type: item.type,
        paymentMode: item.paymentMode || 'CASH',
        date: date
      });
    }
    
    onAddTransactions(bulkTxs);
    setDrafts([]);
    setEditingDraftIdx(null);
  };

  const isDraftValid = (d: AiParsedTransaction | null) => {
    if (!d) return false;
    return d.amount > 0 && d.category.trim().length > 0 && !!d.type && !!d.paymentMode;
  };

  const startInlineEdit = (idx: number) => {
    setEditingDraftIdx(idx);
    setTempDraft({ ...drafts[idx] });
  };

  const saveInlineEdit = () => {
    if (tempDraft && editingDraftIdx !== null && isDraftValid(tempDraft)) {
      const newDrafts = [...drafts];
      newDrafts[editingDraftIdx] = tempDraft;
      setDrafts(newDrafts);
      setEditingDraftIdx(null);
      setTempDraft(null);
    }
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    const id = onAddCategory(newCategoryName, type);
    setSelectedCategoryId(id);
    setNewCategoryName('');
    setShowNewCategoryInput(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        {/* Smart Entry Header & Input */}
        <div className="p-6 pb-6 bg-[#f0f4ff] border-b border-indigo-100/50">
          <div className="flex items-center gap-2 mb-4">
             <Sparkles className="w-4 h-4 text-indigo-600" />
             <span className="text-sm font-bold text-indigo-900">Quick Smart Entry (Multi-item supported)</span>
             {!isOnline && <span className="ml-auto text-[10px] font-bold text-slate-400">OFFLINE</span>}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={aiInput}
              disabled={!isOnline}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiParse()}
              placeholder='e.g., "10 apples for 500 and 10 pens for 40"'
              className="flex-1 rounded-2xl border-none focus:ring-0 px-6 py-4 text-sm shadow-sm placeholder:text-slate-300"
            />
            <button
              onClick={handleAiParse}
              disabled={isParsing || !aiInput || !isOnline}
              className={`rounded-2xl px-8 py-4 text-white shadow-sm flex items-center gap-2 transition-all font-bold text-sm tracking-wide ${aiInput.trim() ? 'bg-indigo-600 shadow-indigo-200' : 'bg-[#ced7ff] opacity-80'}`}
            >
              {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Magic Parse'}
            </button>
          </div>
        </div>

        {/* Draft Review Area */}
        {drafts.length > 0 && (
          <div className="p-6 bg-indigo-50/20 border-b border-indigo-100 animate-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-indigo-900">Review Suggestions ({drafts.length})</h4>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setDrafts([]); setEditingDraftIdx(null); }} className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest px-2 py-1">Discard All</button>
                <button onClick={handleApproveAllDrafts} className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-lg shadow-sm hover:bg-indigo-700 uppercase tracking-widest disabled:opacity-30" disabled={drafts.some(d => !isDraftValid(d))}>Approve All</button>
              </div>
            </div>
            <div className="space-y-3">
              {drafts.map((draft, idx) => (
                <div key={idx} className={`flex flex-col p-4 bg-white border rounded-2xl shadow-sm transition-all ${editingDraftIdx === idx ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-indigo-50'}`}>
                  {editingDraftIdx === idx && tempDraft ? (
                    /* Full Featured Inline Editor */
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Description <span className="text-red-500 font-black">*</span></label>
                          <input type="text" value={tempDraft.description} onChange={(e) => setTempDraft({...tempDraft, description: e.target.value})} className="w-full text-sm font-bold border rounded-xl px-3 py-1.5 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Amount <span className="text-red-500 font-black">*</span></label>
                          <input type="number" value={tempDraft.amount} onChange={(e) => setTempDraft({...tempDraft, amount: parseFloat(e.target.value) || 0})} className="w-full text-sm font-bold border rounded-xl px-3 py-1.5 focus:ring-indigo-500" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Type <span className="text-red-500 font-black">*</span></label>
                          <select 
                            value={tempDraft.type} 
                            onChange={(e) => setTempDraft({...tempDraft, type: e.target.value as TransactionType})}
                            className="w-full text-xs font-bold border-slate-100 rounded-xl px-3 py-1.5 focus:ring-indigo-500 bg-slate-50"
                          >
                            <option value="EXPENSE">Expense</option>
                            <option value="INCOME">Income</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Category <span className="text-red-500 font-black">*</span></label>
                          <input type="text" value={tempDraft.category} onChange={(e) => setTempDraft({...tempDraft, category: e.target.value})} className="w-full text-xs font-bold border rounded-xl px-3 py-1.5 focus:ring-indigo-500" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                         <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Payment Mode</label>
                          <select 
                            value={tempDraft.paymentMode} 
                            onChange={(e) => setTempDraft({...tempDraft, paymentMode: e.target.value as PaymentMode})}
                            className="w-full text-xs font-bold border-slate-100 rounded-xl px-3 py-1.5 focus:ring-indigo-500 bg-slate-50"
                          >
                            <option value="CASH">Cash</option>
                            <option value="UPI">UPI / Scan</option>
                            <option value="CARD">Card</option>
                            <option value="BANK">Bank</option>
                            <option value="WALLET">Wallet</option>
                            <option value="NET_BANKING">Net Banking</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Qty</label>
                          <input type="number" value={tempDraft.quantity || 1} onChange={(e) => setTempDraft({...tempDraft, quantity: parseFloat(e.target.value) || 1})} className="w-full text-xs font-bold border-slate-100 rounded-xl px-3 py-1.5 focus:ring-indigo-500 bg-slate-50" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Unit</label>
                          <input type="text" value={tempDraft.unit || ''} placeholder="kg, ltr..." onChange={(e) => setTempDraft({...tempDraft, unit: e.target.value})} className="w-full text-xs font-bold border-slate-100 rounded-xl px-3 py-1.5 focus:ring-indigo-500 bg-slate-50" />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                        <button onClick={() => { setEditingDraftIdx(null); setTempDraft(null); }} className="text-[10px] font-bold text-slate-400 px-3 py-1.5">Cancel</button>
                        <button onClick={saveInlineEdit} disabled={!isDraftValid(tempDraft)} className="bg-indigo-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg active:scale-95 transition-all disabled:opacity-30">Save Suggestion</button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${draft.type === 'INCOME' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {draft.type === 'INCOME' ? <Plus className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 rotate-45" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{draft.description}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{draft.category}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{draft.paymentMode}</span>
                            {((draft.quantity && draft.quantity > 0) || draft.unit) && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#eef2ff] rounded-md border border-[#e0e7ff]">
                                <Box className="w-2.5 h-2.5 text-[#818cf8]" />
                                <span className="text-[9px] font-black text-[#818cf8] uppercase tracking-tighter">
                                  {draft.quantity || 1} {draft.unit || 'UNITS'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="text-right">
                           <p className={`text-base font-black ${draft.type === 'INCOME' ? 'text-green-600' : 'text-slate-900'}`}>₹{draft.amount?.toLocaleString()}</p>
                         </div>
                         <div className="flex items-center gap-1">
                          <button onClick={() => startInlineEdit(idx)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleConfirmDraft(idx)} disabled={!isDraftValid(draft)} className="p-2 text-slate-300 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"><Check className="w-5 h-5" /></button>
                          <button onClick={() => setDrafts(prev => prev.filter((_, i) => i !== idx))} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Horizontal Ledger Row */}
        <form onSubmit={handleManualSubmit} className="p-8 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 items-start">
            
            {/* Type & Date */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest leading-none">TYPE & DATE</label>
              <div className="space-y-3">
                <div className="relative">
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="w-full text-base font-medium border-none p-0 focus:ring-0 bg-transparent appearance-none pr-6 cursor-pointer text-slate-900"
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="flex-1 text-base font-medium border-none p-0 focus:ring-0 bg-transparent text-slate-900 cursor-pointer" 
                  />
                  <Calendar className="w-4 h-4 text-slate-900 shrink-0" />
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="sm:col-span-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest leading-none">AMOUNT</label>
              <input 
                type="number" 
                required 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" 
                className="w-full text-base font-medium border-none p-0 focus:ring-0 bg-transparent text-slate-400 placeholder:text-slate-300" 
              />
            </div>

            {/* Qty & Unit */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest leading-none">QTY & UNIT</label>
              <div className="flex gap-4">
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-10 text-base font-bold border-none p-0 focus:ring-0 bg-transparent text-slate-900" 
                />
                <input 
                  type="text" 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="unit" 
                  className="flex-1 text-base font-medium border-none p-0 focus:ring-0 bg-transparent text-slate-300 placeholder:text-slate-300" 
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest leading-none">PAYMENT MODE</label>
              <div className="relative">
                <select 
                  value={paymentMode} 
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="w-full text-base font-medium border-none p-0 focus:ring-0 bg-transparent appearance-none pr-6 cursor-pointer text-slate-900"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK">Bank</option>
                  <option value="WALLET">Wallet</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="OTHER">Other</option>
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest leading-none">DESCRIPTION</label>
              <input 
                type="text" 
                
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Dinner" 
                className="w-full text-base font-medium border-none p-0 focus:ring-0 bg-transparent text-slate-400 placeholder:text-slate-300" 
              />
            </div>

            {/* Category */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest leading-none">CATEGORY</label>
              <div className="relative">
                <select 
                  required 
                  value={selectedCategoryId}
                  onChange={(e) => e.target.value === 'NEW' ? setShowNewCategoryInput(true) : setSelectedCategoryId(e.target.value)}
                  className="w-full text-base font-medium border-none p-0 focus:ring-0 bg-transparent appearance-none pr-6 cursor-pointer text-slate-900"
                >
                  <option value="">Select Category</option>
                  {filteredCategories(type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value="NEW" className="text-indigo-600 font-bold">+ Create New...</option>
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-1 flex justify-end">
              <button 
                type="submit" 
                disabled={!amount  || !selectedCategoryId}
                className="w-full sm:w-16 h-12 bg-[#0d111d] text-white rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-all active:scale-90 disabled:opacity-20 shadow-lg"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {showNewCategoryInput && (
            <div className="mt-6 flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 animate-in fade-in">
              <input
                type="text" autoFocus placeholder="New category name..." value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
              />
              <button type="button" onClick={handleCreateCategory} className="text-xs font-bold text-indigo-600 px-4 py-1.5 bg-white rounded-lg shadow-sm border border-indigo-50">Add Category</button>
              <button type="button" onClick={() => setShowNewCategoryInput(false)} className="text-xs font-bold text-slate-400 px-4 py-1.5">Cancel</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
