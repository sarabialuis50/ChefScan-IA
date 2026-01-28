import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async (req) => {
    try {
        const payload = await req.json()
        console.log("Receiving Wompi Webhook:", JSON.stringify(payload))

        const { data, timestamp } = payload
        const transaction = data.transaction
        const reference = transaction.reference // Expected format: 'chefscan_USERUUID_TIMESTAMP'

        if (transaction.status !== 'APPROVED') {
            console.log(`Transaction ${reference} status is ${transaction.status}. Skipping.`);
            return new Response(JSON.stringify({ received: true, status: 'ignored' }), {
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Extract User ID from Reference (chefscan_ID_TIMESTAMP)
        const userId = reference.split('_')[1]

        if (!userId) {
            console.error("No userId found in reference:", reference)
            throw new Error('Invalid Reference format')
        }

        // 2. Activate Premium in Supabase
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error } = await supabaseClient
            .from('profiles')
            .update({
                is_premium: true,
                subscription_status: 'active',
                subscription_price_id: 'wompi_premium_cop',
                // Typically subscription end date would be +1 month from now
                subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('id', userId)

        if (error) {
            console.error("Error updating profile:", error)
            throw error
        }

        console.log(`SUCCESS: User ${userId} activated as Premium.`)

        return new Response(JSON.stringify({ received: true, status: 'processed' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (err) {
        console.error(`Wompi Webhook Error: ${err.message}`)
        return new Response(err.message, { status: 400 })
    }
})
