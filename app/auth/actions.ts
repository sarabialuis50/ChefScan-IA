'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signInWithGoogle() {
    const supabase = createClient()
    const origin = headers().get('origin')

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        console.error('Error signing in with Google:', error.message)
        return redirect('/login?message=Could not authenticate user')
    }

    if (data.url) {
        redirect(data.url) // Redirige a Google
    }
}

export async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
