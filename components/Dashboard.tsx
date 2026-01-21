
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { HisabStats, ReportPeriod } from '../types';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Calendar, Filter } from 'lucide-react';

interface Props {
  stats: HisabStats;
  period: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
}

const Dashboard: React.FC<Props> = ({ stats, period, onPeriodChange }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Reporting Module
        </h2>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          {(['TODAY', 'YESTERDAY', 'WEEK', 'MONTH', 'YEAR'] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                period === p 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-5">
            <ArrowUpCircle className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Period Income</p>
              <p className="text-2xl font-bold text-slate-900">₹{stats.totalIncome.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-5">
            <ArrowDownCircle className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Period Expenses</p>
              <p className="text-2xl font-bold text-slate-900">₹{stats.totalExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Wallet className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 text-white rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Period Balance</p>
              <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                ₹{stats.balance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>


       
            
          
        </div>
      
    
  );
};

export default Dashboard;
