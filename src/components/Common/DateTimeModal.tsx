import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Calendar from 'react-calendar';
import { X, Calendar as CalendarIcon, Clock, ChevronRight } from 'lucide-react';

interface DateTimeModalProps {
  isOpen: boolean;
  initialDate?: string; // yyyy-MM-dd
  initialStartTime?: string; // HH:mm
  initialEndTime?: string; // HH:mm
  initialAllDay?: boolean;
  title?: string;
  onClose: () => void;
  onConfirm: (v: { date: string; startTime: string; endTime?: string; isAllDay: boolean; }) => void;
}

function parseYMD(dateStr?: string): Date {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  const safe = new Date(y || new Date().getFullYear(), (m || 1) - 1, d || 1, 0, 0, 0, 0);
  return Number.isNaN(safe.getTime()) ? new Date() : safe;
}

function parseHM(timeStr?: string, fallback = '00:00'): { h: number; m: number; str: string } {
  const t = (timeStr || fallback).trim();
  const m = t.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return { h: 0, m: 0, str: '00:00' };
  const h = Number(m[1]);
  const mm = Number(m[2]);
  const str = `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  return { h, m: mm, str };
}

const HourMinutePicker: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => {
  const { h, m } = parseHM(value);
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-2">Hora</div>
        <div className="h-48 overflow-y-auto rounded-lg border border-gray-200">
          {hours.map((hh) => {
            const active = hh === h;
            return (
              <button
                key={hh}
                type="button"
                className={`w-full text-left px-3 py-2 ${active ? 'bg-[#246BFD] text-white' : 'hover:bg-gray-100'}`}
                onClick={() => onChange(`${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`)}
              >
                {String(hh).padStart(2, '0')}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-2">Minuto</div>
        <div className="h-48 overflow-y-auto rounded-lg border border-gray-200">
          {minutes.map((mm) => {
            const active = mm === m;
            return (
              <button
                key={mm}
                type="button"
                className={`w-full text-left px-3 py-2 ${active ? 'bg-[#246BFD] text-white' : 'hover:bg-gray-100'}`}
                onClick={() => onChange(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)}
              >
                {String(mm).padStart(2, '0')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const DateTimeModal: React.FC<DateTimeModalProps> = ({
  isOpen,
  initialDate,
  initialStartTime,
  initialEndTime,
  initialAllDay,
  title = 'Data e Horário',
  onClose,
  onConfirm,
}) => {
  const [dateObj, setDateObj] = useState<Date>(() => parseYMD(initialDate));
  const [isAllDay, setIsAllDay] = useState<boolean>(!!initialAllDay);
  const [startTime, setStartTime] = useState<string>(() => parseHM(initialStartTime, '19:00').str);
  const [endTime, setEndTime] = useState<string | undefined>(() => initialEndTime ? parseHM(initialEndTime).str : undefined);
  const [activePane, setActivePane] = useState<'idle' | 'date-start' | 'time-start' | 'date-end' | 'time-end'>('idle');

  const formattedDate = useMemo(() => format(dateObj, 'dd/MM/yyyy', { locale: ptBR }), [dateObj]);
  const formattedStart = useMemo(() => (!isAllDay ? startTime : undefined), [isAllDay, startTime]);
  const formattedEnd = useMemo(() => (!isAllDay ? endTime : undefined), [isAllDay, endTime]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[92%] max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-[fadeIn_120ms_ease-out]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 rounded-full hover:bg-gray-100">
                <X size={18} />
              </button>
              <h3 className="text-base font-semibold">{title}</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                const ymd = format(dateObj, 'yyyy-MM-dd');
                onConfirm({ date: ymd, startTime: parseHM(formattedStart, '00:00').str, endTime: formattedEnd, isAllDay });
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#246BFD] text-white hover:bg-[#1e5be0]"
            >
              Salvar
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* All-day toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Dia inteiro</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isAllDay} onChange={(e) => {
                  const checked = e.target.checked;
                  setIsAllDay(checked);
                  if (checked) {
                    setStartTime('00:00');
                    setEndTime(undefined);
                  }
                }} />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-[#246BFD] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
              <span className={`${isAllDay ? 'bg-[#246BFD] text-white' : 'bg-gray-100 text-gray-700'} text-xs px-2 py-0.5 rounded`}>{isAllDay ? 'Ativo' : 'Inativo'}</span>
            </div>

            {/* Start section */}
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl border border-gray-200 hover:border-[#246BFD]"
              onClick={() => setActivePane('date-start')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#246BFD]/10 text-[#246BFD]">
                  <CalendarIcon size={18} />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-500">Início</div>
                  <div className="text-sm font-medium">
                    {formattedDate}{!isAllDay && formattedStart ? ` às ${formattedStart}` : ''}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>

            {/* End section */}
            <button
              type="button"
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border border-gray-200 ${isAllDay ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#246BFD]'}`}
              onClick={() => { if (!isAllDay) setActivePane('date-end'); }}
              disabled={isAllDay}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#246BFD]/10 text-[#246BFD]">
                  <Clock size={18} />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-500">Término</div>
                  <div className="text-sm font-medium">
                    {!isAllDay ? (formattedEnd ? `${formattedDate} às ${formattedEnd}` : 'Definir término') : '—'}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>

            {/* Pane area */}
            {activePane !== 'idle' && (
              <div className="mt-2 rounded-2xl border border-gray-200 overflow-hidden">
                {(activePane === 'date-start' || activePane === 'date-end') && (
                  <div className="bg-white">
                    <Calendar
                      value={dateObj}
                      onChange={(v: Date | Date[]) => {
                        const d = Array.isArray(v) ? v[0] : v;
                        setDateObj(d);
                        if (activePane === 'date-start') {
                          setActivePane(isAllDay ? 'idle' : 'time-start');
                        } else {
                          setActivePane('time-end');
                        }
                      }}
                      locale="pt-BR"
                      className="react-calendar"
                    />
                  </div>
                )}
                {(activePane === 'time-start' || activePane === 'time-end') && (
                  <div className="p-3 bg-white">
                    <HourMinutePicker
                      value={activePane === 'time-start' ? startTime : (endTime || '19:30')}
                      onChange={(v) => {
                        if (activePane === 'time-start') setStartTime(v);
                        else setEndTime(v);
                        setActivePane('idle');
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0px); } }
        .react-calendar { width: 100%; border: none; }
        .react-calendar__navigation button { padding: 8px; border-radius: 8px; }
        .react-calendar__tile { padding: 10px 6px; border-radius: 8px; }
        .react-calendar__tile--now { background: rgba(36,107,253,0.08); }
        .react-calendar__tile--active { background: #246BFD; color: white; }
        .react-calendar__tile:enabled:hover { background: rgba(36,107,253,0.12); }
      `}</style>
    </div>
  );
};

export default DateTimeModal;