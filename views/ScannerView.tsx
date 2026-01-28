
import React, { useState, useEffect, useRef } from 'react';
import { analyzeIngredientImage } from '../services/geminiService';
import { Ingredient } from '../types';
import { resizeAndCompressImage } from '../utils/imageUtils';

interface ScannerViewProps {
  onCancel: () => void;
  onComplete: (ingredients: Ingredient[], image64: string) => void;
  onReadyToGenerate: () => void;
}

const ScannerView: React.FC<ScannerViewProps> = ({ onCancel, onComplete, onReadyToGenerate }) => {
  const [detected, setDetected] = useState<Ingredient[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Escaneo de red neuronal...');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setCameraError(null);
    setStatus('Iniciando cámara...');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Su navegador no soporta el acceso a la cámara.");
      }

      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: false
      });

      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => {
            console.error("Video play error:", e);
            setCameraError("Error al reproducir el video de la cámara.");
          });
          setStatus('Cámara activa');
        };
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Permiso denegado. Por favor, habilite el acceso a la cámara en la configuración de su navegador para usar el escáner.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("No se encontró ninguna cámara disponible en este dispositivo.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError("La cámara está siendo usada por otra aplicación o tiene un error de hardware.");
      } else {
        setCameraError(`Error: ${err.message || "No se pudo acceder a la cámara"}`);
      }
      setStatus("Error de acceso");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleScan = async () => {
    if (!videoRef.current || !canvasRef.current || !!cameraError) return;

    setScanning(true);
    setProgress(0);
    setStatus("Analizando ingredientes...");

    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];

      const interval = setInterval(() => {
        setProgress(p => (p >= 90 ? p : p + 5));
      }, 200);

      try {
        const optimizedBase64 = await resizeAndCompressImage(base64, 1024, 1024, 0.8);
        const ingredients = await analyzeIngredientImage(optimizedBase64);

        clearInterval(interval);
        setProgress(100);
        setStatus("Identificación completa");
        setDetected(ingredients);

        setTimeout(() => {
          onComplete(ingredients, optimizedBase64);
          setTimeout(() => {
            onReadyToGenerate();
          }, 1000);
        }, 2000);

      } catch (err) {
        clearInterval(interval);
        setStatus("Error en identificación");
        setScanning(false);
      }
    }
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    onCancel();
  };

  return (
    <div className="h-screen w-full bg-pure-black flex flex-col items-center justify-center overflow-hidden">
      {/* Contenedor Vertical (Pantalla completa y sin bordes de limitación) */}
      <div className="w-full h-full relative flex flex-col items-center justify-between overflow-hidden">

        <div className="absolute inset-0 z-0">
          {!cameraError ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-10 text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <span className="material-symbols-outlined text-red-500 text-5xl">no_photography</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-bold uppercase tracking-widest text-sm">Acceso Restringido</h3>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-xs">{cameraError}</p>
              </div>
              <button
                onClick={startCamera}
                className="px-8 py-3 bg-primary text-black font-black rounded-full text-[10px] uppercase tracking-widest shadow-neon-glow"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <header className="relative z-50 w-full flex justify-start p-6">
          <button
            onClick={handleClose}
            className="w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center active:scale-95 transition-all shadow-xl backdrop-blur-md"
          >
            <span className="material-symbols-outlined text-white text-2xl">arrow_back</span>
          </button>
        </header>

        <div className="relative z-10 flex-1 w-full flex flex-col items-center justify-center -mt-16">
          <div className="relative w-72 h-72 flex items-center justify-center">
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl shadow-strong"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl shadow-strong"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl shadow-strong"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl shadow-strong"></div>

            {!cameraError && !scanning && <div className="scanner-line animate-scan"></div>}

            <div className="relative flex flex-col items-center gap-4">
              <div className={`w-20 h-20 rounded-full border border-primary/20 ${!cameraError && !scanning ? 'animate-pulse-slow' : ''} flex items-center justify-center`}>
                <img src="/chefbot_final.png" alt="ChefScan AI" className="w-14 h-14 object-contain opacity-90" />
              </div>

              <div className="bg-surface-dark/80 backdrop-blur-md border border-primary/30 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
                <div className={`w-1.5 h-1.5 rounded-full ${cameraError ? 'bg-red-500' : 'bg-primary animate-pulse'}`}></div>
                <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-tech">ChefScan.IA Engine v2.5</span>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center space-y-2 px-4">
            <h2 className="text-2xl font-tech font-bold text-white tracking-tight">
              {detected.length > 0 ? "Resultados IA" : scanning ? "Codificando datos..." : cameraError ? "Error de Sistema" : "Escaneo Biométrico"}
            </h2>
            <p className="text-sm text-gray-400 max-w-xs">{status}</p>
          </div>

          {detected.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-sm px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {detected.map((ing, i) => (
                <div key={i} className="bg-primary/10 border border-primary/30 p-2 rounded-2xl flex flex-col gap-1 min-w-[100px] items-center">
                  <span className="text-[10px] font-black uppercase tracking-tight text-white">{ing.name}</span>
                  {ing.nutrients && (
                    <div className="text-[8px] font-bold text-primary flex items-center gap-2 opacity-80 uppercase tracking-tighter">
                      <span>{ing.nutrients.calories} kcal</span>
                      <span>•</span>
                      <span>{ing.nutrients.protein}g p</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 w-full pb-12 space-y-6 px-6">
          {scanning ? (
            <div className="space-y-4 px-2">
              <div className="flex justify-between items-end mb-1">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-lg animate-pulse">rocket_launch</span>
                  <span className="text-xs font-black uppercase tracking-widest">IA en proceso</span>
                </div>
                <span className="text-xs font-mono text-zinc-500">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-surface-dark rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                <div
                  className="h-full bg-primary rounded-full neon-glow transition-all duration-300"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full animate-shimmer"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <button
                onClick={handleScan}
                disabled={!!cameraError}
                className={`w-full h-16 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 transition-all ${cameraError ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-primary text-black shadow-strong active:scale-95'
                  }`}
              >
                <span className="material-symbols-outlined font-black">center_focus_strong</span>
                <span className="uppercase tracking-widest text-sm">Capturar Ingredientes</span>
              </button>
              <button
                onClick={handleClose}
                className="w-full text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] hover:text-white transition-colors"
              >
                Abortar Operación
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScannerView;
