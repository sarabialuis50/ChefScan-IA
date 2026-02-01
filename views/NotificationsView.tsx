
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation, Language } from '../utils/i18n';
import { InventoryItem } from '../types';
import { getItemStatus } from '../utils/itemStatus';

interface NotificationsViewProps {
  onBack: () => void;
  language: Language;
  inventory?: InventoryItem[];
  onGenerateRecipe?: (ingredients: string[]) => void;
  isUpdateAvailable?: boolean;
  onUpdateAction?: () => void;
  userId?: string;
}


interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: string;
  type: 'recipe' | 'system' | 'alert' | 'pantry';
  unread: boolean;
  actionLabel?: string;
  actionPayload?: any;
}

// Array of rotating health tips (~80 chars max for 2-line display)
const HEALTH_TIPS = [
  'Bebe al menos 8 vasos de agua al día para mantener tu cuerpo hidratado.',
  'Los vegetales verdes mejoran tu digestión y aportan vitaminas esenciales.',
  'Reducir el azúcar te da más energía estable durante todo el día.',
  'Camina 30 minutos diarios para mantener tu corazón y mente saludables.',
  'Come despacio y disfruta cada bocado, tu digestión te lo agradecerá.',
  'Las frutas frescas son los snacks ideales, naturales y nutritivos.',
  'Dormir 7-8 horas permite que tu cuerpo se recupere completamente.',
  'Evita cenar muy tarde, dale tiempo a tu cuerpo para hacer la digestión.',
  'Las proteínas te mantienen saciado por más tiempo. ¡Inclúyelas siempre!',
  'Cocinar en casa es más saludable y te da control de los ingredientes.',
];

