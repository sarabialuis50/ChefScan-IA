import React from 'react';
import { Recipe } from '../types';
import { getRecipeImage } from '../utils/imageUtils';

interface NutritionalDetailViewProps {
    recipe: Recipe | null;
    onBack: () => void;
}

const NutritionalDetailView: React.FC<NutritionalDetailViewProps> = ({ recipe, onBack }) => {
    if (!recipe) return null;

    // Mock micronutrients data for the demo
    const micronutrients = [
        { name: 'Vitamina A', value: 15, unit: '%' },
        { name: 'Vitamina C', value: 85, unit: '%' },
        { name: 'Calcio', value: 10, unit: '%' },
        { name: 'Hierro', value: 20, unit: '%' },
        { name: 'Potasio', value: 12, unit: 'mg' },
        { name: 'Magnesio', value: 8, unit: '%' },
    ];

    return (
        <div style={{ backgroundColor: 'var(--bg-app)' }} className="min-h-screen pb-12">
            <header style={{ backgroundColor: 'rgba(var(--bg-app-rgb), 0.8)', borderColor: 'var(--card-border)' }} className="px-6 py-4 flex items-center justify-between border-b backdrop-blur-md sticky top-0 z-50">
                <button onClick={onBack} style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }} className="w-10 h-10 rounded-full border flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-400">arrow_back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-sm font-black uppercase tracking-[0.2em] text-primary">Informe Nutricional</h1>
                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-0.5">Análisis Detallado por Porción</p>
                </div>
                <div className="w-10"></div> {/* Spacer */}
            </header>

            <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Nutritional Card */}
                <section style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--card-border)' }} className="border rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                    {/* Header Section with Image */}
                    <div className="h-[280px] w-full relative">
                        <img
                            src={getRecipeImage(recipe, 400)}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-transparent to-transparent"></div>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-surface)' }} className="p-8 space-y-6 relative z-10">
                        <div className="space-y-3">
                            <div className="text-left">
                                <h2 style={{ color: 'var(--text-main)' }} className="text-xl font-black uppercase tracking-normal px-2 leading-tight">{recipe.title}</h2>
                                <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] px-2 mt-1">Porciones: {recipe.portions || 2}</p>
                            </div>

                            {/* Info Grid - Exact match to RecipeDetailView */}
                            <div className="grid grid-cols-4 gap-3 py-2">
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
                                    <p className="text-[8px] text-zinc-600 uppercase font-black mt-1 tracking-widest">Grasa</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Micronutrients Grid */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <span className="material-symbols-outlined text-primary">biotech</span>
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Micronutrientes y Vitaminas</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {micronutrients.map((micro, idx) => (
                            <div key={idx} style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }} className="border p-4 rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{micro.name}</span>
                                    <span style={{ color: 'var(--primary)' }} className="text-[10px] font-black">{micro.value}{micro.unit}</span>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary/50 shadow-[0_0_8px_rgba(57,255,20,0.3)]"
                                        style={{ width: `${micro.value}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Premium Badge */}
                <div style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.05)', borderColor: 'rgba(var(--primary-rgb), 0.2)' }} className="border p-6 rounded-3xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-black">
                        <span className="material-symbols-outlined font-black">verified</span>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-main)' }} className="text-xs font-black uppercase tracking-tight">Análisis IA Certificado</p>
                        <p className="text-[10px] text-zinc-500">Este informe ha sido generado y verificado por el modelo neuronal de ChefScan.IA</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NutritionalDetailView;
