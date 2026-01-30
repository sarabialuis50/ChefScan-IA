import { supabase } from '../lib/supabase';

// Utility to convert VAPID public key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const subscribeUserToPush = async (userId: string) => {
    try {
        // 1. Check if Service Worker is supported
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push messaging is not supported');
            return;
        }

        // 2. Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready;

        // 3. Get public VAPID key from env or use a default (User should provide this)
        const PUBLIC_VAPID_KEY = import.meta.env.VITE_PUBLIC_VAPID_KEY;
        if (!PUBLIC_VAPID_KEY) {
            console.error('VITE_PUBLIC_VAPID_KEY is missing');
            return;
        }

        // 4. Subscribe the user
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });

        // 5. Save to Supabase
        const { endpoint, keys } = subscription.toJSON();

        if (!endpoint || !keys?.p256dh || !keys?.auth) return;

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: userId,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
                updated_at: new Date().toISOString()
            }, { onConflict: 'endpoint' });

        if (error) throw error;

        console.log('User is subscribed to Push Notifications');
        return true;
    } catch (error) {
        console.error('Failed to subscribe user:', error);
        return false;
    }
};

export const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
};
