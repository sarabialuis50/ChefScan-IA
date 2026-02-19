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

        // Get auth token
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            throw new Error('No authorization token');
        }

        // Get user
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) throw new Error('Invalid user');

        const ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
        if (!ACCESS_TOKEN) {
            throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured in Supabase Secrets');
        }

        // Subscription details
        const amount = 19900; // COP
        const reference = `cs_${user.id}_${Date.now()}`;

        // Create Preference in Mercado Pago
        const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: [
                    {
                        title: "Suscripción ChefScan Premium",
                        description: "Acceso total ilimitado por 1 mes",
                        quantity: 1,
                        currency_id: "COP",
                        unit_price: amount,
                    }
                ],
                external_reference: reference,
                back_urls: {
                    success: `${req.headers.get('referer') || 'https://chefscania.com'}`,
                    failure: `${req.headers.get('referer') || 'https://chefscania.com'}`,
                    pending: `${req.headers.get('referer') || 'https://chefscania.com'}`,
                },
                auto_return: "approved",
                notification_url: "https://vhodqxomxpjzfdvwmaok.supabase.co/functions/v1/mercadopago-webhook",
            }),
        });

        const preference = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error('Mercado Pago Error:', preference);
            throw new Error(preference.message || 'Error creating preference');
        }

        return new Response(JSON.stringify({
            id: preference.id,
            init_point: preference.init_point,
            sandbox_init_point: preference.sandbox_init_point,
            reference
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
