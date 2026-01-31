
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

// Helper: Wrap raw PCM data in a WAV container (Simple RIFF header)
// Used as fallback if the direct audio data isn't recognized as a valid container
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const dataSize = pcmData.length;

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Concatenate header and data
  const wavFile = new Uint8Array(header.byteLength + dataSize);
  wavFile.set(new Uint8Array(header), 0);
  wavFile.set(pcmData, 44);

  return wavFile;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
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
    { role: 'model', text: '¡Hola! Soy tu asistente ChefScan.IA. ¿En qué puedo ayudarte hoy?' }
  ]);

  // Personalize welcome message when user loads
  useEffect(() => {
    if (user?.name) {
      const firstName = user.name.split(' ')[0];
      setMessages(prev => {
        // Only update if it's the default initial message
        if (prev.length === 1 && prev[0].role === 'model') {
          return [{ role: 'model', text: `¡Hola ${firstName}! Soy tu asistente ChefScan.IA. ¿Qué vamos a cocinar hoy?` }];
        }
        return prev;
      });
    }
  }, [user?.name]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const currentSpeakingIndexRef = useRef<number | null>(null);


  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  // Pause audio without resetting position (HTML5 Audio only, Speech Synthesis doesn't support reliable pause)
  const pauseAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setIsPaused(true);
    } else if (window.speechSynthesis && window.speechSynthesis.speaking) {
      // Speech Synthesis pause is unreliable, just stop it
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      setIsPaused(false);
    }
  };

  // Resume audio from current position (HTML5 Audio only)
  const resumeAudio = () => {
    if (currentAudio && isPaused) {
      currentAudio.play().catch(console.error);
      setIsPaused(false);
    }
  };

  // Fully stop and reset audio
  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(null);
    setIsPaused(false);
    currentSpeakingIndexRef.current = null;
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
    // If clicking the same message that is currently playing/paused
    if (isSpeaking === index) {
      if (isPaused) {
        // Resume from where we left off
        resumeAudio();
        return;
      } else {
        // Currently playing, so pause it
        pauseAudio();
        return;
      }
    }

    // Stop any existing playback before starting new one
    stopAudio();

    currentSpeakingIndexRef.current = index;
    setIsSpeaking(index);

    try {
      const base64Audio = await generateSpeech(text);

      if (!base64Audio) {
        // FALLBACK: If Gemini native audio fails, use browser's Speech Synthesis
        console.warn("Gemini audio failed, falling back to Web Speech API");
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.onend = () => setIsSpeaking(null);
        utterance.onerror = () => setIsSpeaking(null);
        window.speechSynthesis.speak(utterance);
        return;
      }

      // Convert base64 to byte array
      const audioBytes = decodeBase64(base64Audio);

      // detect format by signatures
      const isWav = audioBytes[0] === 0x52 && audioBytes[1] === 0x49 && audioBytes[2] === 0x46 && audioBytes[3] === 0x46; // RIFF
      const isMp3 = (audioBytes[0] === 0x49 && audioBytes[1] === 0x44 && audioBytes[2] === 0x33) || (audioBytes[0] === 0xFF && (audioBytes[1] & 0xE0) === 0xE0); // ID3 or Sync
      const isAac = audioBytes[0] === 0xFF && (audioBytes[1] & 0xF6) === 0xF0; // ADTS
      const isOgg = audioBytes[0] === 0x4F && audioBytes[1] === 0x67 && audioBytes[2] === 0x67 && audioBytes[3] === 0x53; // OggS

      let blob: Blob;
      if (isWav || isMp3 || isAac || isOgg) {
        const type = isWav ? 'audio/wav' : (isMp3 ? 'audio/mpeg' : (isAac ? 'audio/aac' : 'audio/ogg'));
        blob = new Blob([audioBytes as any], { type });
      } else {
        // Assume Raw PCM (Gemini 2.0 default is often 24kHz Mono 16bit)
        const wavBytes = pcmToWav(audioBytes, 24000, 1);
        blob = new Blob([wavBytes.buffer as any], { type: 'audio/wav' });
      }

      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsSpeaking(null);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.error("Audio playback failed", e);
        setIsSpeaking(null);
        setCurrentAudio(null);
        alert("Error al reproducir el audio. Puede que el formato no sea soportado por tu navegador.");
      };

      setCurrentAudio(audio);
      await audio.play().catch(err => {
        console.error("Auto-play blocked or failed:", err);
        setIsSpeaking(null);
        alert("Haz clic en la pantalla para permitir la reproducción de audio.");
      });

    } catch (error) {
      console.error("Audio playback error:", error);
      setIsSpeaking(null);
      setCurrentAudio(null);
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
        className={`absolute bottom-[75px] right-4 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:scale-110 active:scale-90 transition-all z-[90] animate-float ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <img src="/chefbot_final.png" alt="ChefScan AI" className="w-10 h-10 object-contain" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-white border border-primary shadow-[0_0_10px_rgba(57,255,20,0.5)]"></span>
        </span>
      </button>

      {/* Chat Window Container - z-[100] para estar sobre TODO */}
      <div className={`absolute inset-0 flex flex-col items-center justify-end p-4 transition-all duration-500 pointer-events-none ${isOpen ? 'opacity-100 z-[100]' : 'opacity-0 z-[-1]'}`}>
        <div style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--card-border)' }} className={`w-full max-w-[400px] h-[600px] max-h-[80vh] border rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden pointer-events-auto transition-transform duration-500 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>

          {/* Header */}
          <div className="bg-primary/5 p-6 border-b border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                <img src="/chefbot_final.png" alt="ChefScan AI" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h3 style={{ color: 'var(--text-main)' }} className="font-outfit font-black text-xl tracking-tighter leading-none">
                  Chef<span className="text-primary">Scan.IA</span>
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`px-2 py-0.5 rounded-full border ${isPremium || chefCredits > 0 ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-red-500/10 border-red-500/30 text-red-500'} text-[8px] font-black uppercase tracking-tighter shadow-sm flex items-center gap-1`}>
                    <span className="material-symbols-outlined text-[10px]">workspace_premium</span>
                    {isPremium ? 'Créditos Ilimitados' : `${chefCredits} Créditos de Chef`}
                  </div>
                  {isPremium && <span style={{ color: 'var(--text-muted)' }} className="text-[8px] font-bold uppercase tracking-widest leading-none">PRO Plan</span>}
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
              <div style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }} className="border p-6 rounded-3xl text-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-main)' }} className="text-sm font-black uppercase tracking-widest">Créditos Agotados</h4>
                  <p style={{ color: 'var(--text-muted)' }} className="text-[10px] mt-1">¿Te quedaste sin Sabiduría de Chef? Consigue más:</p>
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
                    style={{ backgroundColor: 'var(--bg-surface-inner)', color: 'var(--text-main)' }}
                    className="w-full py-4 font-black rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
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
                  <div
                    style={{
                      backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-surface-soft)',
                      color: msg.role === 'user' ? 'black' : 'var(--text-main)',
                      borderColor: 'var(--card-border)'
                    }}
                    className={`p-4 rounded-2xl text-sm leading-relaxed relative border ${msg.role === 'user' ? 'font-medium rounded-tr-none border-transparent' : 'rounded-tl-none'}`}
                  >
                    {/* Render text with highlighting */}
                    {(() => {
                      const text = msg.text;
                      const firstName = user?.name ? user.name.split(' ')[0] : '';

                      // Split by firstName (case insensitive) and Scan.IA
                      const parts = text.split(new RegExp(`(${firstName}|Scan\\.IA)`, 'gi'));

                      return (
                        <span>
                          {parts.map((part, index) => {
                            const lowerPart = part.toLowerCase();
                            const isName = firstName && lowerPart === firstName.toLowerCase();
                            const isBrand = lowerPart === 'scan.ia';

                            if (isName || isBrand) {
                              return <span key={index} className={msg.role === 'user' ? 'font-black' : 'text-primary font-black'}>{part}</span>
                            }
                            return <span key={index}>{part}</span>;
                          })}
                        </span>
                      );
                    })()}

                    {msg.role === 'model' && (
                      <button
                        onClick={() => handlePlayAudio(msg.text, i)}
                        className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center shadow-lg border-2 border-black transition-all hover:scale-110 active:scale-90 ${isSpeaking === i && !isPaused ? 'animate-pulse' : ''}`}
                      >
                        <span className="material-symbols-outlined text-sm font-black">
                          {isSpeaking === i && !isPaused ? 'pause' : 'play_arrow'}
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
                <div style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }} className="p-4 rounded-2xl rounded-tl-none border flex gap-1">
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ backgroundColor: 'rgba(var(--bg-app-rgb), 0.5)', borderColor: 'var(--card-border)' }} className="p-6 border-t backdrop-blur-sm">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isRecording ? "Escuchando..." : (chefCredits <= 0 && !isPremium ? "Sin créditos..." : "Pregunta algo al Chef...")}
                  style={{ backgroundColor: 'var(--bg-surface-inner)', color: 'var(--text-main)', borderColor: 'var(--card-border)' }}
                  className="w-full border rounded-2xl py-4 pl-4 pr-14 text-sm placeholder-zinc-600 focus:border-primary/50 transition-all outline-none"
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
                style={{ backgroundColor: isRecording ? '#ef4444' : 'var(--bg-surface-soft)', borderColor: isRecording ? '#ef4444' : 'var(--card-border)' }}
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all shadow-lg ${isRecording ? 'text-white animate-pulse shadow-red-500/20' : 'text-primary active:scale-90'}`}
              >
                <span className="material-symbols-outlined font-black text-2xl">
                  {isRecording ? 'stop' : 'mic'}
                </span>
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)' }} className="text-center text-[8px] font-bold uppercase tracking-[0.2em] mt-4">IA con entrada y salida de voz activada</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIChatbot;
