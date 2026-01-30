import React, { useState, useEffect, useRef } from 'react';
import { Recipe } from '../types';
import { useTranslation, Language } from '../utils/i18n';

// Speech Recognition Types
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

interface CookingModeViewProps {
    recipe: Recipe | null;
    onClose: () => void;
    language: Language;
}

const CookingModeView: React.FC<CookingModeViewProps> = ({ recipe, onClose, language }) => {
    const t = useTranslation(language);
    const [currentStep, setCurrentStep] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef<any>(null);

    if (!recipe) return null;

    const steps = recipe.instructions || [];
    const progress = ((currentStep + 1) / steps.length) * 100;

    const [showMicTip, setShowMicTip] = useState(false);

    const stepRef = useRef(currentStep);
    useEffect(() => {
        stepRef.current = currentStep;
    }, [currentStep]);

    // Initialize Speech Recognition once
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = language === 'es' ? 'es-ES' : 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
                console.log("Voice Command:", command);

                const nextCmds = language === 'es' ? ['siguiente', 'próximo', 'después'] : ['next', 'advance'];
                const backCmds = language === 'es' ? ['atrás', 'anterior', 'regresa'] : ['back', 'previous'];
                const repeatCmds = language === 'es' ? ['repetir', 'repite', 'lee', 'otra vez'] : ['repeat', 'read again'];
                const exitCmds = language === 'es' ? ['salir', 'cerrar', 'terminar'] : ['exit', 'close', 'quit'];

                if (nextCmds.some(c => command.includes(c))) {
                    handleNext();
                } else if (backCmds.some(c => command.includes(c))) {
                    handleBack();
                } else if (repeatCmds.some(c => command.includes(c))) {
                    readStep(stepRef.current);
                } else if (exitCmds.some(c => command.includes(c))) {
                    onClose();
                }
            };

            recognitionRef.current.onend = () => {
                // Keep it listening if the state is still intended to be listening
                if (isListeningRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) { }
                }
            };

            recognitionRef.current.onerror = (err: any) => {
                console.error("Speech error", err);
                if (err.error === 'not-allowed') {
                    setIsListening(false);
                    isListeningRef.current = false;
                    setShowMicTip(true); // Auto-show tip on error
                }
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
            window.speechSynthesis.cancel();
        };
    }, []);

    const isListeningRef = useRef(isListening);
    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            isListeningRef.current = false;
            window.speechSynthesis.cancel();
        } else {
            try {
                recognitionRef.current?.start();
                setIsListening(true);
                isListeningRef.current = true;
                readStep(currentStep);
                setShowMicTip(false); // Hide tip when it successfully starts
            } catch (e) {
                console.error("Mic error:", e);
                // If it fails to start, maybe it's already started but glitching
                setIsListening(true);
                isListeningRef.current = true;
            }
        }
    };

    const readStep = (index: number) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const text = steps[index];
        if (!text) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const handleNext = () => {
        // We use state here safely because this is called by the UI button or onresult handler
        // React handles the state update normally
        setCurrentStep(prev => {
            if (prev < steps.length - 1) {
                const nextIdx = prev + 1;
                if (isListeningRef.current) readStep(nextIdx);
                return nextIdx;
            } else {
                onClose();
                return prev;
            }
        });
    };

    const handleBack = () => {
        setCurrentStep(prev => {
            if (prev > 0) {
                const prevIdx = prev - 1;
                if (isListeningRef.current) readStep(prevIdx);
                return prevIdx;
            }
            return prev;
        });
    };

    return (
        <div style={{ backgroundColor: 'var(--bg-app)' }} className="absolute inset-0 z-[100] flex flex-col overflow-y-auto custom-scrollbar">
            {/* Header - Progress */}
            <header style={{ backgroundColor: 'rgba(var(--bg-app-rgb), 0.4)', borderColor: 'var(--card-border)' }} className="p-6 space-y-4 backdrop-blur-md border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{t('cooking_mode_title')}</h2>
                        {isListening && (
                            <div className="flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                <span className="text-[8px] font-black text-primary uppercase tracking-tighter">{t('listening')}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowMicTip(!showMicTip)}
                                style={{ backgroundColor: showMicTip ? 'var(--primary)' : 'var(--bg-surface-soft)', borderColor: 'var(--card-border)', color: showMicTip ? 'black' : 'var(--primary)' }}
                                className="w-10 h-10 rounded-full border flex items-center justify-center transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">info</span>
                            </button>
                            <button
                                onClick={toggleListening}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-primary text-black shadow-glow' : 'text-primary border'}`}
                                style={{ backgroundColor: isListening ? 'var(--primary)' : 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }}
                            >
                                <span className="material-symbols-outlined text-sm">{isListening ? 'mic' : 'mic_off'}</span>
                            </button>
                            <button onClick={onClose} style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }} className="w-10 h-10 rounded-full border flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    </div>
                </div>

                {showMicTip && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                        <div style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.1)', borderColor: 'var(--primary)' }} className="p-3 rounded-2xl border flex items-start gap-3 relative pr-8">
                            <span className="material-symbols-outlined text-primary text-base">lock</span>
                            <p style={{ color: 'var(--text-main)' }} className="text-[10px] font-bold leading-tight">
                                {t('mic_permission_tip')}
                            </p>
                            <button
                                onClick={() => setShowMicTip(false)}
                                className="absolute top-2.5 right-2 div-center text-primary/50 hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span style={{ color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase tracking-widest">{t('step_label')} {currentStep + 1} {t('step_of')} {steps.length}</span>
                        <span className="text-[10px] text-primary font-black">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden border" style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'var(--card-border)' }}>
                        <div
                            className="h-full transition-all duration-500 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                            style={{ width: `${progress}%`, backgroundColor: 'var(--primary)' }}
                        ></div>
                    </div>
                </div>
            </header>

            {/* Content - The Step */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 relative">
                {/* Background Accent */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="w-full max-w-lg space-y-12 animate-in fade-in zoom-in-95 duration-500">
                    <div className="space-y-4 text-center">
                        <div style={{ backgroundColor: isSpeaking ? 'var(--primary)' : 'var(--bg-surface-soft)', color: isSpeaking ? 'black' : 'var(--primary)', borderColor: 'var(--card-border)' }} className={`w-20 h-20 rounded-3xl flex items-center justify-center border transition-all duration-500 ${isSpeaking ? 'shadow-glow scale-110' : ''} mx-auto mb-6 rotate-3 relative overflow-hidden`}>
                            <span className="text-4xl font-black z-10">{currentStep + 1}</span>
                            {isSpeaking && (
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20 animate-pulse"></div>
                            )}
                        </div>
                        <p style={{ color: 'var(--text-main)' }} className="text-2xl font-bold leading-relaxed">
                            {steps[currentStep]}
                        </p>
                        {isListening && (
                            <div className="pt-4 flex flex-wrap justify-center gap-4">
                                <span style={{ borderColor: 'rgba(57, 255, 20, 0.4)', color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase border px-3 py-1 rounded-lg">"{t('voice_help_next')}"</span>
                                <span style={{ borderColor: 'rgba(57, 255, 20, 0.4)', color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase border px-3 py-1 rounded-lg">"{t('voice_help_back')}"</span>
                                <span style={{ borderColor: 'rgba(57, 255, 20, 0.4)', color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase border px-3 py-1 rounded-lg">"{t('voice_help_repeat')}"</span>
                                <span style={{ borderColor: 'rgba(57, 255, 20, 0.4)', color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase border px-3 py-1 rounded-lg">"{t('voice_help_exit')}"</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Ingredients Reference (Premium Touch) */}
                    <div style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'rgba(57, 255, 20, 0.3)' }} className="border rounded-3xl p-6 space-y-3 shadow-sm">
                        <h4 style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-[0.2em] text-center">{t('chef_tips')}</h4>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs text-center italic">
                            "{recipe.tips && recipe.tips[currentStep]
                                ? recipe.tips[currentStep]
                                : [
                                    t('follow_step_carefully'),
                                    t('keep_area_clean'),
                                    t('secret_is_love'),
                                    t('taste_frequently'),
                                    t('keep_ingredients_handy')
                                ][currentStep % 5]
                            }"
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer - Navigation */}
            <footer style={{ backgroundColor: 'rgba(var(--bg-app-rgb), 0.4)', borderColor: 'var(--card-border)' }} className="p-8 grid grid-cols-2 gap-4 backdrop-blur-md border-t flex-shrink-0">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'rgba(57, 255, 20, 0.4)', color: 'var(--text-muted)' }}
                    className="py-5 rounded-2xl font-black uppercase text-xs tracking-widest border disabled:opacity-20 transition-all active:scale-95"
                >
                    {t('back')}
                </button>
                <button
                    onClick={handleNext}
                    className="py-5 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-strong border border-primary/50 transition-all active:scale-95"
                    style={{ backgroundColor: 'var(--primary)' }}
                >
                    {currentStep === steps.length - 1 ? t('finish') : t('next_step')}
                </button>
            </footer>
        </div>
    );
};

export default CookingModeView;
