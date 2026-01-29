
import React, { useState } from 'react';
import { Recipe } from '../types';

interface SaveFavoriteModalProps {
    recipe: Recipe | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: string) => void;
    userTags: string[];
    onCreateTag?: (tag: string) => void;
    onUpdateTag?: (oldName: string, newName: string) => void;
    onDeleteTag?: (tag: string) => void;
}

const SaveFavoriteModal: React.FC<SaveFavoriteModalProps> = ({
    recipe,
    isOpen,
    onClose,
    onSave,
    userTags = [],
    onCreateTag,
    onUpdateTag,
    onDeleteTag
}) => {
    const [isAddingNewTag, setIsAddingNewTag] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [editingTag, setEditingTag] = useState<{ oldName: string, newName: string } | null>(null);
    const [tagMenuOpen, setTagMenuOpen] = useState<string | null>(null);

    if (!isOpen || !recipe) return null;

    const defaultCategories = ['Desayuno', 'Almuerzo', 'Cena', 'Saludable', 'Vegana'];
    const allCategories = [...new Set([...defaultCategories, ...userTags])];

    const handleCreateTag = () => {
        if (newTagName.trim() && onCreateTag) {
            onCreateTag(newTagName.trim());
            onSave(newTagName.trim());
            setNewTagName('');
            setIsAddingNewTag(false);
            onClose();
        }
    };

    const handleUpdateTagClick = (e: React.MouseEvent, oldName: string) => {
        e.stopPropagation();
        setEditingTag({ oldName, newName: oldName });
        setTagMenuOpen(null);
    };

    const handleDeleteTagClick = (e: React.MouseEvent, tag: string) => {
        e.stopPropagation();
        if (confirm(`¿Estás seguro de que quieres eliminar la etiqueta "${tag}"?`)) {
            if (onDeleteTag) onDeleteTag(tag);
            setTagMenuOpen(null);
        }
    };

    const submitUpdateTag = () => {
        if (editingTag && editingTag.newName.trim() && onUpdateTag) {
            onUpdateTag(editingTag.oldName, editingTag.newName.trim());
            setEditingTag(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-300">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => {
                    onClose();
                    setIsAddingNewTag(false);
                    setEditingTag(null);
                }}
            />
            <div
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--card-border)' }}
                className="w-full max-w-[430px] rounded-t-[3rem] p-8 border-t relative z-10 animate-in slide-in-from-bottom duration-500 overflow-y-auto max-h-[85vh] shadow-[0_-10px_40px_rgba(0,0,0,0.4)]"
            >
                <div className="w-12 h-1.5 bg-zinc-800/50 rounded-full mx-auto mb-8" />

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                        <span className="material-symbols-outlined text-2xl font-black">bookmark_add</span>
                    </div>
                    <div>
                        <h3 style={{ color: 'var(--text-main)' }} className="text-xl font-black uppercase tracking-tight">Guardar en...</h3>
                        <p style={{ color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase tracking-[0.2em]">Elige una categoría para tu receta</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                    {allCategories.map((cat) => {
                        const isUserTag = userTags.includes(cat);
                        return (
                            <div key={cat} className="relative group">
                                <button
                                    onClick={() => {
                                        onSave(cat);
                                        onClose();
                                    }}
                                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--card-border)' }}
                                    className="w-full py-5 px-4 rounded-2xl border text-xs font-black uppercase tracking-widest text-zinc-400 hover:border-primary hover:text-primary transition-all active:scale-95 flex items-center justify-between shadow-sm relative overflow-hidden"
                                >
                                    <span className="relative z-10">{cat}</span>
                                    {isUserTag && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTagMenuOpen(tagMenuOpen === cat ? null : cat);
                                            }}
                                            className="w-6 h-6 rounded-lg bg-zinc-800/30 flex items-center justify-center hover:bg-zinc-800 transition-colors relative z-20"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">more_vert</span>
                                        </button>
                                    )}
                                </button>

                                {tagMenuOpen === cat && (
                                    <div
                                        style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }}
                                        className="absolute bottom-full right-0 mb-2 w-40 rounded-2xl border shadow-2xl z-30 overflow-hidden py-1 animate-in zoom-in-95 duration-200"
                                    >
                                        <button
                                            onClick={(e) => handleUpdateTagClick(e, cat)}
                                            className="w-full py-3 px-4 text-[10px] font-bold text-left hover:bg-primary/10 text-zinc-400 hover:text-primary flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                            RENOMBRAR
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteTagClick(e, cat)}
                                            className="w-full py-3 px-4 text-[10px] font-bold text-left hover:bg-red-500/10 text-red-500 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                            ELIMINAR
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <button
                        onClick={() => setIsAddingNewTag(true)}
                        className="py-5 px-4 bg-primary/10 border border-primary/30 rounded-2xl text-xs font-black uppercase tracking-widest text-primary flex items-center justify-center gap-2 hover:bg-primary/20 transition-all active:scale-95 shadow-glow-subtle"
                    >
                        <span className="material-symbols-outlined text-sm font-black">add</span>
                        Nueva
                    </button>
                </div>

                {editingTag && (
                    <div style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--primary)/40' }} className="space-y-4 animate-in slide-in-from-top-4 duration-300 p-6 rounded-3xl border mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <p style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-widest">Renombrar Etiqueta</p>
                            <button onClick={() => setEditingTag(null)} className="material-symbols-outlined text-zinc-600">close</button>
                        </div>
                        <input
                            autoFocus
                            type="text"
                            value={editingTag.newName}
                            onChange={(e) => setEditingTag({ ...editingTag, newName: e.target.value })}
                            style={{ backgroundColor: 'var(--bg-surface-inner)', color: 'var(--text-main)', borderColor: 'var(--card-border)' }}
                            className="w-full border rounded-xl px-4 py-4 text-sm focus:border-primary outline-none"
                            onKeyDown={(e) => { if (e.key === 'Enter') submitUpdateTag(); }}
                        />
                        <button
                            onClick={submitUpdateTag}
                            className="w-full py-4 bg-primary text-black font-black rounded-xl uppercase text-[10px] tracking-widest shadow-glow"
                        >
                            Confirmar Cambio
                        </button>
                    </div>
                )}

                {isAddingNewTag && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300 mb-6">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Nombre de la etiqueta..."
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            style={{ backgroundColor: 'var(--bg-surface-inner)', color: 'var(--text-main)', borderColor: 'var(--card-border)' }}
                            className="w-full border rounded-xl px-4 py-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTag(); }}
                        />
                        <button
                            onClick={handleCreateTag}
                            className="w-full py-4 bg-primary text-black font-black rounded-xl uppercase text-[10px] tracking-widest shadow-glow"
                        >
                            Crear y Guardar
                        </button>
                    </div>
                )}

                <button
                    onClick={() => {
                        onClose();
                        setIsAddingNewTag(false);
                    }}
                    className="w-full py-4 text-zinc-600 font-bold uppercase text-[9px] tracking-[0.3em]"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};

export default SaveFavoriteModal;
