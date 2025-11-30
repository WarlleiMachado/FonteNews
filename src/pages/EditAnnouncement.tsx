import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { useToast } from '../contexts/ToastContext';
import { listTaxonomies, TaxonomyItem } from '../services/taxonomyService';
import AdvancedEventForm from '../components/Common/AdvancedEventForm';

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

const EditAnnouncement: React.FC = () => {
  const { user } = useAuth();
  const { getAnnouncementById, updateAnnouncement } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [formData, setFormData] = useState({
    title: '',
    type: 'aviso' as string,
    priority: 'media' as string,
    image: '',
  });
  const [tipos, setTipos] = useState<TaxonomyItem[]>([]);
  const [prioridades, setPrioridades] = useState<TaxonomyItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const announcement = getAnnouncementById(id);
      if (announcement) {
        if (user?.role !== 'admin' && user?.id !== announcement.authorId) {
          setError('Você não tem permissão para editar esta programação.');
        } else {
          // Bloqueio: Programações rejeitadas não podem ser editadas/restauradas
          if (announcement.status === 'rejected') {
            showToast('warning', 'Programações Rejeitadas não poderão ser Restauradas');
            navigate('/dashboard');
            setIsLoading(false);
            return;
          }
          setFormData({
            title: announcement.title,
            type: announcement.type,
            priority: announcement.priority,
            image: announcement.image || '',
          });
        }
      } else {
        setError('Programação não encontrada.');
      }
    } else {
      setError('ID inválido.');
    }
    setIsLoading(false);
    // Carrega taxonomias dinâmicas para Tipo e Prioridade
    const loadTaxonomies = async () => {
      try {
        const [t, p] = await Promise.all([
          listTaxonomies('tipo'),
          listTaxonomies('prioridade'),
        ]);
        setTipos(t);
        setPrioridades(p);
      } catch {}
    };
    loadTaxonomies();
  }, [id, getAnnouncementById, user]);

  const handleAdvancedSubmit = async (values: { title: string; description: string; descriptionHtml?: string; imageUrl?: string; destaqueCountdownUrl?: string; rruleString: string; endTime?: string; videoUrl?: string; isLive?: boolean; }) => {
    if (!user || !id) return;

    setIsSubmitting(true);
    try {
      const updateData: any = {
        title: values.title,
        content: values.description,
        ...(values.descriptionHtml && { contentHtml: values.descriptionHtml }),
        type: formData.type,
        priority: formData.priority,
        rruleString: values.rruleString,
        ...(values.endTime && { endTime: values.endTime }),
        ...(values.imageUrl && values.imageUrl.trim() && { image: values.imageUrl.trim() }),
        ...(values.destaqueCountdownUrl && values.destaqueCountdownUrl.trim() && { destaqueCountdownUrl: values.destaqueCountdownUrl.trim() }),
        ...(values.videoUrl && values.videoUrl.trim() && { videoUrl: values.videoUrl.trim() }),
        ...(typeof values.isLive !== 'undefined' && { isLive: !!values.isLive }),
      };

      await updateAnnouncement(id, updateData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Erro ao atualizar:', err);
    } finally {
      setIsSubmitting(false);
    }
  };





  if (isLoading) {
    return <div className="text-center p-8">Carregando editor...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>{error}</p>
        <Link to="/dashboard" className="text-church-primary mt-4 inline-block">Voltar ao Painel</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center space-x-2 text-church-primary hover:text-church-primary/80 mb-4">
            <ArrowLeft size={20} />
            <span>Voltar ao Painel</span>
          </Link>
          <h1 className="text-3xl font-bold text-jkd-heading">Editar Programação</h1>
        </div>

        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-8 space-y-6">
          <AdvancedEventForm
            initialTitle={formData.title}
            initialDescription={(getAnnouncementById(id!)?.contentHtml || getAnnouncementById(id!)?.content || '')}
            initialImageUrl={getAnnouncementById(id!)?.image || ''}
            initialRruleString={getAnnouncementById(id!)?.rruleString || ''}
            initialEndTime={getAnnouncementById(id!)?.endTime || ''}
            initialVideoUrl={getAnnouncementById(id!)?.videoUrl || ''}
            initialIsLive={!!getAnnouncementById(id!)?.isLive}
            uploaderAuthorizedUserId={user?.id}
            onSubmit={handleAdvancedSubmit}
            submitLabel={isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            entityLabel="Programação"
          />

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
            <label htmlFor="priority" className="block text-sm font-medium text-jkd-heading mb-2">Prioridade</label>
            <select id="priority" value={formData.priority} onChange={(e) => setFormData(p => ({...p, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary">
              {(prioridades.length > 0 ? prioridades.map(x => ({ value: x.name, label: x.name })) : FALLBACK_PRIORITIES).map(pr => (
                <option key={pr.value} value={pr.value}>{pr.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6">
            <Link to="/dashboard" className="px-4 py-2 text-jkd-text hover:text-church-primary">Cancelar</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAnnouncement;
