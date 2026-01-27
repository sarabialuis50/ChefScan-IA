
import React, { useState, useRef } from 'react';
import { Recipe, Ingredient } from '../types';
import { analyzeIngredientImage, checkIngredientsConsistency } from '../services/geminiService';
import { resizeAndCompressImage } from '../utils/imageUtils';
import { supabase } from '../lib/supabase';

interface DashboardViewProps {
  user: any;
  recentRecipes: Recipe[];
  scannedIngredients?: Ingredient[];
  onClearScanned?: () => void;
  onScanClick: () => void;
  onRecipeClick: (recipe: Recipe) => void;
  onGenerate: (recipes: Recipe[]) => void;
  onStartGeneration: (ingredients: string[], portions: number, itemId?: string) => void;
  onExploreClick: () => void;
  onNotificationsClick: () => void;
  onSettingsClick?: () => void;
  onNavClick?: (view: any) => void;
  onComplete?: (ingredients: Ingredient[]) => void;
  onAddItem?: (name: string, quantity: number, unit: string, expiryDate?: string) => void;
  inventory?: any[];
  acceptedChallengeId?: string | null;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  recentRecipes,
  scannedIngredients = [],
  onClearScanned,
  onScanClick,
  onRecipeClick,
  onGenerate,
  onStartGeneration,
  onExploreClick,
  onNotificationsClick,
  onSettingsClick,
  onNavClick,
  onComplete,
  onAddItem,
  inventory = [],
  acceptedChallengeId
}) => {
  const [manualInput, setManualInput] = useState('');
  const [portions, setPortions] = useState(2);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [savedItems, setSavedItems] = useState<Set<number>>(new Set());
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (scannedIngredients.length > 0) {
      // Evitar duplicados y comas extra
      const currentItems = manualInput.split(',')
        .map(i => i.trim())
        .filter(Boolean);

      const newItems = scannedIngredients.map(i => i.name);

      // Combinar sin repetir y limpiar comas
      const combined = Array.from(new Set([...currentItems, ...newItems]));
      setManualInput(combined.join(', '));
    }
  }, [scannedIngredients]);

  // ... (useEffect for timer remains same)

  const handleGenerate = () => {
    if (!manualInput.trim()) return;
    onStartGeneration(manualInput.split(',').map(i => i.trim()), portions);
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
          if (user?.id) {
            try {
              const fileExt = file.name.split('.').pop();
              const fileName = `${user.id}/scan_${Date.now()}.${fileExt}`;

              // Convertir base64 optimizado a blob para la subida
              const byteCharacters = atob(optimizedBase64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'image/jpeg' });

              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars') // Usamos 'avatars' por ahora ya que sabemos que existe, o informamos de crear 'scans'
                .upload(`scans/${fileName}`, blob);

              if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                  .from('avatars')
                  .getPublicUrl(`scans/${fileName}`);

                await supabase.from('ingredient_scans').insert({
                  user_id: user.id,
                  image_url: publicUrl,
                  ingredients: identifiedIngredients
                });
              }
            } catch (storageErr) {
              console.error("Error saving scan to storage:", storageErr);
            }
          }

          const names = identifiedIngredients.map(i => i.name).join(', ');
          setManualInput(prev => prev ? `${prev}, ${names}` : names);
          if (onComplete) onComplete(identifiedIngredients);
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
    <div className="flex flex-col bg-pure-black min-h-full p-5 space-y-8 pb-10 relative">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <header className="flex justify-between items-center w-full">
        <div className="absolute top-4 left-4">
          <button
            onClick={() => onNavClick && onNavClick('landing')}
            className="flex items-center justify-center p-2 text-zinc-700 hover:text-zinc-500 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back_ios</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-black border-2 border-primary rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(57,255,20,0.4)] overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <img src="/logo.png" alt="ChefScan Logo" className="w-8 h-8 object-contain" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">Bienvenido</span>
            <h2 className="text-white font-bold text-lg leading-none">Chef <span className="text-primary">{user?.name || 'Alejandro'}</span></h2>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none mt-1.5">¿Qué vas a cocinar hoy?</span>
          </div>
        </div>
        <div className="flex items-center gap-2">

          <button
            onClick={onNotificationsClick}
            className="w-11 h-11 bg-zinc-900/50 rounded-xl border border-white/5 flex items-center justify-center relative active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-zinc-400">notifications</span>
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full neon-glow"></span>
          </button>
          <button
            onClick={onSettingsClick}
            className="w-11 h-11 bg-zinc-900/50 rounded-xl border border-white/5 flex items-center justify-center active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-zinc-400">settings</span>
          </button>
        </div>
      </header>

      {/* Hero Branding */}
      <div className="space-y-1">
        <h1 className="text-5xl font-black tracking-tighter text-white leading-none">
          Chef<span className="text-primary">Scan.IA</span>
        </h1>
        <p className="text-primary font-medium text-xs">Transforma tus ingredientes en obras maestras.</p>
      </div>

      {/* Ingredient Image Section */}
      <section className="bg-[#0A0A0A] border border-zinc-800 rounded-[2rem] p-6 space-y-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">photo_camera</span>
          <h3 className="text-white font-bold uppercase tracking-wider text-sm">Imagen de ingredientes</h3>
        </div>

        {/* Preview Box - Image Preview + Results */}
        <div className="w-full min-h-[18rem] bg-black/40 border-2 border-dashed border-primary/30 rounded-[1.5rem] relative overflow-hidden transition-all group">
          {previewImage ? (
            <>
              <img
                src={previewImage}
                alt="Uploaded Ingredients"
                className="w-full h-full object-cover absolute inset-0 opacity-60 group-hover:opacity-40 transition-opacity"
              />

              {/* Overlay Content */}
              <div className="relative z-10 w-full h-full p-4 flex flex-col items-center justify-center">
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm p-4 rounded-2xl">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Analizando...</span>
                  </div>
                ) : (
                  <span className="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-lg animate-in fade-in duration-500">
                    Captura Exitosa
                  </span>
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
      <section className="bg-[#0A0A0A] border border-zinc-800 rounded-[2rem] p-6 space-y-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
          <h3 className="text-white font-bold uppercase tracking-wider text-sm">Recetas sugeridas</h3>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block ml-1">Entrada manual:</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary opacity-60">edit_note</span>
              <input
                type="text"
                placeholder="Ej: pollo, arroz, verduras"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full bg-black border border-primary/40 rounded-2xl py-5 pl-12 pr-4 text-sm text-white placeholder-zinc-700 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            {aiSuggestion && (
              <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <span className="material-symbols-outlined text-primary text-sm animate-pulse">auto_awesome</span>
                <p className="text-[10px] text-primary/80 font-bold italic tracking-tight">{aiSuggestion}</p>
              </div>
            )}
          </div>

          <div className="bg-black border border-primary/40 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-white font-black text-xs uppercase tracking-widest">Porciones:</span>
            <div className="flex items-center gap-6 bg-zinc-900/50 rounded-xl px-4 py-1.5 border border-white/5">
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
              className="w-full bg-primary text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(57,255,20,0.4)] uppercase text-sm active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined font-bold">{loading ? 'sync' : 'skillet'}</span>
              {loading ? "Generando..." : "Generar Recetas"}
            </button>

            <button
              onClick={resetSystem}
              className="w-full bg-transparent border-2 border-zinc-800 text-zinc-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 uppercase text-[11px] active:scale-95 transition-all"
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
            const days = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return days >= 0 && days <= 5;
          })
          .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());

        if (expiringItems.length === 0) return null;

        return (
          <section className="space-y-4 pt-2">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-white font-bold uppercase tracking-[0.15em] text-[11px]">Retos por Vencer</h3>
              <button
                onClick={() => onNavClick?.('challenges')}
                className="text-primary text-[10px] font-black uppercase tracking-tighter hover:underline"
              >
                Ver más
              </button>
            </div>

            <div className={`flex gap-4 overflow-x-auto custom-scrollbar pb-4 -mx-1 px-1 ${expiringItems.length === 1 ? 'overflow-hidden' : ''}`}>
              {expiringItems.map((item) => {
                const days = Math.ceil((new Date(item.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const urgencyColor = days <= 1 ? 'border-red-500/30' : 'border-primary/20';
                const textColor = days <= 1 ? 'text-red-500' : 'text-primary';
                const isSingle = expiringItems.length === 1;

                return (
                  <div
                    key={item.id}
                    className={`flex-shrink-0 ${isSingle ? 'w-full' : 'w-[240px]'} glass-card rounded-[1.5rem] p-5 border ${urgencyColor} relative overflow-hidden group animate-in fade-in duration-500`}
                  >
                    <div className="flex flex-col h-full justify-between gap-4 relative z-10">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className={`text-[8px] font-black uppercase tracking-widest ${textColor}`}>
                            {days === 0 ? 'Vence Hoy' : days === 1 ? 'Vence Mañana' : `En ${days} días`}
                          </span>
                          <h4 className="text-white font-black text-sm uppercase italic leading-tight">
                            RESUCITA TU <span className="text-primary">{item.name}</span>
                          </h4>
                        </div>
                        <div className="w-8 h-8 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
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
                          className="flex-1 bg-zinc-900 text-zinc-400 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest border border-white/5 active:scale-95 transition-all whitespace-nowrap"
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

      {/* Recent Discoveries */}
      <section className="space-y-4 pt-2 pb-6">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-white font-bold uppercase tracking-[0.15em] text-[11px]">Recetas Favoritas</h3>
          <button onClick={() => onNavClick?.('favorites')} className="text-primary text-[10px] font-black uppercase tracking-tighter hover:underline">Ver más</button>
        </div>

        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4">
          {recentRecipes.length > 0 ? recentRecipes.slice(0, 4).map((recipe, idx) => (
            <button
              key={recipe.id}
              onClick={() => {
                // Lógica Premium de Prueba: Mostramos modal si es free pero permitimos ver la receta
                if (!user?.isPremium) {
                  // Simulamos la llamada al modal de App.tsx (usando un alert por ahora o asumiendo que el onRecipeClick manejará la navegación)
                  console.log("Mostrando aviso Premium de prueba...");
                }
                onRecipeClick(recipe);
              }}
              className="flex-shrink-0 w-40 space-y-3 group"
            >
              <div className="w-40 h-40 rounded-[2rem] overflow-hidden border border-zinc-800 bg-zinc-900">
                <img
                  src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/300/300?grayscale`}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                />
              </div>
              <p className="text-primary font-black text-[10px] uppercase tracking-widest text-center truncate px-2 group-hover:neon-text-glow">
                {recipe.title}
              </p>
            </button>
          )) : (
            <>
              <DiscoveryCard image="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300" title="Añade tus favoritas" onClick={() => onNavClick?.('favorites')} />
              <DiscoveryCard image="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=300" title="Colección vacía" onClick={() => onNavClick?.('favorites')} />
            </>
          )}
        </div>
      </section>
    </div>
  );
};

const DiscoveryCard = ({ image, title, onClick }: { image: string, title: string, onClick?: () => void }) => (
  <div className="flex-shrink-0 w-40 space-y-3 cursor-pointer" onClick={onClick}>
    <div className="w-40 h-40 rounded-[2rem] overflow-hidden border border-zinc-800 bg-zinc-900 shadow-xl">
      <img src={image} className="w-full h-full object-cover grayscale opacity-60" />
    </div>
    <p className="text-primary font-black text-[10px] uppercase tracking-widest text-center truncate px-2 leading-tight">{title}</p>
  </div>
);

export default DashboardView;
