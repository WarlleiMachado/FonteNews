import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Image, AlertTriangle, UploadCloud, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadImage } from '../services/uploadService';
import { RRule } from 'rrule';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import RecurrenceEditor from '../components/Common/RecurrenceEditor';

const NewRoteiro2Page: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'rascunho' as 'rascunho' | 'pronto' | 'revisado',
    image: '',
    recordingMonth: `Gravação ${format(new Date(), 'MMMM yyyy', { locale: ptBR })}`,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rruleString, setRruleString] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    if (!rruleString || rruleString.trim() === '') {
      setError('Configure data e horário na recorrência antes de salvar.');
      setIsSubmitting(false);
      return;
    }

    try {
      let finalImageUrl = formData.image;

      // Upload da imagem se houver arquivo
      if (imageFile) {
        try {
          const filePath = `roteiros/${Date.now()}_${imageFile.name}`;
          finalImageUrl = await uploadImage(imageFile, filePath);
          console.log('🔥 ROTEIRO2: Imagem enviada:', finalImageUrl);
        } catch (uploadError) {
          console.error('❌ ROTEIRO2: Erro no upload:', uploadError);
          setError(`Erro no upload da imagem: ${uploadError instanceof Error ? uploadError.message : 'Erro desconhecido'}`);
          setIsSubmitting(false);
          return;
        }
      }

      // Abordagem direta ao Firestore - sem usar hooks do AppContext
      const scriptData = {
        title: formData.title,
        content: formData.content,
        status: formData.status,
        recordingMonth: formData.recordingMonth,
        rruleString: rruleString,
        ...(endTime && { endTime }),
        authorId: user.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Só adicionar image se tiver valor
        ...(finalImageUrl && finalImageUrl.trim() && { image: finalImageUrl.trim() })
      };

      console.log('🔥 ROTEIRO2: Salvando no Firestore:', scriptData);
      
      // Salvando diretamente na coleção 'roteiros'
      const docRef = await addDoc(collection(db, 'roteiros'), scriptData);
      
      console.log('✅ ROTEIRO2: Salvo com sucesso, ID:', docRef.id);
      
      navigate('/roteiros');
    } catch (error) {
      console.error('❌ ROTEIRO2: Erro ao salvar:', error);
      setError(`Erro ao salvar roteiro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
    return (
      <div className="min-h-screen bg-jkd-bg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-jkd-heading mb-2">Acesso Negado</h2>
          <p className="text-jkd-text">Você precisa estar logado para criar roteiros.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/roteiros" className="inline-flex items-center space-x-2 text-church-primary hover:text-church-primary/80 mb-4">
            <ArrowLeft size={20} />
            <span>Voltar para Roteiros</span>
          </Link>
          <h1 className="text-3xl font-bold text-jkd-heading">Novo Roteiro (Teste 2)</h1>
          <p className="text-sm text-gray-500 mt-2">Versão de teste com abordagem direta ao Firestore</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-jkd-heading mb-2">
              Título do Roteiro *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-jkd-heading mb-2">
              Conteúdo do Roteiro *
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={10}
              className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
              required
            />
          </div>

          <RecurrenceEditor rruleString={rruleString} onChange={setRruleString} endTime={endTime} onEndTimeChange={setEndTime} />

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-jkd-heading mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
            >
              <option value="rascunho">Rascunho</option>
              <option value="pronto">Pronto</option>
              <option value="revisado">Revisado</option>
            </select>
          </div>

          <div>
            <label htmlFor="recordingMonth" className="block text-sm font-medium text-jkd-heading mb-2">
              Mês de Gravação
            </label>
            <input
              type="text"
              id="recordingMonth"
              value={formData.recordingMonth}
              onChange={(e) => setFormData(prev => ({ ...prev, recordingMonth: e.target.value }))}
              className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jkd-heading mb-2">
              <div className="flex items-center gap-2">
                <Image size={16} />
                Imagem (opcional)
              </div>
              <p className="text-xs text-jkd-text/70">Recomendado: formato vertical (9:16). Tamanho máximo: <strong>2MB</strong>.</p>
            </label>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  disabled={!!imageFile}
                  className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary disabled:bg-jkd-border/20 disabled:cursor-not-allowed"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
              
              <div className="relative flex items-center justify-center">
                <div className="flex-grow border-t border-jkd-border"></div>
                <span className="flex-shrink mx-4 text-jkd-text text-sm">ou</span>
                <div className="flex-grow border-t border-jkd-border"></div>
              </div>
              
              {imageFile ? (
                <div className="flex items-center justify-between bg-jkd-bg p-2 rounded-lg border border-jkd-border">
                  <p className="text-sm text-jkd-text truncate">{imageFile.name}</p>
                  <button type="button" onClick={() => setImageFile(null)} className="p-1 rounded-full hover:bg-red-500/10 text-red-500">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label htmlFor="file-upload" className={`relative cursor-pointer rounded-lg border-2 border-dashed border-jkd-border w-full p-6 flex justify-center items-center text-center transition-colors ${formData.image ? 'bg-jkd-border/20 cursor-not-allowed opacity-50' : 'hover:border-church-primary'}`}>
                  <div className="space-y-1 text-jkd-text">
                    <UploadCloud className="mx-auto h-10 w-10" />
                    <span className="font-medium text-church-primary">Clique para enviar</span>
                    <p className="text-xs">PNG, JPG, GIF até 2MB</p>
                  </div>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={!!formData.image} accept="image/*" />
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link
              to="/roteiros"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-jkd-bg text-jkd-text"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90 disabled:opacity-50"
            >
              <Save size={16} />
              {isSubmitting ? 'Salvando...' : 'Salvar Roteiro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRoteiro2Page;