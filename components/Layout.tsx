
import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
      <footer className="mt-12 py-8 border-t border-slate-200 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} Hisab Pro • Your Daily Ledger
      </footer>
    </div>
  );
};

export default Layout;
