import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// VAPID keys from Edge Function secrets
const PUBLIC_VAPID_KEY = Deno.env.get('VITE_PUBLIC_VAPID_KEY') || ''
const PRIVATE_VAPID_KEY = Deno.env.get('PRIVATE_VAPID_KEY') || ''

const CHEF_TIPS = [
    { title: '💡 Tip del Chef', body: '¿Sabías que salar la carne justo antes de cocinarla ayuda a crear una costra perfecta? ¡Pruébalo hoy!' },
    { title: '🍳 ¡Hora de cocinar!', body: 'Tienes ingredientes en tu despensa esperando ser transformados. ¿Qué tal si generamos una receta nueva?' },
    { title: '🥖 Pan Fresco', body: 'Si tu pan está un poco duro, salpícalo con agua y caliéntalo 5 min en el horno. ¡Quedará como nuevo!' },
    { title: '🥗 Equilibrio Perfecto', body: 'Añade una pizca de azúcar a tus salsas de tomate para equilibrar la acidez. ¡Toque de profesional!' },
    { title: '🧄 Secreto del Ajo', body: 'Para pelar ajos rápidamente, aplástalos con el lado plano del cuchillo. ¡La piel sale sola!' },
    { title: '🍋 Jugo Extra', body: 'Calienta los limones en el microondas 15 seg antes de exprimirlos. ¡Obtendrás el doble de jugo!' },
    { title: '🧊 Hierbas Congeladas', body: 'Congela hierbas frescas en cubetas de hielo con aceite de oliva. ¡Tendrás sabor fresco siempre disponible!' },
    { title: '🍝 Agua de Pasta', body: 'Guarda un poco del agua de cocción de la pasta. Es perfecta para espesar salsas gracias a su almidón.' },
    { title: '🥚 Test del Huevo', body: 'Para saber si un huevo está fresco, sumérgelo en agua. Si se hunde, está perfecto. Si flota, ¡descártalo!' },
    { title: '🌿 Conserva tus Hierbas', body: 'Envuelve las hierbas frescas en una toalla de papel húmeda y mételas en una bolsa. ¡Duran hasta 2 semanas!' }
]

// ---- Web Push Implementation using Web Crypto API (Deno compatible) ----

function base64UrlDecode(str: string): Uint8Array {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

async function createVapidAuthHeaders(endpoint: string, vapidPublicKey: string, vapidPrivateKey: string) {
    const audience = new URL(endpoint).origin;

    const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
    const publicKeyBytes = base64UrlDecode(vapidPublicKey);

    const key = await crypto.subtle.importKey(
        'jwk',
        {
            kty: 'EC',
            crv: 'P-256',
            x: base64UrlEncode(publicKeyBytes.slice(1, 33)),
            y: base64UrlEncode(publicKeyBytes.slice(33, 65)),
            d: base64UrlEncode(privateKeyBytes),
        },
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
    );

    const header = { typ: 'JWT', alg: 'ES256' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        aud: audience,
        exp: now + 12 * 60 * 60,
        sub: 'mailto:soporte@chefscania.com'
    };

    const encoder = new TextEncoder();
    const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
    const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
    const unsignedToken = `${headerB64}.${payloadB64}`;

    const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        key,
        encoder.encode(unsignedToken)
    );

    const signatureBytes = new Uint8Array(signature);
    let rawSignature: Uint8Array;

    if (signatureBytes.length === 64) {
        rawSignature = signatureBytes;
    } else {
        rawSignature = derToRaw(signatureBytes);
    }

    const jwt = `${unsignedToken}.${base64UrlEncode(rawSignature)}`;

    return {
        authorization: `vapid t=${jwt}, k=${base64UrlEncode(publicKeyBytes)}`,
    };
}

function derToRaw(der: Uint8Array): Uint8Array {
    const raw = new Uint8Array(64);
    let offset = 2;
    offset++;
    let rLen = der[offset++];
    if (rLen === 33) {
        offset++;
        rLen = 32;
    }
    raw.set(der.slice(offset, offset + rLen), 32 - rLen);
    offset += rLen;
    offset++;
    let sLen = der[offset++];
    if (sLen === 33) {
        offset++;
        sLen = 32;
    }
    raw.set(der.slice(offset, offset + sLen), 64 - sLen);
    return raw;
}

