import React, { useState, useMemo, useEffect } from 'react';
import Calendar from 'react-calendar';
import { format, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Church, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { ANNOUNCEMENT_TYPES } from '../types';
import AnnouncementCard from '../components/Common/AnnouncementCard';
import 'react-calendar/dist/Calendar.css';
import { listTaxonomies, TaxonomyItem } from '../services/taxonomyService';

type ViewType = 'day' | 'week' | 'month' | 'year';

const FILTER_CATEGORIES = [
  { value: 'all', label: 'Todos os Tipos' },
  { value: 'culto', label: 'Cultos' },
  ...ANNOUNCEMENT_TYPES.map(type => {
    const safeType = typeof type === 'string' ? type : '';
    return {
      value: type,
      label: safeType ? (safeType.charAt(0).toUpperCase() + safeType.slice(1)).replace('-', ' ') : String(type)
    };
  })
];

const AgendaPage: React.FC = () => {
  const { announcements, cultos, getOccurrences, toggleVideoModal } = useApp();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeStartDate, setActiveStartDate] = useState(startOfMonth(new Date()));
  const [view, setView] = useState<ViewType>('day');
  const [typeFilter, setTypeFilter] = useState<string>('all');
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
      setTemas(tms);
      setTopicos(tps);
    };
    fetchTaxonomies();
  }, []);

  const approvedAnnouncements = useMemo(() => {
    return announcements.filter(a => a.status === 'approved');
  }, [announcements]);

  const { occurrencesInRange, rangeLabel } = useMemo(() => {
    let start: Date, end: Date, label: string;
    
    switch (view) {
      case 'week':
        start = startOfWeek(selectedDate, { weekStartsOn: 0 });
        end = endOfWeek(selectedDate, { weekStartsOn: 0 });
        label = `Semana de ${format(start, 'dd/MM')} a ${format(end, 'dd/MM')}`;
        break;
      case 'month':
        start = startOfMonth(selectedDate);
        end = endOfMonth(selectedDate);
        label = format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
        break;
      case 'year':
        start = startOfYear(selectedDate);
        end = endOfYear(selectedDate);
        label = format(selectedDate, "yyyy");
        break;
      case 'day':
      default:
        start = startOfDay(selectedDate);
        end = endOfDay(selectedDate);
        label = format(selectedDate, "dd 'de' MMMM", { locale: ptBR });
    }

    const announcementOccurrences = approvedAnnouncements.flatMap(announcement => {
      const occurrences = getOccurrences(announcement.rruleString, start, end);
      return occurrences.map(date => ({ item: announcement, date, type: announcement.type }));
    });

    const cultoOccurrences = cultos.flatMap(culto => {
      const occurrences = getOccurrences(culto.rruleString, start, end);
      return occurrences.map(date => ({ item: culto, date, type: 'culto' as const }));
    });

    const allOccurrences = [...announcementOccurrences, ...cultoOccurrences];
    
    const filteredOccurrences = allOccurrences.filter(occ => {
        const matchesType = typeFilter === 'all' ? true : occ.type === typeFilter;
        const itemAny: any = occ.item as any;
        const matchesTema = selectedTemaId ? itemAny.temaId === selectedTemaId : true;
        const matchesTopico = selectedTopicoId ? itemAny.topicoId === selectedTopicoId : true;
        return matchesType && matchesTema && matchesTopico;
    });

    return {
        occurrencesInRange: filteredOccurrences.sort((a, b) => {
          // Tratamento seguro de datas
          const aTime = a.date instanceof Date ? a.date.getTime() : 0;
          const bTime = b.date instanceof Date ? b.date.getTime() : 0;
          return aTime - bTime;
        }),
        rangeLabel: label
    };
  }, [approvedAnnouncements, cultos, selectedDate, getOccurrences, view, typeFilter, selectedTemaId, selectedTopicoId]);

  const datesWithEvents = useMemo(() => {
    const start = startOfYear(activeStartDate);
    const end = endOfYear(activeStartDate);
    const annOcc = approvedAnnouncements.flatMap(a => getOccurrences(a.rruleString, start, end));
    const cultOcc = cultos.flatMap(c => getOccurrences(c.rruleString, start, end));
    return [...annOcc, ...cultOcc];
  }, [approvedAnnouncements, cultos, activeStartDate, getOccurrences]);

  const tileContent = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const hasEvent = datesWithEvents.some(eventDate => isSameDay(eventDate, date));
      if (hasEvent) {
        return <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-church-primary rounded-full"></div>;
      }
    }
    return null;
  };
  
  const handleDateChange = (value: Date) => {
    setSelectedDate(value);
    setView('day');
  };

  const handleTodayClick = () => {
    const today = new Date();
    setSelectedDate(today);
    setActiveStartDate(startOfMonth(today));
    setView('day');
  };

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <CalendarIcon className="h-8 w-8 text-church-primary" />
            <h1 className="text-3xl font-bold text-jkd-heading">Agenda de Programações</h1>
          </div>
          <p className="text-jkd-text">
            Visualize todas as programações da igreja em um calendário interativo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
                <button 
                    onClick={handleTodayClick}
                    className="w-full mb-4 px-4 py-2 text-sm font-semibold rounded-lg bg-church-primary/10 text-church-primary hover:bg-church-primary/20 transition-colors"
                >
                    Voltar para Hoje
                </button>
              <Calendar
                onChange={(value) => handleDateChange(value as Date)}
                value={selectedDate}
                activeStartDate={activeStartDate}
                onActiveStartDateChange={({ activeStartDate }) => activeStartDate && setActiveStartDate(activeStartDate)}
                locale="pt-BR"
                tileContent={tileContent}
                className="w-full"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
              {/* Cabeçalho em duas linhas: título + período na primeira; demais filtros abaixo */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <h2 className="text-lg font-semibold text-jkd-heading">
                    Programações para {rangeLabel}
                  </h2>
                  <div className="bg-jkd-bg border border-jkd-border rounded-lg p-1 flex items-center space-x-1">
                    {(['day', 'week', 'month', 'year'] as ViewType[]).map(v => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${view === v ? 'bg-church-primary text-white' : 'text-jkd-text hover:bg-jkd-border'}`}
                      >
                        {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : v === 'month' ? 'Mês' : 'Ano'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-jkd-bg border border-jkd-border rounded-lg p-2 text-sm text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                  >
                    {FILTER_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  <select
                    value={selectedTemaId}
                    onChange={(e) => setSelectedTemaId(e.target.value)}
                    className="bg-jkd-bg border border-jkd-border rounded-lg p-2 text-sm text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                  >
                    <option value="">Tema: Todos</option>
                    {temas.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedTopicoId}
                    onChange={(e) => setSelectedTopicoId(e.target.value)}
                    className="bg-jkd-bg border border-jkd-border rounded-lg p-2 text-sm text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                  >
                    <option value="">Tópico: Todos</option>
                    {topicos.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {occurrencesInRange.length > 0 ? (
                  occurrencesInRange.map(({ item, date, type }, index) => {
                    if (type === 'culto') {
                      return (
                        <div key={`${item.id}-${index}`} className="bg-jkd-bg rounded-lg border border-jkd-border p-4 flex items-center gap-4 relative">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-church-primary/10 flex items-center justify-center">
                            <Church size={20} className="text-church-primary" />
                          </div>
                          <div className="flex-1 cursor-pointer" onClick={() => navigate(`/culto/${item.id}`)}>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-jkd-heading">{item.title}</p>
                              {item.isLive && (
                                <a href="#" onClick={(e) => e.stopPropagation()} aria-label="Transmissão ao vivo" className="inline-flex items-center rounded-full bg-red-600 text-white shadow px-2 py-0.5 text-xs font-semibold hover:bg-red-700">Transmissão Ao Vivo</a>
                              )}
                            </div>
                            <p className="text-sm text-jkd-text line-clamp-3 break-anywhere">{`${format(date, "dd/MM/yy 'às' HH:mm", { locale: ptBR })}${(item as any)?.endTime ? ' — ' + (item as any).endTime : ''}`} - {item.description}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              { (item as any)?.temaName && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-jkd-bg border border-jkd-border text-jkd-text">Tema: {(item as any).temaName}</span>
                              )}
                              { (item as any)?.topicoName && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-jkd-bg border border-jkd-border text-jkd-text">Tópico: {(item as any).topicoName}</span>
                              )}
                            </div>
                          </div>
                          {item.videoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                const isYouTube = /youtube\.com|youtu\.be/.test(item.videoUrl || '');
                                toggleVideoModal(true, {
                                  enabled: true,
                                  sourceType: isYouTube ? 'youtube' : 'direct',
                                  url: item.videoUrl || '',
                                });
                              }}
                              className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-600 text-white shadow hover:bg-red-700"
                              aria-label="Assistir vídeo"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )
                    }
                    return (
                      <AnnouncementCard 
                        key={`${item.id}-${date.toISOString()}`} 
                        announcement={item as any}
                      />
                    )
                  })
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-jkd-text mb-2">
                      Nenhuma programação para este período/filtro.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendaPage;
