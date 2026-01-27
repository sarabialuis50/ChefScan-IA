
import React from 'react';

interface ProfileDetailViewProps {
    chef: {
        name: string;
        avatar?: string;
        level: number;
        recipesCount: number;
        likesCount: number;
        specialty: string;
    };
    onBack: () => void;
}

const ProfileDetailView: React.FC<ProfileDetailViewProps> = ({ chef, onBack }) => {
    return (
        <div className="min-h-screen bg-pure-black">
            {/* Header with Background */}
            <div className="h-48 bg-gradient-to-b from-primary/20 to-pure-black relative">
                <button
                    onClick={onBack}
                    className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 z-10"
                >
                    <span className="material-symbols-outlined text-white">arrow_back</span>
                </button>
            </div>

            {/* Profile Info Card */}
            <div className="px-6 -mt-16 relative">
                <div className="glass-card rounded-[3rem] p-8 border-white/10 shadow-2xl space-y-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-28 h-28 rounded-full bg-primary p-1 shadow-glow relative">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                {chef.avatar ? (
                                    <img src={chef.avatar} alt={chef.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-4xl text-primary">person</span>
                                )}
                            </div>
                            <div className="absolute -bottom-2 right-2 bg-primary text-black text-[10px] font-black px-2 py-1 rounded-lg">
                                LVL {chef.level}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-2xl font-black uppercase italic text-white tracking-tighter">{chef.name}</h2>
                            <p className="text-primary text-[10px] font-black uppercase tracking-widest">{chef.specialty}</p>
                        </div>

                        <div className="flex gap-4 w-full pt-4">
                            <button className="flex-1 bg-primary text-black py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-glow active:scale-95 transition-all">Seguir Chef</button>
                            <button className="w-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center border border-white/5 uppercase font-black text-[10px]">
                                <span className="material-symbols-outlined">mail</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/5">
                        <div className="text-center">
                            <p className="text-xl font-black text-white">{chef.recipesCount}</p>
                            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Recetas</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-white">{chef.likesCount}</p>
                            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Fuegos</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-white">1.2k</p>
                            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Seguidores</p>
                        </div>
                    </div>

                    {/* Achievements / Specialty Icons */}
                    <div className="space-y-3 pt-2">
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Logros Destacados</h4>
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center" title="Zero Waste Master">
                                <span className="material-symbols-outlined text-orange-500">eco</span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center" title="Nutrition Expert">
                                <span className="material-symbols-outlined text-blue-500">monitoring</span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center" title="Fast Cook">
                                <span className="material-symbols-outlined text-purple-500">bolt</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Creations Grid */}
                <div className="mt-8 space-y-4 pb-12">
                    <h3 className="text-white font-black uppercase text-sm italic tracking-widest">Creaciones Recientes</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-zinc-900 rounded-[2rem] border border-white/5 overflow-hidden relative group">
                                <img
                                    src={`https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&q=60&w=400`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                    <span className="text-[8px] font-black text-white uppercase tracking-tighter line-clamp-1">Pasta al Pesto {i}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileDetailView;
