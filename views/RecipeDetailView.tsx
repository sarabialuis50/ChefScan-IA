import React, { useState } from 'react';
import { Recipe } from '../types';
import { getRecipeImage } from '../utils/imageUtils';
import SaveFavoriteModal from '../components/SaveFavoriteModal';
import { useTranslation, Language } from '../utils/i18n';

interface RecipeDetailViewProps {
  recipe: Recipe | null;
  isFavorite: boolean;
  onToggleFavorite: (category?: string) => void;
  onBack: () => void;
  onNutritionClick?: () => void;
  onStartCooking?: () => void;
  onShare?: () => void;
  isPremium?: boolean;
  onShowPremium?: (reason: 'recipes' | 'nutrition' | 'chefbot' | 'more-recipes') => void;
  userTags?: string[];
  onCreateTag?: (tag: string) => void;
  onUpdateTag?: (oldName: string, newName: string) => void;
  onDeleteTag?: (tag: string) => void;
  language: Language;
}

const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({ recipe, isFavorite, onToggleFavorite, onBack, onNutritionClick, onStartCooking, onShare, isPremium, onShowPremium, userTags = [], onCreateTag, onUpdateTag, onDeleteTag, language }) => {
  const t = useTranslation(language);
  const [showTagModal, setShowTagModal] = useState(false);

  if (!recipe) return null;

  const handleNutritionClick = () => {
    if (isPremium) {
      if (onNutritionClick) {
        onNutritionClick();
      }
    } else {
      if (onShowPremium) onShowPremium('nutrition');
    }
  };

  const handleToggleFavorite = () => {
    if (isFavorite) {
      onToggleFavorite();
    } else {
      setShowTagModal(true);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-app)' }} className="pb-8">
      <div className="relative h-96 w-full">
        <img
          src={getRecipeImage(recipe, 800)}
          alt={recipe.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-app)] via-[var(--bg-app)]/20 to-transparent"></div>

        <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onShare}
              className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined">share</span>
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${isFavorite ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-black/40 border-white/10 text-white'}`}
            >
              <span className={`material-symbols-outlined ${isFavorite ? 'fill-icon' : ''}`} style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "" }}>
                favorite
              </span>
            </button>
          </div>
        </header>

        <div className="absolute bottom-[-1.25rem] left-0 px-6 space-y-2 z-20 w-full">
          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase shadow-sm ${recipe.nutriScore === 'A' ? 'bg-primary border-primary/40 text-black shadow-glow-subtle' :
              recipe.nutriScore === 'B' ? 'bg-lime-500 border-lime-600 text-white' :
                recipe.nutriScore === 'C' ? 'bg-yellow-500 border-yellow-600 text-black' :
                  recipe.nutriScore === 'D' ? 'bg-orange-500 border-orange-600 text-white' :
                    'bg-red-500 border-red-600 text-white'
              }`}>
              NutriScore {recipe.nutriScore || 'A'}
            </div>
            <div className="inline-flex px-2.5 py-1 rounded-full bg-primary border border-primary/40 text-black text-[10px] font-black uppercase tracking-tight shadow-glow-subtle">
              {recipe.matchPercentage || 100}% {t('match_label')}
            </div>
            {(recipe.category || isFavorite) && (
              <div className="inline-flex px-2.5 py-1 rounded-full bg-blue-500 border border-blue-600 text-white text-[10px] font-black uppercase tracking-tight shadow-sm">
                {recipe.category || t('favorites_title')}
              </div>
            )}
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-1">Detalle Gourmet</p>
          <h1 style={{ color: 'var(--text-main)' }} className="text-3xl font-black font-tech uppercase leading-none drop-shadow-2xl">{recipe.title}</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-primary font-bold text-xs uppercase tracking-[0.2em]">{t('portions_detail')}: {recipe.portions || 2}</p>
            {isFavorite && (
              <span className="px-2 py-0.5 bg-red-500 text-white rounded text-[8px] font-black uppercase tracking-widest shadow-lg">
                FAVORITA
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pt-6 pb-0 space-y-5">
        {/* Info Grid - Basic Nutrition (High-Level) */}
        <div className="grid grid-cols-4 gap-3 py-4 mt-2">
          <div style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }} className="p-4 rounded-3xl border text-center shadow-inner hover:border-primary/20 transition-all">
            <p className="text-primary text-sm font-black tracking-tight">{recipe.calories?.toString().replace(/kcal/i, '').trim() || 'N/A'}</p>
            <p className="text-[8px] text-zinc-600 uppercase font-black mt-1 tracking-widest">Kcal</p>
          </div>
          <div style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }} className="p-4 rounded-3xl border text-center shadow-inner hover:border-primary/20 transition-all">
            <p className="text-primary text-sm font-black tracking-tight">{recipe.protein || 'N/A'}</p>
            <p className="text-[8px] text-zinc-600 uppercase font-black mt-1 tracking-widest">Prot</p>
          </div>
          <div style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }} className="p-4 rounded-3xl border text-center shadow-inner hover:border-primary/20 transition-all">
            <p className="text-primary text-sm font-black tracking-tight">{recipe.carbs || 'N/A'}</p>
            <p className="text-[8px] text-zinc-600 uppercase font-black mt-1 tracking-widest">Carb</p>
          </div>
          <div style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }} className="p-4 rounded-3xl border text-center shadow-inner hover:border-primary/20 transition-all">
            <p className="text-primary text-sm font-black tracking-tight">{recipe.fat || 'N/A'}</p>
            <p className="text-[8px] text-zinc-600 uppercase font-black mt-1 tracking-widest">{t('fat')}</p>
          </div>
        </div>

        {/* Nutrition Banner */}
        <button
          onClick={handleNutritionClick}
          className="w-full p-5 glass-card rounded-[2rem] flex items-center justify-between border-primary/20 group shadow-glow-subtle"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:neon-glow transition-all">
              <span className="material-symbols-outlined text-xl">analytics</span>
            </div>
            <div className="text-left">
              <p style={{ color: 'var(--text-main)' }} className="text-xs font-black uppercase tracking-widest">{t('nutrition_report')}</p>
              <p className="text-[10px] text-zinc-500 font-medium">{isPremium ? t('view_detailed_analysis') : t('get_premium_for_details')}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">chevron_right</span>
        </button>

        {/* Ingredients */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary">{t('base_ingredients')}</h2>
            <span className="text-[9px] font-bold text-zinc-600 uppercase">{(recipe.ingredients || []).length} items</span>
          </div>
          <ul className="space-y-4">
            {(recipe.ingredients || []).length > 0 ? recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex items-center gap-4 group/item">
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(57,255,20,0.6)]"></div>
                <span style={{ color: 'var(--text-main)' }} className="text-sm font-medium tracking-tight transition-colors opacity-80 group-hover/item:opacity-100">{ing}</span>
              </li>
            )) : (
              <li className="text-zinc-500 text-xs italic">No hay ingredientes listados.</li>
            )}
          </ul>
        </section>

        {/* Premium Suggested Extras */}
        {recipe.suggestedExtras && recipe.suggestedExtras.length > 0 && (
          <section className="space-y-4 p-5 bg-primary/5 rounded-3xl border border-primary/20 shadow-inner">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-sm animate-pulse">auto_awesome</span>
                {t('gourmet_touch')}
              </h2>
              <span className="text-[8px] font-black bg-primary text-black px-2 py-0.5 rounded uppercase tracking-tighter shadow-glow">{t('premium_suggestion')}</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">{t('add_these_to_elevate')}</p>
            <ul className="grid grid-cols-2 gap-2">
              {recipe.suggestedExtras.map((extra, idx) => (
                <li key={idx} className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="material-symbols-outlined text-primary text-sm">add_circle</span>
                  <span className="text-xs text-white/90 font-medium truncate">{extra}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Preparation */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary">{t('preparation')}</h2>
          <div className="space-y-6">
            {(recipe.instructions || []).length > 0 ? recipe.instructions.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary text-black font-black flex items-center justify-center text-sm">
                  {idx + 1}
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{step}</p>
              </div>
            )) : (
              <p className="text-zinc-500 text-xs italic">Instrucciones no disponibles para esta receta de exploración.</p>
            )}
          </div>
        </section>

        {/* Global CTA - Start Cooking */}
        <div className="mt-32 flex justify-center">
          <button
            onClick={onStartCooking}
            className="w-[75%] bg-primary text-black font-black py-3.5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(57,255,20,0.4)] uppercase text-sm active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined font-black">restaurant_menu</span>
            {t('start_cooking')}
          </button>
        </div>
      </div>

      {/* Selector de Etiquetas para Favoritos */}
      <SaveFavoriteModal
        isOpen={showTagModal}
        recipe={recipe}
        onClose={() => setShowTagModal(false)}
        onSave={onToggleFavorite}
        userTags={userTags}
        onCreateTag={onCreateTag}
        onUpdateTag={onUpdateTag}
        onDeleteTag={onDeleteTag}
      />

    </div>
  );
};

export default RecipeDetailView;
