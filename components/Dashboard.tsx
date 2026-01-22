
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { HisabStats, ReportPeriod } from '../types';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Calendar, Filter,Landmark,IndianRupee } from 'lucide-react';

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

     
      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Month's Start (Dark Card) */}
        <div className="bg-[#1e293b] p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 text-white rounded-2xl group-hover:scale-110 transition-transform">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Month's Start</p>
              <p className="text-xl font-black text-white">₹{stats.openingBalance.toLocaleString()}</p>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 opacity-5">
            <Landmark className="w-20 h-20 text-white" />
          </div>
        </div>

        {/* Period Income (White Card) */}
        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200 relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl group-hover:scale-110 transition-transform">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Period Income</p>
              <p className="text-xl font-black text-slate-900">₹{stats.totalIncome.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Period Expenses (White Card) */}
        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200 relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Period Expenses</p>
              <p className="text-xl font-black text-slate-900">₹{stats.totalExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Period Balance / Available Funds (Dark Card) */}
        <div className="bg-[#0f172a] p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Period Balance</p>
              <p className={`text-xl font-black ${stats.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                ₹{stats.balance.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 opacity-5">
            <IndianRupee className="w-20 h-20 text-white" />
          </div>
        </div>
      </div>


       
            
          
        </div>
      
    
  );
};

export default Dashboard;
