import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Image, UploadCloud, X, History, User, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';
import { Script, ScriptStatus } from '../../types';
import RecurrenceEditor from '../Common/RecurrenceEditor';
import { RRule } from 'rrule';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RoteiroFormProps {
  script?: Script;
}

const RoteiroForm: React.FC<RoteiroFormProps> = ({ script }) => {
  const isEditing = !!script;
  const { user } = useAuth();
  const { addScript, updateScript, getAuthorizedUserById } = useApp();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: script?.title || '',
    content: script?.content || '',
    status: script?.status || 'rascunho' as ScriptStatus,
    image: script?.image || '',
    recordingMonth: script?.recordingMonth || `Gravação ${format(new Date(), 'MMMM yyyy', { locale: ptBR })}`,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [rruleString, setRruleString] = useState(script?.rruleString || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [endTime, setEndTime] = useState<string>(script?.endTime || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    if (!rruleString || rruleString.trim() === '') {
      setError('Configure data e horário na recorrência antes de salvar.');
      setIsSubmitting(false);
      return;
    }

    let finalImageUrl = formData.image;

    if (imageFile) {
      finalImageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
    }

    const scriptData = {
      ...formData,
      ...(finalImageUrl && finalImageUrl.trim() && { image: finalImageUrl.trim() }),
      rruleString: rruleString,
      ...(endTime && { endTime }),
      authorId: script?.authorId || user.id,
    };

    try {
      if (isEditing && script.id) {
        updateScript(script.id, scriptData, user.id);
      } else {
        addScript(scriptData, user.id);
      }
      navigate('/roteiros');
    } catch (error) {
      console.error('Erro ao salvar roteiro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, image: url }));
    if (url) setImageFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setFormData(prev => ({ ...prev, image: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/roteiros" className="inline-flex items-center space-x-2 text-church-primary hover:text-church-primary/80 mb-4">
            <ArrowLeft size={20} />
            <span>Voltar para Roteiros</span>
          </Link>
          <h1 className="text-3xl font-bold text-jkd-heading">{isEditing ? 'Editar Roteiro' : 'Novo Roteiro'}</h1>
        </div>

        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border">
          {isEditing && (
            <div className="border-b border-jkd-border">
              <nav className="flex space-x-1 p-2">
                <button onClick={() => setActiveTab('editor')} className={`tab-button ${activeTab === 'editor' ? 'active' : ''}`}>Editor</button>
                <button onClick={() => setActiveTab('history')} className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}>Histórico</button>
              </nav>
            </div>
          )}

          {activeTab === 'editor' && (
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-jkd-heading mb-2">Título *</label>
                  <input type="text" id="title" required value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} className="w-full input-style" />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-jkd-heading mb-2">Status *</label>
                  <select id="status" required value={formData.status} onChange={e => setFormData(p => ({...p, status: e.target.value as ScriptStatus}))} className="w-full input-style">
                    <option value="rascunho">Rascunho</option>
                    <option value="pronto">Pronto</option>
                    <option value="revisado">Revisado</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-jkd-heading mb-2">Conteúdo do Roteiro *</label>
                <textarea id="content" required rows={12} value={formData.content} onChange={e => setFormData(p => ({...p, content: e.target.value}))} className="w-full input-style font-mono" />
              </div>

              <RecurrenceEditor rruleString={rruleString} onChange={setRruleString} endTime={endTime} onEndTimeChange={setEndTime} />
              {error && (<div className="text-red-600 text-sm">{error}</div>)}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="recordingMonth" className="block text-sm font-medium text-jkd-heading mb-2">Mês da Gravação *</label>
                  <input type="text" id="recordingMonth" required value={formData.recordingMonth} onChange={e => setFormData(p => ({...p, recordingMonth: e.target.value}))} className="w-full input-style" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-jkd-heading mb-2">Imagem da Programação (opcional)</label>
                    <div className="space-y-2">
                        <input type="url" id="image" value={formData.image} onChange={e => handleUrlChange(e.target.value)} disabled={!!imageFile} className="w-full input-style disabled:bg-jkd-border/20" placeholder="URL da imagem"/>
                        <div className="relative flex items-center justify-center"><div className="flex-grow border-t border-jkd-border"></div><span className="flex-shrink mx-4 text-jkd-text text-xs">ou</span><div className="flex-grow border-t border-jkd-border"></div></div>
                        {imageFile ? (
                            <div className="flex items-center justify-between bg-jkd-bg p-2 rounded-lg border border-jkd-border"><p className="text-sm text-jkd-text truncate">{imageFile.name}</p><button type="button" onClick={() => setImageFile(null)} className="p-1 rounded-full hover:bg-red-500/10 text-red-500"><X size={16} /></button></div>
                        ) : (
                            <label htmlFor="file-upload" className={`relative cursor-pointer rounded-lg border-2 border-dashed border-jkd-border w-full p-4 flex justify-center items-center text-center transition-colors ${formData.image ? 'bg-jkd-border/20 cursor-not-allowed opacity-50' : 'hover:border-church-primary'}`}><div className="space-y-1 text-jkd-text"><UploadCloud className="mx-auto h-8 w-8" /><span className="font-medium text-church-primary text-sm">Enviar arquivo</span></div><input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={!!formData.image} accept="image/*" /></label>
                        )}
                    </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6">
                <Link to="/roteiros" className="px-4 py-2 text-jkd-text hover:text-church-primary">Cancelar</Link>
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center space-x-2 bg-church-primary text-white px-6 py-2 rounded-lg hover:bg-church-primary/90 disabled:opacity-50">
                  <Save size={20} />
                  <span>{isSubmitting ? 'Salvando...' : 'Salvar Roteiro'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'history' && script && (
            <div className="p-8">
              <h3 className="text-lg font-semibold text-jkd-heading mb-4 flex items-center gap-2"><History size={20}/> Histórico de Alterações</h3>
              <ul className="space-y-3">
                {script.history.slice().reverse().map((entry, index) => {
                  const editor = getAuthorizedUserById(entry.userId);
                  return (
                    <li key={index} className="flex items-center gap-4 p-3 bg-jkd-bg rounded-md border border-jkd-border">
                      <img src={editor?.avatarUrl || `https://ui-avatars.com/api/?name=${editor?.name || '?'}`} alt={editor?.name} className="h-10 w-10 rounded-full object-cover"/>
                      <div>
                        <p className="text-sm font-medium text-jkd-heading">
                          <span className="font-bold">{editor?.name || 'Usuário desconhecido'}</span> realizou uma alteração.
                        </p>
                        <p className="text-xs text-jkd-text/70">{format(entry.date, "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .input-style { @apply px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary; }
        .tab-button { @apply px-4 py-2 text-sm font-medium rounded-md transition-colors; }
        .tab-button.active { @apply bg-church-primary/10 text-church-primary; }
      `}</style>
    </div>
  );
};

export default RoteiroForm;
