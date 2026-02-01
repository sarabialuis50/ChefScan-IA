
import React, { useState, useRef } from 'react';
import { Recipe, Ingredient } from '../types';
import { analyzeIngredientImage, checkIngredientsConsistency } from '../services/geminiService';
import { resizeAndCompressImage, getRecipeImage } from '../utils/imageUtils';
import { supabase } from '../lib/supabase';
import { getDaysDiff } from '../utils/dateUtils';
import SaveFavoriteModal from '../components/SaveFavoriteModal';
import { useTranslation } from '../utils/i18n';
import { formatPrepTime } from '../utils/recipeUtils';
import { getItemStatus } from '../utils/itemStatus';

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

  userTags?: string[];
  onCreateTag?: (tag: string) => void;
  onUpdateTag?: (oldName: string, newName: string) => void;
  onDeleteTag?: (tag: string) => void;
  recipeGenerationsToday?: number;
  onShowPremiumModal?: () => void;
  language: 'es' | 'en';
  isUpdateAvailable?: boolean;
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
  userTags = [],
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  recipeGenerationsToday = 0,
  onShowPremiumModal,
  language,
  isUpdateAvailable
}) => {
  const t = useTranslation(language);
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
    const dailyLimit = user?.isPremium ? 6 : 2;
    if (recipeGenerationsToday >= dailyLimit) {
      if (onShowPremiumModal) onShowPremiumModal();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Double check limit before processing (extra safety)
    const dailyLimit = user?.isPremium ? 6 : 2;
    if (recipeGenerationsToday >= dailyLimit) {
      if (onShowPremiumModal) onShowPremiumModal();
      return;
    }

    setAnalyzing(true);
    setPreviewImage(URL.createObjectURL(file)); // Set preview immediately
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalBase64 = reader.result as string;
        const optimizedBase64 = await resizeAndCompressImage(originalBase64, 1024, 1024, 0.8);
        const identifiedIngredients = await analyzeIngredientImage(optimizedBase64, language);
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
          className="absolute top-2 left-5 text-primary hover:text-white transition-colors z-[50]"
        >
          <span className="material-symbols-outlined text-sm text-primary">arrow_back</span>
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
            <h2 style={{ color: 'var(--text-main)' }} className="font-bold text-lg leading-none">Chef <span className="text-primary">{user?.username || user?.name || 'Alejandro'}</span></h2>
            <span style={{ color: 'var(--text-muted)' }} className="text-[8.5px] font-bold uppercase tracking-tight leading-none mt-1.5 whitespace-nowrap">¿Qué vas a cocinar hoy?</span>
          </div>
        </div>

        <div className="flex gap-2">

          <button
            onClick={onNotificationsClick}
            style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }}
            className="w-10 h-10 rounded-xl border flex items-center justify-center relative active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-zinc-500 notranslate text-xl">notifications</span>
            {(() => {
              // Check for unread notifications based on localStorage
              try {
                const userId = user?.id;
                const key = userId ? `chefscan_read_notifs_${userId}` : 'chefscan_read_notifs';
                const readNotifs = JSON.parse(localStorage.getItem(key) || '[]');

                // Base notification IDs that exist
                const baseNotifIds = ['1', '4'];

                // '3' only counts if there is an update
                if (isUpdateAvailable) baseNotifIds.push('3');

                // Check if pantry has urgent items (creates 'pantry_summary' notification)
                const hasUrgentPantry = inventory && inventory.some(item => {
                  const days = getDaysDiff(item.expiryDate);
                  return days <= 1;
                });

                if (hasUrgentPantry) baseNotifIds.push('pantry_summary');

                // If any notification ID is NOT in readNotifs, there are unread notifications
                const hasUnread = baseNotifIds.some(id => !readNotifs.includes(id));

                return hasUnread ? (
                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full neon-glow"></span>
                ) : null;
              } catch {
                return null;
              }
            })()}
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
        <h3 style={{ color: 'var(--text-main)' }} className="font-bold text-lg leading-tight mb-2">Generar Recetas</h3>

        {/* Unified Preview Box - RESTORED ORIGINAL LOGIC */}
        <div
          style={{ backgroundColor: 'var(--bg-surface-inner)' }}
          className="w-full min-h-[16rem] border-2 border-dashed border-primary/30 rounded-[1.5rem] relative overflow-hidden transition-all group flex flex-col items-center justify-center text-center"
        >
          {previewImage ? (
            <>
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-cover absolute inset-0 opacity-60 group-hover:opacity-40 transition-opacity"
              />
              {/* Overlay Content Original */}
              <div className="relative z-10 w-full h-full p-6 flex flex-col items-center justify-center">
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm p-4 rounded-2xl">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Analizando...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <span style={{ background: 'var(--bg-surface-inner)', color: 'var(--text-main)' }} className="text-[10px] font-black uppercase tracking-widest drop-shadow-lg animate-in fade-in duration-500 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                      {t('scan_success')}
                    </span>

                    {/* Chips de ingredientes detectados ORIGINAL */}
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
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="relative z-10 flex flex-col items-center gap-1">
              {analyzing ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Analizando Red Neuronal...</span>
                </div>
              ) : (
                <>
                  <div style={{ backgroundColor: 'rgba(57, 255, 20, 0.1)', color: '#39FF14' }} className="w-20 h-20 rounded-full flex items-center justify-center mb-4 border border-[#39FF14]/30 shadow-[0_0_20px_rgba(57,255,20,0.2)]">
                    <span className="material-symbols-outlined text-4xl notranslate" style={{ fontWeight: '300', textShadow: '0 0 10px rgba(57, 255, 20, 0.5)' }}>photo_camera</span>
                  </div>
                  <h4 style={{ color: 'var(--text-main)' }} className="font-bold text-lg mb-0 leading-tight">Vista previa de la foto</h4>
                  <p style={{ color: 'var(--text-muted)' }} className="text-[12px] font-medium leading-tight">Toma una foto o selecciona de tu galería</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons - PILL DESIGN WITH PERMANENT SUBTLE BORDER */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onScanClick}
            disabled={analyzing}
            className="flex items-center justify-center gap-2 py-2 rounded-full border border-primary/40 text-[12px] font-bold bg-[var(--bg-surface-soft)] text-[var(--text-main)] hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 active:scale-95 disabled:opacity-50 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg notranslate">photo_camera</span>
            {t('take_photo')}
          </button>
          <button
            onClick={handleUploadClick}
            disabled={analyzing}
            className="flex items-center justify-center gap-2 py-2 rounded-full border border-primary/40 text-[12px] font-bold bg-[var(--bg-surface-soft)] text-[var(--text-main)] hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 active:scale-95 disabled:opacity-50 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg notranslate">image</span>
            {t('gallery')}
          </button>
        </div>

        {/* Manual Input - PILL DESIGN WITH PERMANENT SUBTLE BORDER */}
        <div className="space-y-2">
          <label style={{ color: 'var(--text-main)' }} className="text-[12px] font-bold block ml-1 uppercase tracking-tight opacity-80">{t("manual_input")}</label>
          <input
            type="text"
            placeholder={t("manual_placeholder")}
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            style={{ backgroundColor: 'var(--bg-surface-inner)', color: 'var(--text-main)' }}
            className="w-full border border-primary/40 rounded-full py-2.5 px-6 text-sm placeholder-zinc-500 focus:border-primary outline-none transition-all"
          />
          <p style={{ color: 'var(--text-muted)' }} className="text-[10px] font-medium ml-1">{t('manual_input_help')}</p>
        </div>

        {/* Portions Selector */}
        <div className="space-y-3">
          <label style={{ color: 'var(--text-main)' }} className="text-xs font-bold block ml-1">{t('portions')}</label>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setPortions(Math.max(1, portions - 1))}
              style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}
              className="w-10 h-10 rounded-xl border flex items-center justify-center hover:border-primary hover:text-primary transition-all active:scale-90"
            >
              <span className="material-symbols-outlined notranslate">remove</span>
            </button>
            <span style={{ color: 'var(--text-main)' }} className="font-black text-xl w-6 text-center">{portions}</span>
            <button
              onClick={() => setPortions(portions + 1)}
              style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}
              className="w-10 h-10 rounded-xl border flex items-center justify-center hover:border-primary hover:text-primary transition-all active:scale-90"
            >
              <span className="material-symbols-outlined notranslate">add</span>
            </button>
          </div>
        </div>

        {/* Generate & Reset Buttons - RESTORED ORIGINAL STYLES */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleGenerate}
            disabled={loading || analyzing || (!manualInput.trim() && scannedIngredients.length === 0)}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 uppercase text-sm active:scale-95 transition-all disabled:opacity-50
              ${manualInput.trim() || scannedIngredients.length > 0
                ? 'bg-primary text-black font-black shadow-[0_0_20px_rgba(57,255,20,0.4)]'
                : 'bg-transparent border-2 border-primary/50 text-primary font-bold shadow-none'}`}
          >
            <span className="material-symbols-outlined notranslate">{loading ? 'sync' : 'auto_awesome'}</span>
            {loading ? t('generating') : t('generate_recipes')}
          </button>

          <button
            onClick={resetSystem}
            className="w-full bg-transparent border border-primary/40 text-primary font-bold py-4 rounded-2xl flex items-center justify-center gap-2 uppercase text-[11px] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm notranslate">refresh</span>
            {t('reset_system')}
          </button>
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
              <h3 style={{ color: 'var(--text-main)' }} className="font-bold uppercase tracking-[0.15em] text-[11px] opacity-80">{t('expiring_challenges')}</h3>
              <button
                onClick={() => onNavClick?.('challenges')}
                className="text-primary text-[10px] font-black uppercase tracking-tighter transition-opacity hover:opacity-70"
              >
                {t('view_more')}
              </button>
            </div>

            <div
              className={`flex gap-4 overflow-x-auto pb-6 -mx-1 px-1 [&::-webkit-scrollbar]:hidden ${expiringItems.length === 1 ? 'overflow-hidden' : ''}`}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {expiringItems.map((item) => {
                const days = getDaysDiff(item.expiryDate!);
                const itemStatus = getItemStatus(item.expiryDate);
                const isSingle = expiringItems.length === 1;

                const borderColor = itemStatus ? itemStatus.borderColorStyle : 'var(--card-border)';
                const effectClass = itemStatus ? itemStatus.effectClasses : '';
                const textColor = itemStatus ? itemStatus.textColorClass : 'text-primary';
                const shadowClass = itemStatus?.shadowClass || '';

                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: borderColor,
                      boxShadow: 'none'
                    }}
                    className={`flex-shrink-0 ${isSingle ? 'w-full' : 'w-[240px]'} rounded-[1.5rem] p-5 border relative overflow-hidden group animate-in fade-in duration-500 ${effectClass} ${shadowClass}`}
                  >
                    <div className="flex flex-col h-full justify-between gap-4 relative z-10">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className={`text-[8px] font-black uppercase tracking-widest ${textColor}`}>
                            {itemStatus ? t(itemStatus.statusKey as any) : ''}
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
                          {t('accept_challenge')}
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
                      <span style={{ color: 'var(--text-muted)' }} className="text-[9px] font-bold">{formatPrepTime(recipe.prepTime)}</span>
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
            <div
              key={recipe.id}
              onClick={() => onRecipeClick(recipe)}
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--card-border)' }}
              className="flex-shrink-0 w-44 rounded-[2rem] border overflow-hidden group shadow-lg transition-transform active:scale-95 text-left cursor-pointer"
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
                    <span style={{ color: 'var(--text-muted)' }} className="text-[9px] font-bold">{formatPrepTime(recipe.prepTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-orange-500">local_fire_department</span>
                    <span style={{ color: 'var(--text-muted)' }} className="text-[9px] font-bold">320 kcal</span>
                  </div>
                </div>
              </div>
            </div>
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
