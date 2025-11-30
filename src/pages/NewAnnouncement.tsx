import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Image, AlertTriangle, UploadCloud, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { TaxonomyItem, listTaxonomies } from '../services/taxonomyService';
import RecurrenceEditor from '../components/Common/RecurrenceEditor';
import RichTextEditor from '../components/Common/RichTextEditor';
import { RRule } from 'rrule';

import { uploadImage } from '../services/uploadService';

const FALLBACK_TYPES = [
  { value: 'aviso', label: 'Aviso' },
  { value: 'evento', label: 'Evento' },
  { value: 'retiro', label: 'Retiro' },
  { value: 'jantar', label: 'Jantar' },
  { value: 'visita', label: 'Visita' },
  { value: 'evangelismo', label: 'Evangelismo' },
  { value: 'audicao', label: 'Audição' },
  { value: 'curso', label: 'Curso' },
  { value: 'confraternizacao', label: 'Confraternização' },
  { value: 'jornada-vida', label: 'Jornada Vida' },
];

const FALLBACK_PRIORITIES = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
];

const NewAnnouncement: React.FC = () => {
  const { user } = useAuth();
  const { addAnnouncement } = useApp();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'aviso' as string,
    priority: 'media' as string,
    image: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [rruleString, setRruleString] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tipos, setTipos] = useState<TaxonomyItem[]>([]);
  const [prioridades, setPrioridades] = useState<TaxonomyItem[]>([]);
  const [contentHtml, setContentHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTaxonomies = async () => {
      try {
        const [t, p] = await Promise.all([
          listTaxonomies('tipo'),
          listTaxonomies('prioridade'),
        ]);
        setTipos(t);
        setPrioridades(p);
        if (t.length > 0 && !t.find(x => x.name === formData.type)) {
          setFormData(prev => ({ ...prev, type: t[0].name }));
        }
        if (p.length > 0 && !p.find(x => x.name === formData.priority)) {
          setFormData(prev => ({ ...prev, priority: p[0].name }));
        }
      } catch {}
    };
    loadTaxonomies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);
    let finalImageUrl = formData.image;

    if (imageFile) {
      try {
        const filePath = `announcements/${Date.now()}_${imageFile.name}`;
        finalImageUrl = await uploadImage(imageFile, filePath);
      } catch (error) {
        console.error("Image upload failed:", error);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // Exigir recorrência configurada para evitar DTSTART dinâmico (agora)
      if (!rruleString || rruleString.trim() === '') {
        setError('Configure data e horário na recorrência antes de salvar.');
        setIsSubmitting(false);
        return;
      }

      const safeHtml = DOMPurify.sanitize(contentHtml || '');
      const toPlainText = (html: string) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html || '';
        return (tmp.textContent || tmp.innerText || '').trim();
      };

      const announcementData: any = {
        title: formData.title,
        content: toPlainText(safeHtml) || formData.content,
        ...(safeHtml && safeHtml.trim() && { contentHtml: safeHtml }),
        type: formData.type,
        rruleString: rruleString,
        ...(endTime && { endTime }),
        priority: formData.priority,
        ministry: user.ministry,
      };

      if (finalImageUrl && finalImageUrl.trim() !== '') {
        announcementData.image = finalImageUrl;
      }

      addAnnouncement(announcementData, user);

      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao criar programação:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, image: url }));
    if (url) {
      setImageFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setFormData(prev => ({ ...prev, image: '' }));
    }
  };

  if (!user) {
    return <div>Acesso negado</div>;
  }

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            to="/dashboard"
            className="inline-flex items-center space-x-2 text-church-primary hover:text-church-primary/80 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Voltar ao Painel</span>
          </Link>
          <h1 className="text-3xl font-bold text-jkd-heading">Nova Programação</h1>
        </div>

        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-jkd-heading mb-2">Tipo *</label>
              <select id="type" required value={formData.type} onChange={(e) => setFormData(p => ({...p, type: e.target.value }))}
                className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary">
                {(tipos.length > 0 ? tipos.map(x => ({ value: x.name, label: x.name })) : FALLBACK_TYPES).map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-jkd-heading mb-2">Título *</label>
              <input type="text" id="title" required value={formData.title} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))}
                className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary" />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-jkd-heading mb-2">Conteúdo *</label>
              <RichTextEditor
                initialHtml={contentHtml}
                onChangeHtml={setContentHtml}
                className="min-h-[150px]"
              />
            </div>

            <RecurrenceEditor rruleString={rruleString} onChange={setRruleString} endTime={endTime} onEndTimeChange={setEndTime} />
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-jkd-heading mb-2">Prioridade</label>
              <select id="priority" value={formData.priority} onChange={(e) => setFormData(p => ({...p, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary">
                {(prioridades.length > 0 ? prioridades.map(x => ({ value: x.name, label: x.name })) : FALLBACK_PRIORITIES).map(pr => (
                  <option key={pr.value} value={pr.value}>{pr.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-2">
                <div className="flex items-center space-x-2"><Image size={16} /><span>Imagem (opcional)</span></div>
                 <p className="text-xs text-jkd-text/70">Recomendado: formato vertical (9:16). Tamanho máximo: <strong>5MB</strong>.</p>
              </label>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input type="url" id="image" value={formData.image} onChange={(e) => handleUrlChange(e.target.value)}
                    disabled={!!imageFile}
                    className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary disabled:bg-jkd-border/20 disabled:cursor-not-allowed"
                    placeholder="https://exemplo.com/imagem.jpg" />
                </div>
                <div className="relative flex items-center justify-center">
                    <div className="flex-grow border-t border-jkd-border"></div>
                    <span className="flex-shrink mx-4 text-jkd-text text-sm">ou</span>
                    <div className="flex-grow border-t border-jkd-border"></div>
                </div>
                <div>
                  <label htmlFor="file-upload" className={`relative cursor-pointer rounded-lg border-2 border-dashed border-jkd-border w-full p-4 flex justify-center items-center text-center transition-colors ${formData.image ? 'bg-jkd-border/20 cursor-not-allowed opacity-50' : 'hover:border-church-primary'}`}>
                    <div className="space-y-1 text-jkd-text">
                      <UploadCloud className="mx-auto h-8 w-8" />
                      <span className="font-medium text-church-primary text-sm">Enviar arquivo</span>
                    </div>
                    <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={!!formData.image} accept="image/*" />
                  </label>
                  {imageFile && (
                    <div className="flex items-center justify-between bg-jkd-bg p-2 rounded-lg border border-jkd-border mt-2">
                      <p className="text-sm text-jkd-text truncate">{imageFile.name}</p>
                      <button type="button" onClick={() => setImageFile(null)} className="p-1 rounded-full hover:bg-red-500/10 text-red-500"><X size={16} /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6">
              <Link to="/dashboard" className="px-4 py-2 text-jkd-text hover:text-church-primary">Cancelar</Link>
              <button type="submit" disabled={isSubmitting} className="inline-flex items-center space-x-2 bg-church-primary text-white px-6 py-2 rounded-lg hover:bg-church-primary/90 disabled:opacity-50">
                <Save size={20} />
                <span>{isSubmitting ? 'Salvando...' : 'Salvar Programação'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`
        .input-style { @apply px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary; }
      `}</style>
    </div>
  );
};

export default NewAnnouncement;
