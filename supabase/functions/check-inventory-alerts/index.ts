import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "https://esm.sh/web-push"

// VAPID keys should be set in Edge Function secrets
const PUBLIC_VAPID_KEY = Deno.env.get('VITE_PUBLIC_VAPID_KEY') || ''
const PRIVATE_VAPID_KEY = Deno.env.get('PRIVATE_VAPID_KEY') || ''
const GCM_API_KEY = Deno.env.get('GCM_API_KEY') || ''

webpush.setVapidDetails(
    'mailto:soporte@chefscania.com',
    PUBLIC_VAPID_KEY,
    PRIVATE_VAPID_KEY
)

serve(async (req) => {
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        // 1. Get tomorrow's date
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowStr = tomorrow.toISOString().split('T')[0]

        // 2. Find items expiring tomorrow
        const { data: expiringItems, error: invError } = await supabaseClient
            .from('inventory')
            .select('*, profiles(id, name)')
            .eq('expiry_date', tomorrowStr)

        if (invError) throw invError

        if (!expiringItems || expiringItems.length === 0) {
            return new Response(JSON.stringify({ message: 'No items expiring tomorrow' }), { status: 200 })
        }

        // 3. Group by user
        const userGroups: Record<string, any[]> = {}
        expiringItems.forEach(item => {
            if (!userGroups[item.user_id]) userGroups[item.user_id] = []
            userGroups[item.user_id].push(item)
        })

        const results = []

        // 4. Send notifications
        for (const userId in userGroups) {
            const { data: subscriptions } = await supabaseClient
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', userId)

            if (subscriptions && subscriptions.length > 0) {
                const itemsCount = userGroups[userId].length
                const itemsList = userGroups[userId].map(i => i.name).join(', ')
                const notificationPayload = JSON.stringify({
                    title: '⏰ Alerta de Vencimiento',
                    body: `¡Atención! ${itemsCount} producto(s) vencen mañana: ${itemsList}. Úsalos pronto en una receta.`,
                    url: '/inventory'
                })

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
                        results.push({ userId, status: 'sent' })
                    } catch (err) {
                        console.error(`Error sending to ${sub.id}:`, err)
                        // If subscription is no longer valid, delete it
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            await supabaseClient.from('push_subscriptions').delete().eq('id', sub.id)
                        }
                        results.push({ userId, status: 'failed', error: err.message })
                    }
                }
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
