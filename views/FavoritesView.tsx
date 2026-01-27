import React, { useState, useMemo } from 'react';
import { Recipe } from '../types';

interface FavoritesViewProps {
  recipes: (Recipe & { category?: string })[];
  onRecipeClick: (recipe: Recipe) => void;
  onBack: () => void;
}

const ImageWithPlaceholder: React.FC<{ src?: string, alt: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const finalSrc = src || `https://picsum.photos/seed/${alt}/200/200?grayscale`;

  return (
    <div className="w-24 h-24 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg overflow-hidden relative flex-shrink-0">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-zinc-800 flex items-center justify-center">
          <span className="material-symbols-outlined text-zinc-700 text-sm">image</span>
        </div>
      )}
      <img
        src={finalSrc}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

const FavoritesView: React.FC<FavoritesViewProps> = ({ recipes, onRecipeClick, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todo');

  const categories = ['Todo', 'Desayuno', 'Almuerzo', 'Cena', 'Saludable', 'Otra'];

  const filteredRecipes = useMemo(() => {
    return recipes.filter(item => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = activeCategory === 'Todo' || item.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [recipes, searchTerm, activeCategory]);

  return (
    <div className="p-6 pb-20">
      <header className="flex flex-col gap-6 mt-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center active:scale-90 transition-all mr-2"
            >
              <span className="material-symbols-outlined text-white text-xl">arrow_back</span>
            </button>
            <h1 className="text-2xl font-black tracking-tighter uppercase text-white">FAVORITAS<span className="text-primary">.IA</span></h1>
          </div>
          <div className="px-3 py-1 bg-primary/20 rounded-full border border-primary/30 text-[10px] font-black text-primary uppercase">
            {filteredRecipes.length} Recetas
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-zinc-500">search</span>
          <input
            type="text"
            placeholder="Buscar entre tus favoritas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-zinc-700 focus:border-primary/40 outline-none transition-all"
          />
        </div>

        {/* Categories Tabs - Grid structure to fit all 6 in one row */}
        <div className="grid grid-cols-6 gap-1 w-full">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`py-2 rounded-lg text-[7.5px] font-black uppercase tracking-tighter text-center transition-all ${activeCategory === cat
                ? 'bg-primary text-black shadow-md shadow-primary/20'
                : 'bg-zinc-900/50 text-zinc-500 border border-white/5 hover:border-white/10'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {filteredRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl opacity-20">favorite_border</span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] mb-1 text-zinc-500">Sin favoritas</p>
            <p className="text-xs text-zinc-600">No se encontraron recetas en esta categoría.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecipes.map((recipe, idx) => (
            <div
              key={recipe.id || idx}
              onClick={() => onRecipeClick(recipe)}
              className="group relative flex items-center gap-4 glass-card p-4 rounded-3xl hover:bg-primary/5 transition-all cursor-pointer border-white/5 hover:border-primary/20 shadow-xl overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-24 h-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors"></div>

              <div className="relative">
                <ImageWithPlaceholder src={recipe.imageUrl} alt={recipe.title} />
                {recipe.category && (
                  <div className="absolute -top-1 -left-1 px-2 py-0.5 bg-primary text-black rounded border border-primary/20 text-[7px] font-black uppercase tracking-widest shadow-glow">
                    {recipe.category}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 z-10 space-y-2">
                <div>
                  <h4 className="text-white text-base font-bold uppercase tracking-tight leading-tight">{recipe.title}</h4>
                  <p className="text-zinc-500 text-[10px] italic line-clamp-2 leading-relaxed mt-1">
                    {recipe.description}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-zinc-500 text-xs text-primary/60">schedule</span>
                    <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-tighter">{recipe.prepTime || '20 min'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-zinc-500 text-xs text-primary/60">restaurant</span>
                    <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-tighter">{recipe.difficulty || 'Fácil'}</span>
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-zinc-700 group-hover:text-primary transition-colors pr-2">play_circle</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesView;
