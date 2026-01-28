
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (request) => {
    const signature = request.headers.get('Stripe-Signature')

    // Verify the webhook signature
    const body = await request.text()
    let event
    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature!,
            Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
            undefined,
            cryptoProvider
        )
    } catch (err) {
        return new Response(err.message, { status: 400 })
    }

    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // IMPORTANT: Use Service Role Key for admin updates
    )

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object
            const userId = session.metadata?.supabaseUUID // Sent when creating the user/customer/session
            const subscriptionId = session.subscription

            // Activate Premium
            if (userId) {
                await supabaseClient
                    .from('profiles')
                    .update({
                        is_premium: true,
                        subscription_status: 'active',
                        subscription_price_id: session.amount_total > 0 ? 'premium' : 'trial' // Simplify for now
                    })
                    .eq('id', userId)
            }
            break
        }
        case 'customer.subscription.updated': {
            const subscription = event.data.object
            // Update subscription status in DB (e.g., active, past_due)
            // Find user by stripe_customer_id first if metadata is missing on this event object
            // ... (Simplified logic)
            break
        }
        case 'customer.subscription.deleted': {
            const subscription = event.data.object
            // Revoke Premium
            const customerId = subscription.customer
            await supabaseClient
                .from('profiles')
                .update({ is_premium: false, subscription_status: 'canceled' })
                .eq('stripe_customer_id', customerId)
            break
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
    })
})
