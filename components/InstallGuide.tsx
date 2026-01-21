
import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

const InstallGuide: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect if it's iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Check if already in standalone mode (installed)
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

    // Show prompt only on iOS and if not already installed
    if (isIOS && !isStandalone) {
      // Check if user has dismissed it before in this session
      const dismissed = sessionStorage.getItem('ios-prompt-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }
  }, []);

  if (!showPrompt) return null;

  const dismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('ios-prompt-dismissed', 'true');
  };

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white/90 backdrop-blur-md border border-indigo-100 rounded-2xl shadow-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
        
        <button 
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 pr-6">
          <div className="bg-indigo-600 text-white p-2.5 rounded-xl shrink-0 shadow-lg shadow-indigo-200">
            <PlusSquare className="w-6 h-6" />
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 text-base leading-tight">Install Hisab Pro</h4>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Install this app on your iPhone for a better experience and offline use.
            </p>
            
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-xs font-medium text-slate-700">
                <div className="flex items-center justify-center w-5 h-5 bg-slate-100 rounded-full text-[10px]">1</div>
                <span>Tap the <span className="inline-block translate-y-0.5 mx-0.5 text-indigo-600"><Share className="w-3.5 h-3.5" /></span> Share icon below.</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-700">
                <div className="flex items-center justify-center w-5 h-5 bg-slate-100 rounded-full text-[10px]">2</div>
                <span>Select <strong className="text-slate-900">"Add to Home Screen"</strong>.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallGuide;
