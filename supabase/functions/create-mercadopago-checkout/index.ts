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
            throw new Error('No se encontró el token de autorización.');
        }

        // Get user profile data for better payment method availability
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) throw new Error('Usuario no válido o sesión expirada.');

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('name, phone')
            .eq('id', user.id)
            .single();

        const ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
        if (!ACCESS_TOKEN) {
            throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado en Supabase.');
        }

        // Split name for Mercado Pago (Best Practice)
        const fullName = profile?.name || user.user_metadata?.full_name || 'Chef';
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Scan';

        // Subscription details
        const amount = 19900; // COP
        const reference = `cs_${user.id}_${Date.now()}`;

        // Determine return URLs
        const referer = req.headers.get('referer') || '';
        const isLocalhost = referer.includes('localhost') || referer.includes('127.0.0.1');
        const baseUrl = isLocalhost ? 'https://chefscania.com' : referer.split('?')[0];

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
                payer: {
                    email: user.email,
                    first_name: firstName,
                    last_name: lastName,
                    phone: profile?.phone ? {
                        number: profile.phone.replace(/\D/g, '')
                    } : undefined,
                },
                back_urls: {
                    success: baseUrl,
                    failure: baseUrl,
                    pending: baseUrl,
                },
                auto_return: "approved",
                notification_url: "https://vhodqxomxpjzfdvwmaok.supabase.co/functions/v1/mercadopago-webhook",
                statement_descriptor: "CHEFSCAN IA",
                // Explicitly allow all methods to ensure Nequi/Daviplata/PSE are visible if account permits
                payment_methods: {
                    excluded_payment_methods: [],
                    excluded_payment_types: [],
                    installments: 1,
                    default_installments: 1
                }
            }),
        });

        const preferenceData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error('Mercado Pago API Error Detail:', JSON.stringify(preferenceData));
            throw new Error(preferenceData.message || 'Error en la API de Mercado Pago');
        }

        return new Response(JSON.stringify({
            id: preferenceData.id,
            init_point: preferenceData.init_point,
            sandbox_init_point: preferenceData.sandbox_init_point,
            reference
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Function Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
