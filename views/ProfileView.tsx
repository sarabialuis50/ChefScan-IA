import React from 'react';

interface ProfileViewProps {
  user: any;
  onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout }) => {
  return (
    <div className="flex flex-col pb-24">
      <nav className="flex items-center justify-between p-6 border-b border-white/5">
        <span className="material-symbols-outlined text-zinc-500">arrow_back_ios</span>
        <h2 className="text-lg font-outfit font-bold uppercase tracking-tight">Mi Perfil</h2>
        <button className="flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </nav>

      <header className="flex flex-col items-center p-8 space-y-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-3xl border-2 border-primary p-1 bg-zinc-900 group overflow-hidden">
            <img
              src={`https://picsum.photos/seed/${user?.email}/200/200?grayscale`}
              alt="Avatar"
              className="w-full h-full object-cover rounded-2xl group-hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-xl text-black border-2 border-pure-black shadow-lg">
            <span className="material-symbols-outlined text-sm font-black">
              {user?.isPremium ? 'workspace_premium' : 'verified'}
            </span>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-3xl font-black font-outfit uppercase tracking-tighter text-white">{user?.name}</h3>
          <p className="text-primary text-xs font-bold uppercase tracking-[0.2em]">{user?.email}</p>
          <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest pt-2">Miembro desde Diciembre 2023</p>
        </div>
      </header>

      <section className="px-6 grid grid-cols-3 gap-3">
        <StatCard value="12" label="Recetas" />
        <StatCard value="48" label="Escaneos" />
        <StatCard value={user?.isPremium ? 'PRO' : 'FREE'} label="Nivel" active={user?.isPremium} />
      </section>

      <section className="mt-10 px-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] pb-1 border-b border-white/5">Suscripción</h3>

          <div className={`group flex items-center gap-4 px-5 py-5 justify-between rounded-3xl transition-all cursor-pointer ${user?.isPremium
            ? 'bg-primary/5 border border-primary/20 shadow-[0_0_20px_rgba(57,255,20,0.05)]'
            : 'bg-zinc-900/50 border border-white/5 opacity-80'
            }`}>
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center rounded-2xl shrink-0 size-12 shadow-inner ${user?.isPremium ? 'bg-primary/20 text-primary' : 'bg-white/5 text-zinc-500'
                }`}>
                <span className="material-symbols-outlined text-2xl">
                  {user?.isPremium ? 'workspace_premium' : 'lock'}
                </span>
              </div>
              <div className="text-left">
                <p className="text-white text-base font-bold uppercase tracking-tight">
                  {user?.isPremium ? 'Plan Premium Activo' : 'Versión Gratuita'}
                </p>
                <p className={`text-[10px] font-bold uppercase mt-0.5 ${user?.isPremium ? 'text-primary' : 'text-zinc-500'}`}>
                  {user?.isPremium ? 'Siguiente pago: 15 Feb' : 'Desbloquea funciones PRO'}
                </p>
              </div>
            </div>
            {!user?.isPremium && (
              <button className="bg-primary text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                Upgrade
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] pb-1 border-b border-white/5">Centro de Control</h3>
          <div className="bg-zinc-900/30 rounded-[2rem] border border-white/5 overflow-hidden">
            <ProfileLink icon="account_circle" label="Editar Perfil" />
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
        <p className="text-center text-[8px] text-zinc-700 font-bold uppercase tracking-[0.4em]">ChefScan.IA — Premium Culinary System v2.5</p>
      </div>
    </div>
  );
};

const StatCard = ({ value, label, active }: { value: string; label: string, active?: boolean }) => (
  <div className={`flex flex-col gap-1 rounded-3xl border p-4 items-center text-center transition-all ${active ? 'border-primary/30 bg-primary/5 shadow-lg shadow-primary/5' : 'border-white/5 bg-zinc-900/50'
    }`}>
    <p className={`text-2xl font-black font-outfit tracking-tighter ${active ? 'text-primary' : 'text-white'}`}>{value}</p>
    <p className="text-zinc-500 text-[8px] font-black uppercase tracking-[0.1em]">{label}</p>
  </div>
);

const ProfileLink = ({ icon, label }: { icon: string; label: string }) => (
  <div className="group flex items-center gap-4 px-6 min-h-[64px] justify-between border-b border-white/5 last:border-none hover:bg-white/5 transition-all cursor-pointer">
    <div className="flex items-center gap-4">
      <div className="text-zinc-500 flex items-center justify-center rounded-xl bg-white/5 shrink-0 size-10 group-hover:bg-primary/10 group-hover:text-primary transition-all">
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <p className="text-white text-xs font-bold uppercase tracking-widest leading-none">{label}</p>
    </div>
    <span className="material-symbols-outlined text-zinc-600 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
  </div>
);

export default ProfileView;
