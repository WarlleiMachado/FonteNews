import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Filter, Church } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import AnnouncementCard from '../components/Common/AnnouncementCard';
import 'react-calendar/dist/Calendar.css';

const CalendarPage: React.FC = () => {
  const { announcements, cultos, getOccurrences } = useApp();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filter, setFilter] = useState<'todos' | 'aviso' | 'evento' | 'culto'>('todos');

  const approvedAnnouncements = useMemo(() => {
    return announcements.filter(a => a.status === 'approved');
  }, [announcements]);

  const allOccurrences = useMemo(() => {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);
    
    const announcementOccurrences = approvedAnnouncements.flatMap(announcement => {
      const occurrences = getOccurrences(announcement.rruleString, startOfMonth, endOfMonth);
      return occurrences.map(date => ({ item: announcement, date, type: announcement.type as 'culto' | 'aviso' | 'evento' }));
    });

    const cultoOccurrences = cultos.flatMap(culto => {
      const occurrences = getOccurrences(culto.rruleString, startOfMonth, endOfMonth);
      return occurrences.map(date => ({ item: culto, date, type: 'culto' as const }));
    });

    return [...announcementOccurrences, ...cultoOccurrences];
  }, [approvedAnnouncements, cultos, selectedDate, getOccurrences]);

  const occurrencesForDate = useMemo(() => {
    return allOccurrences.filter(occurrence => {
      const matchesDate = isSameDay(occurrence.date, selectedDate);
      if (!matchesDate) return false;

      switch (filter) {
        case 'todos':
          return true;
        case 'aviso':
          return occurrence.type === 'aviso';
        case 'culto':
          return occurrence.type === 'culto';
        case 'evento':
          return occurrence.type !== 'aviso' && occurrence.type !== 'culto';
        default:
          return true;
      }
    }).sort((a, b) => {
        // Tratamento seguro de datas
        const aTime = a.date instanceof Date ? a.date.getTime() : 0;
        const bTime = b.date instanceof Date ? b.date.getTime() : 0;
        return aTime - bTime;
      });
  }, [allOccurrences, selectedDate, filter]);

  const datesWithEvents = useMemo(() => {
    return allOccurrences.map(occurrence => occurrence.date);
  }, [allOccurrences]);

  const tileContent = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const hasEvent = datesWithEvents.some(eventDate => isSameDay(eventDate, date));
      if (hasEvent) {
        return <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-church-primary rounded-full"></div>;
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <CalendarIcon className="h-8 w-8 text-church-primary" />
            <h1 className="text-3xl font-bold text-jkd-heading">Calendário de Programações</h1>
          </div>
          <p className="text-jkd-text">
            Visualize todas as programações da igreja em um calendário interativo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
              <Calendar
                onChange={(value) => setSelectedDate(value as Date)}
                value={selectedDate}
                locale="pt-BR"
                tileContent={tileContent}
                className="w-full"
                onActiveStartDateChange={({ activeStartDate }) => activeStartDate && setSelectedDate(activeStartDate)}
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-jkd-heading">
                  Programações para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h2>
                
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-jkd-text" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as typeof filter)}
                    className="bg-jkd-bg border border-jkd-border rounded-md px-3 py-1 text-sm text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                  >
                    <option value="todos">Todos</option>
                    <option value="evento">Eventos e Outros</option>
                    <option value="aviso">Avisos</option>
                    <option value="culto">Cultos</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {occurrencesForDate.length > 0 ? (
                  occurrencesForDate.map(({ item, date, type }, index) => {
                    if (type === 'culto') {
                      return (
                        <div key={`${item.id}-${index}`} className="bg-jkd-bg rounded-lg border border-jkd-border p-4 flex items-center gap-4">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-church-navy/10 flex items-center justify-center">
                            <Church size={20} className="text-church-navy" />
                          </div>
                          <div>
                            <p className="font-semibold text-jkd-heading">{item.title}</p>
                            <p className="text-sm text-jkd-text">{`${format(date, "HH:mm", { locale: ptBR })}${(item as any)?.endTime ? ' — ' + (item as any).endTime : ''}`} - {item.description}</p>
                          </div>
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
                      Nenhuma programação para esta data.
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

export default CalendarPage;
