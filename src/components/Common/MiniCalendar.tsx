import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { isSameDay, startOfMonth } from 'date-fns';

interface MiniCalendarProps {
  events: Date[];
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ events }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeStartDate, setActiveStartDate] = useState(startOfMonth(new Date()));

  const tileClassName = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const hasEvent = events.some(eventDate => isSameDay(eventDate, date));
      if (hasEvent) {
        return 'has-event';
      }
    }
    return null;
  };
  
  const handleTodayClick = () => {
      const today = new Date();
      setSelectedDate(today);
      setActiveStartDate(startOfMonth(today));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-jkd-heading">Calendário</h3>
        <button 
            onClick={handleTodayClick}
            className="px-3 py-1 text-xs font-semibold rounded-md bg-church-primary/10 text-church-primary hover:bg-church-primary/20 transition-colors"
        >
            Hoje
        </button>
      </div>
      <Calendar
        tileClassName={tileClassName}
        value={selectedDate}
        onChange={(v: any) => { if (v) setSelectedDate(v as Date); }}
        activeStartDate={activeStartDate}
        onActiveStartDateChange={({ activeStartDate }) => activeStartDate && setActiveStartDate(activeStartDate)}
        showNavigation={true}
        showNeighboringMonth={false}
        locale="pt-BR"
        className="mini-calendar"
        formatShortWeekday={(_, date) => {
          const s = date ? date.toLocaleDateString('pt-BR', { weekday: 'short' }) : '';
          return s ? s.charAt(0).toUpperCase() : '';
        }}
      />
      <style>{`
        .mini-calendar {
          @apply w-full border-0 bg-transparent font-sans text-sm;
        }
        .mini-calendar .react-calendar__navigation {
          @apply flex justify-between items-center mb-2 px-1;
        }
        .mini-calendar .react-calendar__navigation button {
          @apply text-jkd-heading font-semibold text-sm min-w-0 p-1 hover:bg-jkd-border rounded-md;
        }
        .mini-calendar .react-calendar__navigation__label {
            @apply font-bold text-jkd-heading flex-grow-0;
        }
        .mini-calendar .react-calendar__month-view__weekdays {
          @apply text-center text-xs font-medium text-jkd-text/70;
        }
        .mini-calendar .react-calendar__month-view__weekdays__weekday {
            @apply p-0;
        }
        .mini-calendar .react-calendar__tile {
          @apply text-center text-xs p-0 m-0.5 h-8 w-8 flex items-center justify-center rounded-full relative hover:bg-jkd-border;
        }
        .mini-calendar .react-calendar__tile--now {
          @apply bg-jkd-border text-jkd-heading;
        }
        .mini-calendar .react-calendar__tile--active {
          @apply bg-church-primary text-white;
        }
        .mini-calendar .react-calendar__tile.has-event::after {
          content: '';
          @apply absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-church-primary rounded-full;
        }
      `}</style>
    </div>
  );
};

export default MiniCalendar;
