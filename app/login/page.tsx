import GoogleButton from '@/components/auth/GoogleButton'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: { message: string }
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Si ya está logueado, redirigir al dashboard
    if (user) {
        return redirect('/dashboard')
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black px-6">
            <div className="w-full max-w-md space-y-8 text-center">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white uppercase tracking-tighter">
                        Bienvenido a ChefScan<span className="text-primary">.IA</span>
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Ingresa para empezar a cocinar con inteligencia artificial
                    </p>
                </div>

                <div className="bg-zinc-900/50 p-8 rounded-3xl border border-white/5 shadow-2xl">
                    <GoogleButton />

                    {searchParams?.message && (
                        <p className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl">
                            {searchParams.message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
