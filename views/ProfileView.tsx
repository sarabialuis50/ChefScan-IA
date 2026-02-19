import React from 'react';

interface ProfileViewProps {
  user: any;
  stats: {
    recipes: number;
    inventory: number;
    generated: number;
  };
  onLogout: () => void;
  onEditProfile: () => void;
  onShowPremium: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, stats, onLogout, onEditProfile, onShowPremium }) => {
  return (
    <div className="flex flex-col pb-1">
      <nav style={{ borderColor: 'var(--card-border)' }} className="flex items-center justify-between p-6 border-b">
        <span className="material-symbols-outlined text-primary">arrow_back</span>
        <div>
          <h2 style={{ color: 'var(--text-main)' }} className="text-lg font-outfit font-bold uppercase tracking-tight">Mi Perfil</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">Resumen Chef</p>
        </div>
        <button
          onClick={onEditProfile}
          style={{ color: 'var(--text-main)' }}
          className="flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </nav>

      <header className="flex flex-col items-center p-8 space-y-6">
        <div className="relative">
          <div style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'var(--primary)' }} className="w-32 h-32 rounded-3xl border-2 p-1 group overflow-hidden">
            <img
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
              alt="Avatar"
              className="w-full h-full object-cover rounded-2xl group-hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div style={{ borderColor: 'var(--bg-app)' }} className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-xl text-black border-2 shadow-lg">
            <span className="material-symbols-outlined text-sm font-black">
              {user?.isPremium ? 'workspace_premium' : 'verified'}
            </span>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h3 style={{ color: 'var(--text-main)' }} className="text-3xl font-black font-outfit uppercase tracking-tighter">{user?.name}</h3>
          <p className="text-primary text-xs font-bold uppercase tracking-[0.2em]">{user?.email}</p>
          <p style={{ color: 'var(--text-muted)' }} className="text-[9px] font-bold uppercase tracking-widest pt-2 opacity-60">Miembro desde Diciembre 2023</p>
        </div>
      </header>

      <section className="px-6 grid grid-cols-3 gap-3">
        <StatCard value={stats.recipes.toString()} label="Colección" />
        <StatCard value={stats.inventory.toString()} label="Despensa" />
        <StatCard value={user?.isPremium ? 'PRO' : 'FREE'} label="Nivel" active={user?.isPremium} />
      </section>

      <section className="mt-10 px-6 space-y-6">
        <div className="space-y-4">
          <h3 style={{ color: 'var(--text-muted)', borderBottomColor: 'var(--card-border)' }} className="text-[10px] font-black uppercase tracking-[0.3em] pb-1 border-b">Suscripción</h3>

          <div className={`group flex items-center gap-4 px-5 py-5 justify-between rounded-3xl transition-all cursor-pointer ${user?.isPremium
            ? 'bg-primary/5 border border-primary/20 shadow-[0_0_20px_rgba(57,255,20,0.05)]'
            : 'border opacity-80'
            }`} style={{ backgroundColor: user?.isPremium ? 'transparent' : 'var(--bg-surface-soft)', borderColor: user?.isPremium ? 'var(--primary)' : 'var(--card-border)' }}>
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center rounded-2xl shrink-0 size-12 shadow-inner ${user?.isPremium ? 'bg-primary/20 text-primary' : 'bg-black/5 text-zinc-500'
                }`} style={{ backgroundColor: user?.isPremium ? 'transparent' : 'var(--bg-surface-inner)' }}>
                <span className="material-symbols-outlined text-2xl">
                  {user?.isPremium ? 'workspace_premium' : 'lock'}
                </span>
              </div>
              <div className="text-left">
                <p style={{ color: 'var(--text-main)' }} className="text-base font-bold uppercase tracking-tight">
                  {user?.isPremium ? 'Plan Premium Activo' : 'Versión Gratuita'}
                </p>
                <p className={`text-[10px] font-bold uppercase mt-0.5 ${user?.isPremium ? 'text-primary' : 'text-zinc-500'}`}>
                  {user?.isPremium ? 'Siguiente pago: 15 Feb' : 'Desbloquea funciones PRO'}
                </p>
              </div>
            </div>
            {!user?.isPremium && (
              <button
                onClick={onShowPremium}
                style={{ backgroundColor: 'var(--primary)', color: 'var(--text-on-primary)' }}
                className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 style={{ color: 'var(--text-muted)', borderBottomColor: 'var(--card-border)' }} className="text-[10px] font-black uppercase tracking-[0.3em] pb-1 border-b">Centro de Control</h3>
          <div style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }} className="rounded-[2rem] border overflow-hidden shadow-sm">
            <ProfileLink icon="account_circle" label="Editar Perfil" onClick={onEditProfile} />
            <ProfileLink icon="notifications" label="Notificaciones" />
            <ProfileLink icon="help" label="Soporte y Ayuda" />
            <ProfileLink icon="policy" label="Términos y Privacidad" />
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-5 rounded-[2rem] bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all text-red-500 group"
        >
          <div className="flex items-center justify-center rounded-2xl bg-red-500/10 shrink-0 size-10 group-hover:scale-95 transition-transform">
            <span className="material-symbols-outlined text-xl">logout</span>
          </div>
          <p className="text-sm font-black uppercase tracking-[0.2em]">Cerrar Sesión Segura</p>
        </button>
      </section>

      <div className="flex flex-col items-center gap-3 mt-12 mb-4 opacity-30">
        <img src="/chefbot_final.png" alt="ChefScan Logo" className="w-8 h-8 object-contain grayscale" />
        <p style={{ color: 'var(--text-muted)' }} className="text-center text-[8px] font-bold uppercase tracking-[0.4em]">ChefScan.IA — Premium Culinary System v2.5</p>
      </div>
    </div>
  );
};

const StatCard = ({ value, label, active }: { value: string; label: string, active?: boolean }) => (
  <div style={{ backgroundColor: active ? 'rgba(57,255,20,0.05)' : 'var(--bg-surface-soft)', borderColor: active ? 'rgba(57,255,20,0.3)' : 'var(--card-border)' }}
    className={`flex flex-col gap-1 rounded-3xl border p-4 items-center text-center transition-all ${active ? 'shadow-lg shadow-primary/5' : ''}`}>
    <p className={`text-2xl font-black font-outfit tracking-tighter ${active ? 'text-primary' : ''}`} style={{ color: active ? '#39FF14' : 'var(--text-main)' }}>{value}</p>
    <p style={{ color: 'var(--text-muted)' }} className="text-[8px] font-black uppercase tracking-[0.1em] opacity-60">{label}</p>
  </div>
);

const ProfileLink = ({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) => (
  <div
    onClick={onClick}
    style={{ borderBottomColor: 'var(--card-border)' }}
    className="group flex items-center gap-4 px-6 min-h-[64px] justify-between border-b last:border-none hover:bg-primary/5 transition-all cursor-pointer"
  >
    <div className="flex items-center gap-4">
      <div style={{ backgroundColor: 'var(--bg-surface-inner)' }} className="text-zinc-500 flex items-center justify-center rounded-xl shrink-0 size-10 group-hover:bg-primary/10 group-hover:text-primary transition-all">
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <p style={{ color: 'var(--text-main)' }} className="text-xs font-bold uppercase tracking-widest leading-none">{label}</p>
    </div>
    <span className="material-symbols-outlined text-zinc-600 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
  </div>
);

export default ProfileView;
