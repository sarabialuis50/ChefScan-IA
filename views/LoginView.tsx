import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginViewProps {
  onLogin: (user: any) => void;
  onBack?: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const translateError = (message: string) => {
    if (message.includes('Password should be at least 6 characters')) return 'La contraseña debe tener al menos 6 caracteres.';
    if (message.includes('Invalid login credentials')) return 'Credenciales incorrectas. Intenta de nuevo.';
    if (message.includes('User already registered')) return 'Este correo ya está registrado.';
    if (message.includes('Email not confirmed')) return 'Confirma tu email antes de iniciar sesión.';
    if (message.includes('weak_password')) return 'La contraseña es muy débil.';
    return 'Ocurrió un error. Intenta de nuevo.';
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Escribe tu email para recuperar la contraseña.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (error) {
      setError(translateError(error.message));
    } else {
      setError('¡Email de recuperación enviado! Revisa tu correo.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      if (!username || !fullName) {
        setError('Por favor completa todos los campos.');
        setLoading(false);
        return;
      }
      if (username.length > 10) {
        setError('El usuario no puede tener más de 10 caracteres.');
        setLoading(false);
        return;
      }
    }

    const { data, error: authError } = isSignUp
      ? await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            name: fullName
          }
        }
      })
      : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(translateError(authError.message));
      setLoading(false);
    } else {
      // Success handling
      if (data.session) {
        // We have a session, force entry immediately
        onLogin(data.session.user);
      } else if (data.user && isSignUp) {
        // User created but no session means Email Confirmation is likely ON
        setError('¡Cuenta creada! Por favor revisa tu email para confirmar.');
        setLoading(false);
      } else {
        // Fallback
        setLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: siteUrl
      }
    });
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-app)' }} className="min-h-screen w-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Grids */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #39FF14 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[140px] pointer-events-none"></div>

      <main style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--card-border)' }} className="w-full max-w-md rounded-[3rem] p-10 relative z-10 border shadow-2xl">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-8 left-8 text-zinc-600 hover:text-white transition-colors z-[50] flex items-center gap-2 group cursor-pointer bg-transparent border-none p-0"
          >
            <span className="material-symbols-outlined text-sm text-primary">arrow_back</span>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Volver</span>
          </button>
        )}
        <div className="flex flex-col items-center text-center mb-10">
          <div style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'rgba(var(--primary-rgb), 0.3)' }} className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 neon-glow border overflow-hidden">
            <img src="/landing-logo.png" alt="ChefScan Logo" className="w-14 h-14 object-contain relative z-10" />
          </div>
          <h2 className="text-3xl font-bold tracking-tighter drop-shadow-lg mb-2">
            <span style={{ color: 'var(--text-main)' }}>Chef</span><span className="text-primary">Scan.IA</span>
          </h2>
          <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium px-4 leading-relaxed">
            Recetas saludables creadas con IA para tu bienestar diario
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Nombre de Usuario (Máx 10)</label>
                <div style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'var(--card-border)' }} className="relative group rounded-xl border focus-within:border-primary transition-all overflow-hidden">
                  <span className="absolute inset-y-0 left-4 flex items-center text-gray-500 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-xl">person</span>
                  </span>
                  <input
                    type="text"
                    maxLength={10}
                    className="block w-full pl-12 pr-4 py-4 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-700 font-medium"
                    style={{ color: 'var(--text-main)' }}
                    placeholder="Ej: Luis S."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Nombre Completo</label>
                <div style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'var(--card-border)' }} className="relative group rounded-xl border focus-within:border-primary transition-all overflow-hidden">
                  <span className="absolute inset-y-0 left-4 flex items-center text-gray-500 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-xl">badge</span>
                  </span>
                  <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-4 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-700 font-medium"
                    style={{ color: 'var(--text-main)' }}
                    placeholder="Tu nombre completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Email de Acceso</label>
            <div style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'var(--card-border)' }} className="relative group rounded-xl border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all overflow-hidden">
              <span className="absolute inset-y-0 left-4 flex items-center text-gray-500 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">alternate_email</span>
              </span>
              <input
                type="email"
                required
                className="block w-full pl-12 pr-4 py-4 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-700"
                style={{ color: 'var(--text-main)' }}
                placeholder="usuario@chefscan.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Contraseña</label>
            <div style={{ backgroundColor: 'var(--bg-surface-inner)', borderColor: 'var(--card-border)' }} className="relative group rounded-xl border focus-within:border-primary transition-all overflow-hidden">
              <span className="absolute inset-y-0 left-4 flex items-center text-gray-500 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">lock</span>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-12 pr-12 py-4 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-700"
                style={{ color: 'var(--text-main)' }}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white cursor-pointer bg-transparent border-none z-10"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight ml-1">{error}</p>}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleResetPassword}
                style={{ color: 'var(--text-muted)' }}
                className="text-[10px] font-bold hover:text-primary transition-colors uppercase tracking-wider bg-transparent border-none cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-[0.25em] text-[11px] shadow-lg hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 border-none cursor-pointer"
          >
            {loading ? 'Procesando...' : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div style={{ borderColor: 'var(--card-border)' }} className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-[10px]">
            <span style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }} className="px-4 font-bold uppercase tracking-[0.25em]">O CONTINUAR CON</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center px-4 py-4 border border-white/10 rounded-xl bg-white text-black hover:bg-gray-100 transition-all text-[11px] font-bold uppercase tracking-widest gap-3 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Iniciar con Google
        </button>

        <div className="mt-10 text-center">
          <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">
            {isSignUp ? '¿YA TIENES CUENTA?' : '¿NUEVO EN CHEFSCAN.IA?'}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 font-black text-primary hover:underline bg-transparent border-none cursor-pointer uppercase tracking-widest"
            >
              {isSignUp ? 'INICIA SESIÓN' : 'REGÍSTRATE'}
            </button>
          </p>
        </div>
      </main >

      <footer className="mt-10">
        <p style={{ color: 'var(--text-muted)', opacity: 0.5 }} className="text-[9px] font-bold uppercase tracking-[0.4em]">© 2026 ChefScan System v2.5</p>
      </footer>
    </div >
  );
};

export default LoginView;
