import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import PremiumModal from '../components/PremiumModal';

interface SettingsViewProps {
    onBack: () => void;
    user: any;
    onUpdateUser: (updates: any) => void;
    onLogout: () => void;
    stats: {
        recipes: number;
        favorites: number;
        generated: number;
    };
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, user, onUpdateUser, onLogout, stats }) => {
    const [notifications, setNotifications] = useState(true);
    const [autoSave, setAutoSave] = useState(false);
    const [language, setLanguage] = useState('Español');
    const [showGoalInfo, setShowGoalInfo] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    // Detailed Notifications State
    const [notifSettings, setNotifSettings] = useState({
        suggestedRecipes: true,
        favoritesUpdates: true,
        pushAlerts: true,
        activityEmails: false,
        weeklySummary: false,
        whatsapp: false
    });

    // Privacy State
    const [privacySettings, setPrivacySettings] = useState({
        publicProfile: false,
        showGeneratedRecipes: true,
        showFavorites: false,
        usageAnalytics: true
    });

    const [showCulinaryModal, setShowCulinaryModal] = useState(false);
    const [culinarySettings, setCulinarySettings] = useState({
        diet: 'ninguna',
        restrictions: [] as string[],
        detailedAllergies: user?.allergies || []
    });

    // Profile Edit State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editEmail, setEditEmail] = useState(user?.email || '');
    const [editPhone, setEditPhone] = useState(user?.phone || '');
    const [editBio, setEditBio] = useState(user?.bio || '');

    const [tempAllergies, setTempAllergies] = useState(user?.allergies?.join(', ') || '');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditingProfile) {
            setEditName(user?.name || '');
            setEditEmail(user?.email || '');
            setEditPhone(user?.phone || '');
            setEditBio(user?.bio || '');
        }
    }, [isEditingProfile, user]);

    const handleSaveProfile = () => {
        onUpdateUser({
            name: editName,
            phone: editPhone,
            bio: editBio
        });
        setIsEditingProfile(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            onUpdateUser({ avatarUrl: publicUrl });
        }
        setUploading(false);
    };

    const handleAllergyBlur = () => {
        const allergies = tempAllergies.split(',').map(a => a.trim()).filter(a => a !== '');
        onUpdateUser({ allergies });
    };

    return (
        <div className="flex flex-col bg-pure-black min-h-screen p-6 space-y-8 pb-32">
            <header className="flex items-center gap-4 pt-2">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-primary">arrow_back</span>
                </button>
                <h1 className="text-white font-bold text-xl uppercase tracking-wider font-outfit">Configuración<span className="text-primary">.IA</span></h1>
            </header>

            <section className="flex flex-col items-center gap-6 py-4">
                <div className="relative">
                    <div className="w-28 h-28 rounded-full border-2 border-primary/30 overflow-hidden bg-zinc-900 flex items-center justify-center shadow-2xl shadow-primary/20">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-5xl text-white">person</span>
                            </div>
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                    {/* Badge de Verificado / Premium */}
                    <div className="absolute bottom-1 right-1 w-8 h-8 bg-zinc-900 rounded-full border-2 border-pure-black flex items-center justify-center">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-glow">
                            <span className="material-symbols-outlined text-black text-[14px] font-bold">check</span>
                        </div>
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute top-0 right-0 w-8 h-8 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-white active:scale-95 transition-all shadow-lg"
                    >
                        <span className="material-symbols-outlined text-sm">photo_camera</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarUpload}
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                <div className="text-center space-y-1">
                    <h2 className="text-white font-black text-2xl tracking-tight font-outfit">{user?.name || 'Chef Usuario'}</h2>
                    <p className="text-zinc-500 text-xs font-medium max-w-[200px] leading-relaxed">
                        {user?.bio || 'Sin biografía definida'}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-8 pt-2">
                    <div className="text-center">
                        <p className="text-primary font-black text-lg">{stats.recipes}</p>
                        <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Despensa</p>
                    </div>
                    <div className="text-center border-x border-white/5 px-8">
                        <p className="text-primary font-black text-lg">{stats.favorites}</p>
                        <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Favoritas</p>
                    </div>
                    <div className="text-center">
                        <p className="text-primary font-black text-lg">{stats.generated}</p>
                        <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Generadas</p>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-primary text-[10px] font-black uppercase tracking-[0.3em] pb-1 border-b border-primary/10">Cuenta</h3>

                    <button
                        onClick={() => setIsEditingProfile(true)}
                        className="w-full p-4 rounded-3xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all flex items-center justify-between active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-glow">
                                <span className="material-symbols-outlined">person</span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-bold uppercase tracking-tight">Editar Perfil</p>
                                <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest">Nombre, Bio y Datos</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-zinc-600">chevron_right</span>
                    </button>

                    <button
                        onClick={() => setShowNotificationsModal(true)}
                        className="w-full p-4 rounded-3xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all flex items-center justify-between active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-glow">
                                <span className="material-symbols-outlined">notifications</span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-bold uppercase tracking-tight">Notificaciones</p>
                                <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest">Configura tus alertas</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-zinc-600">chevron_right</span>
                    </button>

                    <button
                        onClick={() => setShowPrivacyModal(true)}
                        className="w-full p-4 rounded-3xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all flex items-center justify-between active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-glow">
                                <span className="material-symbols-outlined">shield</span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-bold uppercase tracking-tight">Privacidad</p>
                                <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest">Controla tus datos</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-zinc-600">chevron_right</span>
                    </button>
                </div>

                <div className="space-y-4">
                    <h3 className="text-primary text-[10px] font-black uppercase tracking-[0.3em] pb-1 border-b border-primary/10">Preferencias IA</h3>

                    <button
                        onClick={() => setShowCulinaryModal(true)}
                        className="w-full p-4 rounded-3xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all flex items-center justify-between active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-glow">
                                <span className="material-symbols-outlined">restaurant_menu</span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-bold uppercase tracking-tight">Personalización Culinaria</p>
                                <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest">Dieta, Metas y Alergias</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-zinc-600">chevron_right</span>
                    </button>

                    <SettingToggle
                        icon="notifications_active"
                        title="Sugerencias Inteligentes"
                        description="Recibe alertas de ingredientes que combinan."
                        active={notifications}
                        onToggle={() => setNotifications(!notifications)}
                    />

                    <SettingToggle
                        icon="save"
                        title="Auto-guardar Recetas"
                        description="Guarda automáticamente platos de favoritos."
                        active={autoSave}
                        onToggle={() => setAutoSave(!autoSave)}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-primary text-[10px] font-black uppercase tracking-[0.3em] pb-1 border-b border-primary/10">Sistema</h3>

                    <button
                        onClick={() => !user?.isPremium && setShowPremiumModal(true)}
                        className={`w-full p-4 rounded-3xl border flex items-center justify-between transition-all ${user?.isPremium ? 'bg-zinc-900/40 border-white/5 cursor-default' : 'bg-primary/5 border-primary/20 hover:bg-primary/10 active:scale-[0.98]'}`}
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-glow">
                                <span className="material-symbols-outlined">verified_user</span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-bold uppercase tracking-tight">Estado: {user?.isPremium ? 'PREMIUM' : 'FREE'}</p>
                                <p className={`${user?.isPremium ? 'text-zinc-500' : 'text-primary'} text-[10px] font-black uppercase tracking-widest`}>
                                    {user?.isPremium ? 'Soporte Prioritario Activo' : 'Sube a Premium • $19.900/mes'}
                                </p>
                            </div>
                        </div>
                        {!user?.isPremium && <span className="material-symbols-outlined text-primary">chevron_right</span>}
                    </button>

                    {/* Soporte */}
                    <div className="w-full p-4 rounded-3xl border border-white/5 bg-zinc-900/40 flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-glow">
                                <span className="material-symbols-outlined">support_agent</span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-bold uppercase tracking-tight">Soporte</p>
                                <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest">¿Necesitas ayuda?</p>
                            </div>
                        </div>
                        <div className="grid gap-2 pl-14">
                            <a href="mailto:info@chefscania.com" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-xs">mail</span>
                                <span className="text-[10px] font-bold tracking-widest">info@chefscania.com</span>
                            </a>
                            <a href="https://wa.me/573017810256" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-green-400 transition-colors">
                                <span className="material-symbols-outlined text-xs">chat</span>
                                <span className="text-[10px] font-bold tracking-widest">+57 301 781 0256 (WhatsApp)</span>
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-3xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-glow">
                                <span className="material-symbols-outlined">language</span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-bold uppercase tracking-tight">Idioma</p>
                                <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest">{language}</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-zinc-600">expand_more</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-3xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-glow">
                                <span className="material-symbols-outlined">storage</span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-bold uppercase tracking-tight">Almacenamiento Local</p>
                                <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest">12.4 MB utilizados</p>
                            </div>
                        </div>
                        <button className="text-red-500 text-[9px] font-black uppercase tracking-widest bg-red-500/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all">Limpiar</button>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        onClick={onLogout}
                        className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        Cerrar Sesión del Terminal
                    </button>
                </div>
            </section>

            <div className="pt-10 flex flex-col items-center gap-2">
                <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.3em]">ChefScan IA Engine v2.5.4</p>
                <p className="text-[8px] text-zinc-800 font-bold uppercase tracking-[0.2em]">© 2024 DeepMind Inspired Agent</p>
            </div>

            {/* Goal Info Modal */}
            {showGoalInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-pure-black/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-sm h-[80vh] glass-card rounded-3xl p-8 border-primary/30 flex flex-col gap-6 relative overflow-hidden">
                        {/* Background Splashes */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

                        <div className="flex justify-between items-center relative z-10">
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white">
                                META DEL <span className="text-primary">CHEFBOT</span>
                            </h3>
                            <button onClick={() => setShowGoalInfo(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <div className="flex-1 space-y-4 relative z-10 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                                Esta configuración le da un "contexto" permanente al ChefBot. Define cómo la IA prioriza y selecciona las recetas para ti.
                            </p>

                            <div className="space-y-4 pt-2">
                                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-primary text-sm">fitness_center</span>
                                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">Bajar de Peso</h4>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                                        La IA priorizará recetas bajas en calorías, ricas en fibra y con porciones controladas. Al sugerir ingredientes o platos, buscará opciones ligeras y saciantes.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-primary text-sm">bolt</span>
                                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">Ganar Músculo</h4>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                                        El ChefBot se enfocará en recetas con alto contenido proteico. Buscará ingredientes como carnes magras, huevos, legumbres y te sugerirá comidas ideales para el post-entrenamiento.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">Ahorrar Tiempo</h4>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                                        La IA buscará recetas "express". Priorizará platos que se puedan cocinar en menos de 20 minutos, con menos pasos de preparación y utilizando técnicas de cocina rápida.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-primary text-sm">restaurant</span>
                                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">Gourmet / Explorar</h4>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                                        Aquí la IA se pone creativa. Te sugerirá combinaciones de sabores más atrevidas, técnicas de cocina más refinadas y platos visualmente impresionantes, ideal para cuando quieres cocinar algo especial.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowGoalInfo(false)}
                            className="w-full py-3 bg-primary text-black rounded-xl font-black uppercase text-xs tracking-widest shadow-glow relative z-10 flex-shrink-0"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {isEditingProfile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pure-black/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-sm h-auto max-h-[85vh] glass-card rounded-[2.5rem] p-6 border-primary/30 flex flex-col relative overflow-hidden shadow-2xl">
                        {/* Background Splashes */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

                        {/* Header */}
                        <div className="flex items-center justify-center relative z-10 mb-6 flex-shrink-0">
                            <h3 className="text-white font-bold text-lg uppercase tracking-wider font-outfit">Información Personal</h3>
                            <button
                                onClick={() => setIsEditingProfile(false)}
                                className="absolute -top-1 -right-1 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-90 transition-all z-20"
                            >
                                <span className="material-symbols-outlined text-zinc-400 text-lg">close</span>
                            </button>
                        </div>

                        {/* Content Area - Scrollable */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 relative z-10 px-1">
                            <div className="flex justify-center mb-2">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full border-2 border-primary/30 overflow-hidden bg-black flex items-center justify-center shadow-neon-glow">
                                        {user?.avatarUrl ? (
                                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-4xl text-zinc-700">person</span>
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black shadow-lg border-2 border-pure-black active:scale-95 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-zinc-500 text-[9px] font-black uppercase tracking-widest block ml-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-4 px-4 text-xs text-white focus:border-primary/40 outline-none transition-all"
                                        placeholder="Tu nombre aquí"
                                    />
                                </div>

                                <div className="space-y-2 opacity-50">
                                    <label className="text-zinc-500 text-[9px] font-black uppercase tracking-widest block ml-1">Email (No Editable)</label>
                                    <input
                                        type="email"
                                        value={editEmail}
                                        disabled
                                        className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-4 px-4 text-xs text-zinc-500 cursor-not-allowed"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-zinc-500 text-[9px] font-black uppercase tracking-widest block ml-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={editPhone}
                                        onChange={(e) => setEditPhone(e.target.value)}
                                        className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-4 px-4 text-xs text-white focus:border-primary/40 outline-none transition-all"
                                        placeholder="+52 000 000 0000"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-zinc-500 text-[9px] font-black uppercase tracking-widest block ml-1">Biografía</label>
                                    <textarea
                                        value={editBio}
                                        onChange={(e) => setEditBio(e.target.value.slice(0, 50))}
                                        maxLength={50}
                                        className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-4 px-4 text-xs text-white focus:border-primary/40 outline-none transition-all min-h-[80px] resize-none"
                                        placeholder="Cuéntanos un poco sobre tus gustos culinarios..."
                                    />
                                    <p className="text-[9px] text-zinc-600 font-medium uppercase tracking-widest text-right">{editBio.length}/50</p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 pb-10">
                                <button
                                    onClick={() => setIsEditingProfile(false)}
                                    className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 active:scale-95 transition-all text-center"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    className="flex-1 py-4 bg-primary text-black rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-glow hover:scale-[1.02] active:scale-95 transition-all text-center"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications Modal */}
            {showNotificationsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pure-black/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-sm h-auto max-h-[85vh] glass-card rounded-[2.5rem] p-6 border-primary/30 flex flex-col relative overflow-hidden shadow-2xl">
                        {/* Background Splashes */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

                        {/* Header */}
                        <div className="flex items-center justify-center relative z-10 mb-6 flex-shrink-0">
                            <h3 className="text-white font-bold text-lg uppercase tracking-wider font-outfit">Notificaciones<span className="text-primary">.IA</span></h3>
                            <button
                                onClick={() => setShowNotificationsModal(false)}
                                className="absolute -top-1 -right-1 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-90 transition-all z-20"
                            >
                                <span className="material-symbols-outlined text-zinc-400 text-lg">close</span>
                            </button>
                        </div>

                        {/* Content Area - Scrollable */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 relative z-10 px-1">
                            <div className="space-y-3">
                                <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Push & Alertas</h4>
                                <SettingToggle
                                    icon="fastfood"
                                    title="Recetas Sugeridas"
                                    description="Basadas en tus ingredientes."
                                    active={notifSettings.suggestedRecipes}
                                    onToggle={() => setNotifSettings({ ...notifSettings, suggestedRecipes: !notifSettings.suggestedRecipes })}
                                />
                                <SettingToggle
                                    icon="favorite"
                                    title="Actualizaciones Favoritos"
                                    description="Nuevas versiones de tus platos."
                                    active={notifSettings.favoritesUpdates}
                                    onToggle={() => setNotifSettings({ ...notifSettings, favoritesUpdates: !notifSettings.favoritesUpdates })}
                                />
                                <SettingToggle
                                    icon="notifications_active"
                                    title="Alertas Globales"
                                    description="Novedades de la plataforma."
                                    active={notifSettings.pushAlerts}
                                    onToggle={() => setNotifSettings({ ...notifSettings, pushAlerts: !notifSettings.pushAlerts })}
                                />
                            </div>

                            <div className="space-y-3 pt-4">
                                <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Correo Electrónico</h4>
                                <SettingToggle
                                    icon="mail"
                                    title="Emails de Actividad"
                                    description="Resumen de tus logros semanales."
                                    active={notifSettings.activityEmails}
                                    onToggle={() => setNotifSettings({ ...notifSettings, activityEmails: !notifSettings.activityEmails })}
                                />
                                <SettingToggle
                                    icon="analytics"
                                    title="Resumen Semanal"
                                    description="Tus estadísticas de cocina."
                                    active={notifSettings.weeklySummary}
                                    onToggle={() => setNotifSettings({ ...notifSettings, weeklySummary: !notifSettings.weeklySummary })}
                                />
                                <SettingToggle
                                    icon="chat"
                                    title="WhatsApp"
                                    description="Recibe recetas y alertas por mensaje."
                                    active={notifSettings.whatsapp}
                                    onToggle={() => setNotifSettings({ ...notifSettings, whatsapp: !notifSettings.whatsapp })}
                                />
                            </div>

                            <div className="flex gap-3 pt-8 pb-10">
                                <button
                                    onClick={() => setShowNotificationsModal(false)}
                                    className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 active:scale-95 transition-all text-center"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => setShowNotificationsModal(false)}
                                    className="flex-1 py-4 bg-primary text-black rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-glow hover:scale-[1.02] active:scale-95 transition-all text-center"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Privacy Modal */}
            {showPrivacyModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pure-black/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-sm h-auto max-h-[85vh] glass-card rounded-[2.5rem] p-6 border-primary/30 flex flex-col relative overflow-hidden shadow-2xl">
                        {/* Background Splashes */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

                        {/* Header */}
                        <div className="flex items-center justify-center relative z-10 mb-6 flex-shrink-0">
                            <h3 className="text-white font-bold text-lg uppercase tracking-wider font-outfit">Privacidad</h3>
                            <button
                                onClick={() => setShowPrivacyModal(false)}
                                className="absolute -top-1 -right-1 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-90 transition-all z-20"
                            >
                                <span className="material-symbols-outlined text-zinc-400 text-lg">close</span>
                            </button>
                        </div>

                        {/* Content Area - Scrollable */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 relative z-10 px-1">
                            <div className="space-y-4">
                                <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Visibilidad del Perfil</h4>
                                <SettingToggle
                                    icon="public"
                                    title="Perfil Público"
                                    description="Otros pueden ver tus estadísticas."
                                    active={privacySettings.publicProfile}
                                    onToggle={() => setPrivacySettings({ ...privacySettings, publicProfile: !privacySettings.publicProfile })}
                                />
                                <SettingToggle
                                    icon="auto_awesome"
                                    title="Mostrar Recetas IA"
                                    description="Tus creaciones visibles en el feed."
                                    active={privacySettings.showGeneratedRecipes}
                                    onToggle={() => setPrivacySettings({ ...privacySettings, showGeneratedRecipes: !privacySettings.showGeneratedRecipes })}
                                />
                                <SettingToggle
                                    icon="star"
                                    title="Mostrar Favoritos"
                                    description="Tu colección visible a amigos."
                                    active={privacySettings.showFavorites}
                                    onToggle={() => setPrivacySettings({ ...privacySettings, showFavorites: !privacySettings.showFavorites })}
                                />
                            </div>

                            <div className="space-y-4 pt-4">
                                <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Datos y Análisis</h4>
                                <SettingToggle
                                    icon="insights"
                                    title="Analítica de Uso"
                                    description="Ayúdanos a mejorar el ChefBot."
                                    active={privacySettings.usageAnalytics}
                                    onToggle={() => setPrivacySettings({ ...privacySettings, usageAnalytics: !privacySettings.usageAnalytics })}
                                />
                            </div>

                            <div className="p-4 rounded-3xl border border-white/5 bg-zinc-900/40 space-y-3 mt-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">info</span>
                                    <h5 className="text-[11px] text-white font-bold uppercase tracking-widest">Tu seguridad primero</h5>
                                </div>
                                <p className="text-[9px] text-zinc-500 leading-relaxed font-medium">
                                    En ChefScan IA, tus datos están cifrados de extremo a extremo. Nunca vendemos tu información personal a terceros.
                                </p>
                            </div>

                            <div className="space-y-3 pt-6">
                                <h4 className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-1">Zona de Peligro</h4>
                                <div className="space-y-3 pt-1">
                                    <button className="w-full py-3 rounded-xl border border-zinc-800 text-xs text-white font-bold uppercase tracking-widest active:scale-95 transition-all">
                                        Descargar mis datos
                                    </button>
                                    <button className="w-full py-3 rounded-xl border border-red-500/30 text-xs text-red-500 font-black uppercase tracking-widest active:scale-95 transition-all">
                                        Eliminar mi cuenta
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 pb-10">
                                <button
                                    onClick={() => setShowPrivacyModal(false)}
                                    className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 active:scale-95 transition-all text-center"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => setShowPrivacyModal(false)}
                                    className="flex-1 py-4 bg-primary text-black rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-glow hover:scale-[1.02] active:scale-95 transition-all text-center"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Culinary Personalization Modal */}
            {showCulinaryModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pure-black/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-sm h-auto max-h-[90vh] glass-card rounded-[2.5rem] p-6 border-primary/30 flex flex-col relative overflow-hidden shadow-2xl">
                        {/* Background Splashes */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

                        {/* Header */}
                        <div className="flex items-center justify-between relative z-10 mb-6 flex-shrink-0">
                            <h3 className="text-white font-bold text-lg uppercase tracking-wider font-outfit">Personalización Culinaria</h3>
                            <button
                                onClick={() => setShowCulinaryModal(false)}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Content Area - Scrollable */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 relative z-10 px-1">

                            {/* Meta del ChefBot Section */}
                            <div className="p-5 rounded-3xl border border-white/5 bg-zinc-900/40 space-y-4 shadow-glow-subtle">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary text-xl">bolt</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-[11px] text-white font-black uppercase tracking-widest">Meta del ChefBot</h4>
                                            <button
                                                onClick={() => setShowGoalInfo(true)}
                                                className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-all active:scale-90"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">info</span>
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest leading-tight">IA priorizará recetas según tu objetivo</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'bajar_peso', label: 'Bajar de Peso', icon: 'fitness_center' },
                                        { id: 'ganar_musculo', label: 'Ganar Músculo', icon: 'bolt' },
                                        { id: 'ahorrar_tiempo', label: 'Ahorrar Tiempo', icon: 'schedule' },
                                        { id: 'explorar', label: 'Gourmet / Explorar', icon: 'restaurant' }
                                    ].map((goal) => (
                                        <button
                                            key={goal.id}
                                            onClick={() => onUpdateUser({ cookingGoal: goal.id })}
                                            className={`flex items-center gap-2 p-2.5 rounded-2xl border transition-all ${user?.cookingGoal === goal.id ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-white/5 border-white/5 text-zinc-500'}`}
                                        >
                                            <span className="material-symbols-outlined text-sm">{goal.icon}</span>
                                            <span className="text-[9.5px] font-bold uppercase tracking-tighter leading-tight">{goal.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dieta y Estilo de Vida */}
                            <div className="p-5 rounded-3xl border border-white/5 bg-zinc-900/40 space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary text-xl">spa</span>
                                    <div>
                                        <h4 className="text-[11px] text-white font-black uppercase tracking-widest">Dieta y Estilo de Vida</h4>
                                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Selecciona tus preferencias alimentarias</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { id: 'vegetariano', label: 'Vegetariano', desc: 'Sin carnes procesadas' },
                                        { id: 'vegano', label: 'Vegano', desc: 'Sin productos de origen animal' },
                                        { id: 'pesquetariano', label: 'Pesquetariano', desc: 'Pescado pero sin carne' },
                                        { id: 'keto', label: 'Keto', desc: 'Baja en carbohidratos, alta en grasas' },
                                        { id: 'paleo', label: 'Paleo', desc: 'Alimentos no procesados' }
                                    ].map(diet => (
                                        <button
                                            key={diet.id}
                                            onClick={() => setCulinarySettings({ ...culinarySettings, diet: diet.id })}
                                            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${culinarySettings.diet === diet.id ? 'bg-primary/5 border-primary/30' : 'bg-black/20 border-white/5'}`}
                                        >
                                            <div className="text-left">
                                                <p className={`text-[10px] font-bold uppercase ${culinarySettings.diet === diet.id ? 'text-primary' : 'text-white'}`}>{diet.label}</p>
                                                <p className="text-[8px] text-zinc-600 font-medium uppercase tracking-widest">{diet.desc}</p>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${culinarySettings.diet === diet.id ? 'border-primary bg-primary/20' : 'border-zinc-700'}`}>
                                                {culinarySettings.diet === diet.id && <div className="w-2 h-2 rounded-full bg-primary shadow-glow"></div>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Restricciones Alimentarias */}
                            <div className="p-5 rounded-3xl border border-white/5 bg-zinc-900/40 space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary text-xl">no_food</span>
                                    <div>
                                        <h4 className="text-[11px] text-white font-black uppercase tracking-widest">Restricciones Alimentarias</h4>
                                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Ingredientes que prefieres evitar</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { id: 'gluten', label: 'Sin Gluten', desc: 'Sin trigo, cebada o centeno' },
                                        { id: 'lacteos', label: 'Sin Lácteos', desc: 'Sin leche ni derivados' },
                                        { id: 'frutos_secos_r', label: 'Sin Frutos Secos', desc: 'Sin maníes, almendras, etc.' }
                                    ].map(rest => (
                                        <button
                                            key={rest.id}
                                            onClick={() => {
                                                const newR = culinarySettings.restrictions.includes(rest.id)
                                                    ? culinarySettings.restrictions.filter(r => r !== rest.id)
                                                    : [...culinarySettings.restrictions, rest.id];
                                                setCulinarySettings({ ...culinarySettings, restrictions: newR });
                                            }}
                                            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${culinarySettings.restrictions.includes(rest.id) ? 'bg-primary/5 border-primary/30' : 'bg-black/20 border-white/5'}`}
                                        >
                                            <div className="text-left">
                                                <p className={`text-[10px] font-bold uppercase ${culinarySettings.restrictions.includes(rest.id) ? 'text-primary' : 'text-white'}`}>{rest.label}</p>
                                                <p className="text-[8px] text-zinc-600 font-medium uppercase tracking-widest">{rest.desc}</p>
                                            </div>
                                            <div className={`w-10 h-5 rounded-full relative transition-all ${culinarySettings.restrictions.includes(rest.id) ? 'bg-primary' : 'bg-zinc-800'}`}>
                                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${culinarySettings.restrictions.includes(rest.id) ? 'left-6' : 'left-1'}`}></div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Alergias Alimentarias */}
                            <div className="p-5 rounded-3xl border border-red-500/20 bg-red-500/5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-500 text-xl">warning_amber</span>
                                    <div>
                                        <h4 className="text-[11px] text-red-500 font-black uppercase tracking-widest">Alergias Alimentarias</h4>
                                        <p className="text-[9px] text-red-500/60 font-bold uppercase tracking-widest">Importante: La IA filtrará estrictamente estos ingredientes</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Maní', 'Mariscos', 'Huevos', 'Lácteos', 'Soya', 'Trigo', 'Pescado', 'Nueces'].map(allergy => (
                                        <button
                                            key={allergy}
                                            onClick={() => {
                                                const newA = culinarySettings.detailedAllergies.includes(allergy)
                                                    ? culinarySettings.detailedAllergies.filter(a => a !== allergy)
                                                    : [...culinarySettings.detailedAllergies, allergy];
                                                setCulinarySettings({ ...culinarySettings, detailedAllergies: newA });
                                            }}
                                            className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${culinarySettings.detailedAllergies.includes(allergy) ? 'bg-red-500/20 border-red-500/40 text-red-500' : 'bg-black/40 border-white/5 text-zinc-500'}`}
                                        >
                                            <div className={`w-3 h-3 rounded-full border ${culinarySettings.detailedAllergies.includes(allergy) ? 'border-red-500 bg-red-500' : 'border-zinc-700'}`}></div>
                                            <span className="text-[10px] font-bold uppercase tracking-tight">{allergy}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 pb-10">
                                <button
                                    onClick={() => setShowCulinaryModal(false)}
                                    className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 active:scale-95 transition-all text-center"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        const combinedAllergies = [...culinarySettings.detailedAllergies];
                                        onUpdateUser({ allergies: combinedAllergies });
                                        setShowCulinaryModal(false);
                                    }}
                                    className="flex-1 py-4 bg-primary text-black rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-glow hover:scale-[1.02] active:scale-95 transition-all text-center"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Modal */}
            <PremiumModal
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
                reason="upgrade"
            />
        </div>
    );
};

const SettingToggle = ({ icon, title, description, active, onToggle }: { icon: string, title: string, description: string, active: boolean, onToggle: () => void }) => (
    <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-zinc-900/40 rounded-3xl border border-white/5 active:scale-[0.98] transition-all"
    >
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${active ? 'bg-primary/20 text-primary shadow-glow' : 'bg-white/5 text-zinc-600'}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div className="text-left">
                <p className="text-white text-sm font-bold uppercase tracking-tight">{title}</p>
                <p className="text-zinc-500 text-[10px] font-medium leading-tight max-w-[160px]">{description}</p>
            </div>
        </div>
        <div className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-primary' : 'bg-zinc-800'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${active ? 'left-7' : 'left-1'}`}></div>
        </div>
    </button>
);

export default SettingsView;
