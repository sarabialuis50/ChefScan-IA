
import React, { useState } from 'react';
import { Recipe } from '../types';

interface RecipeDetailViewProps {
  recipe: Recipe | null;
  isFavorite: boolean;
  onToggleFavorite: (category?: string) => void;
  onBack: () => void;
  onNutritionClick?: () => void;
  onStartCooking?: () => void;
  onShare?: () => void;
  isPremium?: boolean;
}

const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({ recipe, isFavorite, onToggleFavorite, onBack, onNutritionClick, onStartCooking, onShare, isPremium }) => {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);

  if (!recipe) return null;

  const handleNutritionClick = () => {
    // Para pruebas permitimos entrar siempre
    if (onNutritionClick) {
      onNutritionClick();
    }
  };

  const categories = ['Desayuno', 'Almuerzo', 'Cena', 'Saludable', 'Otra'];

  const handleToggleFavorite = () => {
    // Para pruebas permitimos usar etiquetas sin ser premium
    if (isFavorite) {
      onToggleFavorite();
    } else {
      setShowTagModal(true);
    }
  };

  const selectCategory = (cat: string) => {
    onToggleFavorite(cat);
    setShowTagModal(false);
  };

  return (
    <div className="min-h-screen bg-pure-black pb-12 text-white">
      <div className="relative h-96 w-full">
        <img
          src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/800/800`}
          alt={recipe.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pure-black via-pure-black/20 to-transparent"></div>

        <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined">close</span>
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

        <div className="absolute bottom-0 left-0 p-6 space-y-2 z-10 w-full">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase shadow-sm ${recipe.nutriScore === 'A' ? 'bg-green-500/20 border-green-500 text-green-500' :
              recipe.nutriScore === 'B' ? 'bg-lime-500/20 border-lime-500 text-lime-500' :
                recipe.nutriScore === 'C' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' :
                  recipe.nutriScore === 'D' ? 'bg-orange-500/20 border-orange-500 text-orange-500' :
                    'bg-red-500/20 border-red-500 text-red-500'
              }`}>
              NutriScore {recipe.nutriScore || 'A'}
            </div>
            <div className="inline-flex px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-[10px] font-black uppercase tracking-tight">
              {recipe.matchPercentage || 100}% Match
            </div>
            {recipe.category && (
              <div className="inline-flex px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] font-black uppercase tracking-tight shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                {recipe.category}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black font-tech uppercase leading-tight text-white drop-shadow-lg">{recipe.title}</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-primary font-bold text-xs uppercase tracking-[0.2em]">Porciones: {recipe.portions || 2}</p>
            {isFavorite && (
              <span className="px-2 py-0.5 bg-red-500 text-white rounded text-[8px] font-black uppercase tracking-widest shadow-lg">
                FAVORITA
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Info Grid - Basic Nutrition (4 Columns) */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-surface-dark p-3 rounded-2xl border border-white/5 text-center">
            <p className="text-primary text-sm font-bold">{recipe.calories || 'N/A'}</p>
            <p className="text-[8px] text-zinc-500 uppercase font-bold mt-1">Kcal</p>
          </div>
          <div className="bg-surface-dark p-3 rounded-2xl border border-white/5 text-center">
            <p className="text-primary text-sm font-bold">{recipe.protein || 'N/A'}</p>
            <p className="text-[8px] text-zinc-500 uppercase font-bold mt-1">Prot. (g)</p>
          </div>
          <div className="bg-surface-dark p-3 rounded-2xl border border-white/5 text-center">
            <p className="text-primary text-sm font-bold">{recipe.carbs || 'N/A'}</p>
            <p className="text-[8px] text-zinc-500 uppercase font-bold mt-1">Carb. (g)</p>
          </div>
          <div className="bg-surface-dark p-3 rounded-2xl border border-white/5 text-center">
            <p className="text-primary text-sm font-bold">{recipe.fat || 'N/A'}</p>
            <p className="text-[8px] text-zinc-500 uppercase font-bold mt-1">Grasa (g)</p>
          </div>
        </div>

        {/* Nutrition Banner */}
        <button
          onClick={handleNutritionClick}
          className="w-full p-4 glass-card rounded-2xl flex items-center justify-between border-primary/20 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:neon-glow">
              <span className="material-symbols-outlined text-lg">info</span>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-wider">Informe Nutricional</p>
              <p className="text-[10px] text-zinc-500">Hazte PRO para ver detalles completos</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">chevron_right</span>
        </button>

        {/* Ingredients */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Ingredientes Base</h2>
          <ul className="space-y-3">
            {(recipe.ingredients || []).length > 0 ? recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex items-center gap-3 text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span className="text-sm">{ing}</span>
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
                Toque Gourmet
              </h2>
              <span className="text-[8px] font-black bg-primary text-black px-2 py-0.5 rounded uppercase tracking-tighter shadow-glow">PRO Suggestion</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">Añade estos ingredientes para elevar tu plato:</p>
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
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Preparación</h2>
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
        <div className="pt-4">
          <button
            onClick={onStartCooking}
            className="w-full bg-primary text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(57,255,20,0.4)] uppercase text-sm active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined font-black">restaurant_menu</span>
            Empezar a Cocinar
          </button>
        </div>
      </div>

      {/* Tag Selection Modal */}
      {showTagModal && (
        <div className="absolute inset-0 z-[110] flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0A0A0A] border-t border-primary/20 rounded-t-[3rem] p-8 pb-12 space-y-8 animate-in slide-in-from-bottom-full duration-500">
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto"></div>
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-bold uppercase tracking-tight text-white">¿Cómo quieres guardarla?</h3>
              <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest">Organiza tu receta favoritas por etiqueta</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => selectCategory(cat)}
                  className="py-5 px-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-400 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all active:scale-95"
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTagModal(false)}
              className="w-full py-4 text-zinc-600 font-bold uppercase text-[9px] tracking-[0.3em]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Premium Modal */}
      {
        showPremiumModal && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-pure-black/90 backdrop-blur-md">
            <div className="w-full max-w-sm glass-card rounded-3xl p-8 border-primary/30 space-y-6 text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center text-primary mx-auto neon-glow">
                <span className="material-symbols-outlined text-4xl">workspace_premium</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-tech font-bold uppercase tracking-tight">Acceso Premium</h3>
                <p className="text-zinc-400 text-sm">Desbloquea informe nutricional completo, recetas ilimitadas y tu Agente Chef IA personal.</p>
              </div>
              <div className="grid gap-3 pt-2">
                <button className="w-full py-4 bg-primary text-black rounded-xl font-bold uppercase text-xs tracking-widest neon-glow">
                  Subir a PRO • $9.99/mes
                </button>
                <button onClick={() => setShowPremiumModal(false)} className="w-full py-4 text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
                  Tal vez más tarde
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default RecipeDetailView;
