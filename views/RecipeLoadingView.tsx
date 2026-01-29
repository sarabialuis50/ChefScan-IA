
import React, { useState, useEffect } from 'react';

interface RecipeLoadingViewProps {
  onCancel: () => void;
  isFinished: boolean;
}

const RecipeLoadingView: React.FC<RecipeLoadingViewProps> = ({ onCancel, isFinished }) => {
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState('Analizando ingredientes...');

  useEffect(() => {
    const labels = [
      'Analizando ingredientes...',
      'Emparejando sabores...',
      'Calculando valores nutricionales...',
      'Diseñando presentación...',
      'Finalizando receta gourmet...'
    ];
    let labelIndex = 0;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (isFinished) return 100;
        if (prev < 90) {
          // Progress logic: move faster at start, slower as it nears 90%
          const increment = Math.max(0.5, (90 - prev) / 20);
          return prev + increment;
        }
        return prev;
      });

      // Cycle labels
      if (Math.floor(progress / 20) > labelIndex && labelIndex < labels.length - 1) {
        labelIndex++;
        setStatusLabel(labels[labelIndex]);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isFinished, progress]);

  return (
    <div style={{ backgroundColor: 'var(--bg-app)' }} className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-8 overflow-hidden">
      {/* Back/Close button */}
      <button
        onClick={onCancel}
        className="absolute top-12 left-8 text-zinc-500 hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-3xl">arrow_back</span>
      </button>

      {/* Center Graphic */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <div className="relative w-72 h-72 mb-12 flex items-center justify-center">
          {/* Decorative Rings - Refined for better centering and smoothness */}
          <div className="absolute inset-0 border border-primary/20 rounded-full scale-[1.15] animate-pulse-slow"></div>
          <div className="absolute inset-0 border border-primary/10 rounded-full scale-[1.3] opacity-50"></div>

          {/* Orbital dots - Better positioned */}
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/40 rounded-full"></div>
          <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_15px_rgba(57,255,20,0.8)]"></div>

          {/* Main Dish Image Container - Improved for cleanliness */}
          <div className="w-full h-full rounded-full overflow-hidden border border-primary/30 shadow-[0_0_80px_rgba(57,255,20,0.2)] relative group bg-zinc-900">
            <img
              src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800"
              alt="Platillo"
              className="w-full h-full object-cover scale-110 grayscale-[0.2] brightness-90 animate-subtle-zoom"
            />
            {/* Soft Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-primary/10"></div>

            {/* Logo Overlay - Centered with flex */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-primary/95 rounded-[2rem] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.3)] animate-float border border-white/20">
                <img src="/chefbot_final.png" alt="ChefScan AI" className="w-16 h-16 object-contain" />
              </div>
            </div>
          </div>

          {/* AI Status Tag */}
          <div style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--primary-half)' }} className="absolute -bottom-6 left-1/2 -translate-x-1/2 border backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_5px_#39FF14]"></div>
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">AI CHEF</span>
          </div>
        </div>

        {/* Text Section */}
        <div className="text-center space-y-4">
          <h2 style={{ color: 'var(--text-main)' }} className="text-3xl font-bold font-outfit">Generando tu Receta...</h2>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-[280px] mx-auto">
            Analizando tus ingredientes para crear algo delicioso y único.
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="w-full max-w-sm space-y-4 pb-12">
        <div className="flex justify-between items-end px-1">
          <div className="flex items-center gap-2 text-primary">
            <img src="/chefbot_final.png" alt="ChefScan AI" className="w-5 h-5 object-contain" />
            <span className="text-xs font-bold uppercase tracking-widest">{statusLabel}</span>
          </div>
          <span className="text-xs font-tech text-zinc-500">{Math.floor(progress)}%</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'var(--card-border)' }} className="h-1.5 w-full rounded-full overflow-hidden border relative">
          <div
            className="h-full bg-primary rounded-full neon-glow transition-all duration-300"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full animate-shimmer"></div>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="w-full text-zinc-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em] pt-4"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default RecipeLoadingView;
