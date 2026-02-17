import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
    'Access-Control-Max-Age': '86400',
};

// Hardcoded fallback key (same as in frontend) to ensure production works immediately
const FALLBACK_PEXELS_KEY = "NcAFAIe1Vdf4ufPGwuxFmjbCjWpf4yeCRrd4goHlM8rBaPD9c4S3UZEL";

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { query, per_page = 20 } = await req.json();

        // Try getting from secrets first, then fallback to hardcoded
        const PEXELS_API_KEY = Deno.env.get('VITE_PEXELS_API_KEY') || FALLBACK_PEXELS_KEY;

        if (!PEXELS_API_KEY) {
            throw new Error('PEXELS_API_KEY not configured');
        }

        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${per_page}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': PEXELS_API_KEY,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Pexels API error:', data);
            return new Response(JSON.stringify({ error: data.error || 'Pexels API error' }), {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Edge Function error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
