
import React, { useState, useMemo } from 'react';
import { Transaction, Category } from '../types';
import { 
  X, BrainCircuit, Sparkles, Target, TrendingUp, Tag, 
  Activity, Percent, Calendar, ChevronLeft, ChevronRight, 
  History, CalendarDays, Timer, Clock
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
}

const MathematicalIntelligence: React.FC<Props> = ({ transactions, categories, isOpen, onClose }) => {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [isPickingPeriod, setIsPickingPeriod] = useState(false);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const fullMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const isCurrentMonth = viewMonth === now.getMonth() && viewYear === now.getFullYear();

  const insights = useMemo(() => {
    // 1. Filter transactions strictly for the selected view period
    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let expenseCount = 0;
    
    filtered.forEach(t => {
      if (t.type === 'INCOME') totalIncome += t.amount;
      else {
        totalExpense += t.amount;
        expenseCount++;
      }
    });

    // 2. CALENDAR-CLOCK SYNC LOGIC
    // For the current month, the divisor is the current day of the month.
    // As the day passes, this divisor increments automatically, making your 
    // "Daily Burn" more accurate even if you haven't added a transaction today.
    let effectiveDays = 1;
    const daysInSelectedMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    if (isCurrentMonth) {
      effectiveDays = now.getDate(); 
    } else {
      effectiveDays = daysInSelectedMonth;
    }

    // 3. Financial Metrics
    const dailyAvg = totalExpense / effectiveDays;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    const projectedMonthEnd = dailyAvg * daysInSelectedMonth;
    const avgPerTx = expenseCount > 0 ? totalExpense / expenseCount : 0;
    const txVelocity = filtered.length / effectiveDays;

    // 4. Intelligence Scoring
    let healthColor = 'text-amber-600';
    let healthBg = 'bg-amber-50';
    let healthLabel = 'STABLE';
    let recommendation = "You're doing okay, but try to find 5% more savings this month.";

    if (savingsRate > 25) {
      healthColor = 'text-emerald-600';
      healthBg = 'bg-emerald-50';
      healthLabel = 'EXCELLENT';
      recommendation = "Outstanding! You're in the top 10% of savers. Keep this momentum!";
    } else if (savingsRate < 0) {
      healthColor = 'text-red-600';
      healthBg = 'bg-red-50';
      healthLabel = 'DEFICIT';
      recommendation = "You're spending more than you earn. Review high-cost categories immediately.";
    } else if (savingsRate > 15) {
      healthColor = 'text-indigo-600';
      healthBg = 'bg-indigo-50';
      healthLabel = 'HEALTHY';
      recommendation = "Solid financial management. You're building a good safety net.";
    }

    return {
      dailyAvg,
      savingsRate,
      projectedMonthEnd,
      avgPerTx,
      txVelocity,
      healthColor,
      healthLabel,
      healthBg,
      recommendation,
      effectiveDays,
      totalExpense,
      daysInSelectedMonth,
      hasData: filtered.length > 0
    };
  }, [transactions, viewMonth, viewYear, isCurrentMonth, now]);

  const togglePicker = () => setIsPickingPeriod(!isPickingPeriod);

  const selectMonth = (idx: number) => {
    setViewMonth(idx);
    setIsPickingPeriod(false);
  };

  const hasTransactionsInMonth = (monthIdx: number) => {
    return transactions.some(t => {
      const d = new Date(t.date);
      return d.getMonth() === monthIdx && d.getFullYear() === viewYear;
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 cursor-default max-h-[92vh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Intelligence Hub Header */}
        <div className="p-6 border-b border-slate-100 bg-indigo-600 text-white shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-2xl">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Intelligence</h2>
                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.2em] leading-none mt-1">Mathematical Hub</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div 
            onClick={togglePicker}
            className="group flex items-center justify-between bg-white/10 hover:bg-white/20 p-3 rounded-2xl border border-white/10 cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-indigo-500 rounded-xl">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Active Period</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black">{fullMonths[viewMonth]} {viewYear}</span>
                  {isCurrentMonth && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/20 rounded-full border border-white/10">
                      <Clock className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="text-[9px] font-black uppercase">Live</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={`p-2 rounded-lg transition-transform ${isPickingPeriod ? 'rotate-180 bg-white/20' : 'group-hover:translate-x-1'}`}>
              <ChevronLeft className="-rotate-90 w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto relative bg-slate-50/30 no-scrollbar">
          {isPickingPeriod ? (
            /* CALENDAR-STYLE MONTH GRID */
            <div className="p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300 space-y-8">
              <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                <button 
                  onClick={() => setViewYear(prev => prev - 1)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>
                <span className="text-xl font-black text-slate-900">{viewYear}</span>
                <button 
                  onClick={() => setViewYear(prev => prev + 1)}
                  disabled={viewYear >= now.getFullYear()}
                  className={`p-2 rounded-xl transition-colors ${viewYear >= now.getFullYear() ? 'opacity-10' : 'hover:bg-slate-100'}`}
                >
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {months.map((m, idx) => {
                  const isSelected = viewMonth === idx;
                  const isToday = now.getMonth() === idx && now.getFullYear() === viewYear;
                  const hasData = hasTransactionsInMonth(idx);

                  return (
                    <button
                      key={m}
                      onClick={() => selectMonth(idx)}
                      className={`
                        relative flex flex-col items-center justify-center h-20 rounded-[1.5rem] border transition-all active:scale-95
                        ${isSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 shadow-sm'}
                        ${!hasData && !isSelected ? 'opacity-40 grayscale-[0.5]' : ''}
                      `}
                    >
                      <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{m}</span>
                      {isToday && (
                        <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'} animate-pulse`} />
                      )}
                      {hasData && !isSelected && (
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-100" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jump to any month for history report</p>
              </div>
            </div>
          ) : (
            /* REAL-TIME INTELLIGENCE DASHBOARD */
            <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 pb-10 animate-in slide-in-from-right-4 duration-300">
              {insights.hasData ? (
                <>
                  <div className={`p-6 rounded-3xl border flex items-start gap-4 ${insights.healthBg} border-indigo-100 shadow-sm`}>
                    <div className={`p-2 rounded-xl ${insights.healthColor} bg-white shadow-sm`}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Monthly Fresh Rating</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-white border ${insights.healthColor}`}>
                          {insights.healthLabel}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 leading-relaxed">{insights.recommendation}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* DAILY BURN - CALENDAR SYNCED */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Daily Burn</span>
                      </div>
                      <p className="text-xl font-black text-slate-900">₹{Math.round(insights.dailyAvg).toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Timer className="w-2.5 h-2.5 text-slate-400" />
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                          {isCurrentMonth ? `Calibrated to Day ${insights.effectiveDays}` : `${insights.effectiveDays} day full month`}
                        </p>
                      </div>
                    </div>

                    {/* FORECASTING / FINAL TOTAL */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {isCurrentMonth ? 'Forecasting' : 'Final Total'}
                        </span>
                      </div>
                      <p className="text-xl font-black text-slate-900">
                        ₹{Math.round(isCurrentMonth ? insights.projectedMonthEnd : insights.totalExpense).toLocaleString()}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">
                        {isCurrentMonth ? `Target for Day ${insights.daysInSelectedMonth}` : 'Final Ledger Balance'}
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit Avg</span>
                      </div>
                      <p className="text-xl font-black text-slate-900">₹{Math.round(insights.avgPerTx).toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Avg cost per entry</p>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group hover:border-amber-200 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Activity Velocity</span>
                      </div>
                      <p className="text-xl font-black text-slate-900">{insights.txVelocity.toFixed(1)}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Entries / Day</p>
                    </div>
                  </div>

                  {/* SAVINGS PROGRESS CARD */}
                  <div className="bg-indigo-900 p-6 sm:p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Percent className="w-20 h-20 text-white" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-500 rounded-lg">
                            <Percent className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Retention Ratio</span>
                        </div>
                        <div className="px-3 py-1 bg-indigo-800 rounded-full border border-indigo-700">
                          <span className="text-lg font-black text-white">{insights.savingsRate.toFixed(1)}%</span>
                        </div>
                      </div>

                      <div className="w-full bg-indigo-950/50 rounded-full h-3.5 mb-4 border border-indigo-800 p-1">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${insights.savingsRate > 0 ? 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(Math.max(insights.savingsRate, 0), 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold text-indigo-300 italic">Financial efficiency score</p>
                        <div className="flex gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${insights.savingsRate > 10 ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-600'}`}></div>
                          <div className={`w-1.5 h-1.5 rounded-full ${insights.savingsRate > 25 ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-600'}`}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!isCurrentMonth && (
                    <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500 rounded-xl">
                          <History className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">History Ledger View</p>
                      </div>
                      <button 
                        onClick={() => { setViewMonth(now.getMonth()); setViewYear(now.getFullYear()); }}
                        className="text-[10px] font-black text-white bg-indigo-600 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-indigo-500 transition-colors"
                      >
                        Reset to Current
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* EMPTY DATA STATE */
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="p-6 bg-white rounded-full shadow-sm border border-slate-100">
                    <CalendarDays className="w-12 h-12 text-slate-200" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Intelligence Dry Spell</h3>
                    <p className="text-sm text-slate-500 max-w-[200px] mx-auto leading-relaxed">No data detected for {fullMonths[viewMonth]} {viewYear}. Ledger is empty.</p>
                  </div>
                  <button 
                    onClick={togglePicker}
                    className="px-6 py-2 bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    Select Active Month
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Intelligence Actions Footer */}
        <div className="p-5 sm:p-6 bg-white border-t border-slate-100 flex justify-center shrink-0">
          <button 
            type="button"
            onClick={isPickingPeriod ? togglePicker : onClose}
            className={`
              w-full sm:w-auto px-12 py-4 font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-[0.98] shadow-lg
              ${isPickingPeriod ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-slate-900 text-white shadow-slate-100'}
            `}
          >
            {isPickingPeriod ? 'Back to Intelligence' : 'Close Hub'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MathematicalIntelligence;
