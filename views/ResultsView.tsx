import React, { useState, useMemo } from 'react';
import { Recipe } from '../types';
import { getRecipeImage } from '../utils/imageUtils';
import { useTranslation, Language } from '../utils/i18n';
import { formatPrepTime } from '../utils/recipeUtils';

interface ResultsViewProps {
  recipes: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
  onBack: () => void;
  isPremium?: boolean;
  onGenerateMore?: () => void;
  loadingMore?: boolean;
  language: Language;
}

const ResultsView: React.FC<ResultsViewProps> = ({
  recipes,
  onRecipeClick,
  onBack,
  isPremium,
  onGenerateMore,
  loadingMore,
  language
}) => {
  const t = useTranslation(language);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecipes = useMemo(() => {
    if (!searchTerm.trim()) return recipes;
    return recipes.filter(recipe =>
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [recipes, searchTerm]);

  const handleGenerateMore = () => {
    if (onGenerateMore) {
      onGenerateMore();
    }
  };

  return (
    <div className="p-6 pb-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }} className="w-10 h-10 flex items-center justify-center rounded-full border">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <div>
            <h1 style={{ color: 'var(--text-main)' }} className="text-2xl font-bold uppercase tracking-tight font-outfit">{t('results_title')}<span className="text-primary italic">.IA</span></h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t('sub_recientes')}</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
          {recipes?.length || 0} {t('results_title')}
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative mb-8">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-zinc-500">search</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('search_results_placeholder')}
          style={{ backgroundColor: 'var(--bg-surface-inner)', color: 'var(--text-main)', borderColor: 'var(--card-border)' }}
          className="w-full border rounded-2xl py-4 pl-12 pr-4 text-sm placeholder-zinc-700 outline-none focus:border-primary/50 transition-all shadow-inner"
        />
      </div>

      <div className="space-y-6">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => onRecipeClick(recipe)}
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--card-border)' }}
              className="w-full rounded-2xl p-4 flex flex-col gap-4 border hover:border-primary/40 transition-all text-left relative overflow-hidden group"
            >
              {/* Background Image Preview */}
              <div className="absolute top-0 right-0 w-32 h-full opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <img
                  src={getRecipeImage(recipe, 400)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400";
                  }}
                />
              </div>

              <div className="flex gap-4 relative z-10 items-center">
                <div style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'var(--card-border)' }} className="w-24 h-24 rounded-2xl overflow-hidden border flex-shrink-0 relative">
                  <img
                    src={getRecipeImage(recipe, 300)}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300";
                    }}
                  />
                  {recipe.category && (
                    <div className="absolute top-0 left-0 bg-primary text-black text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-br-lg shadow-sm z-20">
                      {recipe.category}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-[1px] w-4 bg-primary/40" />
                    <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">
                      {recipe.matchPercentage || 100}% {t('match_label')}
                    </span>
                  </div>
                  <h3 style={{ color: 'var(--text-main)' }} className="text-[14px] font-black leading-tight transition-colors line-clamp-2 uppercase">
                    {recipe.title}
                  </h3>
                  <div className="space-y-2">
                    <p className="text-zinc-500 text-[10px] italic line-clamp-2 leading-relaxed">
                      {recipe.description}
                    </p>
                    <div className="flex -space-x-1.5">
                      {(recipe.ingredients || []).slice(0, 4).map((_, i) => (
                        <div key={i} style={{ borderColor: 'var(--bg-app)', backgroundColor: 'var(--bg-surface-inner)' }} className="w-5 h-5 rounded-full border flex items-center justify-center text-[8px]">
                          {['🥬', '🥑', '🍗', '🥚', '🍝'][i % 5]}
                        </div>
                      ))}
                      {(recipe.ingredients || []).length > 4 && (
                        <div key="more" style={{ borderColor: 'var(--bg-app)', backgroundColor: 'var(--bg-surface-inner)', color: 'var(--text-main)' }} className="w-5 h-5 rounded-full border flex items-center justify-center text-[7px] font-black">
                          +{(recipe.ingredients || []).length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderColor: 'var(--card-border)' }} className="mt-1 pt-3 border-t relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4 text-zinc-500 text-[9px] font-black uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary/60">schedule</span>
                    {formatPrepTime(recipe.prepTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary/60">analytics</span>
                    {recipe.difficulty || 'Fácil'}
                  </span>
                </div>

                <div className="bg-primary text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 hover:brightness-110 shadow-glow active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-sm font-black">play_arrow</span>
                  {t('cook_now')}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-20 text-zinc-600">
            <span className="material-symbols-outlined text-5xl opacity-20 mb-2">search_off</span>
            <p className="text-sm font-bold uppercase tracking-widest">{t('no_results')}</p>
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
              {loadingMore ? t('generating_more') : t('generate_more_recipes')}
            </button>
            <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.15em] text-center mt-3">
              {t('versions_generated', { count: recipes.length })}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ResultsView;
