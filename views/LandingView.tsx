import React, { useState, useEffect } from 'react';

interface LandingViewProps {
  onStart: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onStart }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Detección por ancho de pantalla (estándar para diseño responsivo)
      // o por User Agent si se prefiere algo más estricto
      setIsMobile(window.innerWidth < 1024);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  if (isMobile) {
    return (
      <div className="bg-black min-h-screen text-white flex flex-col items-center px-6 py-12 overflow-hidden relative">
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-[#39FF14]/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[60%] h-[40%] bg-[#39FF14]/5 blur-[120px] rounded-full"></div>

        {/* Top Brand */}
        <div className="flex flex-col items-center gap-3 mb-10 relative z-10">
          <div className="relative group">
            <div className="absolute -inset-4 bg-[#39FF14]/20 blur-xl rounded-full opacity-100"></div>
            <img src="/logo.png" alt="ChefScan" className="h-16 w-16 relative z-10" />
          </div>
          <h1 className="font-outfit font-black text-2xl tracking-tighter text-white">
            ChefScan<span className="text-[#39FF14]">.IA</span>
          </h1>
        </div>

        {/* Central Card Mockup - Inspired by the provided image */}
        <div className="w-full max-w-[340px] bg-[#121212] border border-white/5 rounded-[2.5rem] p-5 shadow-2xl relative z-10 mb-8">
          <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-6 border border-white/10">
            <img
              src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800"
              alt="Scanner Preview"
              className="w-full h-full object-cover opacity-80"
            />
            {/* Scanner UI Overlays */}
            <div className="absolute inset-4">
              <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-[#39FF14] rounded-tl-xl shadow-glow"></div>
              <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-[#39FF14] rounded-tr-xl shadow-glow"></div>
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-[#39FF14] rounded-bl-xl shadow-glow"></div>
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-[#39FF14] rounded-br-xl shadow-glow"></div>
            </div>

            {/* Scanner Labels */}
            <div className="absolute top-4 left-4">
              <span className="bg-[#39FF14] text-black text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Scanner v2.0</span>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="bg-black/60 backdrop-blur-md border border-[#39FF14]/30 px-6 py-2 rounded-full overflow-hidden relative group">
                <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-[0.2em] relative z-10">Identificando...</span>
                <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>
              </div>
            </div>

            <div className="absolute top-1/4 right-4">
              <div className="bg-black/80 border border-[#39FF14] px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse"></div>
                <span className="text-[9px] font-bold text-[#39FF14] uppercase">Aguacate</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white leading-none">Ingrediente Detectado</h3>
              <span className="material-symbols-outlined text-[#39FF14] text-lg notranslate">check_circle</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-gray-400">98% Match</span>
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-gray-400">Orgánico</span>
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-gray-400">Grasas Saludables</span>
            </div>
          </div>
        </div>

        {/* Headlines */}
        <div className="text-center space-y-4 mb-10 relative z-10">
          <h2 className="text-4xl font-black font-outfit leading-tight text-white uppercase">
            Reconocimiento de <br />
            <span className="text-[#39FF14] italic lowercase font-normal [font-family:serif] text-5xl leading-none">precisión IA</span>
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mx-auto font-medium">
            Apunta tu cámara a cualquier ingrediente y descubre infinitas posibilidades culinarias.
          </p>
        </div>

        {/* Actions */}
        <div className="w-full space-y-4 relative z-10 mt-auto">
          <button
            onClick={onStart}
            className="w-full bg-[#39FF14] text-black font-black py-5 rounded-[2rem] text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(57,255,20,0.3)] active:scale-95 transition-all"
          >
            Comenzar ahora
          </button>
          <button
            onClick={onStart}
            className="w-full bg-[#121212] border border-white/10 text-white font-black py-5 rounded-[2rem] text-sm uppercase tracking-widest active:scale-95 transition-all"
          >
            Ya tengo una cuenta
          </button>
        </div>

        {/* Home Indicator Mockup */}
        <div className="w-32 h-1 bg-white/20 rounded-full mt-10 opacity-30"></div>
      </div>
    );
  }

  // Versión de Escritorio (PC) - Sin cambios sustanciales, solo corregir el título
  return (
    <div className="bg-[#0A0A0A] font-body antialiased min-h-screen text-white overflow-x-hidden selection:bg-primary selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 py-4 sm:py-6 bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer transition-all duration-300">
            <div className="relative">
              <div className="absolute -inset-2 bg-[#39FF14]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                src="/logo.png"
                alt="ChefScan"
                className="h-12 w-12 relative z-10 transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-outfit font-black text-2xl tracking-tighter text-white leading-none">ChefScan<span className="text-[#39FF14]">.IA</span></span>
              <span className="notranslate text-[8px] font-black uppercase tracking-[0.3em] text-gray-500 mt-0.5">Premium Kitchen IA</span>
            </div>
          </div>
          <button className="px-5 py-2 bg-[#39FF14] text-black rounded-full text-xs font-bold hover:bg-[#32e612] transition-all shadow-[0_0_15px_rgba(57,255,20,0.3)]">
            Descargar App
          </button>
        </div>
      </nav>

      <main className="relative pt-32 pb-20">
        {/* Background Image / Overlay */}
        <div className="fixed inset-0 z-0">
          <div className="hidden lg:block absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1920"
              alt="ChefScan PC Background"
              className="w-full h-full object-cover opacity-15"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/95 to-[#0A0A0A]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-7 space-y-10 lg:sticky lg:top-32">
              <div className="space-y-4 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-xl border border-[#39FF14]/20">
                  <span className="flex h-2 w-2 rounded-full bg-[#39FF14] animate-pulse"></span>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#39FF14]">Tecnología de Visión IA</span>
                </div>

                <div className="space-y-6">
                  <h1 className="font-outfit font-extrabold text-4xl sm:text-6xl lg:text-7xl leading-[1.1] tracking-tight text-white text-left">
                    Transforma tus <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39FF14] to-green-400 [text-shadow:0_0_20px_rgba(57,255,20,0.4)]">ingredientes</span> <br />
                    en obras maestras.
                  </h1>

                  <p className="text-gray-400 text-lg sm:text-xl leading-relaxed font-light max-w-xl">
                    Nuestra IA avanzada reconoce visualmente lo que tienes en tu cocina y diseña recetas gourmet personalizadas en segundos.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={onStart}
                    className="w-full sm:w-auto px-8 py-6 bg-[#39FF14] text-black hover:bg-[#32e612] transition-all duration-300 rounded-2xl shadow-2xl shadow-[#39FF14]/30 font-bold text-lg flex items-center justify-center group"
                  >
                    Comenzar ahora
                    <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform h-6 w-6 notranslate">arrow_forward</span>
                  </button>
                  <button
                    onClick={onStart}
                    className="w-full sm:w-auto px-8 py-6 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 rounded-2xl font-bold text-lg border border-white/10 text-white"
                  >
                    Ya tengo una cuenta
                  </button>
                </div>
              </div>

              <div className="pt-8 flex items-center gap-10 border-t border-white/10">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-white tracking-widest leading-none mb-1">98%</span>
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Precisión IA</span>
                </div>
                <div className="w-px h-12 bg-white/10"></div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-white tracking-widest leading-none mb-1">500k+</span>
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Recetas Creadas</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center items-center relative py-10 lg:py-0">
              <div className="absolute w-[400px] h-[400px] bg-[#39FF14]/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>

              <div className="relative mx-auto border-[10px] border-zinc-800 rounded-[3rem] h-[580px] w-[280px] shadow-[0_0_60px_-15px_rgba(57,255,20,0.25),inset_0_0_2px_2px_rgba(255,255,255,0.1)] bg-black overflow-hidden group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-3xl z-20"></div>

                <div className="p-5 h-full flex flex-col bg-[#0A0A0A] overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center mt-8 mb-6">
                    <div className="text-left">
                      <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Panel de Control</p>
                      <h3 className="text-xl font-bold text-white">¡Hola, Chef!</h3>
                    </div>
                  </div>

                  <div className="relative rounded-[2rem] overflow-hidden mb-6 aspect-[4/5] bg-[#161616] border border-white/10 group shadow-2xl">
                    <img
                      alt="Scan preview"
                      className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform group-hover:scale-110 duration-1000"
                      src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400"
                    />
                    <div className="absolute inset-4 z-10">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#39FF14] rounded-tl-2xl shadow-[0_0_15px_rgba(57,255,20,0.5)]" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-[#39FF14] rounded-tr-2xl shadow-[0_0_15px_rgba(57,255,20,0.5)]" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-[#39FF14] rounded-bl-2xl shadow-[0_0_15px_rgba(57,255,20,0.5)]" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-[#39FF14] rounded-br-2xl shadow-[0_0_15px_rgba(57,255,20,0.5)]" />
                    </div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#39FF14] to-transparent shadow-[0_0_20px_rgba(57,255,20,1)] animate-scan z-20" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
                      <div className="bg-[#39FF14]/20 backdrop-blur-md px-4 py-2 rounded-full border border-[#39FF14]/50 mb-2 animate-pulse">
                        <span className="text-[10px] font-black text-[#39FF14] tracking-widest uppercase">ESCANEANDO...</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center px-1">
                      <h4 className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Ingredientes Detectados</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#161616] p-3 rounded-2xl border border-white/5 flex items-center gap-2">
                        <span className="text-[9px] font-semibold text-white">Aguacate</span>
                      </div>
                      <div className="bg-[#161616] p-3 rounded-2xl border border-white/5 flex items-center gap-2">
                        <span className="text-[9px] font-semibold text-white">Huevos</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#39FF14]/20 to-[#161616] p-4 rounded-3xl border border-[#39FF14]/20 shadow-xl mt-auto transition-transform hover:-translate-y-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-[#39FF14] text-sm animate-spin-slow notranslate">auto_awesome</span>
                      <p className="text-[8px] font-bold text-[#39FF14] uppercase tracking-widest text-left">Recomendación ChefScan</p>
                    </div>
                    <h4 className="text-sm font-bold mb-2 text-white text-left">Tostada de Aguacate Gourmet</h4>
                    <button className="w-full py-3 bg-[#39FF14] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all border-none">
                      Ver Receta Completa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingView;
