import React, { useState, useEffect } from 'react';

interface LandingViewProps {
  onStart: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onStart }) => {
  return (
    <div style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }} className="font-body antialiased min-h-screen overflow-x-hidden selection:bg-primary selection:text-black">
      {/* Custom Styles for Mobile and Desktop Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .neon-glow {
            box-shadow: 0 0 25px rgba(57, 255, 20, 0.4);
        }
        .bg-hero-image-custom {
            background-image: linear-gradient(to bottom, rgba(var(--bg-app-rgb), 0.85) 0%, rgba(var(--bg-app-rgb), 1) 100%), url(/portada-pc.png);
        }
        .dish-card-shadow {
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), 0 0 40px rgba(var(--primary-rgb), 0.15);
        }
        .scan-line-custom {
            height: 2px;
            background: linear-gradient(to right, transparent, #39FF14, transparent);
            box-shadow: 0 0 15px #39FF14;
            width: 100%;
            position: absolute;
            z-index: 30;
            top: 0;
            animation: scan_custom 3s ease-in-out infinite;
        }
        @keyframes scan_custom {
            0%, 100% { top: 10%; }
            50% { top: 90%; }
        }
        .connector-line-custom {
            width: 1px;
            height: 60px;
            background: linear-gradient(to top, #39FF14, transparent);
            transform: rotate(-45deg);
            transform-origin: bottom;
        }
        .floating-tag-custom {
            background: rgba(var(--bg-app-rgb), 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid var(--primary);
        }
      `}} />

      {/* Navigation (Desktop only) */}
      <nav style={{ backgroundColor: 'rgba(var(--bg-app-rgb), 0.8)', borderColor: 'var(--card-border)' }} className="fixed top-0 left-0 w-full z-50 px-6 py-4 sm:py-6 backdrop-blur-md border-b hidden lg:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer transition-all duration-300">
            <div className="relative">
              <div className="absolute -inset-2 bg-[#39FF14]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                src="/landing-logo.png"
                alt="ChefScan Logo"
                className="h-[42px] w-auto object-contain relative z-10"
              />
            </div>
            <div className="flex flex-col">
              <span style={{ color: 'var(--text-main)' }} className="font-display font-black text-2xl tracking-tighter leading-none">
                ChefScan<span className="text-primary">.IA</span>
              </span>
              <span style={{ color: 'var(--text-muted)' }} className="text-[8px] font-black uppercase tracking-[0.3em] mt-0.5">Premium Kitchen IA</span>
            </div>
          </div>
          <button style={{ backgroundColor: 'var(--primary)' }} className="px-5 py-2 text-black rounded-full text-xs font-bold hover:brightness-110 transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
            Descargar App
          </button>
        </div>
      </nav>

      <main className="relative lg:pt-24 lg:pb-20">
        {/* --- MOBILE VERSION (HIDDEN ON LG) --- */}
        <div style={{ backgroundColor: 'var(--bg-app)' }} className="lg:hidden relative flex min-h-screen w-full flex-col overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-hero-image-custom bg-cover bg-center opacity-40"></div>
            <div className="absolute top-[-5%] right-[-10%] w-[80%] h-[40%] bg-[#39FF14]/10 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-[10%] left-[-20%] w-[80%] h-[40%] bg-[#39FF14]/5 blur-[100px] rounded-full"></div>
          </div>

          {/* Mobile Header/Logo */}
          <div className="relative z-20 flex flex-col items-center pt-12 px-6 w-full">
            <div className="flex flex-col items-center gap-2">
              <div style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'rgba(var(--primary-rgb), 0.3)' }} className="w-14 h-14 rounded-2xl flex items-center justify-center neon-glow border overflow-hidden">
                <img src="/landing-logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              </div>
              <h2 style={{ color: 'var(--text-main)' }} className="text-2xl font-bold tracking-tighter drop-shadow-lg mt-2">
                Chef<span className="text-primary">Scan.IA</span>
              </h2>
            </div>
          </div>

          {/* Mobile Central Card */}
          <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-4">
            <div className="relative w-full glass-card rounded-[2.5rem] p-4 dish-card-shadow flex flex-col border-[#39FF14]/20">
              <div className="relative flex-1 aspect-[4/4.5] rounded-3xl overflow-hidden mb-4 bg-[#111] border border-white/10">
                <img
                  alt="Scan preview"
                  className="w-full h-full object-cover opacity-90"
                  src="/landing-avocado.png"
                />
                <div className="absolute inset-0 bg-black/5"></div>
                <div className="scan-line-custom"></div>
                {/* Manual overlays removed since they are included in the 'landing-avocado.png' image */}
              </div>

              <div className="space-y-4 px-2 pb-2 text-center">
                <div className="flex justify-center items-center gap-2">
                  <h3 style={{ color: 'var(--text-main)' }} className="text-xl font-bold tracking-tight">Ingrediente Detectado</h3>
                  <span className="material-symbols-outlined text-primary text-lg notranslate">check_circle</span>
                </div>
                <div className="flex justify-center items-center gap-1.5 overflow-hidden">
                  <span className="text-[9px] flex-1 py-1.5 bg-white/5 rounded-full text-white/70 border border-white/5 font-medium uppercase tracking-wider whitespace-nowrap">98% Match</span>
                  <span className="text-[9px] flex-1 py-1.5 bg-white/5 rounded-full text-white/70 border border-white/5 font-medium uppercase tracking-wider whitespace-nowrap">Orgánico</span>
                  <span className="text-[9px] flex-1 py-1.5 bg-white/5 rounded-full text-white/70 border border-white/5 font-medium uppercase tracking-wider whitespace-nowrap">Grasas Saludables</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Footer/Buttons */}
          <div className="relative z-20 flex flex-col px-6 pb-12 w-full gap-8">
            <div className="text-center space-y-3">
              <h1 style={{ color: 'var(--text-main)' }} className="text-3xl font-display font-bold leading-tight tracking-tight px-2 uppercase">
                Reconocimiento de<br />
                <span className="text-primary italic">precisión IA</span>
              </h1>
              <p style={{ color: 'var(--text-muted)' }} className="text-sm leading-relaxed max-w-[280px] mx-auto">
                Apunta tu cámara a cualquier ingrediente y descubre infinitas posibilidades culinarias.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={onStart}
                style={{ backgroundColor: 'var(--primary)' }}
                className="flex h-16 w-full items-center justify-center rounded-full text-black text-lg font-black tracking-widest uppercase neon-glow hover:brightness-110 active:scale-[0.98] transition-all border-none"
              >
                Comenzar ahora
              </button>
              <button
                onClick={onStart}
                style={{ color: 'var(--text-main)', borderColor: 'var(--card-border)' }}
                className="flex h-16 w-full items-center justify-center rounded-full bg-transparent border-2 text-lg font-bold tracking-widest uppercase hover:bg-white/5 active:scale-[0.98] transition-all backdrop-blur-sm"
              >
                Ya tengo una cuenta
              </button>
            </div>
          </div>
        </div>

        {/* --- DESKTOP VERSION (AS BEFORE) --- */}
        <div className="hidden lg:block relative">
          {/* Background / Overlay for Desktop */}
          <div className="fixed inset-0 z-0 text-left">
            <div className="absolute inset-0">
              <img
                src="/portada-pc.png"
                alt="ChefScan PC Background"
                className="w-full h-full object-cover opacity-15"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/95 to-[#0A0A0A]"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
              {/* Left Column: Text Content */}
              <div className="lg:col-span-7 space-y-10 lg:sticky lg:top-32 text-left">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-xl border border-[#39FF14]/20">
                    <span className="flex h-2 w-2 rounded-full bg-[#39FF14] animate-pulse"></span>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#39FF14]">Tecnología de Visión IA</span>
                  </div>

                  <div className="space-y-6">
                    <h1 style={{ color: 'var(--text-main)' }} className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl leading-[1.1] tracking-tight">
                      Transforma tus <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39FF14] to-green-400 [text-shadow:0_0_20px_rgba(57,255,20,0.4)]">ingredientes</span> <br />
                      en obras maestras.
                    </h1>

                    <p style={{ color: 'var(--text-muted)' }} className="text-lg sm:text-xl leading-relaxed font-light max-w-xl">
                      Nuestra IA avanzada reconoce visualmente lo que tienes en tu cocina y diseña recetas gourmet personalizadas en segundos.
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={onStart}
                      style={{ backgroundColor: 'var(--primary)' }}
                      className="w-full sm:w-auto px-8 py-6 text-black hover:brightness-110 transition-all duration-300 rounded-2xl shadow-2xl shadow-[#39FF14]/30 font-bold text-lg flex items-center justify-center group border-none"
                    >
                      Comenzar ahora
                      <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform h-6 w-6 notranslate text-black">arrow_forward</span>
                    </button>
                    <button
                      onClick={onStart}
                      style={{ color: 'var(--text-main)', borderColor: 'var(--card-border)' }}
                      className="w-full sm:w-auto px-8 py-6 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 rounded-2xl font-bold text-lg border"
                    >
                      Ya tengo una cuenta
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-8 flex items-center gap-10 border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold text-white tracking-widest leading-none mb-1">98%</span>
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Precisión IA</span>
                  </div>
                  <div className="w-px h-12 bg-white/10"></div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold text-white tracking-widest leading-none mb-1">500k+</span>
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Recetas Creadas</span>
                  </div>
                </div>
              </div>

              {/* Right Column: iPhone Mockup */}
              <div className="lg:col-span-5 flex justify-center items-center relative py-10 lg:py-0">
                <div className="absolute w-[500px] h-[500px] bg-[#39FF14]/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>

                {/* iPhone Mockup Frame */}
                <div className="relative mx-auto border-[10px] border-zinc-800 rounded-[3.5rem] h-[640px] w-[310px] shadow-[0_0_60px_-15px_rgba(57,255,20,0.25),inset_0_0_2px_2px_rgba(255,255,255,0.1)] bg-black overflow-hidden group">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-zinc-800 rounded-b-3xl z-20"></div>

                  <div className="p-6 h-full flex flex-col bg-[#0A0A0A] overflow-y-auto custom-scrollbar">
                    {/* Header Mockup */}
                    <div className="flex justify-between items-center mt-8 mb-8 text-left">
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Bienvenido</p>
                        <h3 className="text-2xl font-bold text-white">Chef <span className="text-[#39FF14]">John</span></h3>
                      </div>
                      <div className="w-11 h-11 rounded-2xl bg-[#161616] border border-white/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#39FF14] h-5 w-5 notranslate">notifications</span>
                      </div>
                    </div>

                    {/* Scan Preview Mockup */}
                    <div className="relative rounded-[2rem] overflow-hidden mb-6 aspect-[4/5] bg-[#161616] border border-white/10 group shadow-2xl">
                      <img
                        alt="Scan preview"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform group-hover:scale-110 duration-1000"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwDtYbKrZNV6TF4H8yqRkaG2EubCEiRIeEuHUNeBX3-TMnG_UGhfZ9Prohd3Xah0B5SNeAmIe4-AZ26K6YtujiDhtwEWTUa0Y9_O4eZq5fNTsORWqvW9xdw9_x88D_Dm4NLoZNMHwsnVt1-bueiiEnURd6OxM71FluHkFJPyjXTwAXQDLMT-hAoycZrIrav8yLh2diVnNcl7Vk4_X3YUixmFHIfXdMRT2Z6APMbVBopCscaHZ5SxiW88l2-bZyrcrSaR5bnyaWbCU"
                      />

                      {/* Esquinas Premium Neón (Mockup) */}
                      <div className="absolute inset-4 z-10">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#39FF14] rounded-tl-2xl shadow-[0_0_15px_rgba(57,255,20,0.5)]" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-[#39FF14] rounded-tr-2xl shadow-[0_0_15px_rgba(57,255,20,0.5)]" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-[#39FF14] rounded-bl-2xl shadow-[0_0_15px_rgba(57,255,20,0.5)]" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-[#39FF14] rounded-br-2xl shadow-[0_0_15px_rgba(57,255,20,0.5)]" />
                      </div>

                      {/* Línea Láser Animation (Mockup) */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#39FF14] to-transparent shadow-[0_0_20px_rgba(57,255,20,1)] animate-scan_custom z-20" />

                      <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
                        <div className="bg-[#39FF14]/20 backdrop-blur-md px-4 py-2 rounded-full border border-[#39FF14]/50 mb-2 animate-pulse">
                          <span className="text-xs font-black text-[#39FF14] tracking-widest uppercase">ESCANEANDO...</span>
                        </div>
                      </div>
                    </div>

                    {/* Ingredients Mockup */}
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-1 text-left whitespace-nowrap">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-normal">Ingredientes Detectados:</h4>
                        <span className="text-[10px] text-[#39FF14] font-bold tracking-normal">4 encontrados</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="bg-[#161616] p-3 rounded-2xl border border-white/5 flex items-center gap-3">
                          <div className="w-7 h-7 bg-[#39FF14]/10 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#39FF14] h-4 w-4 notranslate">restaurant</span>
                          </div>
                          <span className="text-[10px] font-semibold text-white">Aguacate</span>
                        </div>
                        <div className="bg-[#161616] p-3 rounded-2xl border border-white/5 flex items-center gap-3">
                          <div className="w-7 h-7 bg-[#39FF14]/10 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#39FF14] h-4 w-4 notranslate">egg</span>
                          </div>
                          <span className="text-[10px] font-semibold text-white">Huevos</span>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation Card Mockup */}
                    <div className="bg-gradient-to-br from-[#39FF14]/30 to-[#161616] p-5 rounded-3xl border border-[#39FF14]/30 shadow-xl mt-auto transition-transform hover:-translate-y-1 text-left">
                      <div className="flex items-center gap-2 mb-3 whitespace-nowrap">
                        <span className="material-symbols-outlined text-[#39FF14] text-lg animate-spin-slow notranslate">auto_awesome</span>
                        <p className="text-[10px] font-bold text-[#39FF14] uppercase tracking-normal">Recomendación ChefScan.IA</p>
                      </div>
                      <h4 className="text-lg font-bold mb-2 text-white leading-tight">Tostada de Aguacate Gourmet</h4>
                      <div className="flex items-center gap-4 mb-5">
                        <div className="flex items-center gap-1.5 opacity-60">
                          <span className="material-symbols-outlined text-[13px] notranslate">schedule</span>
                          <span className="text-[11px] font-medium text-gray-400">15 min</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[13px] text-[#39FF14] notranslate fill-icon">signal_cellular_alt</span>
                          <span className="text-[11px] font-medium text-gray-400">Fácil</span>
                        </div>
                      </div>
                      <button className="w-full py-3 bg-[#39FF14] text-black rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all border-none">
                        Ver Receta Completa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Persistent Background Effects (Desktop) */}
      <div className="hidden lg:block">
        <div className="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-[#39FF14]/5 rounded-full blur-[150px] animate-pulse"></div>
        <div className="fixed bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-[#39FF14]/5 rounded-full blur-[150px]"></div>
      </div>
    </div>
  );
};

export default LandingView;
