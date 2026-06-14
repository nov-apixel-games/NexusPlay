import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Camera, Check, Loader2, AlertTriangle, Globe, MapPin } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface OnboardingViewProps {
  session: any;
  onComplete: (profile: any) => void;
}

export function OnboardingView({ session, onComplete }: OnboardingViewProps) {
  const { t } = useAppStore();
  const email = session?.user?.email || '';
  const initialName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || '';
  const initialAvatar = session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture || '';
  const baseUsername = (initialName || email.split('@')[0] || 'User')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .substring(0, 15)
    .toLowerCase();

  const [username, setUsername] = useState(baseUsername);
  const [displayName, setDisplayName] = useState(initialName);
  const [bio, setBio] = useState('');
  const [language, setLanguage] = useState(localStorage.getItem('nexus_language') || 'es');
  const [country, setCountry] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check username availability
  useEffect(() => {
    if (!username || username.trim().length < 3) {
      setUsernameError('El nombre de usuario debe tener al menos 3 caracteres');
      setUsernameAvailable(false);
      return;
    }

    const checkAvailability = async () => {
      setIsCheckingUsername(true);
      setUsernameError('');
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username.trim().toLowerCase())
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setUsernameError('Este nombre de usuario ya está en uso');
          setUsernameAvailable(false);
        } else {
          setUsernameAvailable(true);
        }
      } catch (err: any) {
        console.error("Error checking username:", err);
        setUsernameAvailable(false);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const debounce = setTimeout(checkAvailability, 500);
    return () => clearTimeout(debounce);
  }, [username]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen no debe superar los 2MB");
      return;
    }

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path);
      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.error(err);
      alert("Error al subir el avatar.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameAvailable || !displayName.trim()) return;

    setIsSaving(true);
    try {
      const role = email === 'elmenorjn@gmail.com' ? 'admin' : 'user';

      // Actualizar metadata de auth con la info adicional que no cabe en profiles local
      await supabase.auth.updateUser({
        data: { 
          avatar_url: avatarUrl, 
          full_name: displayName.trim(), 
          bio: bio.trim(),
          language: language,
          country: country.trim(),
          onboarding_completed: true
        }
      });
      
      localStorage.setItem('nexus_language', language);

      const compatPayload = {
        id: session.user.id,
        email: email,
        username: username.trim().toLowerCase(),
        real_name: displayName.trim(),
        avatar_url: avatarUrl,
        bio: bio.trim(),
        language: language,
        country: country.trim(),
        role: role,
        onboarding_completed: true
      };
      
      const { data: compatData, error: compatErr } = await supabase.from('profiles').upsert([compatPayload], { onConflict: 'id' }).select().single();
      if (compatErr) throw compatErr;
      
      onComplete(compatData);
    } catch (err: any) {
      console.error("Error setting up profile:", err);
      alert(`No se pudo crear el perfil: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-nexus-bg flex items-center justify-center p-4 overflow-y-auto pointer-events-auto sm:p-6 lg:p-8 touch-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-nexus-card border border-nexus-border rounded-3xl max-w-2xl w-full p-6 sm:p-10 shadow-2xl my-auto"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-nexus-text mb-3 tracking-tight">Completa tu perfil</h1>
          <p className="text-nexus-text-sec text-sm sm:text-base max-w-md mx-auto">Configura tu cuenta para comenzar a usar NexusPlay</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Base */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-nexus-card bg-nexus-surface overflow-hidden shadow-xl flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-cyan-500 uppercase">{displayName[0] || '?'}</span>
                )}
              </div>
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex flex-col items-center justify-center cursor-pointer">
                <Camera className="w-8 h-8 text-white mb-1" />
                <span className="text-white text-[10px] font-bold uppercase tracking-wider">Cambiar</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <p className="text-xs text-nexus-text-sec mt-3 font-medium uppercase tracking-widest">Foto (Opcional)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <label className="block text-xs font-black text-nexus-text-sec uppercase tracking-widest mb-2">Usuario Único</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-nexus-text-sec">@</span>
                <input 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                  className={`w-full bg-nexus-surface border ${usernameError ? 'border-red-500' : 'border-nexus-border'} rounded-xl pl-9 pr-10 py-3 text-nexus-text outline-none focus:border-cyan-500 transition-colors font-medium`}
                  placeholder="usuario_unico"
                  required
                />
                <div className="absolute right-4 top-3.5">
                  {isCheckingUsername ? <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" /> : 
                   usernameAvailable ? <Check className="w-4 h-4 text-emerald-400" /> : 
                   usernameError ? <AlertTriangle className="w-4 h-4 text-red-500" /> : null}
                </div>
              </div>
              {usernameError && <p className="text-red-400 text-xs mt-1 font-medium">{usernameError}</p>}
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-xs font-black text-nexus-text-sec uppercase tracking-widest mb-2">Nombre Visible</label>
              <input 
                type="text" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-3 text-nexus-text outline-none focus:border-cyan-500 transition-colors font-medium"
                placeholder="Ej. Juan Pérez"
                required
              />
            </div>

            {/* Bio */}
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-nexus-text-sec uppercase tracking-widest mb-2">Biografía (Opcional)</label>
              <textarea 
                value={bio} 
                onChange={e => setBio(e.target.value)}
                className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-3 text-nexus-text outline-none focus:border-cyan-500 transition-colors font-medium resize-none h-24"
                placeholder="Cuéntanos un poco sobre ti..."
                maxLength={160}
              />
              <p className="text-right text-xs text-nexus-text-sec mt-1">{bio.length}/160</p>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-black text-nexus-text-sec uppercase tracking-widest mb-2 flex items-center gap-2"><Globe className="w-3 h-3"/> Idioma Preferido</label>
              <select 
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-3 text-nexus-text outline-none focus:border-cyan-500 transition-colors font-medium appearance-none"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-black text-nexus-text-sec uppercase tracking-widest mb-2 flex items-center gap-2"><MapPin className="w-3 h-3"/> País (Opcional)</label>
              <input 
                type="text" 
                value={country} 
                onChange={e => setCountry(e.target.value)}
                className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-3 text-nexus-text outline-none focus:border-cyan-500 transition-colors font-medium"
                placeholder="Ej. México, España, Argentina..."
              />
            </div>
          </div>

          <div className="pt-6 border-t border-nexus-border flex justify-end">
            <button
              type="submit"
              disabled={!usernameAvailable || !displayName.trim() || isSaving}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-black px-8 py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5"/> Completar Perfil</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
