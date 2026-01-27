
import React, { useState, useMemo } from 'react';
import { Recipe } from '../types';

interface ResultsViewProps {
  recipes: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
  onBack: () => void;
  isPremium?: boolean;
  onGenerateMore?: () => void;
  loadingMore?: boolean;
}

const ResultsView: React.FC<ResultsViewProps> = ({
  recipes,
  onRecipeClick,
  onBack,
  isPremium,
  onGenerateMore,
  loadingMore
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const filteredRecipes = useMemo(() => {
    if (!searchTerm.trim()) return recipes;
    return recipes.filter(recipe =>
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [recipes, searchTerm]);

  const handleGenerateMore = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
    } else if (onGenerateMore) {
      onGenerateMore();
    }
  };

  return (
    <div className="p-6 pb-32">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10">
            <span className="material-symbols-outlined text-zinc-400">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold uppercase tracking-tight font-outfit">Recetas <span className="text-primary italic">IA</span></h1>
        </div>
        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
          {recipes?.length || 0} Resultados
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative mb-8">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-zinc-500">search</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filtrar por nombre o ingrediente..."
          className="w-full bg-black border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-zinc-400 placeholder-zinc-700 outline-none focus:border-primary/50 transition-all shadow-inner"
        />
      </div>

      <div className="space-y-6">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => onRecipeClick(recipe)}
              className="w-full glass-card rounded-2xl p-4 flex flex-col gap-4 border-primary/10 hover:border-primary/40 transition-all text-left relative overflow-hidden group"
            >
              {/* Background Image Preview */}
              <div className="absolute top-0 right-0 w-32 h-full opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <img src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/200/400`} alt="" className="w-full h-full object-cover" />
              </div>

              <div className="flex gap-4 relative z-10">
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                  <img src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/200/200`} alt={recipe.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold leading-tight uppercase line-clamp-2 pr-2">{recipe.title}</h3>
                    <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/30 whitespace-nowrap">
                      {recipe.matchPercentage || 100}% MATCH
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-zinc-500 text-[11px] font-bold">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                      {recipe.prepTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-primary">bar_chart</span>
                      {recipe.difficulty || 'Fácil'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5 relative z-10">
                <div className="flex -space-x-2">
                  {(recipe.ingredients || []).slice(0, 3).map((_, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-pure-black bg-zinc-800 flex items-center justify-center text-[10px]">
                      {['🥬', '🥑', '🍗', '🥚', '🍝'][i % 5]}
                    </div>
                  ))}
                  {(recipe.ingredients || []).length > 3 && (
                    <div className="w-6 h-6 rounded-full border-2 border-pure-black bg-zinc-800 flex items-center justify-center text-[8px] font-bold">
                      +{(recipe.ingredients || []).length - 3}
                    </div>
                  )}
                </div>
                <div className="bg-primary text-black px-4 py-2 rounded-full text-xs font-black uppercase flex items-center gap-2 hover:brightness-110 shadow-[0_0_10px_rgba(57,255,20,0.3)]">
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  Cocinar ahora
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-20 text-zinc-600">
            <span className="material-symbols-outlined text-5xl opacity-20 mb-2">search_off</span>
            <p className="text-sm font-bold uppercase tracking-widest">No se encontraron resultados</p>
          </div>
        )}

        {/* Generate More Button - Only shows if less than 15 recipes */}
        {recipes.length < 15 && !searchTerm && (
          <div className="pt-6">
            <button
              onClick={handleGenerateMore}
              disabled={loadingMore}
              className="w-full bg-primary text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(57,255,20,0.4)] uppercase text-sm active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined font-bold">{loadingMore ? 'sync' : 'rocket_launch'}</span>
              {loadingMore ? "Generando más..." : "Generar más recetas"}
            </button>
            <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.15em] text-center mt-3">
              {recipes.length}/15 versiones de recetas generadas
            </p>
          </div>
        )}
      </div>

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-pure-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm glass-card rounded-[2.5rem] p-8 border-primary/30 space-y-6 text-center shadow-[0_0_50px_rgba(57,255,20,0.1)]">
            <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center text-primary mx-auto neon-glow border border-primary/30">
              <span className="material-symbols-outlined text-4xl">workspace_premium</span>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-tech font-bold uppercase tracking-tight">Acceso Premium</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Hazte PRO para ver hasta <span className="text-primary font-bold">15 versiones</span> de recetas (en lotes de 5), informe nutricional detallado y acceso ilimitado a tu Agente Chef IA.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                Ver hasta 10 versiones más
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                Informe nutricional completo
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                Agente Chef IA Personal
              </div>
            </div>
            <div className="grid gap-3 pt-2">
              <button className="w-full py-4 bg-primary text-black rounded-xl font-bold uppercase text-xs tracking-widest neon-glow shadow-strong">
                Subir a PRO • $9.99/mes
              </button>
              <button onClick={() => setShowPremiumModal(false)} className="w-full py-2 text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
                Tal vez más tarde
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsView;
