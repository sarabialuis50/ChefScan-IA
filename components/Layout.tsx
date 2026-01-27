
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  activeNav?: string;
  onNavClick?: (view: any) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, showNav = true, activeNav, onNavClick }) => {
  return (
    <div className="flex flex-col min-h-screen w-full max-w-[430px] mx-auto bg-pure-black relative overflow-hidden font-body shadow-2xl">
      <main className="flex-1 w-full overflow-y-auto pb-24 custom-scrollbar">
        {children}
      </main>

      {showNav && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-black/95 backdrop-blur-xl border-t border-zinc-900 pb-10 pt-4 px-2 z-50">
          <div className="grid grid-cols-5 items-center h-16 relative">
            <NavItem
              icon="home"
              label="Inicio"
              active={activeNav === 'dashboard'}
              onClick={() => onNavClick?.('dashboard')}
            />
            <NavItem
              icon="favorite"
              label="Favoritas"
              active={activeNav === 'favorites'}
              onClick={() => onNavClick?.('favorites')}
            />

            {/* Placeholder for center space */}
            <div className="flex justify-center items-center">
              <div className="w-12 h-12"></div>
            </div>

            {/* Centered Floating Scanner Button */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-8 z-20">
              <button
                onClick={() => onNavClick?.('scanner')}
                className="w-[62px] h-[62px] bg-primary rounded-full flex items-center justify-center text-black shadow-[0_10px_30px_rgba(57,255,20,0.4)] border-[5px] border-pure-black transform active:scale-90 transition-all duration-300"
              >
                <span className="material-symbols-outlined text-[28px] font-black notranslate">photo_camera</span>
              </button>
            </div>

            <NavItem
              icon="inventory_2"
              label="Despensa"
              active={activeNav === 'inventory'}
              onClick={() => onNavClick?.('inventory')}
            />
            <NavItem
              icon="groups"
              label="Comunidad"
              active={activeNav === 'community'}
              onClick={() => onNavClick?.('community')}
            />
          </div>
        </nav>
      )}
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${active ? 'text-primary scale-110' : 'text-zinc-600'}`}
  >
    <span className={`material-symbols-outlined text-2xl notranslate ${active ? 'fill-icon' : ''}`}>
      {icon}
    </span>
    <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);
