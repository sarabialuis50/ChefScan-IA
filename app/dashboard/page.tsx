import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/auth/actions'

export default async function DashboardPage() {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/login')
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <header className="flex justify-between items-center bg-zinc-900 p-6 rounded-2xl border border-white/5">
                <div>
                    <h1 className="text-2xl font-bold">¡Hola de nuevo!</h1>
                    <p className="text-zinc-500 text-sm">{user.email}</p>
                </div>

                <form action={signOut}>
                    <button className="px-5 py-2 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest">
                        Cerrar Sesión
                    </button>
                </form>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 h-40 flex items-center justify-center text-zinc-600 italic">
                    Aquí irán tus recetas guardadas...
                </div>
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 h-40 flex items-center justify-center text-zinc-600 italic">
                    Aquí irá tu inventario...
                </div>
            </div>
        </div>
    )
}
