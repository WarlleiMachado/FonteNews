import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import AdvancedEventForm from '../components/Common/AdvancedEventForm';
import { listTaxonomies, TaxonomyItem } from '../services/taxonomyService';

const NewCulto2Page: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temas, setTemas] = useState<TaxonomyItem[]>([]);
  const [topicos, setTopicos] = useState<TaxonomyItem[]>([]);
  const [selectedTemaId, setSelectedTemaId] = useState<string>('');
  const [selectedTopicoId, setSelectedTopicoId] = useState<string>('');

  useEffect(() => {
    const fetchTaxonomies = async () => {
      const [tms, tps] = await Promise.all([
        listTaxonomies('tema'),
        listTaxonomies('topico')
      ]);
      setTemas([...tms].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })));
      setTopicos([...tps].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })));
    };
    fetchTaxonomies();
  }, []);

  const handleAdvancedSubmit = async (values: { title: string; description: string; descriptionHtml?: string; imageUrl?: string; destaqueCountdownUrl?: string; rruleString: string; endTime?: string; videoUrl?: string; isLive?: boolean; }) => {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // Validações obrigatórias: Tema e Tópico
      if (!selectedTemaId || !selectedTopicoId) {
        setError('Selecione Tema e Tópico.');
        setIsSubmitting(false);
        return;
      }
      const cultoData = {
        title: values.title,
        description: values.description,
        ...(values.descriptionHtml && { descriptionHtml: values.descriptionHtml }),
        rruleString: values.rruleString,
        ...(values.endTime && { endTime: values.endTime }),
        authorFirebaseUid: firebaseUser?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(values.imageUrl && values.imageUrl.trim() && { image: values.imageUrl.trim() }),
        ...(values.destaqueCountdownUrl && values.destaqueCountdownUrl.trim() && { destaqueCountdownUrl: values.destaqueCountdownUrl.trim() }),
        ...(values.videoUrl && values.videoUrl.trim() && { videoUrl: values.videoUrl.trim() }),
        ...(typeof values.isLive !== 'undefined' && { isLive: !!values.isLive }),
        ...(selectedTemaId && { temaId: selectedTemaId, temaName: (temas.find(t => t.id === selectedTemaId)?.name || '') }),
        ...(selectedTopicoId && { topicoId: selectedTopicoId, topicoName: (topicos.find(t => t.id === selectedTopicoId)?.name || '') })
      };
      console.log('🔥 CULTO2: Salvando no Firestore:', cultoData);
      const docRef = await addDoc(collection(db, 'cultos'), cultoData);
      console.log('✅ CULTO2: Salvo com sucesso, ID:', docRef.id);
      navigate('/agenda');
    } catch (error) {
      console.error('❌ CULTO2: Erro ao salvar:', error);
      setError(`Erro ao salvar culto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-jkd-bg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-jkd-heading mb-2">Acesso Negado</h2>
          <p className="text-jkd-text">Você precisa estar logado para criar cultos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/agenda" className="inline-flex items-center space-x-2 text-church-primary hover:text-church-primary/80 mb-4">
            <ArrowLeft size={20} />
            <span>Voltar para Agenda</span>
          </Link>
          <h1 className="text-3xl font-bold text-jkd-heading">Novo Culto</h1>
          <p className="text-sm text-gray-500 mt-2">Formulário para cadastro de cultos (pontuais ou recorrentes).</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-6">
          <AdvancedEventForm
             uploaderAuthorizedUserId={user.id}
             onSubmit={handleAdvancedSubmit}
             submitLabel={isSubmitting ? 'Salvando...' : 'Salvar Culto'}
             entityLabel="Culto"
           />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="tema" className="block text-sm font-medium text-jkd-heading mb-2">
                Tema (Categoria)
              </label>
              <select
                id="tema"
                value={selectedTemaId}
                onChange={(e) => setSelectedTemaId(e.target.value)}
                className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                required
              >
                <option value="">Selecione um Tema</option>
                {temas.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="topico" className="block text-sm font-medium text-jkd-heading mb-2">
                Tópico (Tag)
              </label>
              <select
                id="topico"
                value={selectedTopicoId}
                onChange={(e) => setSelectedTopicoId(e.target.value)}
                className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                required
              >
                <option value="">Selecione um Tópico</option>
                {topicos.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Link
              to="/agenda"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-jkd-bg text-jkd-text"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCulto2Page;