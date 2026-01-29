import React, { useState, useMemo } from 'react';
import { getRecipeImage } from '../utils/imageUtils';

interface HistoryItem {
  id?: string;
  ingredient: string;
  recipe: string;
  date: string;
  time: string;
  imageUrl?: string;
  category?: 'Desayuno' | 'Almuerzo' | 'Cena' | 'Saludable';
  fullRecipeData?: any;
}

interface HistoryViewProps {
  history: HistoryItem[];
  onBack: () => void;
  onRecipeClick: (recipe: any) => void;
}

const ImageWithPlaceholder: React.FC<{ imageUrl?: string, id: string, alt: string }> = ({ imageUrl, id, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const finalSrc = getRecipeImage({ imageUrl, id }, 200);

  return (
    <div style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'var(--card-border)' }} className="w-16 h-16 rounded-2xl border shadow-lg overflow-hidden relative">
      {!loaded && (
        <div style={{ backgroundColor: 'var(--bg-surface-inner)' }} className="absolute inset-0 animate-pulse flex items-center justify-center">
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

const HistoryView: React.FC<HistoryViewProps> = ({ history, onBack, onRecipeClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todo');

  const categories = ['Todo', 'Desayuno', 'Almuerzo', 'Cena', 'Saludable', 'Otra'];

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch =
        item.recipe.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ingredient.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = activeCategory === 'Todo' || item.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [history, searchTerm, activeCategory]);

  return (
    <div className="p-6 pb-20">
      <header className="flex flex-col gap-6 mt-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }}
              className="w-10 h-10 rounded-full border flex items-center justify-center active:scale-90 transition-all mr-2"
            >
              <span className="material-symbols-outlined text-primary text-xl">arrow_back</span>
            </button>
            <h2 style={{ color: 'var(--text-main)' }} className="text-xl font-bold tracking-tight font-outfit uppercase">Recetas Recientes</h2>
          </div>
          <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-bold text-primary">
            {filteredHistory.length} items
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary">search</span>
          <input
            type="text"
            placeholder="Buscar en el historial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ backgroundColor: 'var(--bg-surface-inner)', color: 'var(--text-main)', borderColor: 'var(--card-border)' }}
            className="w-full border rounded-2xl py-4 pl-12 pr-4 text-sm placeholder-zinc-500 focus:border-primary/40 outline-none transition-all"
          />
        </div>

        {/* Categories Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 px-1 no-scrollbar scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border hover:bg-primary/10 ${activeCategory === cat
                ? 'shadow-lg shadow-primary/20'
                : ''
                }`}
              style={{
                backgroundColor: activeCategory === cat ? '#39FF14' : 'var(--bg-surface-soft)',
                borderColor: activeCategory === cat ? '#39FF14' : 'var(--card-border)',
                color: activeCategory === cat ? '#000000' : 'var(--text-muted)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {filteredHistory.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }} className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'var(--card-border)' }} className="w-20 h-20 rounded-full border flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl opacity-20">history_toggle_off</span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] mb-1">Sin resultados</p>
            <p className="text-xs">No se encontraron recetas en esta categoría.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                // Si existe la receta completa la usamos, si no, creamos una básica con lo que tenemos
                const recipeToOpen = item.fullRecipeData || {
                  id: item.id || `hist-${idx}`,
                  title: item.recipe,
                  imageUrl: item.imageUrl,
                  description: `Receta preparada el ${item.date}`,
                  content: {
                    ingredients: [item.ingredient],
                    instructions: ["Detalle de pasos no disponible para esta receta histórica."],
                    category: item.category || 'General'
                  }
                };
                onRecipeClick(recipeToOpen);
              }}
              className="group relative flex items-center gap-4 p-4 rounded-3xl transition-all cursor-pointer border shadow-xl overflow-hidden"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--card-border)' }}
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-24 h-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors"></div>

              <div className="relative flex-shrink-0">
                <ImageWithPlaceholder imageUrl={item.imageUrl} id={item.id || item.recipe} alt={item.recipe} />
                {item.category && (
                  <div className="absolute -top-1 -left-1 px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded border border-white/10 text-[6px] font-black uppercase text-primary tracking-widest">
                    {item.category}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 z-10">
                <h4 style={{ color: 'var(--text-main)' }} className="text-base font-bold truncate uppercase tracking-tight mb-0.5">{item.recipe}</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase tracking-[0.1em]">Base:</span>
                  <p className="text-primary/70 text-[10px] font-black truncate uppercase">{item.ingredient}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ color: 'var(--text-muted)' }} className="text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">calendar_today</span> {item.date}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }} className="text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span> {item.time}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-zinc-700 group-hover:text-primary transition-colors pr-2">arrow_forward</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
