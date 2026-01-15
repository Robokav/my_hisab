
import React, { useState } from 'react';
import { TransactionType, Transaction, Category, PaymentMode } from '../types';
import { parseNaturalLanguageEntry } from '../services/geminiService';
import { Sparkles, Plus, Loader2, Tag, WifiOff } from 'lucide-react';

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

  const filteredCategories = categories.filter(c => c.type === type);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !selectedCategoryId) return;

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
      if (results.length === 1) {
        const result = results[0];
        setAmount(result.amount.toString());
        setQuantity(result.quantity?.toString() || '1');
        setUnit(result.unit || '');
        setDescription(result.description);
        setType(result.type);
        setPaymentMode(result.paymentMode || 'CASH');
        
        let cat = categories.find(c => c.name.toLowerCase() === result.category.toLowerCase() && c.type === result.type);
        if (!cat) {
          const id = onAddCategory(result.category, result.type);
          setSelectedCategoryId(id);
        } else {
          setSelectedCategoryId(cat.id);
        }
      } else {
        const bulkTxs: Omit<Transaction, 'id' | 'createdAt'>[] = [];
        const localCategories = [...categories];

        for (const result of results) {
          let cat = localCategories.find(c => c.name.toLowerCase() === result.category.toLowerCase() && c.type === result.type);
          let catId = '';
          let catName = '';
          
          if (!cat) {
            catId = onAddCategory(result.category, result.type);
            catName = result.category;
            localCategories.push({ id: catId, name: catName, type: result.type, color: '#6366f1', icon: 'Tag' });
          } else {
            catId = cat.id;
            catName = cat.name;
          }

          bulkTxs.push({
            amount: result.amount,
            quantity: result.quantity || 1,
            unit: result.unit || '',
            description: result.description,
            categoryId: catId,
            categoryName: catName,
            type: result.type,
            paymentMode: result.paymentMode || 'CASH',
            date: date
          });
        }
        
        onAddTransactions(bulkTxs);
      }
      setAiInput('');
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
      <div className={`p-6 border-b transition-colors duration-300 ${isOnline ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-200'}`}>
        <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${isOnline ? 'text-indigo-900' : 'text-slate-500'}`}>
          {isOnline ? <Sparkles className="w-4 h-4 text-indigo-600" /> : <WifiOff className="w-4 h-4 text-slate-400" />}
          {isOnline ? 'Quick Smart Entry (Multi-item supported)' : 'Smart Entry Disabled (Offline)'}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiInput}
            disabled={!isOnline}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiParse()}
            placeholder={isOnline ? 'e.g., "10 apples for 500 and 10 pens for 40"' : 'Connect to internet for Magic Parse...'}
            className="flex-1 rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 text-sm md:text-base disabled:bg-slate-100 disabled:text-slate-400"
          />
          <button
            onClick={handleAiParse}
            disabled={isParsing || !aiInput || !isOnline}
            className={`rounded-xl px-4 py-2 transition-colors flex items-center gap-2 ${
              isOnline 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <span className="hidden md:inline">{isOnline ? 'Magic Parse' : 'Offline'}</span>
                {isOnline ? <Sparkles className="w-4 h-4 md:hidden" /> : <WifiOff className="w-4 h-4 md:hidden" />}
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Type & Date</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as TransactionType);
                setSelectedCategoryId('');
              }}
              className="w-full rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 px-2 py-2 text-sm"
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 w-full rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 px-2 py-2 text-sm"
            />
          </div>

          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Amount</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2"
            />
          </div>

          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Qty & Unit</label>
            <div className="flex gap-1">
              <input
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-1/2 rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 px-2 py-2 text-sm"
              />
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="unit"
                className="w-1/2 rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 px-2 py-2 text-sm"
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              className="w-full rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 px-2 py-2 text-sm"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="BANK">Bank Transfer</option>
              <option value="WALLET">Wallet</option>
              <option value="NET_BANKING">Net Banking</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Dinner"
              className="w-full rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2"
            />
          </div>

          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Category</label>
            <select
              required
              value={selectedCategoryId}
              onChange={(e) => {
                if (e.target.value === 'NEW') {
                  setShowNewCategoryInput(true);
                } else {
                  setSelectedCategoryId(e.target.value);
                }
              }}
              className="w-full rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 appearance-none"
            >
              <option value="">Select Category</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>
                   {c.name}
                </option>
              ))}
              <option value="NEW" className="text-indigo-600 font-bold">+ Add New</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-2 transition-colors flex items-center justify-center gap-2 h-[42px]"
            >
              <Plus className="w-5 h-5" />
              <span className="lg:hidden">Save</span>
            </button>
          </div>
        </div>

        {showNewCategoryInput && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 animate-in fade-in slide-in-from-top-1">
            <Tag className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="New category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
            />
            <button type="button" onClick={handleCreateCategory} className="text-xs font-bold text-indigo-600 px-2 py-1">Add</button>
            <button type="button" onClick={() => setShowNewCategoryInput(false)} className="text-xs font-bold text-slate-400 px-2 py-1">Cancel</button>
          </div>
        )}
      </form>
    </div>
  );
};

export default TransactionForm;
