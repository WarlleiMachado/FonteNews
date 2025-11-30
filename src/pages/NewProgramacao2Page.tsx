import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import AdvancedEventForm from '../components/Common/AdvancedEventForm';
import { listTaxonomies, TaxonomyItem } from '../services/taxonomyService';
import { useToast } from '../contexts/ToastContext';

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

const NewProgramacao2Page: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const { addAnnouncement } = useApp();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'aviso' as string,
    priority: 'media' as string,
    image: '',
  });
  const [temas, setTemas] = useState<TaxonomyItem[]>([]);
  const [topicos, setTopicos] = useState<TaxonomyItem[]>([]);
  const [tipos, setTipos] = useState<TaxonomyItem[]>([]);
  const [prioridades, setPrioridades] = useState<TaxonomyItem[]>([]);
  const [selectedTemaId, setSelectedTemaId] = useState<string>('');
  const [selectedTopicoId, setSelectedTopicoId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTaxonomies = async () => {
      const [tms, tps, tTipos, tPrioridades] = await Promise.all([
        listTaxonomies('tema'),
        listTaxonomies('topico'),
        listTaxonomies('tipo'),
        listTaxonomies('prioridade'),
      ]);
      const sortBR = (arr: TaxonomyItem[]) => [...arr].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
      setTemas(sortBR(tms));
      setTopicos(sortBR(tps));
      setTipos(sortBR(tTipos));
      setPrioridades(sortBR(tPrioridades));
      if (tTipos.length > 0 && !tTipos.find(x => x.name === formData.type)) {
        setFormData(prev => ({ ...prev, type: tTipos[0].name }));
      }
      if (tPrioridades.length > 0 && !tPrioridades.find(x => x.name === formData.priority)) {
        setFormData(prev => ({ ...prev, priority: tPrioridades[0].name }));
      }
    };
    fetchTaxonomies();
  }, []);

  const handleAdvancedSubmit = async (values: { title: string; description: string; descriptionHtml?: string; imageUrl?: string; destaqueCountdownUrl?: string; rruleString: string; endTime?: string; videoUrl?: string; isLive?: boolean; }) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      // Validações obrigatórias: Tipo, Prioridade, Tema e Tópico
      if (!formData.type || !formData.priority || !selectedTemaId || !selectedTopicoId) {
        showToast('warning', 'Selecione Tipo, Prioridade, Tema e Tópico.');
        setIsSubmitting(false);
        return;
      }
      const announcementData = {
        title: values.title,
        content: values.description,
        ...(values.descriptionHtml && { contentHtml: values.descriptionHtml }),
        type: formData.type,
        priority: formData.priority,
        ministry: user.ministry || 'geral',
        rruleString: values.rruleString,
        ...(values.endTime && { endTime: values.endTime }),
        ...(values.imageUrl && values.imageUrl.trim() && { image: values.imageUrl.trim() }),
        ...(values.destaqueCountdownUrl && values.destaqueCountdownUrl.trim() && { destaqueCountdownUrl: values.destaqueCountdownUrl.trim() }),
        ...(values.videoUrl && values.videoUrl.trim() && { videoUrl: values.videoUrl.trim() }),
        ...(typeof values.isLive !== 'undefined' && { isLive: !!values.isLive }),
        ...(selectedTemaId && { temaId: selectedTemaId, temaName: (temas.find(t => t.id === selectedTemaId)?.name || '') }),
        ...(selectedTopicoId && { topicoId: selectedTopicoId, topicoName: (topicos.find(t => t.id === selectedTopicoId)?.name || '') })
      };
      console.log('🔥 PROGRAMACAO2: Enviando criação via AppContext.addAnnouncement:', announcementData);
      await addAnnouncement(announcementData as any, { ...user, avatarUrl: user.avatarUrl || '' } as any);
      console.log('✅ PROGRAMACAO2: Solicitação de criação enviada com sucesso');
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ PROGRAMACAO2: Erro ao salvar:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast('error', `Erro ao salvar programação: ${message}`);
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
          <p className="text-jkd-text">Você precisa estar logado para criar programações.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center space-x-2 text-church-primary hover:text-church-primary/80 mb-4">
            <ArrowLeft size={20} />
            <span>Voltar para Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-jkd-heading">Nova Programação</h1>
          <p className="text-sm text-gray-500 mt-2">Crie uma programação com título, descrição, tipo, prioridade, imagem e recorrência. Após salvar, ela ficará pendente em "Aprovações" e só aparecerá na Agenda após ser aprovada.</p>
        </div>

        {/* Mensagens inline substituídas por toasts flutuantes via ToastContext */}

        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-6">
          <AdvancedEventForm
            initialTitle={formData.title}
            initialDescription={formData.content}
            initialImageUrl={formData.image}
            uploaderAuthorizedUserId={user.id}
            onSubmit={handleAdvancedSubmit}
            submitLabel={isSubmitting ? 'Salvando...' : 'Salvar Programação'}
            entityLabel="Programação"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-jkd-heading mb-2">
                Tipo
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                required
              >
                {(tipos.length > 0 ? tipos.map(x => ({ value: x.name, label: x.name })) : FALLBACK_TYPES).map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-jkd-heading mb-2">
                Prioridade
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                required
              >
                {(prioridades.length > 0 ? prioridades.map(x => ({ value: x.name, label: x.name })) : FALLBACK_PRIORITIES).map(pr => (
                  <option key={pr.value} value={pr.value}>{pr.label}</option>
                ))}
              </select>
            </div>
          </div>

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
              to="/dashboard"
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

export default NewProgramacao2Page;