const NotificationsView: React.FC<NotificationsViewProps> = ({
  onBack,
  language,
  inventory,
  onGenerateRecipe,
  isUpdateAvailable,
  onUpdateAction,
  userId
}) => {

  const t = useTranslation(language);
  const [activeFilter, setActiveFilter] = useState('Todas');

  // Get today's health tip based on the day of month (rotates through the list)
  const todaysHealthTip = useMemo(() => {
    const dayOfMonth = new Date().getDate();
    return HEALTH_TIPS[dayOfMonth % HEALTH_TIPS.length];
  }, []);

  // Load read notifications from localStorage
  const getReadNotifications = (): string[] => {
    try {
      const key = userId ? `chefscan_read_notifs_${userId}` : 'chefscan_read_notifs';
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  // Save read notifications to localStorage
  const saveReadNotifications = (ids: string[]) => {
    try {
      const key = userId ? `chefscan_read_notifs_${userId}` : 'chefscan_read_notifs';
      localStorage.setItem(key, JSON.stringify(ids));
    } catch { }
  };

  const [readNotifIds, setReadNotifIds] = useState<string[]>(getReadNotifications);

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const readIds = getReadNotifications();

    const baseNotifications: Notification[] = [
      {
        id: '1',
        title: 'Recomendación Inteligente',
        description: 'IA generó recomendaciones de recetas con tu despensa.',
        time: 'Hace 5 min',
        icon: 'auto_awesome',
        type: 'recipe',
        unread: !readIds.includes('1'),
        actionLabel: 'Ver Receta',
        actionPayload: ['Salmón', 'Espárragos', 'Limón', 'Ajo']
      },

      {
        id: '3',
        title: isUpdateAvailable ? 'Nueva Versión Disponible' : 'Actualización del Núcleo',
        description: isUpdateAvailable
          ? 'Hay una nueva actualización de ChefScan.IA lista para mejorar tu experiencia.'
          : 'ChefScan.IA Engine v2.5 ya está activo con mayor precisión visual.',
        time: isUpdateAvailable ? 'AHORA' : 'Ayer',
        icon: isUpdateAvailable ? 'system_update' : 'developer_board',
        type: 'system',
        unread: isUpdateAvailable ? !readIds.includes('3') : false,
        actionLabel: isUpdateAvailable ? 'Actualizar' : undefined,
        actionPayload: 'pwa-update'
      },


      {
        id: '4',
        title: 'Consejo Saludable',
        description: todaysHealthTip,
        time: 'Hoy',
        icon: 'tips_and_updates',
        type: 'alert',
        unread: !readIds.includes('4')
      }
    ];

    if (!inventory) return baseNotifications;

    const expiredCount = inventory.filter(i => {
      const s = getItemStatus(i.expiryDate);
      return s?.statusKey === 'expired';
    }).length;

    const expiringTodayCount = inventory.filter(i => {
      const s = getItemStatus(i.expiryDate);
      return s?.statusKey === 'expires_today';
    }).length;

    const expiringTomorrowCount = inventory.filter(i => {
      const s = getItemStatus(i.expiryDate);
      return s?.statusKey === 'expires_tomorrow';
    }).length;

    const proxExpiryCount = inventory.filter(i => {
      const s = getItemStatus(i.expiryDate);
      return s?.statusKey === 'prox_expiry';
    }).length;

    if (expiredCount === 0 && expiringTodayCount === 0 && expiringTomorrowCount === 0 && proxExpiryCount === 0) {
      return baseNotifications;
    }

    let descriptionParts: string[] = [];
    if (descriptionParts.length === 0 && expiredCount > 0) descriptionParts.push(`${expiredCount} vencido(s)`);
    if (descriptionParts.length === 0 && expiringTodayCount > 0) descriptionParts.push(`${expiringTodayCount} vencen hoy`);
    if (descriptionParts.length === 0 && expiringTomorrowCount > 0) descriptionParts.push(`${expiringTomorrowCount} item que vence mañana`);


    if (descriptionParts.length === 0 && proxExpiryCount > 0) {
      descriptionParts.push(`${proxExpiryCount} próximos a vencer`);
    }

    const description = `Tienes ${descriptionParts.join(', ')} en tu despensa.`;
    const isUrgent = expiredCount > 0 || expiringTodayCount > 0 || expiringTomorrowCount > 0;

    const pantrySummaryNotification: Notification = {
      id: 'pantry_summary',
      title: 'Alertas Despensa',
      description: description,
      time: 'Hace un momento',
      icon: 'inventory_2',
      type: 'pantry',
      unread: isUrgent && !readIds.includes('pantry_summary')
    };

    return [pantrySummaryNotification, ...baseNotifications];
  });

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, unread: false } : n
    ));
    const newReadIds = [...readNotifIds, id].filter((v, i, a) => a.indexOf(v) === i);
    setReadNotifIds(newReadIds);
    saveReadNotifications(newReadIds);
  };

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    setReadNotifIds(allIds);
    saveReadNotifications(allIds);
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'Todas') return true;
    if (activeFilter === 'Recetas') return n.type === 'recipe';
    if (activeFilter === 'Sistema') return n.type === 'system';
    if (activeFilter === 'Alertas') return n.type === 'alert';
    if (activeFilter === 'Despensa') return n.type === 'pantry';
    return true;
  });

  return (
    <div style={{ backgroundColor: 'var(--bg-app)' }} className="flex flex-col min-h-full p-6 space-y-6 pb-0">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <button onClick={onBack} style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--card-border)' }} className="w-10 h-10 flex items-center justify-center rounded-full border active:scale-90 transition-all">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <div>
            <h1 style={{ color: 'var(--text-main)' }} className="font-bold text-xl uppercase tracking-wider font-outfit">Notificaciones<span className="text-primary">.IA</span></h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t('sub_notificaciones')}</p>
          </div>
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
        {['Todas', 'Recetas', 'Despensa', 'Sistema', 'Alertas'].map(filter => (
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
              onClick={() => markAsRead(notif.id)}
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

              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex justify-between items-start gap-1">
                  <h3 style={{ color: notif.unread ? 'var(--text-main)' : 'var(--text-muted)' }} className="text-[11px] font-bold uppercase tracking-tight leading-tight whitespace-nowrap truncate">
                    {notif.title}
                  </h3>
                  <span style={{ color: 'var(--text-muted)' }} className="text-[7px] font-bold uppercase tracking-tighter whitespace-nowrap flex-shrink-0 pt-0.5">
                    {notif.time}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)' }} className="text-[11px] leading-snug mt-1 line-clamp-2">
                  {notif.description}{notif.actionLabel && (onGenerateRecipe || (notif.actionPayload === 'pwa-update' && onUpdateAction)) && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        if (notif.actionPayload === 'pwa-update' && onUpdateAction) {
                          onUpdateAction();
                        } else if (onGenerateRecipe) {
                          onGenerateRecipe(notif.actionPayload);
                        }
                      }}
                      className={`ml-1 text-[8px] font-bold uppercase tracking-tight cursor-pointer hover:underline decoration-1 underline-offset-2 transition-all ${notif.actionPayload === 'pwa-update'
                        ? "text-[#39FF14] decoration-[#39FF14]"
                        : "text-primary decoration-primary"
                        }`}
                    >
                      {notif.actionLabel} →

                    </span>
                  )}
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
      <div className="text-center mt-auto pb-4">
        <p style={{ color: 'var(--text-muted)', opacity: 0.5 }} className="text-[8px] font-bold uppercase tracking-[0.5em]">Sistema de Alertas ChefScan.IA • Online</p>
      </div>
    </div>
  );
};

export default NotificationsView;
