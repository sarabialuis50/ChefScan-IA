
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  activeNav?: string;
  onNavClick?: (view: any) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, showNav = true, activeNav, onNavClick }) => {
  return (
    <div className="flex flex-col h-screen w-full max-w-[430px] mx-auto bg-pure-black relative overflow-hidden font-body shadow-2xl"
      style={{ backgroundColor: 'var(--bg-app)' }}>
      <main className="flex-1 w-full overflow-y-auto pb-24 custom-scrollbar">
        {children}
      </main>

      {showNav && (
        <nav
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--card-border)'
          }}
          className="absolute bottom-[4px] left-1/2 -translate-x-1/2 w-full max-w-[430px] flex justify-around items-center h-20 px-6 z-40 transition-colors shadow-[0_-4px_20px_rgba(0,0,0,0.5)] rounded-2xl"
        >
          <NavItem
            active={activeNav === 'dashboard' || activeNav === 'results'}
            icon="home"
            label="Inicio"
            onClick={() => onNavClick?.('dashboard')}
          />
          <NavItem
            active={activeNav === 'favorites'}
            icon="favorite"
            label="Favoritas"
            onClick={() => onNavClick?.('favorites')}
          />

          <div className="w-16 h-16 -mt-12 bg-primary rounded-full flex items-center justify-center p-3 shadow-[0_0_25px_rgba(57,255,20,0.6)] border-[3px] border-[#000] active:scale-95 transition-all cursor-pointer z-50"
            onClick={() => onNavClick?.('scanner')}>
            <span className="material-symbols-outlined text-black text-3xl font-black">photo_camera</span>
          </div>

          <NavItem
            active={activeNav === 'inventory'}
            icon="inventory_2"
            label="Despensa"
            onClick={() => onNavClick?.('inventory')}
          />
          <NavItem
            active={activeNav === 'community' || activeNav === 'explore'}
            icon="groups"
            label="Comunidad"
            onClick={() => onNavClick?.('community')}
          />
        </nav>
      )}
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1 transition-all active:scale-95"
  >
    <span className={`material-symbols-outlined text-2xl notranslate ${active ? 'text-primary fill-icon' : 'text-zinc-500'}`}
      style={{ color: active ? '#39FF14' : 'var(--text-muted)' }}>
      {icon}
    </span>
    <span style={{ color: active ? '#39FF14' : 'var(--text-muted)' }}
      className="text-[9px] font-bold uppercase tracking-widest mt-1">
      {label}
    </span>
  </button>
);
