import React, { useState, useEffect, useRef } from 'react';
import { Recipe } from '../types';

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
}

const CookingModeView: React.FC<CookingModeViewProps> = ({ recipe, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef<any>(null);

    if (!recipe) return null;

    const steps = recipe.instructions || [];
    const progress = ((currentStep + 1) / steps.length) * 100;

    // Initialize Speech Synthesis & Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'es-ES';

            recognitionRef.current.onresult = (event: any) => {
                const command = event.results[event.results.length - 1][0].transcript.toLowerCase();

                if (command.includes('siguiente') || command.includes('próximo')) {
                    handleNext();
                } else if (command.includes('atrás') || command.includes('anterior')) {
                    handleBack();
                } else if (command.includes('repetir') || command.includes('lee')) {
                    readStep(currentStep);
                } else if (command.includes('salir') || command.includes('cerrar') || command.includes('parar')) {
                    onClose();
                } else if (command.includes('ayuda') || command.includes('qué puedo decir')) {
                    readHelp();
                }
            };

            const readHelp = () => {
                const helpText = "Puedes decir: siguiente para avanzar, atrás para retroceder, repetir para volver a escuchar el paso, o salir para cerrar el asistente.";
                const utterance = new SpeechSynthesisUtterance(helpText);
                utterance.lang = 'es-ES';
                window.speechSynthesis.speak(utterance);
            };

            recognitionRef.current.onend = () => {
                if (isListening) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) { }
                }
            };
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            window.speechSynthesis.cancel();
        };
    }, [isListening, currentStep]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            window.speechSynthesis.cancel();
        } else {
            try {
                recognitionRef.current?.start();
                setIsListening(true);
                readStep(currentStep);
            } catch (e) {
                console.error("Mic error:", e);
            }
        }
    };

    const readStep = (index: number) => {
        window.speechSynthesis.cancel();
        const text = steps[index];
        if (!text) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            const nextIdx = currentStep + 1;
            setCurrentStep(nextIdx);
            if (isListening) readStep(nextIdx);
        } else {
            onClose();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            const prevIdx = currentStep - 1;
            setCurrentStep(prevIdx);
            if (isListening) readStep(prevIdx);
        }
    };

    return (
        <div style={{ backgroundColor: 'var(--bg-app)' }} className="absolute inset-0 z-[100] flex flex-col overflow-y-auto custom-scrollbar">
            {/* Header - Progress */}
            <header style={{ backgroundColor: 'rgba(var(--bg-app-rgb), 0.4)', borderColor: 'var(--card-border)' }} className="p-6 space-y-4 backdrop-blur-md border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Modo Cocina Elite</h2>
                        {isListening && (
                            <div className="flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                <span className="text-[8px] font-black text-primary uppercase tracking-tighter">Escuchando...</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
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
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span style={{ color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase tracking-widest">Paso {currentStep + 1} de {steps.length}</span>
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
                            <div className="pt-4 flex justify-center gap-4">
                                <span style={{ borderColor: 'rgba(57, 255, 20, 0.4)', color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase border px-3 py-1 rounded-lg">"Siguiente"</span>
                                <span style={{ borderColor: 'rgba(57, 255, 20, 0.4)', color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase border px-3 py-1 rounded-lg">"Anterior"</span>
                                <span style={{ borderColor: 'rgba(57, 255, 20, 0.4)', color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase border px-3 py-1 rounded-lg">"Repetir"</span>
                                <span style={{ borderColor: 'rgba(57, 255, 20, 0.4)', color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase border px-3 py-1 rounded-lg">"Ayuda"</span>
                                <span style={{ borderColor: 'rgba(57, 255, 20, 0.4)', color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase border px-3 py-1 rounded-lg">"Salir"</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Ingredients Reference (Premium Touch) */}
                    <div style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'rgba(57, 255, 20, 0.3)' }} className="border rounded-3xl p-6 space-y-3 shadow-sm">
                        <h4 style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-[0.2em] text-center">Tips del Chef</h4>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs text-center italic">
                            "{recipe.tips && recipe.tips[currentStep]
                                ? recipe.tips[currentStep]
                                : [
                                    "Sigue el paso cuidadosamente para un resultado perfecto.",
                                    "Recuerda mantener el área de trabajo limpia para cocinar mejor.",
                                    "El secreto está en el cariño que le pongas a la preparación.",
                                    "Prueba la sazón en cada paso para ajustar si es necesario.",
                                    "Mantén los ingredientes a la mano para no perder el ritmo."
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
                    Anterior
                </button>
                <button
                    onClick={handleNext}
                    className="py-5 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-strong border border-primary/50 transition-all active:scale-95"
                    style={{ backgroundColor: 'var(--primary)' }}
                >
                    {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente Paso'}
                </button>
            </footer>
        </div>
    );
};

export default CookingModeView;
