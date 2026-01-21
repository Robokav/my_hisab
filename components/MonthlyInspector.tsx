
import React, { useState, useMemo } from 'react';
import { Transaction, Category } from '../types';
import { CalendarDays, ArrowUpRight, ArrowDownRight, IndianRupee, History, Package, Tag, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onClose?: () => void;
}

const IconRenderer: React.FC<{ name: string; className?: string; color?: string }> = ({ name, className, color }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Tag;
  return <IconComponent className={className} style={{ color }} />;
};

const MonthlyInspector: React.FC<Props> = ({ transactions, categories, onClose }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = useMemo(() => {
    const arr = [];
    for (let i = currentYear; i >= currentYear - 5; i--) arr.push(i);
    return arr;
  }, [currentYear]);

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
      balance: income - expense
    };
  }, [transactions, selectedMonth, selectedYear]);

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
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Targeted Historical Data</p>
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

          <div className="flex items-center gap-2">
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

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 bg-white">
        <div className="p-4 bg-green-50 rounded-2xl border border-green-100 transition-all hover:shadow-md hover:shadow-green-50/50">
          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Target Income</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-green-700">₹{monthData.income.toLocaleString()}</span>
            <ArrowUpRight className="w-5 h-5 text-green-400" />
          </div>
        </div>
        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 transition-all hover:shadow-md hover:shadow-red-50/50">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Target Expense</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-red-700">₹{monthData.expense.toLocaleString()}</span>
            <ArrowDownRight className="w-5 h-5 text-red-400" />
          </div>
        </div>
        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 transition-all hover:shadow-md hover:shadow-indigo-50/50">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Period Balance</p>
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
