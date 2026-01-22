
import React, { useState } from 'react';
import { Transaction, Category, TransactionType, PaymentMode } from '../types';
import { X, Save, ChevronDown, Package, AlertCircle, Check, Undo } from 'lucide-react';

interface Props {
  transaction: Transaction;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (transaction: Transaction) => void;
  onAddCategory: (name: string, type: TransactionType) => string;
}

const EditTransactionModal: React.FC<Props> = ({ 
  transaction, categories, isOpen, onClose, onUpdate, onAddCategory 
}) => {
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [description, setDescription] = useState(transaction.description);
  const [selectedCategoryId, setSelectedCategoryId] = useState(transaction.categoryId);
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(transaction.paymentMode);
  const [date, setDate] = useState(transaction.date);
  const [quantity, setQuantity] = useState(transaction.quantity.toString());
  const [unit, setUnit] = useState(transaction.unit);
  
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSaveAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedCategoryId) return;
    setShowConfirm(true);
  };

  const handleActualUpdate = () => {
    const category = categories.find(c => c.id === selectedCategoryId);
    if (!category) return;

    onUpdate({
      ...transaction,
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
    setShowConfirm(false);
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    const id = onAddCategory(newCategoryName, type);
    setSelectedCategoryId(id);
    setNewCategoryName('');
    setShowNewCategoryInput(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 relative">
        
        {/* Confirmation Overlay */}
        {showConfirm && (
          <div className="absolute inset-0 z-[70] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-amber-50 rounded-full mb-4">
              <AlertCircle className="w-12 h-12 text-amber-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Confirm Modification</h3>
            <p className="text-sm text-slate-500 mb-8 max-w-[280px]">
              Are you sure you want to update this transaction? This will overwrite the existing entry in your ledger.
            </p>
            <div className="flex w-full gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-4 text-sm font-extrabold text-slate-500 rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <Undo className="w-4 h-4" />
                Go Back
              </button>
              <button 
                onClick={handleActualUpdate}
                className="flex-1 py-4 bg-indigo-600 text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirm Update
              </button>
            </div>
          </div>
        )}

        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            Edit Transaction
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSaveAttempt} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Transaction Type</label>
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setType('EXPENSE')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${type === 'EXPENSE' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Expense
                </button>
                <button 
                  type="button"
                  onClick={() => setType('INCOME')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${type === 'INCOME' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Income
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Amount (₹)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-2xl border-slate-200 text-sm py-3 px-4 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border-slate-200 text-sm py-3 px-4 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
              <input
                type="text"
                
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this for?"
                className="w-full rounded-2xl border-slate-200 text-sm py-3 px-4 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category</label>
              <div className="relative">
                <select
                  required
                  value={selectedCategoryId}
                  onChange={(e) => e.target.value === 'NEW' ? setShowNewCategoryInput(true) : setSelectedCategoryId(e.target.value)}
                  className="w-full rounded-2xl border-slate-200 text-sm py-3 px-4 focus:ring-indigo-500 appearance-none bg-white"
                >
                  <option value="">Select Category</option>
                  {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value="NEW">+ New Category</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {showNewCategoryInput && (
              <div className="col-span-2 flex items-center gap-2 p-3 bg-indigo-50 rounded-2xl border border-dashed border-indigo-200">
                <input
                  type="text"
                  autoFocus
                  placeholder="Category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
                />
                <button type="button" onClick={handleCreateCategory} className="text-xs font-bold text-indigo-600 px-3 py-1">Add</button>
                <button type="button" onClick={() => setShowNewCategoryInput(false)} className="text-xs font-bold text-slate-400 px-3 py-1">Cancel</button>
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Payment Mode</label>
              <div className="relative">
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="w-full rounded-2xl border-slate-200 text-sm py-3 px-4 focus:ring-indigo-500 appearance-none bg-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / Scan</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="WALLET">Mobile Wallet</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="OTHER">Other</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {type === 'EXPENSE' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full rounded-2xl border-slate-200 text-sm py-3 px-4 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="kg, ltr, pc..."
                    className="w-full rounded-2xl border-slate-200 text-sm py-3 px-4 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 text-sm font-extrabold text-slate-500 rounded-2xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-indigo-600 text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;
