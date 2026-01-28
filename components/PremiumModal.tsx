import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason: 'recipes' | 'nutrition' | 'chefbot' | 'more-recipes' | 'community-post' | 'community-save' | 'community-comment' | 'upgrade';
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

            // 2. Ensure Wompi is available
            let WompiConstructor = (window as any).WidgetCheckout || (window as any).Widget;

            if (!WompiConstructor) {
                console.log("Wompi not found in window, attempting to load script...");
                await new Promise((resolve) => {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.wompi.co/widget.js';
                    script.async = true;
                    script.onload = () => resolve(true);
                    script.onerror = () => resolve(false);
                    document.body.appendChild(script);
                });
                WompiConstructor = (window as any).WidgetCheckout || (window as any).Widget;
            }

            if (!WompiConstructor) {
                throw new Error("La pasarela de pagos (Wompi) no está disponible. Por favor refresca la página.");
            }

            // 3. Get Signature from Edge Function
            const { data: wompiData, error } = await supabase.functions.invoke('create-wompi-signature', {
                body: { returnUrl: window.location.origin }
            });

            if (error) throw error;
            if (wompiData?.error) throw new Error(wompiData.error);

            // 4. Open Wompi Widget
            const checkoutConfig = {
                currency: 'COP',
                amountInCents: wompiData.amountInCents,
                reference: wompiData.reference,
                publicKey: wompiData.publicKey,
                signature: { integrity: wompiData.integritySignature },
                redirectUrl: window.location.origin,
                customerData: {
                    email: user.email,
                    fullName: user.user_metadata?.name || 'ChefScan User'
                }
            };

            console.log('Iniciando Checkout Wompi con:', {
                reference: checkoutConfig.reference,
                amount: checkoutConfig.amountInCents,
                publicKey: checkoutConfig.publicKey,
                integrity: checkoutConfig.signature.integrity
            });

            const checkout = new WompiConstructor(checkoutConfig);

            checkout.open((result: any) => {
                const transaction = result.transaction;
                if (transaction.status === 'APPROVED') {
                    alert('¡Pago Exitoso! Tu cuenta Premium se activará en instantes.');
                    onClose();
                    window.location.reload();
                } else if (transaction.status === 'DECLINED') {
                    alert('El pago fue rechazado por la entidad financiera.');
                } else if (transaction.status === 'VOIDED' || transaction.status === 'ERROR') {
                    alert('Hubo un problema con la transacción. Inténtalo de nuevo.');
                }
            });

        } catch (err: any) {
            console.error('Wompi Error:', err);
            alert('Error al procesar el pago: ' + (err.message || 'Inténtalo más tarde'));
        } finally {
            setLoading(false);
        }
    };

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
                        6 Consultas Diarias (vs 2 Free)
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
                        Despensa de 30 ítems (vs 5 free)
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
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
