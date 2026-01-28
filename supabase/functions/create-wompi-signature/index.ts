import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version',
}

Deno.serve(async (req) => {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: { headers: { Authorization: req.headers.get('Authorization')! } },
            }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('No user found')
        }

        const publicKey = Deno.env.get('WOMPI_PUBLIC_KEY')
        const integritySecret = Deno.env.get('WOMPI_INTEGRITY_SECRET')

        if (!publicKey || !integritySecret) {
            throw new Error(`Faltan secretos en Supabase: ${!publicKey ? 'WOMPI_PUBLIC_KEY ' : ''}${!integritySecret ? 'WOMPI_INTEGRITY_SECRET' : ''}`)
        }

        const { returnUrl } = await req.json()

        // 1. Generate a unique Reference for Wompi
        const reference = `chefscan_${user.id}_${Date.now()}`

        // 2. Generate the Integrity Signature
        const amountInCents = 1990000
        const currency = 'COP'

        // La firma de Wompi requiere: referencia + monto + moneda + secreto
        const signatureInput = `${reference}${amountInCents}${currency}${integritySecret}`

        const encoder = new TextEncoder()
        const data = encoder.encode(signatureInput)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const integritySignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        return new Response(
            JSON.stringify({
                reference,
                integritySignature,
                amountInCents,
                currency,
                publicKey,
                status: 'success'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
