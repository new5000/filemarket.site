import React from 'react';

export interface LoadingScreenProps {
  text?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ text = 'Loading Digital Assets...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors">
      <div className="flex flex-col items-center max-w-xs w-full px-6 text-center space-y-4 animate-fade-in">
        
        {/* Brand Avatar / Logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl border-2 border-emerald-500/30 p-1 bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 backdrop-blur-md">
            <img
              src="https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10"
              alt="FileMarket"
              className="w-full h-full object-cover rounded-2xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
              }}
            />
          </div>
          {/* Subtle Verified Indicator */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 flex items-center justify-center text-slate-950">
            <svg className="w-2.5 h-2.5 fill-current font-black" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
        </div>

        {/* Brand Title */}
        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
          File<span className="text-emerald-500">Market</span>
        </h2>

        {/* Sleek Progress Bar */}
        <div className="w-full max-w-[200px] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-2/3 animate-pulse" />
        </div>

        {/* Subtle Status Text */}
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {text}
        </p>

      </div>
    </div>
  );
};

export default LoadingScreen;
