import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings, Save } from 'lucide-react';

interface LegacySettings {
  autoplayMs?: number;
  pauseOnHover?: boolean;
  showIndicators?: boolean;
  contact_email?: string;
  email_color?: string;
  enable_particles?: boolean;
  transition_time?: number;
  pause_on_hover?: boolean;
}

const defaultSettings: LegacySettings = {
  autoplayMs: 5000,
  pauseOnHover: true,
  showIndicators: true,
  contact_email: '',
  email_color: '#ffffff',
  enable_particles: false,
};

const CursoSlideConfigPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<LegacySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const ref = doc(db, 'course_slide_settings', 'default');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as LegacySettings;
        setSettings({
          ...defaultSettings,
          ...data,
          autoplayMs: data.autoplayMs ?? data.transition_time ?? defaultSettings.autoplayMs,
          pauseOnHover: data.pauseOnHover ?? data.pause_on_hover ?? defaultSettings.pauseOnHover,
        });
      } else {
        setSettings(defaultSettings);
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const payload: LegacySettings = {
        autoplayMs: Number(settings.autoplayMs) || defaultSettings.autoplayMs,
        transition_time: Number(settings.autoplayMs) || defaultSettings.autoplayMs,
        pauseOnHover: !!settings.pauseOnHover,
        pause_on_hover: !!settings.pauseOnHover,
        showIndicators: !!settings.showIndicators,
        contact_email: settings.contact_email || '',
        email_color: settings.email_color || '#ffffff',
        enable_particles: !!settings.enable_particles,
      };
      await setDoc(doc(db, 'course_slide_settings', 'default'), payload, { merge: true });
      setInfo('Configurações salvas com sucesso.');
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-jkd-heading">Curso-Slide — Configurações</h1>
        <p className="text-sm text-jkd-text mt-1">Ajuste as opções de comportamento e aparência do slider de cursos.</p>

        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-5 h-5 text-church-primary" />
            <h2 className="text-lg font-medium text-jkd-heading">Opções</h2>
          </div>

          {loading ? (
            <div className="text-jkd-text">Carregando...</div>
          ) : (
            <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {error && <div className="md:col-span-2 text-sm text-red-600">{error}</div>}
              {info && <div className="md:col-span-2 text-sm text-green-600">{info}</div>}

              <div>
                <label className="text-sm font-medium text-jkd-heading">Autoplay (ms)</label>
                <input type="number" min={1000} step={500} value={settings.autoplayMs ?? 5000} onChange={e=>setSettings(s=>({ ...s, autoplayMs: Number(e.target.value) }))} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
              </div>
              
              <div className="flex items-center gap-2">
                <input id="pauseOnHover" type="checkbox" checked={!!settings.pauseOnHover} onChange={e=>setSettings(s=>({ ...s, pauseOnHover: e.target.checked }))} />
                <label htmlFor="pauseOnHover" className="text-sm text-jkd-heading">Pausar ao passar o mouse</label>
              </div>

              <div className="flex items-center gap-2">
                <input id="showIndicators" type="checkbox" checked={!!settings.showIndicators} onChange={e=>setSettings(s=>({ ...s, showIndicators: e.target.checked }))} />
                <label htmlFor="showIndicators" className="text-sm text-jkd-heading">Mostrar indicadores</label>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-jkd-heading">E-mail de contato</label>
                <input type="email" value={settings.contact_email || ''} onChange={e=>setSettings(s=>({ ...s, contact_email: e.target.value }))} placeholder="ex: contato@exemplo.com" className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
              </div>

              <div>
                <label className="text-sm font-medium text-jkd-heading">Cor do e-mail</label>
                <input type="text" value={settings.email_color || '#ffffff'} onChange={e=>setSettings(s=>({ ...s, email_color: e.target.value }))} placeholder="#ffffff" className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
              </div>

              <div className="flex items-center gap-2">
                <input id="enable_particles" type="checkbox" checked={!!settings.enable_particles} onChange={e=>setSettings(s=>({ ...s, enable_particles: e.target.checked }))} />
                <label htmlFor="enable_particles" className="text-sm text-jkd-heading">Habilitar partículas decorativas</label>
              </div>

              <div className="md:col-span-2 flex justify-end mt-2">
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90 disabled:opacity-60">
                  <Save size={16} />
                  <span>{saving ? 'Salvando...' : 'Salvar configurações'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CursoSlideConfigPage;