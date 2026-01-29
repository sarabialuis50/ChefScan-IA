
import React, { useState, useRef, useEffect } from 'react';
import { chatWithChef, generateSpeech, processAudioInstruction } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

// Audio Helper Functions
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface AIChatbotProps {
  isPremium?: boolean;
  user?: any;
  chefCredits: number;
  onUseCredit: () => void;
  onAddCredits: () => void;
  onShowPremium: () => void;
}

const AIChatbot: React.FC<AIChatbotProps> = ({
  isPremium,
  user,
  chefCredits,
  onUseCredit,
  onAddCredits,
  onShowPremium
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '¡Hola! Soy tu asistente ChefScan.IA. ¿En qué puedo ayudarte hoy? Puedo sugerirte recetas, sustitutos de ingredientes o darte consejos de cocina.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Stop audio when modal is closed
  useEffect(() => {
    if (!isOpen) {
      stopAudio();
    }
  }, [isOpen]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Source might have already stopped
      }
      audioSourceRef.current = null;
    }
    setIsSpeaking(null);
  };

  const handleSend = async () => {
    if (chefCredits <= 0 && !isPremium) {
      return;
    }

    const userMessage = input.trim();
    if (!userMessage) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);
    if (!isPremium) onUseCredit();

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [msg.text]
      }));

      const userContext = {
        name: user?.name,
        allergies: user?.allergies,
        cookingGoal: user?.cookingGoal
      };

      const response = await chatWithChef(history, userMessage, userContext);
      setMessages(prev => [...prev, { role: 'model', text: response || 'Lo siento, tuve un problema procesando tu solicitud.' }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Error de conexión con el núcleo de IA.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    if (chefCredits <= 0 && !isPremium) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsLoading(true);
          setMessages(prev => [...prev, { role: 'user', text: '(Mensaje de voz enviado)' }]);

          const userContext = {
            name: user?.name,
            allergies: user?.allergies,
            cookingGoal: user?.cookingGoal
          };

          const response = await processAudioInstruction(base64Audio, 'audio/webm', userContext);
          setMessages(prev => [...prev, { role: 'model', text: response || 'No pude entender el audio.' }]);
          setIsLoading(false);
          if (!isPremium) onUseCredit();
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePlayAudio = async (text: string, index: number) => {
    // If clicking the same message that is currently playing, stop it.
    if (isSpeaking === index) {
      stopAudio();
      return;
    }

    // Stop any existing playback before starting new one
    stopAudio();

    setIsSpeaking(index);
    try {
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        const audioBuffer = await decodeAudioData(
          decodeBase64(base64Audio),
          audioContextRef.current,
          24000,
          1
        );

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          // Only reset isSpeaking if this source is the current one
          if (audioSourceRef.current === source) {
            setIsSpeaking(null);
            audioSourceRef.current = null;
          }
        };
        audioSourceRef.current = source;
        source.start();
      } else {
        setIsSpeaking(null);
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsSpeaking(null);
    }
  };

  const handleWatchAd = () => {
    setIsWatchingAd(true);
    // Simulate Ad playback
    setTimeout(() => {
      onAddCredits();
      setIsWatchingAd(false);
    }, 3000);
  };

  return (
    <>
      {/* Floating Action Button - Posicionado a la derecha sobre Comunidad */}
      <button
        onClick={() => setIsOpen(true)}
        className={`absolute bottom-28 right-4 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:scale-110 active:scale-90 transition-all z-[90] animate-float ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <img src="/chefbot_final.png" alt="ChefScan AI" className="w-10 h-10 object-contain" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
        </span>
      </button>

      {/* Chat Window Container - z-[100] para estar sobre TODO */}
      <div className={`absolute inset-0 flex flex-col items-center justify-end p-4 transition-all duration-500 pointer-events-none ${isOpen ? 'opacity-100 z-[100]' : 'opacity-0 z-[-1]'}`}>
        <div className={`w-full max-w-[400px] h-[600px] max-h-[80vh] bg-black border border-primary/30 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden pointer-events-auto transition-transform duration-500 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>

          {/* Header */}
          <div className="bg-primary/5 p-6 border-b border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                <img src="/chefbot_final.png" alt="ChefScan AI" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h3 className="font-outfit font-black text-xl tracking-tighter text-white leading-none">
                  Chef<span className="text-primary">Scan.IA</span>
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`px-2 py-0.5 rounded-full border ${isPremium || chefCredits > 0 ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-red-500/10 border-red-500/30 text-red-500'} text-[8px] font-black uppercase tracking-tighter shadow-sm flex items-center gap-1`}>
                    <span className="material-symbols-outlined text-[10px]">workspace_premium</span>
                    {isPremium ? 'Créditos Ilimitados' : `${chefCredits} Créditos de Chef`}
                  </div>
                  {isPremium && <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest leading-none">PRO Plan</span>}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-500 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {chefCredits <= 0 && !isPremium && (
              <div className="bg-zinc-900/80 border border-primary/20 p-6 rounded-3xl text-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase text-white tracking-widest">Créditos Agotados</h4>
                  <p className="text-[10px] text-zinc-400 mt-1">¿Te quedaste sin Sabiduría de Chef? Consigue más:</p>
                </div>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  <button
                    onClick={handleWatchAd}
                    disabled={isWatchingAd}
                    className="w-full py-4 bg-primary text-black font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-glow flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isWatchingAd ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Viendo Anuncio...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">play_circle</span>
                        Ver Anuncio (+3 Créditos)
                      </>
                    )}
                  </button>
                  <button
                    onClick={onShowPremium}
                    className="w-full py-4 bg-zinc-800 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm text-primary">stars</span>
                    Pasar a Premium (Ilimitado)
                  </button>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed relative ${msg.role === 'user'
                    ? 'bg-primary text-black font-medium rounded-tr-none'
                    : 'bg-zinc-900 text-zinc-300 border border-white/5 rounded-tl-none'
                    }`}>
                    {msg.text}
                    {msg.role === 'model' && (
                      <button
                        onClick={() => handlePlayAudio(msg.text, i)}
                        className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center shadow-lg border-2 border-black transition-all hover:scale-110 active:scale-90 ${isSpeaking === i ? 'animate-pulse' : ''}`}
                      >
                        <span className="material-symbols-outlined text-sm font-black">
                          {isSpeaking === i ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                    )}
                  </div>
                  {msg.role === 'model' && (
                    <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest ml-1">ChefBot v2.5</span>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-900 p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 bg-zinc-950/50 border-t border-white/5">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isRecording ? "Escuchando..." : (chefCredits <= 0 && !isPremium ? "Sin créditos..." : "Pregunta algo al Chef...")}
                  className="w-full bg-black border border-zinc-800 rounded-2xl py-4 pl-4 pr-14 text-sm text-white placeholder-zinc-600 focus:border-primary/50 transition-all outline-none"
                  disabled={isRecording || (chefCredits <= 0 && !isPremium)}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim() || isRecording}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-black disabled:opacity-50 active:scale-90 transition-all"
                >
                  <span className="material-symbols-outlined font-black">send</span>
                </button>
              </div>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${isRecording
                  ? 'bg-red-500 text-white animate-pulse shadow-red-500/20'
                  : 'bg-zinc-900 text-primary border border-primary/20 hover:border-primary active:scale-90'
                  }`}
              >
                <span className="material-symbols-outlined font-black text-2xl">
                  {isRecording ? 'stop' : 'mic'}
                </span>
              </button>
            </div>
            <p className="text-center text-[8px] text-zinc-700 font-bold uppercase tracking-[0.2em] mt-4">IA con entrada y salida de voz activada</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIChatbot;
