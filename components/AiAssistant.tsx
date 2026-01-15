
import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { MessageCircle, RefreshCcw, Sparkles, WifiOff } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  isOnline: boolean;
}

const AiAssistant: React.FC<Props> = ({ transactions, isOnline }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async () => {
    if (!isOnline) {
      setAdvice('The AI brain is resting while you are offline. Connect to the internet for smart financial tips!');
      return;
    }
    setLoading(true);
    const result = await getFinancialAdvice(transactions);
    setAdvice(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdvice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  return (
    <div className={`rounded-2xl shadow-lg p-6 text-white relative overflow-hidden transition-all duration-500 ${
      isOnline ? 'bg-gradient-to-br from-indigo-600 to-violet-700' : 'bg-slate-600'
    }`}>
      <div className="absolute top-0 right-0 p-4 opacity-10">
        {isOnline ? <Sparkles className="w-24 h-24" /> : <WifiOff className="w-24 h-24" />}
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className={`w-5 h-5 ${isOnline ? 'text-indigo-200' : 'text-slate-300'}`} />
            <h3 className="font-semibold text-lg">
              {isOnline ? 'Hisab Pro AI Assistant' : 'Offline Mode Active'}
            </h3>
          </div>
          <button 
            onClick={fetchAdvice}
            disabled={loading || !isOnline}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <p className={`text-sm leading-relaxed min-h-[48px] ${isOnline ? 'text-indigo-50' : 'text-slate-200'}`}>
          {loading ? 'Consulting the magic ledger...' : advice}
        </p>
      </div>
    </div>
  );
};

export default AiAssistant;
