
import React, { useState } from 'react';

interface NotificationsViewProps {
  onBack: () => void;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: string;
  type: 'recipe' | 'system' | 'alert';
  unread: boolean;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ onBack }) => {
  const [activeFilter, setActiveFilter] = useState('Todas');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: '¡Nueva Receta Gourmet!',
      description: 'IA ha generado una variante premium de tu Salmón Parrillero.',
      time: 'Hace 5 min',
      icon: 'auto_awesome',
      type: 'recipe',
      unread: true
    },
    {
      id: '2',
      title: 'Escaneo Completado',
      description: 'Se han identificado 4 nuevos ingredientes en tu refrigerador.',
      time: 'Hace 2 horas',
      icon: 'camera',
      type: 'system',
      unread: true
    },
    {
      id: '3',
      title: 'Actualización del Núcleo',
      description: 'ChefScan Engine v2.5 ya está activo con mayor precisión visual.',
      time: 'Ayer',
      icon: 'developer_board',
      type: 'system',
      unread: false
    },
    {
      id: '4',
      title: 'Consejo Saludable',
      description: 'Recuerda que los vegetales verdes hoy combinan con tu dieta keto.',
      time: 'Ayer',
      icon: 'tips_and_updates',
      type: 'alert',
      unread: false
    }
  ]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'Todas') return true;
    if (activeFilter === 'Recetas') return n.type === 'recipe';
    if (activeFilter === 'Sistema') return n.type === 'system';
    return true;
  });

  return (
    <div className="flex flex-col bg-pure-black min-h-full p-6 space-y-6 pb-32">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h1 className="text-white font-bold text-xl uppercase tracking-wider font-outfit">Notificaciones<span className="text-primary">.IA</span></h1>
        </div>
        <button
          onClick={markAllRead}
          className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
        >
          Marcar Todo
        </button>
      </header>

      {/* Filter Chips */}
      <div className="flex gap-3 pt-2">
        {['Todas', 'Recetas', 'Sistema'].map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeFilter === filter
              ? 'bg-primary text-black shadow-neon-glow'
              : 'bg-zinc-900/50 text-zinc-500 border border-zinc-800'
              }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-4 pt-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`relative glass-card rounded-[1.5rem] p-4 flex gap-4 border transition-all ${notif.unread ? 'border-primary/30 bg-primary/5' : 'border-white/5'
                }`}
            >
              <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center border ${notif.unread ? 'bg-primary/20 border-primary text-primary shadow-neon-glow' : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                }`}>
                <span className="material-symbols-outlined">{notif.icon}</span>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className={`text-sm font-bold uppercase tracking-tight ${notif.unread ? 'text-white' : 'text-zinc-500'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter whitespace-nowrap pt-0.5">
                    {notif.time}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${notif.unread ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  {notif.description}
                </p>
              </div>

              {notif.unread && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full neon-glow"></div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-700 space-y-4">
            <span className="material-symbols-outlined text-6xl opacity-20">notifications_off</span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nada que reportar por ahora</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center pt-10">
        <p className="text-[8px] text-zinc-800 font-bold uppercase tracking-[0.5em]">Sistema de Alertas ChefScan IA • Online</p>
      </div>
    </div>
  );
};

export default NotificationsView;
