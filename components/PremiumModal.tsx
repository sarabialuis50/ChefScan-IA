import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason: 'recipes' | 'nutrition' | 'chefbot' | 'more-recipes' | 'community-post' | 'community-save' | 'community-comment' | 'upgrade' | 'pantry-limit' | 'favorites-limit';
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, reason }) => {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            // 1. Get User
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) throw new Error("No se pudo identificar al usuario.");

            // 2. Ensure ePayco is available
            let ePaycoHandler = (window as any).ePayco;

            if (!ePaycoHandler) {
                console.log("ePayco not found in window, attempting to load script...");
                await new Promise((resolve) => {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.epayco.co/checkout.js';
                    script.async = true;
                    script.onload = () => resolve(true);
                    script.onerror = () => resolve(false);
                    document.body.appendChild(script);
                });
                ePaycoHandler = (window as any).ePayco;
            }

            if (!ePaycoHandler) {
                throw new Error("La pasarela de pagos (ePayco) no está disponible. Por favor refresca la página.");
            }

            // 3. Get Checkout Config from Edge Function
            const { data: epaycoData, error } = await supabase.functions.invoke('create-epayco-checkout');

            if (error) throw error;
            if (epaycoData?.error) throw new Error(epaycoData.error);

            // 4. Open ePayco Widget
            const handler = ePaycoHandler.checkout.configure({
                key: epaycoData.publicKey,
                test: import.meta.env.DEV // Auto-detect: true in local, false in production
            });

            const data = {
                // Generales
                name: "Suscripción ChefScan Premium",
                description: "Acceso total ilimitado por 1 mes",
                invoice: epaycoData.reference,
                currency: "cop",
                amount: epaycoData.amount.toString(),
                tax_base: "0",
                tax: "0",
                country: "co",
                lang: "es",

                // Atributos cliente
                external: "false",
                extra1: epaycoData.reference, // Usamos esto para el Webhook también
                email_billing: epaycoData.email,
                name_billing: epaycoData.name,

                // Redirección y Confirmación
                confirm: `https://vhodqxomxpjzfdvwmaok.supabase.co/functions/v1/epayco-webhook`,
                response: `${window.location.origin}`,
            };

            handler.open(data);

        } catch (err: any) {
            console.error('ePayco Error:', err);
            alert('Error al procesar el pago: ' + (err.message || 'Inténtalo más tarde'));
        } finally {
            setLoading(false);
        }
    };

    const getReasonText = () => {
        switch (reason) {
            case 'recipes':
                return 'Has alcanzado el límite de 2 consultas diarias permitidas para el plan Free. ¡Hazte Premium para realizar hasta 6 búsquedas diarias!';
            case 'nutrition':
                return 'El análisis nutricional detallado y completo es una función exclusiva para usuarios Premium.';
            case 'chefbot':
                return 'Has agotado tus 5 créditos diarios con el Agente Chef IA. ¡Los usuarios Premium tienen consultas ilimitadas!';
            case 'more-recipes':
                return 'Los usuarios Free solo pueden ver 3 versiones de recetas. ¡Con Premium obtienes 5 versiones inicialmente y puedes extenderlas hasta 15 versiones por cada búsqueda!';

            case 'community-post':
                return 'Publicar tus creaciones en la comunidad es una función exclusiva para usuarios Premium.';
            case 'community-save':
                return 'Guardar recetas de la comunidad es una función exclusiva para usuarios Premium. ¡Únete para coleccionar las mejores creaciones!';
            case 'favorites-limit':
                return 'Has alcanzado el límite de 5 recetas favoritas permitidas para el plan Free. ¡Hazte Premium para guardar recetas ilimitadas!';
            case 'community-comment':
                return 'Has alcanzado el límite de comentarios mensuales para usuarios gratuitos.';
            case 'pantry-limit':
                return 'Has alcanzado el límite de 5 ítems en tu despensa. ¡Hazte Premium para gestionar hasta 30 ingredientes y evitar el desperdicio!';
            case 'upgrade':
                return '¡Da el siguiente paso en tu experiencia culinaria profesional con ChefScan.IA Premium!';
            default:
                return 'Desbloquea todo el potencial culinario con ChefScan.IA Premium.';
        }
    };

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300" style={{ backgroundColor: 'rgba(var(--bg-app-rgb), 0.95)' }}>
            <div style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--card-border)' }} className="w-full max-w-sm rounded-[2.5rem] p-8 border space-y-6 text-center shadow-[0_0_50px_rgba(57,255,20,0.1)] relative max-h-[90vh] overflow-y-auto custom-scrollbar">
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
                    <h3 style={{ color: 'var(--text-main)' }} className="text-2xl font-outfit font-bold uppercase tracking-tight">Acceso Premium</h3>
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm leading-relaxed">
                        {getReasonText()}
                    </p>
                </div>

                <div style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }} className="border rounded-2xl p-4 text-left space-y-2">
                    <div style={{ color: 'var(--text-muted)' }} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                        Hasta 6 consultas diarias (vs 2 free)
                    </div>
                    <div style={{ color: 'var(--text-muted)' }} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                        Hasta 15 recetas por consulta (vs 3 free)
                    </div>
                    <div style={{ color: 'var(--text-muted)' }} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                        Informe nutricional completo
                    </div>
                    <div style={{ color: 'var(--text-muted)' }} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                        CHEFBOT.IA ILIMITADO (VS 5 CREDITOS)
                    </div>
                    <div style={{ color: 'var(--text-muted)' }} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                        Recetas Favoritas ilimitadas (vs 5 free)
                    </div>
                    <div style={{ color: 'var(--text-muted)' }} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                        Despensa de 30 ítems (vs 5 free)
                    </div>
                    <div style={{ color: 'var(--text-muted)' }} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <span className="material-symbols-outlined text-primary text-xs">check_circle</span>
                        Subir recetas en la comunidad
                    </div>
                </div>

                <div className="grid gap-3 pt-2">
                    <button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className="w-full py-4 bg-primary text-black rounded-xl font-bold uppercase text-xs tracking-widest neon-glow shadow-strong active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                PROCESANDO...
                            </>
                        ) : (
                            'Subir a Premium • $19.900 COP/mes'
                        )}
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
