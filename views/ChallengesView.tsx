
import React, { useState } from 'react';
import { InventoryItem } from '../types';

interface ChallengesViewProps {
    onBack: () => void;
    onAcceptChallenge: (item: InventoryItem) => void;
    onViewInventory?: () => void;
    inventory: InventoryItem[];
}

const ChallengesView: React.FC<ChallengesViewProps> = ({ onBack, onAcceptChallenge, onViewInventory, inventory }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const expiringItems = inventory
        .filter(item => {
            if (!item.expiryDate) return false;
            const days = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return days >= 0 && days <= 7; // Buscamos productos que vencen en la próxima semana
        })
        .sort((a, b) => {
            const daysA = new Date(a.expiryDate!).getTime();
            const daysB = new Date(b.expiryDate!).getTime();
            return daysA - daysB;
        })
        .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="min-h-screen bg-pure-black pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <span className="material-symbols-outlined text-white">arrow_back</span>
                    </button>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white">RETOS<span className="text-primary">.IA</span></h2>
                </div>
                <div className="px-4 py-1.5 bg-primary/20 rounded-full border border-primary/30">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{expiringItems.length} RETOS</span>
                </div>
            </header>

            <main className="p-6 space-y-6">
                {/* Search Bar */}
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary opacity-60">search</span>
                    <input
                        type="text"
                        placeholder="Buscar entre tus retos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black border border-primary/40 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-zinc-700 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>

                {/* List of Challenges */}
                <div className="space-y-4">
                    {expiringItems.length > 0 ? (
                        expiringItems.map((item) => {
                            const days = Math.ceil((new Date(item.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            const urgencyColor = days <= 1 ? 'text-red-500' : days <= 3 ? 'text-orange-500' : 'text-primary';

                            return (
                                <div key={item.id} className="glass-card rounded-[2rem] p-6 border-white/5 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>

                                    <div className="flex flex-col gap-4 relative z-10">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`material-symbols-outlined text-sm ${urgencyColor}`}>alarm</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${urgencyColor}`}>
                                                        {days === 0 ? 'Vence Hoy' : days === 1 ? 'Vence Mañana' : `Vence en ${days} días`}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">
                                                    RESUCITA TU <span className="text-primary">{item.name}</span>
                                                </h3>
                                            </div>
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-primary">skillet</span>
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-zinc-400 font-medium leading-relaxed max-w-[80%]">
                                            Evita el desperdicio. Crea una receta increíble con este ingrediente antes de que caduque.
                                        </p>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => onAcceptChallenge(item)}
                                                className="flex-[1.5] bg-primary text-black py-2 rounded-xl text-[8px] font-bold uppercase tracking-widest shadow-strong active:scale-95 transition-all whitespace-nowrap"
                                            >
                                                ACEPTAR DESAFÍO
                                            </button>
                                            <button
                                                onClick={onViewInventory}
                                                className="flex-1 bg-zinc-900 text-zinc-400 py-2 rounded-xl text-[8px] font-bold uppercase tracking-widest border border-white/5 active:scale-95 transition-all whitespace-nowrap"
                                            >
                                                VER DESPENSA
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
                            <span className="material-symbols-outlined text-6xl">inventory</span>
                            <p className="text-xs font-bold uppercase tracking-widest">No tienes retos pendientes por ahora</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ChallengesView;
