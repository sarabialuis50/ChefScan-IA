import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "https://esm.sh/web-push"

// VAPID keys should be set in Edge Function secrets
const PUBLIC_VAPID_KEY = Deno.env.get('VITE_PUBLIC_VAPID_KEY') || ''
const PRIVATE_VAPID_KEY = Deno.env.get('PRIVATE_VAPID_KEY') || ''

webpush.setVapidDetails(
    'mailto:soporte@chefscania.com',
    PUBLIC_VAPID_KEY,
    PRIVATE_VAPID_KEY
)

const CHEF_TIPS = [
    { title: '💡 Tip del Chef', body: '¿Sabías que salar la carne justo antes de cocinarla ayuda a crear una costra perfecta? ¡Pruébalo hoy!' },
    { title: '🍳 ¡Hora de cocinar!', body: 'Tienes ingredientes en tu despensa esperando ser transformados. ¿Qué tal si generamos una receta nueva?' },
    { title: '🥖 Pan Fresco', body: 'Si tu pan está un poco duro, salpícalo con agua y caliéntalo 5 min en el horno. ¡Quedará como nuevo!' },
    { title: '🥗 Equilibrio Perfecto', body: 'Añade una pizca de azúcar a tus salsas de tomate para equilibrar la acidez. ¡Toque de profesional!' }
]

serve(async (req) => {
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        // 1. Get all unique subscriptions
        const { data: subscriptions, error: subError } = await supabaseClient
            .from('push_subscriptions')
            .select('*')

        if (subError) throw subError

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ message: 'No subscriptions found' }), { status: 200 })
        }

        // 2. Choose a random tip
        const tip = CHEF_TIPS[Math.floor(Math.random() * CHEF_TIPS.length)]

        const notificationPayload = JSON.stringify({
            title: tip.title,
            body: tip.body,
            url: '/'
        })

        const results = []

        // 3. Send notifications
        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(
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
            } catch (err) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabaseClient.from('push_subscriptions').delete().eq('id', sub.id)
                }
                results.push({ id: sub.id, status: 'failed', error: err.message })
            }
        }

        return new Response(JSON.stringify({ results }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
