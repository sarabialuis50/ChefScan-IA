
import React from 'react';
import { Recipe } from '../types';

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
        <div className="min-h-screen bg-pure-black pb-12">
            <header className="p-6 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-sm font-black uppercase tracking-[0.2em] text-primary">Informe Nutricional</h1>
                <div className="w-10"></div> {/* Spacer */}
            </header>

            <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">{recipe.title}</h2>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Análisis Detallado por Porción</p>
                </div>

                {/* Macro Chart (CSS Bars) */}
                <section className="bg-surface-dark border border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
                    <div className="flex justify-around items-end h-40 gap-4">
                        <MacroBar label="Carbs" value={55} color="#39FF14" amount={`${recipe.carbs}g`} />
                        <MacroBar label="Proteína" value={25} color="#00E5FF" amount={`${recipe.protein}g`} />
                        <MacroBar label="Grasas" value={20} color="#FF00E5" amount={`${recipe.fat}g`} />
                    </div>

                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Calorías Totales</p>
                            <p className="text-3xl font-black text-white">{recipe.calories} <span className="text-primary text-sm uppercase">Kcal</span></p>
                        </div>
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                            <span className="material-symbols-outlined text-primary">bolt</span>
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
                            <div key={idx} className="bg-zinc-900/40 border border-white/5 p-4 rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{micro.name}</span>
                                    <span className="text-[10px] font-black text-primary">{micro.value}{micro.unit}</span>
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
                <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-black">
                        <span className="material-symbols-outlined font-black">verified</span>
                    </div>
                    <div>
                        <p className="text-xs font-black text-white uppercase tracking-tight">Análisis IA Certificado</p>
                        <p className="text-[10px] text-zinc-500">Este informe ha sido generado y verificado por el modelo neuronal de ChefScan.IA</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MacroBar = ({ label, value, color, amount }: { label: string, value: number, color: string, amount: string }) => (
    <div className="flex-1 flex flex-col items-center gap-3">
        <div className="w-full relative flex flex-col items-center group">
            <div
                className="w-full rounded-t-xl transition-all duration-1000 ease-out"
                style={{ height: `${value}%`, backgroundColor: color, opacity: 0.8, boxShadow: `0 0 20px ${color}33` }}
            ></div>
            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 px-2 py-1 rounded text-[10px] font-bold text-white whitespace-nowrap z-10">
                {value}% del plato
            </div>
        </div>
        <div className="text-center">
            <p className="text-[10px] font-black text-white uppercase tracking-tighter">{amount}</p>
            <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{label}</p>
        </div>
    </div>
);

export default NutritionalDetailView;
