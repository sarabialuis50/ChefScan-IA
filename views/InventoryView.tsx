
import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types';

interface InventoryViewProps {
    inventory: InventoryItem[];
    onAddItem: (name: string, quantity: number, unit: string, expiryDate?: string) => void;
    onDeleteItem: (id: string) => void;
    onUpdateItem: (id: string, updates: Partial<InventoryItem>) => void;
    onStartGeneration: (ingredients: string[], portions: number, itemId?: string) => void;
    acceptedChallengeId?: string | null;
    onBack: () => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({
    inventory,
    onAddItem,
    onDeleteItem,
    onUpdateItem,
    onStartGeneration,
    acceptedChallengeId,
    onBack
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: 'unidades', expiryDate: '' });
    const [searchTerm, setSearchTerm] = useState('');

    const filteredInventory = useMemo(() => {
        return inventory.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => {
            if (!a.expiryDate) return 1;
            if (!b.expiryDate) return -1;
            return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        });
    }, [inventory, searchTerm]);

    const getStatusColor = (expiryDate?: string) => {
        if (!expiryDate) return 'text-zinc-500';
        const daysLeft = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return 'text-red-500';
        if (daysLeft <= 3) return 'text-orange-500';
        return 'text-primary';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItem.name) {
            onAddItem(newItem.name, newItem.quantity, newItem.unit, newItem.expiryDate || undefined);
            setNewItem({ name: '', quantity: 1, unit: 'unidades', expiryDate: '' });
            setIsAdding(false);
        }
    };

    return (
        <div className="min-h-screen bg-pure-black pb-20 p-6">
            <header className="flex flex-col gap-6 mt-6 mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white">arrow_back</span>
                        </button>
                        <div>
                            <h2 className="text-2xl font-black tracking-tighter uppercase text-white">DESPENSA<span className="text-primary">.IA</span></h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Gestión Inteligente</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-11 h-11 bg-primary text-black rounded-xl flex items-center justify-center shadow-glow active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined font-black">add</span>
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-2xl">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Total Items</p>
                        <p className="text-2xl font-black text-white">{inventory.length}</p>
                    </div>
                    <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-2xl">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Por Caducar</p>
                        <p className="text-2xl font-black text-orange-500">
                            {inventory.filter(item => {
                                if (!item.expiryDate) return false;
                                const days = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                return days >= 0 && days <= 3;
                            }).length}
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-zinc-500">search</span>
                    <input
                        type="text"
                        placeholder="Buscar en tu despensa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-zinc-700 focus:border-primary/40 outline-none transition-all"
                    />
                </div>
            </header>

            {/* Inventory List */}
            <div className="space-y-3">
                {filteredInventory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-white/5 opacity-40">
                            <span className="material-symbols-outlined text-3xl">inventory_2</span>
                        </div>
                        <p className="text-zinc-500 text-sm">Tu inventario está vacío.</p>
                    </div>
                ) : (
                    filteredInventory.map(item => {
                        const daysLeft = item.expiryDate
                            ? Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                            : null;
                        const isExpired = daysLeft !== null && daysLeft < 0;
                        const isNearExpiry = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

                        return (
                            <div key={item.id} className={`group relative flex items-center gap-4 glass-card p-4 rounded-3xl transition-all duration-500 ${isExpired
                                ? 'border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5),inset_0_0_10px_rgba(220,38,38,0.2)] animate-pulse'
                                : 'border-white/5 hover:border-primary/20 shadow-none'
                                }`}>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-white text-sm font-bold truncate uppercase tracking-tight">{item.name}</h4>
                                            {isExpired ? (
                                                <span className="px-2 py-0.5 bg-red-500 text-white text-[7px] font-black uppercase rounded tracking-widest">Producto Vencido</span>
                                            ) : (isNearExpiry && item.id === acceptedChallengeId) ? (
                                                <button
                                                    onClick={() => onStartGeneration([item.name], 2, item.id)}
                                                    className="px-2 py-0.5 bg-primary/20 border border-primary/40 text-primary text-[7px] font-black uppercase rounded tracking-widest hover:bg-primary hover:text-black transition-colors"
                                                >
                                                    Re-generar Reto
                                                </button>
                                            ) : null}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-tighter ${getStatusColor(item.expiryDate)}`}>
                                            {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'Sin fecha'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{item.quantity} {item.unit}</span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                                        <span className="text-[10px] text-zinc-600 font-medium">Añadido {new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/5 transition-opacity">
                                        <button
                                            onClick={() => onUpdateItem(item.id, { quantity: Math.max(0, item.quantity - 1) })}
                                            className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">remove</span>
                                        </button>
                                        <button
                                            onClick={() => onUpdateItem(item.id, { quantity: item.quantity + 1 })}
                                            className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-primary"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">add</span>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => onDeleteItem(item.id)}
                                        className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center active:scale-90 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Item Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-pure-black/90 backdrop-blur-md">
                    <form onSubmit={handleSubmit} className="w-full max-w-sm max-h-[90vh] glass-card rounded-3xl p-8 border-primary/30 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6 flex-shrink-0">
                            <h3 className="text-xl font-black uppercase tracking-tighter">NUEVO ITEM</h3>
                            <button type="button" onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1 -mr-1">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Ingrediente</label>
                                    <input
                                        autoFocus
                                        required
                                        type="text"
                                        value={newItem.name}
                                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-sm focus:border-primary outline-none"
                                        placeholder="Ej: Leche desnatada"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Cant.</label>
                                        <input
                                            type="number"
                                            value={newItem.quantity}
                                            onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                                            className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-sm focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Unidad</label>
                                        <select
                                            value={newItem.unit}
                                            onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                                            className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-sm focus:border-primary outline-none"
                                        >
                                            <option value="unidades">uds (unidades)</option>
                                            <option value="kg">kg (kilogramo)</option>
                                            <option value="mg">mg (miligramo)</option>
                                            <option value="lb">lb (libra)</option>
                                            <option value="oz">oz (onza)</option>
                                            <option value="ml">ml (mililitro)</option>
                                            <option value="L">L (litro)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Caducidad (Opcional)</label>
                                    <input
                                        type="date"
                                        value={newItem.expiryDate}
                                        onChange={e => setNewItem({ ...newItem, expiryDate: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-sm focus:border-primary outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-primary text-black rounded-xl font-bold uppercase text-xs tracking-widest shadow-glow mt-4"
                            >
                                Añadir a Despensa
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default InventoryView;
