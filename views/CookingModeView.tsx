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
        <div className="absolute inset-0 z-[100] bg-pure-black flex flex-col overflow-hidden">
            {/* Header - Progress */}
            <header className="p-6 space-y-4 bg-black/40 backdrop-blur-md border-b border-white/5">
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
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-primary text-black shadow-glow' : 'bg-white/5 text-zinc-500 border border-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-sm">{isListening ? 'mic' : 'mic_off'}</span>
                        </button>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-zinc-400">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Paso {currentStep + 1} de {steps.length}</span>
                        <span className="text-[10px] text-primary font-black">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_rgba(57,255,20,0.5)]"
                            style={{ width: `${progress}%` }}
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
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'bg-primary text-black shadow-glow scale-110' : 'bg-zinc-800 text-primary'} mx-auto mb-6 rotate-3 relative overflow-hidden`}>
                            <span className="text-4xl font-black z-10">{currentStep + 1}</span>
                            {isSpeaking && (
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20 animate-pulse"></div>
                            )}
                        </div>
                        <p className="text-2xl font-bold leading-relaxed text-white">
                            {steps[currentStep]}
                        </p>
                        {isListening && (
                            <div className="pt-4 flex justify-center gap-4">
                                <span className="text-[10px] text-zinc-600 font-bold uppercase border border-zinc-800 px-3 py-1 rounded-lg">"Siguiente"</span>
                                <span className="text-[10px] text-zinc-600 font-bold uppercase border border-zinc-800 px-3 py-1 rounded-lg">"Anterior"</span>
                                <span className="text-[10px] text-zinc-600 font-bold uppercase border border-zinc-800 px-3 py-1 rounded-lg">"Repetir"</span>
                                <span className="text-[10px] text-zinc-600 font-bold uppercase border border-zinc-800 px-3 py-1 rounded-lg">"Ayuda"</span>
                                <span className="text-[10px] text-zinc-600 font-bold uppercase border border-zinc-800 px-3 py-1 rounded-lg">"Salir"</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Ingredients Reference (Premium Touch) */}
                    <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-center">Tips del Chef</h4>
                        <p className="text-xs text-zinc-400 text-center italic">"Asegúrate de que el fuego sea medio para no quemar los aromáticos."</p>
                    </div>
                </div>
            </main>

            {/* Footer - Navigation */}
            <footer className="p-8 grid grid-cols-2 gap-4 bg-black/40 backdrop-blur-md border-t border-white/5">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="py-5 bg-zinc-900 text-zinc-400 rounded-2xl font-black uppercase text-xs tracking-widest border border-white/5 disabled:opacity-20 transition-all active:scale-95"
                >
                    Anterior
                </button>
                <button
                    onClick={handleNext}
                    className="py-5 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-strong transition-all active:scale-95"
                >
                    {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente Paso'}
                </button>
            </footer>
        </div>
    );
};

export default CookingModeView;
