
import React, { useState, useRef } from 'react';
import { Recipe, Ingredient } from '../types';
import { analyzeIngredientImage, checkIngredientsConsistency } from '../services/geminiService';
import { resizeAndCompressImage, getRecipeImage } from '../utils/imageUtils';
import { supabase } from '../lib/supabase';
import { getDaysDiff } from '../utils/dateUtils';
import SaveFavoriteModal from '../components/SaveFavoriteModal';

interface DashboardViewProps {
  user: any;
  recentRecipes: Recipe[];
  favoriteRecipes: Recipe[];
  scannedIngredients?: Ingredient[];
  scannedImage?: string;
  onClearScanned?: () => void;
  onScanClick: () => void;
  onRecipeClick: (recipe: Recipe) => void;
  onGenerate: (recipes: Recipe[]) => void;
  onStartGeneration: (ingredients: string[], portions: number, itemId?: string) => void;
  onExploreClick: () => void;
  onNotificationsClick: () => void;
  onSettingsClick?: () => void;
  onNavClick?: (view: any) => void;
  onComplete?: (ingredients: Ingredient[], image64: string) => void;
  onAddItem?: (name: string, quantity: number, unit: string, expiryDate?: string) => void;
  inventory?: any[];
  acceptedChallengeId?: string | null;
  onBack?: () => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  userTags?: string[];
  onCreateTag?: (tag: string) => void;
  onUpdateTag?: (oldName: string, newName: string) => void;
  onDeleteTag?: (tag: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  recentRecipes,
  favoriteRecipes,
  scannedIngredients = [],
  scannedImage,
  onClearScanned,
  onScanClick,
  onRecipeClick,
  onGenerate,
  onToggleFavorite,
  onStartGeneration,
  onExploreClick,
  onNotificationsClick,
  onSettingsClick,
  onNavClick,
  onComplete,
  onAddItem,
  inventory = [],
  acceptedChallengeId,
  onBack,
  isDarkMode,
  onThemeToggle,
  userTags = [],
  onCreateTag,
  onUpdateTag,
  onDeleteTag
}) => {
  const [manualInput, setManualInput] = useState('');
  const [portions, setPortions] = useState(2);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [savedItems, setSavedItems] = useState<Set<number>>(new Set());
  const [showTagModal, setShowTagModal] = useState(false);
  const [recipeToTag, setRecipeToTag] = useState<Recipe | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    onThemeToggle();
  };

  // Sincronizar imagen y entrada manual del escáner
  React.useEffect(() => {
    if (scannedImage) {
      const img = scannedImage.startsWith('data:') ? scannedImage : `data:image/jpeg;base64,${scannedImage}`;
      setPreviewImage(img);
    }
  }, [scannedImage]);

  React.useEffect(() => {
    if (scannedIngredients && scannedIngredients.length > 0) {
      setManualInput(prev => {
        const currentItems = prev.split(',')
          .map(i => i.trim())
          .filter(Boolean);

        const newItems = scannedIngredients.map(i => i.name);

        // Combinar evitando duplicados (sin distinguir mayúsculas/minúsculas)
        const combined = [...currentItems];
        newItems.forEach(newItem => {
          if (!combined.some(item => item.toLowerCase() === newItem.toLowerCase())) {
            combined.push(newItem);
          }
        });

        return combined.join(', ');
      });
    }
  }, [scannedIngredients]);

  // ... (useEffect for timer remains same)

  const handleGenerate = () => {
    if (!manualInput.trim()) return;
    onStartGeneration(manualInput.split(',').map(i => i.trim()), portions);

    // Limpiar imagen automáticamente tras generar
    setPreviewImage(null);
    if (onClearScanned) onClearScanned();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setPreviewImage(URL.createObjectURL(file)); // Set preview immediately
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalBase64 = reader.result as string;
        const optimizedBase64 = await resizeAndCompressImage(originalBase64, 1024, 1024, 0.8);
        const identifiedIngredients = await analyzeIngredientImage(optimizedBase64);
        // ... rest of logic
        if (identifiedIngredients && identifiedIngredients.length > 0) {
          // Persistencia en Supabase si el usuario está logueado
          // Persistencia en Supabase REMOVIDA por solicitud del usuario
          // Solo se mantiene la imagen en memoria temporalmente para la sesión

          if (onComplete) onComplete(identifiedIngredients, optimizedBase64);
        } else {
          alert("No pudimos identificar ingredientes claros en esta imagen.");
        }
        setAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error analyzing uploaded file:", error);
      setAnalyzing(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetSystem = () => {
    setManualInput('');
    setPortions(2);
    setAiSuggestion(null);
    setPreviewImage(null);
    if (onClearScanned) onClearScanned();
  };

  return (
    <div className="flex flex-col min-h-screen p-5 pb-0 space-y-4 relative" style={{ backgroundColor: 'var(--bg-app)' }}>
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-2 left-5 text-zinc-600 hover:text-white transition-colors z-[50]"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
        </button>
      )}
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <header className="flex justify-between items-center w-full pt-2">
        <div className="flex items-center gap-3">
          <div style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'var(--primary)' }} className="w-12 h-12 border-2 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 shadow-[0_0_15px_rgba(57,255,20,0.5)] border-primary">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <img src="/chefbot_final.png" alt="ChefScan Logo" className="w-8 h-8 object-contain" />
            )}
          </div>
          <div className="flex flex-col">
            <span style={{ color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Bienvenido</span>
            <h2 style={{ color: 'var(--text-main)' }} className="font-bold text-lg leading-none">Chef <span className="text-primary">{user?.name || 'Alejandro'}</span></h2>
            <span style={{ color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase tracking-widest leading-none mt-1.5">¿Qué vas a cocinar hoy?</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            style={{
              backgroundColor: isDarkMode ? 'rgba(57,255,20,0.1)' : 'var(--bg-surface-soft)',
              borderColor: isDarkMode ? 'var(--primary)' : 'var(--card-border)'
            }}
            className="w-10 h-10 rounded-xl border flex items-center justify-center active:scale-90 transition-all duration-500 group"
            title="Cambiar Tema"
          >
            <span className={`material-symbols-outlined notranslate text-xl transition-transform duration-500 ${isDarkMode ? 'text-primary rotate-[360deg]' : 'text-zinc-500 rotate-0'}`}>
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button
            onClick={onNotificationsClick}
            style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }}
            className="w-10 h-10 rounded-xl border flex items-center justify-center relative active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-zinc-500 notranslate text-xl">notifications</span>
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full neon-glow"></span>
          </button>
          <button
            onClick={onSettingsClick}
            style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }}
            className="w-10 h-10 rounded-xl border flex items-center justify-center active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-zinc-500 notranslate text-xl">settings</span>
          </button>
        </div>
      </header>

      <div className="space-y-1.5 pt-2 relative">
        <h1 style={{ color: 'var(--text-main)' }} className="text-4xl font-black tracking-tighter leading-none">
          Chef<span className="text-primary">Scan.IA</span>
        </h1>
        <p style={{ color: 'var(--text-main)' }} className="font-bold text-[9px] uppercase tracking-[0.25em] opacity-80">
          Transforma tus ingredientes en obras maestras
        </p>
      </div>

      <section style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--card-border)' }} className="border rounded-[2.5rem] p-6 space-y-6 w-full shadow-sm">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl notranslate">photo_camera</span>
          <h3 style={{ color: 'var(--text-main)' }} className="font-bold uppercase tracking-[0.2em] text-[10px] opacity-80">Imagen de ingredientes</h3>
        </div>

        {/* Preview Box - Image Preview + Results */}
        <div style={{ backgroundColor: 'var(--bg-surface-inner)' }} className="w-full min-h-[18rem] border-2 border-dashed border-primary/30 rounded-[1.5rem] relative overflow-hidden transition-all group">
          {previewImage ? (
            <>
              <img
                src={previewImage}
                alt="Uploaded Ingredients"
                className="w-full h-full object-cover absolute inset-0 opacity-60 group-hover:opacity-40 transition-opacity"
              />

              {/* Overlay Content */}
              <div className="relative z-10 w-full h-full p-6 flex flex-col items-center justify-center">
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm p-4 rounded-2xl">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Analizando...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <span style={{ background: 'var(--bg-surface-inner)', color: 'var(--text-main)' }} className="text-[10px] font-black uppercase tracking-widest drop-shadow-lg animate-in fade-in duration-500 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                      Captura Exitosa
                    </span>

                    {/* Chips de ingredientes detectados */}
                    {scannedIngredients && scannedIngredients.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2 max-w-full animate-in zoom-in-95 duration-500">
                        {scannedIngredients.map((ing, i) => (
                          <div
                            key={i}
                            style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.2)', borderColor: 'rgba(var(--primary-rgb), 0.4)' }}
                            className="border backdrop-blur-md px-3 py-1.5 rounded-xl flex flex-col items-center shadow-lg"
                          >
                            <span style={{ color: 'var(--text-main)' }} className="text-[10px] font-black uppercase tracking-tight">{ing.name}</span>
                            {ing.nutrients && (
                              <span className="text-[8px] font-bold text-primary/80 uppercase tracking-tighter">
                                {ing.nutrients.calories} kcal
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {scannedIngredients && scannedIngredients.length === 0 && (
                      <span className="text-red-400 text-[9px] font-black uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full">
                        No se detectaron ingredientes
                      </span>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[18rem] w-full gap-5 text-center">
              {analyzing ? (
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Analizando Red Neuronal...</span>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-primary text-5xl opacity-80 neon-text-glow">frame_inspect</span>
                  <span className="text-primary text-[11px] font-black uppercase tracking-[0.3em] opacity-90">ESPERANDO ENTRADA VISUAL...</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Unified Button - Now full width and primary style */}
        <button
          onClick={handleUploadClick}
          disabled={analyzing}
          className="w-full bg-primary text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(57,255,20,0.4)] uppercase text-sm active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined font-black text-xl">{analyzing ? 'sync' : 'upload'}</span>
          {analyzing ? 'Analizando...' : 'Subir Foto'}
        </button>

        <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.15em] text-center pt-1">
          Escaneo inteligente de red neuronal activado.
        </p>
      </section>

      {/* Suggested Recipes Section */}
      <section style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--card-border)' }} className="border rounded-[2.5rem] p-6 space-y-6 w-full shadow-sm">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl notranslate">auto_awesome</span>
          <h3 style={{ color: 'var(--text-main)' }} className="font-bold uppercase tracking-[0.2em] text-[10px] opacity-80">Recetas sugeridas</h3>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label style={{ color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase tracking-widest block ml-1">
              Entrada manual: <span className="text-[9px] font-medium normal-case opacity-60">(verifica la ortografía)</span>
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary opacity-60">edit_note</span>
              <input
                type="text"
                placeholder="Ej: pollo, arroz, aguacate"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                style={{ backgroundColor: 'var(--bg-surface-inner)', color: 'var(--text-main)', borderColor: 'var(--card-border)' }}
                className="w-full border rounded-2xl py-5 pl-12 pr-4 text-sm placeholder-zinc-500 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            {aiSuggestion && (
              <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <span className="material-symbols-outlined text-primary text-sm animate-pulse">auto_awesome</span>
                <p className="text-[10px] text-primary/80 font-bold italic tracking-tight">{aiSuggestion}</p>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'var(--card-border)' }} className="border rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <span style={{ color: 'var(--text-main)' }} className="font-black text-xs uppercase tracking-widest">Porciones:</span>
            <div style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }} className="flex items-center gap-6 rounded-xl px-4 py-1.5 border">
              <button onClick={() => setPortions(Math.max(1, portions - 1))} className="text-zinc-500 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">remove</span>
              </button>
              <span className="text-primary font-black text-xl w-4 text-center">{portions}</span>
              <button onClick={() => setPortions(portions + 1)} className="text-zinc-500 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">add</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleGenerate}
              disabled={loading || analyzing || (!manualInput.trim())}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 uppercase text-sm active:scale-95 transition-all disabled:opacity-50
                ${manualInput.trim()
                  ? 'bg-primary text-black font-black shadow-[0_0_20px_rgba(57,255,20,0.4)]'
                  : 'bg-transparent border-2 border-primary/50 text-primary font-bold shadow-none'}`}
            >
              <span className="material-symbols-outlined font-bold">{loading ? 'sync' : 'skillet'}</span>
              {loading ? "Generando..." : "Generar Recetas"}
            </button>

            <button
              onClick={resetSystem}
              className="w-full bg-transparent border border-primary/40 text-primary font-bold py-4 rounded-2xl flex items-center justify-center gap-2 uppercase text-[11px] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Reiniciar Sistema
            </button>
          </div>
        </div>
      </section>

      {/* Expiry Challenges Slider */}
      {(() => {
        const expiringItems = inventory
          .filter(item => {
            if (!item.expiryDate) return false;
            const days = getDaysDiff(item.expiryDate);
            return days <= 5; // Incluimos vencidos (negativos) y hasta 5 días por vencer
          })
          .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());

        if (expiringItems.length === 0) return null;

        return (
          <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 style={{ color: 'var(--text-main)' }} className="font-bold uppercase tracking-[0.15em] text-[11px] opacity-80">Retos por Vencer</h3>
              <button
                onClick={() => onNavClick?.('challenges')}
                className="text-primary text-[10px] font-black uppercase tracking-tighter transition-opacity hover:opacity-70"
              >
                Ver más
              </button>
            </div>

            <div
              className={`flex gap-4 overflow-x-auto pb-6 -mx-1 px-1 [&::-webkit-scrollbar]:hidden ${expiringItems.length === 1 ? 'overflow-hidden' : ''}`}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {expiringItems.map((item) => {
                const days = getDaysDiff(item.expiryDate!);
                const urgencyColor = days <= 1 ? 'border-red-500/30' : 'border-primary/20';
                const textColor = days <= 1 ? 'text-red-500' : 'text-primary';
                const isSingle = expiringItems.length === 1;

                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: days <= 1 ? 'rgba(239, 68, 68, 0.4)' : 'var(--card-border)',
                      boxShadow: 'none'
                    }}
                    className={`flex-shrink-0 ${isSingle ? 'w-full' : 'w-[240px]'} rounded-[1.5rem] p-5 border relative overflow-hidden group animate-in fade-in duration-500`}
                  >
                    <div className="flex flex-col h-full justify-between gap-4 relative z-10">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className={`text-[8px] font-black uppercase tracking-widest ${textColor}`}>
                            {days < 0 ? '¡VENCIDO!' : days === 0 ? 'Vence Hoy' : days === 1 ? 'Vence Mañana' : `En ${days} días`}
                          </span>
                          <h4 style={{ color: 'var(--text-main)' }} className="font-black text-sm uppercase italic leading-tight">
                            RESUCITA TU <span className="text-primary">{item.name}</span>
                          </h4>
                        </div>
                        <div style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--glass-border)' }} className="w-8 h-8 rounded-lg border flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-sm">skillet</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => onStartGeneration?.([item.name], 2, item.id)}
                          className="flex-[1.5] bg-primary text-black py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest shadow-strong active:scale-95 transition-all whitespace-nowrap"
                        >
                          ACEPTAR DESAFÍO
                        </button>
                        <button
                          onClick={() => onNavClick?.('inventory')}
                          style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }}
                          className="flex-1 text-zinc-400 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest border active:scale-95 transition-all whitespace-nowrap"
                        >
                          VER DESPENSA
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* Recent AI Recipes */}
      {recentRecipes.length > 0 && (
        <section className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <h3 style={{ color: 'var(--text-main)' }} className="font-bold uppercase tracking-[0.15em] text-[11px] opacity-80">Recetas Recientes</h3>
            <button
              onClick={() => onNavClick?.('results')}
              className="text-primary text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 transition-opacity hover:opacity-70"
            >
              Ver más
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>

          <div
            className="flex gap-4 overflow-x-auto pb-6 -mx-1 px-1 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {recentRecipes.slice(0, 3).map((recipe) => (
              <div
                key={recipe.id}
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--card-border)' }}
                className="flex-shrink-0 w-44 rounded-[2rem] border overflow-hidden group shadow-lg transition-transform active:scale-95 text-left relative"
              >
                {/* Imagen con botón de favorito flotante */}
                <div onClick={() => onRecipeClick(recipe)} className="relative h-32 w-full overflow-hidden cursor-pointer">
                  <img
                    src={getRecipeImage(recipe, 300)}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>

                {/* Botón de favorito flotante */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const isFav = favoriteRecipes.some(r => r.id === recipe.id || (r.title === recipe.title && r.description === recipe.description));
                    if (isFav) {
                      onToggleFavorite?.(recipe);
                    } else {
                      setRecipeToTag(recipe);
                      setShowTagModal(true);
                    }
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90 transition-all z-20"
                >
                  <span className={`material-symbols-outlined text-sm ${favoriteRecipes.some(r => r.id === recipe.id || (r.title === recipe.title && r.description === recipe.description)) ? 'text-red-500 fill-icon' : 'text-zinc-600'}`}>
                    {favoriteRecipes.some(r => r.id === recipe.id || (r.title === recipe.title && r.description === recipe.description)) ? 'favorite' : 'favorite_border'}
                  </span>
                </button>

                {/* Información de la receta */}
                <div onClick={() => onRecipeClick(recipe)} className="p-4 space-y-3 cursor-pointer">
                  <h4
                    style={{
                      color: 'var(--text-main)',
                    }}
                    className="font-bold text-[10px] uppercase tracking-tight line-clamp-2 leading-tight min-h-[2.5em]"
                  >
                    {recipe.title}
                  </h4>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-zinc-400">schedule</span>
                      <span style={{ color: 'var(--text-muted)' }} className="text-[9px] font-bold">{recipe.prepTime || '25 min'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-orange-500">analytics</span>
                      <span style={{ color: 'var(--text-muted)' }} className="text-[9px] font-bold">{recipe.difficulty || 'Fácil'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Favorites */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <h3 style={{ color: 'var(--text-main)' }} className="font-bold uppercase tracking-[0.15em] text-[11px] opacity-80">Recetas Favoritas</h3>
          <button onClick={() => onNavClick?.('favorites')} className="text-primary text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 transition-opacity hover:opacity-70">
            Ver más
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-6 -mx-1 px-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {favoriteRecipes.length > 0 ? favoriteRecipes.slice(0, 4).map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => onRecipeClick(recipe)}
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--card-border)' }}
              className="flex-shrink-0 w-44 rounded-[2rem] border overflow-hidden group shadow-lg transition-transform active:scale-95 text-left"
            >
              <div className="relative h-32 w-full overflow-hidden">
                <img
                  src={getRecipeImage(recipe, 300)}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.(recipe);
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90 transition-all z-20"
                >
                  <span className="material-symbols-outlined text-sm text-red-500 fill-icon">favorite</span>
                </button>
              </div>

              <div className="p-4 space-y-3">
                <h4
                  style={{ color: 'var(--text-main)' }}
                  className="font-bold text-[10px] uppercase tracking-tight line-clamp-2 leading-tight min-h-[2.5em]"
                >
                  {recipe.title}
                </h4>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-zinc-400">schedule</span>
                    <span style={{ color: 'var(--text-muted)' }} className="text-[9px] font-bold">{recipe.prepTime || '25 min'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-orange-500">local_fire_department</span>
                    <span style={{ color: 'var(--text-muted)' }} className="text-[9px] font-bold">320 kcal</span>
                  </div>
                </div>
              </div>
            </button>
          )) : (
            <>
              <DiscoveryCard image="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300" title="Añade tus favoritas" onClick={() => onNavClick?.('favorites')} />
              <DiscoveryCard image="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=300" title="Colección vacía" onClick={() => onNavClick?.('favorites')} />
            </>
          )}
        </div>
      </section>

      {/* Selector de Etiquetas para Favoritos */}
      <SaveFavoriteModal
        isOpen={showTagModal}
        recipe={recipeToTag}
        onClose={() => setShowTagModal(false)}
        onSave={(category) => {
          if (recipeToTag) {
            onToggleFavorite?.(recipeToTag, category);
          }
        }}
        userTags={userTags}
        onCreateTag={onCreateTag}
        onUpdateTag={onUpdateTag}
        onDeleteTag={onDeleteTag}
      />
    </div>
  );
};

const DiscoveryCard = ({ image, title, onClick }: { image: string, title: string, onClick?: () => void }) => (
  <div
    onClick={onClick}
    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--card-border)' }}
    className="flex-shrink-0 w-44 rounded-[2rem] border overflow-hidden group shadow-lg transition-transform active:scale-95 text-left cursor-pointer"
  >
    <div className="relative h-32 w-full overflow-hidden bg-zinc-100">
      <img src={image} className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-60 transition-opacity" />
      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center">
        <span className="material-symbols-outlined text-sm text-zinc-400">favorite_border</span>
      </div>
    </div>
    <div className="p-4 space-y-3">
      <h4 style={{ color: 'var(--text-main)' }} className="font-bold text-[11px] uppercase tracking-tight leading-tight line-clamp-2 min-h-[2rem] opacity-60">
        {title}
      </h4>
      <div className="flex items-center justify-between opacity-30">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          <span className="text-[9px] font-bold">-- min</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
          <span className="text-[9px] font-bold">-- kcal</span>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardView;
