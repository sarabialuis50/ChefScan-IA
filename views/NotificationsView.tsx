
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
    if (activeFilter === 'Alertas') return n.type === 'alert';
    return true;
  });

  return (
    <div style={{ backgroundColor: 'var(--bg-app)' }} className="flex flex-col min-h-full p-6 space-y-6 pb-32">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <button onClick={onBack} style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }} className="w-10 h-10 flex items-center justify-center rounded-full border active:scale-90 transition-all">
            <span className="material-symbols-outlined text-zinc-400">arrow_back</span>
          </button>
          <h1 style={{ color: 'var(--text-main)' }} className="font-bold text-xl uppercase tracking-wider font-outfit">Notificaciones<span className="text-primary">.IA</span></h1>
        </div>
        <button
          onClick={markAllRead}
          className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
        >
          Marcar Todo
        </button>
      </header>

      {/* Filter Chips */}
      <div className="flex gap-3 pt-2 overflow-x-auto no-scrollbar">
        {['Todas', 'Recetas', 'Sistema', 'Alertas'].map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === filter
              ? 'bg-primary text-black shadow-neon-glow'
              : 'border'
              }`}
            style={{
              backgroundColor: activeFilter === filter ? 'var(--primary)' : 'var(--bg-surface-soft)',
              borderColor: 'var(--card-border)',
              color: activeFilter === filter ? '#000' : 'var(--text-muted)'
            }}
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
              onClick={() => {
                setNotifications(prev => prev.map(n =>
                  n.id === notif.id ? { ...n, unread: false } : n
                ));
              }}
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: notif.unread ? 'var(--primary)' : 'var(--card-border)' }}
              className={`relative rounded-[1.5rem] p-4 flex gap-4 border transition-all cursor-pointer active:scale-95 ${notif.unread ? 'bg-primary/5 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' : ''
                }`}
            >
              <div
                style={{
                  backgroundColor: notif.unread ? 'rgba(var(--primary-rgb), 0.2)' : 'var(--bg-surface-inner)',
                  borderColor: notif.unread ? 'var(--primary)' : 'var(--card-border)',
                  color: notif.unread ? 'var(--primary)' : 'var(--text-muted)'
                }}
                className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center border ${notif.unread ? 'shadow-neon-glow' : ''
                  }`}>
                <span className="material-symbols-outlined">{notif.icon}</span>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 style={{ color: notif.unread ? 'var(--text-main)' : 'var(--text-muted)' }} className={`text-sm font-bold uppercase tracking-tight`}>
                    {notif.title}
                  </h3>
                  <span style={{ color: 'var(--text-muted)' }} className="text-[9px] font-bold uppercase tracking-tighter whitespace-nowrap pt-0.5">
                    {notif.time}
                  </span>
                </div>
                <p style={{ color: notif.unread ? 'var(--text-muted)' : 'var(--text-muted)' }} className={`text-xs leading-relaxed opacity-80`}>
                  {notif.description}
                </p>
              </div>

              {notif.unread && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full neon-glow"></div>
              )}
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--text-muted)' }} className="flex flex-col items-center justify-center py-20 space-y-4">
            <span className="material-symbols-outlined text-6xl opacity-20">notifications_off</span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nada que reportar por ahora</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center pt-10">
        <p style={{ color: 'var(--text-muted)', opacity: 0.5 }} className="text-[8px] font-bold uppercase tracking-[0.5em]">Sistema de Alertas ChefScan IA • Online</p>
      </div>
    </div>
  );
};

export default NotificationsView;