async function encryptPayload(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
    const encoder = new TextEncoder();

    const localKeyPair = await crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveBits']
    );

    const localPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', localKeyPair.publicKey));
    const subscriberPublicKeyBytes = base64UrlDecode(subscription.keys.p256dh);
    const subscriberPublicKey = await crypto.subtle.importKey(
        'raw',
        subscriberPublicKeyBytes,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
    );

    const sharedBits = new Uint8Array(await crypto.subtle.deriveBits(
        { name: 'ECDH', public: subscriberPublicKey },
        localKeyPair.privateKey,
        256
    ));

    const authSecret = base64UrlDecode(subscription.keys.auth);
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const authSecretKey = await crypto.subtle.importKey('raw', authSecret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const prk = new Uint8Array(await crypto.subtle.sign('HMAC', authSecretKey, sharedBits));

    const keyInfoHeader = encoder.encode('WebPush: info\0');
    const keyInfo = concatUint8Arrays(keyInfoHeader, subscriberPublicKeyBytes, localPublicKeyRaw);
    const cekInfo = encoder.encode('Content-Encoding: aes128gcm\0');
    const nonceInfo = encoder.encode('Content-Encoding: nonce\0');

    const prkHmacKey = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const ikm = new Uint8Array(await crypto.subtle.sign('HMAC', prkHmacKey, concatUint8Arrays(keyInfo, new Uint8Array([1]))));

    const saltHmacKey = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const prk2 = new Uint8Array(await crypto.subtle.sign('HMAC', saltHmacKey, ikm));

    const prk2HmacKey = await crypto.subtle.importKey('raw', prk2, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const cekNonceBase = new Uint8Array(await crypto.subtle.sign('HMAC', prk2HmacKey, concatUint8Arrays(cekInfo, new Uint8Array([1]))));
    const cek = cekNonceBase.slice(0, 16);

    const nonceBase = new Uint8Array(await crypto.subtle.sign('HMAC', prk2HmacKey, concatUint8Arrays(nonceInfo, new Uint8Array([1]))));
    const nonce = nonceBase.slice(0, 12);

    const encryptionKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
    const paddedPayload = concatUint8Arrays(encoder.encode(payload), new Uint8Array([2]));

    const encrypted = new Uint8Array(await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce },
        encryptionKey,
        paddedPayload
    ));

    return { ciphertext: encrypted, salt, localPublicKey: localPublicKeyRaw };
}

async function sendPushNotification(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string
): Promise<void> {
    const { ciphertext, salt, localPublicKey } = await encryptPayload(subscription, payload);

    const rs = new Uint8Array(4);
    new DataView(rs.buffer).setUint32(0, 4096);
    const idlen = new Uint8Array([65]);

    const body = concatUint8Arrays(salt, rs, idlen, localPublicKey, ciphertext);

    const vapidHeaders = await createVapidAuthHeaders(
        subscription.endpoint,
        PUBLIC_VAPID_KEY,
        PRIVATE_VAPID_KEY
    );

    const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'TTL': '86400',
            ...vapidHeaders,
        },
        body: body,
    });

    if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Push send failed: ${response.status} ${response.statusText} - ${errorText}`);
        (error as any).statusCode = response.status;
        throw error;
    }
}

serve(async (req) => {
    console.log('🔔 daily-chef-tips function invoked');
    console.log(`VAPID Public Key present: ${!!PUBLIC_VAPID_KEY} (len: ${PUBLIC_VAPID_KEY.length})`);
    console.log(`VAPID Private Key present: ${!!PRIVATE_VAPID_KEY} (len: ${PRIVATE_VAPID_KEY.length})`);

    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        if (!PUBLIC_VAPID_KEY || !PRIVATE_VAPID_KEY) {
            throw new Error('VAPID keys not configured. Set VITE_PUBLIC_VAPID_KEY and PRIVATE_VAPID_KEY in Edge Function secrets.');
        }

        // 1. Get all unique subscriptions
        const { data: subscriptions, error: subError } = await supabaseClient
            .from('push_subscriptions')
            .select('*')

        if (subError) throw subError

        if (!subscriptions || subscriptions.length === 0) {
            console.log('No subscriptions found');
            return new Response(JSON.stringify({ message: 'No subscriptions found' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            })
        }

        console.log(`Found ${subscriptions.length} subscriptions`);

        // 2. Choose a random tip
        const tip = CHEF_TIPS[Math.floor(Math.random() * CHEF_TIPS.length)]

        const notificationPayload = JSON.stringify({
            title: tip.title,
            body: tip.body,
            url: '/'
        })

        console.log(`Sending tip: ${tip.title}`);

        const results = []

        // 3. Send notifications
        for (const sub of subscriptions) {
            try {
                await sendPushNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth
                        }
                    },
                    notificationPayload
                )
                results.push({ id: sub.id, status: 'sent' })
                console.log(`✅ Sent to ${sub.id}`);
            } catch (err) {
                console.error(`❌ Failed for ${sub.id}:`, err.message);
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabaseClient.from('push_subscriptions').delete().eq('id', sub.id)
                    console.log(`🗑️ Removed expired subscription ${sub.id}`);
                }
                results.push({ id: sub.id, status: 'failed', error: err.message })
            }
        }

        return new Response(JSON.stringify({ results, tip: tip.title }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error) {
        console.error('Fatal error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
