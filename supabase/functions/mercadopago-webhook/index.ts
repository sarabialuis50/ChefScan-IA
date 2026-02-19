import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');

        // Mercado Pago sends notifications as query params or body
        // For 'payment' type, it sends 'data.id' and 'type=payment'
        const url = new URL(req.url);
        const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');
        const type = url.searchParams.get('type') || url.searchParams.get('topic');

        console.log(`Mercado Pago Webhook received: type=${type}, id=${dataId}`);

        if (type === 'payment' && dataId) {
            // Fetch payment details from Mercado Pago
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                },
            });

            if (!mpResponse.ok) {
                throw new Error(`Failed to fetch payment ${dataId} from Mercado Pago`);
            }

            const payment = await mpResponse.json();
            console.log(`Payment status: ${payment.status}, External Reference: ${payment.external_reference}`);

            if (payment.status === 'approved') {
                const reference = payment.external_reference;

                // reference format: cs_USERID_TIMESTAMP
                const parts = reference?.split('_');
                const userId = parts?.[1];

                if (userId) {
                    console.log(`Updating user ${userId} to Premium`);

                    const { error: updateError } = await supabaseAdmin
                        .from('profiles')
                        .update({
                            is_premium: true,
                            chef_credits: 999
                        })
                        .eq('id', userId);

                    if (updateError) throw updateError;

                    console.log("User updated successfully to Premium");
                } else {
                    console.warn("Could not extract userId from reference:", reference);
                }
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Webhook Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
