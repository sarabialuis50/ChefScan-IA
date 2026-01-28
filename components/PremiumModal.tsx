import React from 'react';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason: 'recipes' | 'nutrition' | 'chefbot' | 'more-recipes' | 'community-post' | 'community-save' | 'community-comment' | 'upgrade';
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, reason }) => {
    if (!isOpen) return null;

    const getReasonText = () => {
        switch (reason) {
            case 'recipes':
                return 'Has alcanzado el límite diario de 2 consultas (10 recetas) gratuitas.';
            case 'nutrition':
                return 'El análisis nutricional detallado es una función exclusiva para usuarios Premium.';
            case 'chefbot':
                return 'Has agotado tus consultas gratuitas con el Agente Chef IA.';
            case 'more-recipes':
                return 'Los usuarios Free ven 5 recetas. ¡Premium ve hasta 15 por consulta!';
            case 'community-post':
                return 'Publicar tus creaciones en la comunidad es una función exclusiva para usuarios Premium.';
            case 'community-save':
                return 'Guardar recetas de otros chefs es una función exclusiva para usuarios Premium.';
            case 'community-comment':
                return 'Has alcanzado el límite de 5 comentarios mensuales para usuarios gratuitos.';
            case 'upgrade':
                return '¡Da el siguiente paso en tu experiencia culinaria!';
            default:
                return 'Desbloquea todo el potencial culinario con ChefScan Premium.';
        }
    };

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-pure-black/90 backdrop-blur-md">
            <div className="w-full max-w-sm glass-card rounded-[2.5rem] p-8 border-primary/30 space-y-6 text-center shadow-[0_0_50px_rgba(57,255,20,0.1)] relative">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center text-primary mx-auto neon-glow border border-primary/30">
                    <span className="material-symbols-outlined text-4xl">workspace_premium</span>
                </div>

                <div className="space-y-3">
                    <h3 className="text-2xl font-outfit font-bold uppercase tracking-tight">Acceso Premium</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        {getReasonText()} Hazte Premium para disfrutar de una experiencia sin límites.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                        <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                        90 Recetas Diarias (vs 10 Free)
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                        <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                        Informe nutricional completo
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                        <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                        ChefBot Ilimitado (vs 10 créditos)
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                        <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                        Guardar recetas favoritas
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                        <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                        Despensa de 30 ítems (vs 5)
                    </div>
                </div>

                <div className="grid gap-3 pt-2">
                    <button className="w-full py-4 bg-primary text-black rounded-xl font-bold uppercase text-xs tracking-widest neon-glow shadow-strong active:scale-95 transition-all">
                        Subir a Premium • $19.900 COP/mes
                    </button>
                    <button onClick={onClose} className="w-full py-2 text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
                        Tal vez más tarde
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PremiumModal;
