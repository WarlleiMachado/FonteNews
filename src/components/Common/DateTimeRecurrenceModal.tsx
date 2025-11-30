import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Calendar from 'react-calendar';
import { X, Calendar as CalendarIcon, Clock, Repeat, ChevronRight, Pencil } from 'lucide-react';
import { RRule, Weekday } from 'rrule';

interface DateTimeRecurrenceModalProps {
  isOpen: boolean;
  title?: string;
  initialDate?: string; // yyyy-MM-dd
  initialStartTime?: string; // HH:mm
  initialEndTime?: string; // HH:mm
  initialAllDay?: boolean;
  initialIsRecurring?: boolean;
  initialFreq?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  initialInterval?: number;
  initialByWeekday?: number[]; // 0=SU..6=SA
  initialMonthlyMode?: 'bymonthday' | 'byweekdaypos';
  initialCount?: number;
  initialUntil?: string; // yyyy-MM-dd
  initialRruleString?: string;
  onClose: () => void;
  onConfirm: (v: { date: string; startTime: string; endTime?: string; isAllDay: boolean; isRecurring: boolean; rruleString: string; }) => void;
}

function parseYMD(dateStr?: string): Date {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  const safe = new Date(y || new Date().getFullYear(), (m || 1) - 1, d || 1, 0, 0, 0, 0);
  return Number.isNaN(safe.getTime()) ? new Date() : safe;
}

function parseHM(timeStr?: string, fallback = '19:00'): { h: number; m: number; str: string } {
  const t = (timeStr || fallback).trim();
  const m = t.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return { h: 19, m: 0, str: '19:00' };
  const h = Number(m[1]);
  const mm = Number(m[2]);
  const str = `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  return { h, m: mm, str };
}

const HourMinutePicker: React.FC<{
  value: string;
  onChange: (v: string) => void;
  accentColor?: string;
}> = ({ value, onChange, accentColor = '#246BFD' }) => {
  const { h, m } = parseHM(value);
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-xs font-semibold mb-2" style={{ color: accentColor }}>Hora</div>
        <div className="h-48 overflow-y-auto rounded-lg border border-gray-200">
          {hours.map((hh) => {
            const active = hh === h;
            return (
              <button
                key={hh}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-100"
                style={active ? { backgroundColor: accentColor, color: '#fff' } : undefined}
                onClick={() => onChange(`${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`)}
              >
                {String(hh).padStart(2, '0')}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold mb-2" style={{ color: accentColor }}>Minuto</div>
        <div className="h-48 overflow-y-auto rounded-lg border border-gray-200">
          {minutes.map((mm) => {
            const active = mm === m;
            return (
              <button
                key={mm}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-100"
                style={active ? { backgroundColor: accentColor, color: '#fff' } : undefined}
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

const WEEKDAYS: { label: string; value: number; rrule: Weekday }[] = [
  { label: 'Dom', value: 0, rrule: RRule.SU },
  { label: 'Seg', value: 1, rrule: RRule.MO },
  { label: 'Ter', value: 2, rrule: RRule.TU },
  { label: 'Qua', value: 3, rrule: RRule.WE },
  { label: 'Qui', value: 4, rrule: RRule.TH },
  { label: 'Sex', value: 5, rrule: RRule.FR },
  { label: 'Sáb', value: 6, rrule: RRule.SA },
];

function weekOfMonth(d: Date): number {
  return Math.ceil(d.getDate() / 7);
}

// Calendário em pop-up separado com modo de edição manual
 const CalendarModal: React.FC<{
   isOpen: boolean;
   initialDate: Date;
   onClose: () => void;
   onConfirm: (d: Date) => void;
   confirmColor?: string;
 }> = ({ isOpen, initialDate, onClose, onConfirm, confirmColor = '#246BFD' }) => {
   const [date, setDate] = useState<Date>(initialDate);
   const [manualMode, setManualMode] = useState<boolean>(false);
   const [manualInput, setManualInput] = useState<string>(format(initialDate, 'yyyy-MM-dd'));

   const tryParseManual = (s: string): Date | null => {
     try {
       const [y, m, d] = s.split('-').map((n) => parseInt(n, 10));
       const dd = new Date(y, (m || 1) - 1, d || 1);
       if (!Number.isNaN(dd.getTime())) return dd;
     } catch {}
     return null;
   };

   if (!isOpen) return null;
   return (
     <div className="fixed inset-0 z-[1100]">
       <div className="absolute inset-0 bg-black/50" onClick={onClose} />
       <div className="absolute inset-0 flex items-center justify-center">
         <div className="w-[92%] max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-[fadeIn_120ms_ease-out]">
           <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
             <h3 className="text-base font-semibold">Calendário</h3>
             <div className="flex items-center gap-2">
               <button type="button" className="p-2 rounded-full hover:bg-gray-100" onClick={() => setManualMode((v) => !v)} aria-label="Alternar modo manual">
                 <Pencil size={18} />
               </button>
               <button type="button" className="px-3 py-1.5 rounded-lg text-white hover:opacity-90" style={{ backgroundColor: confirmColor }} onClick={() => {
                 const finalDate = manualMode ? (tryParseManual(manualInput) || date) : date;
                 onConfirm(finalDate);
                 onClose();
               }}>Confirmar</button>
             </div>
           </div>
           <div className="p-4">
             {!manualMode ? (
               <Calendar
                 value={date}
                 onChange={(v: Date | Date[]) => {
                   const d = Array.isArray(v) ? v[0] : v;
                   setDate(d);
                 }}
                 locale="pt-BR"
                 className="react-calendar"
               />
             ) : (
               <div className="space-y-2">
                 <label className="text-sm text-gray-600">Inserir data manualmente (yyyy-MM-dd)</label>
                 <input
                   type="text"
                   value={manualInput}
                   onChange={(e) => setManualInput(e.target.value)}
                   className="w-full px-3 py-2 rounded-lg border border-gray-300"
                   placeholder="2025-12-31"
                 />
                 <div className="text-xs text-gray-500">Atual: {format(date, 'dd/MM/yyyy')}</div>
               </div>
             )}
           </div>
         </div>
       </div>
     </div>
   );
 };

const DateTimeRecurrenceModal: React.FC<DateTimeRecurrenceModalProps> = ({
  isOpen,
  title = 'Data e Horário',
  initialDate,
  initialStartTime,
  initialEndTime,
  initialAllDay,
  initialIsRecurring,
  initialFreq = 'WEEKLY',
  initialInterval = 1,
  initialByWeekday = [],
  initialMonthlyMode = 'bymonthday',
  initialCount,
  initialUntil,
  initialRruleString,
  onClose,
  onConfirm,
}) => {
  const [dateObj, setDateObj] = useState<Date>(() => parseYMD(initialDate));
  const [isAllDay, setIsAllDay] = useState<boolean>(!!initialAllDay);
  const [isRecurring, setIsRecurring] = useState<boolean>(!!initialIsRecurring);
  const [startTime, setStartTime] = useState<string>(() => parseHM(initialStartTime, '19:00').str);
  const [endTime, setEndTime] = useState<string | undefined>(() => initialEndTime ? parseHM(initialEndTime).str : undefined);
  const [freq, setFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>(initialFreq);
  const [interval, setInterval] = useState<number>(initialInterval || 1);
  const [byWeekday, setByWeekday] = useState<number[]>(initialByWeekday);
  const [monthlyMode, setMonthlyMode] = useState<'bymonthday' | 'byweekdaypos'>(initialMonthlyMode);
  const [endType, setEndType] = useState<'never' | 'count' | 'until'>(initialCount ? 'count' : initialUntil ? 'until' : 'never');
  const [count, setCount] = useState<number>(initialCount || 10);
  const [untilDate, setUntilDate] = useState<Date | undefined>(() => initialUntil ? parseYMD(initialUntil) : undefined);
  const [activePane, setActivePane] = useState<'idle' | 'date-start' | 'time-start' | 'date-end' | 'time-end' | 'recurrence'>('idle');
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [calendarTarget, setCalendarTarget] = useState<'start' | 'until'>('start');

  // Formatações e construção de regra de recorrência
  const formattedDate = useMemo(() => format(dateObj, 'dd/MM/yyyy', { locale: ptBR }), [dateObj]);
  const formattedStart = useMemo(() => parseHM(startTime, '00:00').str, [startTime]);
  const formattedEnd = useMemo(() => (endTime ? parseHM(endTime).str : undefined), [endTime]);

  function buildRRule(): string {
    if (!isRecurring) return '';
    const freqMap: Record<'DAILY'|'WEEKLY'|'MONTHLY'|'YEARLY', RRule.Frequency> = {
      DAILY: RRule.DAILY,
      WEEKLY: RRule.WEEKLY,
      MONTHLY: RRule.MONTHLY,
      YEARLY: RRule.YEARLY,
    };
    // Base dtstart: data selecionada + horário de início (se não for dia inteiro)
    const base = new Date(dateObj);
    const { h: sh, m: sm } = parseHM(startTime || '00:00', '00:00');
    if (!isAllDay) {
      base.setHours((sh ?? 0), (sm ?? 0), 0, 0);
    } else {
      base.setHours(0, 0, 0, 0);
    }
    
    const opts: RRule.Options = {
      freq: freqMap[freq],
      interval: Math.max(1, interval || 1),
      dtstart: base,
    };
    
    if (freq === 'WEEKLY' && byWeekday.length) {
      opts.byweekday = byWeekday.map((v) => WEEKDAYS[v].rrule);
    }
    if (freq === 'MONTHLY') {
      if (monthlyMode === 'bymonthday') {
        opts.bymonthday = dateObj.getDate();
      } else {
        opts.byweekday = [WEEKDAYS[dateObj.getDay()].rrule];
        // 1ª, 2ª, 3ª ou 4ª ocorrência do dia da semana no mês
        opts.bysetpos = weekOfMonth(dateObj);
      }
    }
    if (endType === 'count') {
      opts.count = Math.max(1, count || 1);
    } else if (endType === 'until' && untilDate) {
      const u = new Date(untilDate);
      u.setHours(23, 59, 59, 999);
      opts.until = u;
    }
    const rule = new RRule(opts);
    // Remover sufixo 'Z' para manter horário local
    return rule
      .toString()
      .replace(/DTSTART:(\d{8}T\d{6})Z/g, 'DTSTART:$1')
      .replace(/UNTIL=(\d{8}T\d{6})Z/g, 'UNTIL=$1');
  }

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
                const rruleString = buildRRule();
                onConfirm({
                  date: ymd,
                  startTime: parseHM(formattedStart, '00:00').str,
                  endTime: formattedEnd,
                  isAllDay,
                  isRecurring,
                  rruleString,
                });
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-church-primary text-white hover:bg-church-primary/90"
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
                <div className="toggle-container bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-[#246BFD] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:transition-all"></div>
              </label>
              <span className={`${isAllDay ? 'bg-[#246BFD] text-white' : 'bg-gray-100 text-gray-700'} text-xs px-2 py-0.5 rounded`}>{isAllDay ? 'Ativo' : 'Inativo'}</span>
            </div>

            {/* Start section */}
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl border border-gray-200 hover:border-[#246BFD]"
              onClick={() => { setCalendarTarget('start'); setIsCalendarOpen(true); }}
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
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border border-gray-200 ${isAllDay ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#EF4444]'}`}
              onClick={() => { if (!isAllDay) setActivePane('time-end'); }}
              disabled={isAllDay}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#EF4444]/10 text-[#EF4444]">
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

            {/* Recurrence toggle */}
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl border border-gray-200 hover:border-[#10B981]"
              onClick={() => setActivePane('recurrence')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#10B981]/10 text-[#10B981]">
                  <Repeat size={18} />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-500">Recorrência</div>
                  <div className="text-sm font-medium">
                    {isRecurring ? `${freq === 'DAILY' ? 'Diário' : freq === 'WEEKLY' ? 'Semanal' : freq === 'MONTHLY' ? 'Mensal' : 'Anual'} • intervalo ${interval}` : 'Não repete'}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>

            {/* Pane area */}
            {activePane !== 'idle' && (
              <div className="mt-2 rounded-2xl border border-gray-200 overflow-hidden">
                {(activePane === 'date-start') && (
                  <div className="bg-white">
                    <Calendar
                      value={dateObj}
                      onChange={(v: Date | Date[]) => {
                        const d = Array.isArray(v) ? v[0] : v;
                        setDateObj(d);
                        setActivePane(isAllDay ? 'idle' : 'time-start');
                      }}
                      locale="pt-BR"
                      className="react-calendar"
                    />
                  </div>
                )}
                {(activePane === 'time-start') && (
                  <div className="p-3 bg-white space-y-3">
                    <HourMinutePicker
                      value={startTime}
                      onChange={(v) => {
                        setStartTime(v);
                      }}
                      accentColor="#246BFD"
                    />
                    <div className="pt-1 flex justify-end">
                      <button type="button" className="px-3 py-1.5 rounded-lg bg-church-primary text-white hover:bg-church-primary/90" onClick={() => setActivePane('idle')}>Concluir</button>
                    </div>
                  </div>
                )}
                {(activePane === 'time-end') && (
                  <div className="p-3 bg-white space-y-3">
                    <HourMinutePicker
                      value={endTime || '19:30'}
                      onChange={(v) => {
                        setEndTime(v);
                      }}
                      accentColor="#EF4444"
                    />
                    <div className="pt-1 flex justify-end">
                      <button type="button" className="px-3 py-1.5 rounded-lg bg-church-primary text-white hover:bg-church-primary/90" onClick={() => setActivePane('idle')}>Concluir</button>
                    </div>
                  </div>
                )}
                {(activePane === 'recurrence') && (
                  <div className="p-4 bg-white space-y-4">
                    {/* Recurrence enable */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">Ativar recorrência</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                        <div className="toggle-container bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-[#10B981] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:transition-all"></div>
                      </label>
                      <span className={`${isRecurring ? 'bg-[#10B981] text-white' : 'bg-gray-100 text-gray-700'} text-xs px-2 py-0.5 rounded`}>{isRecurring ? 'Ativo' : 'Inativo'}</span>
                    </div>

                    {isRecurring && (
                      <>
                        {/* Frequency */}
                        <div>
                          <div className="text-xs text-gray-500 mb-2">Frequência</div>
                          <div className="grid grid-cols-4 gap-2">
                            {(['DAILY','WEEKLY','MONTHLY','YEARLY'] as const).map((f) => (
                              <button
                                key={f}
                                type="button"
                                className={`px-2 py-1.5 rounded-lg border ${freq === f ? 'bg-[#10B981] text-white border-[#10B981]' : 'border-gray-300 hover:border-[#10B981]'}`}
                                onClick={() => setFreq(f)}
                              >
                                {f === 'DAILY' && 'Diário'}
                                {f === 'WEEKLY' && 'Semanal'}
                                {f === 'MONTHLY' && 'Mensal'}
                                {f === 'YEARLY' && 'Anual'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interval */}
                        <div>
                          <div className="text-xs text-gray-500 mb-2">Intervalo</div>
                          <input
                            type="number"
                            min={1}
                            value={interval}
                            onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value || '1')))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300"
                          />
                        </div>

                        {/* Weekly weekdays */}
                        {freq === 'WEEKLY' && (
                          <div>
                            <div className="text-xs text-gray-500 mb-2">Dias da semana</div>
                            <div className="grid grid-cols-7 gap-2">
                              {WEEKDAYS.map((wd) => {
                                const active = byWeekday.includes(wd.value);
                                return (
                                  <button
                                    key={wd.value}
                                    type="button"
                                    className={`px-2 py-1.5 rounded-lg border text-xs ${active ? 'bg-[#10B981] text-white border-[#10B981]' : 'border-gray-300 hover:border-[#10B981]'}`}
                                    onClick={() => {
                                      setByWeekday((prev) => {
                                        if (prev.includes(wd.value)) return prev.filter((v) => v !== wd.value);
                                        return [...prev, wd.value].sort((a, b) => a - b);
                                      });
                                    }}
                                  >
                                    {wd.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Monthly config */}
                        {freq === 'MONTHLY' && (
                          <div className="space-y-3">
                            <div className="text-xs text-gray-500">Configuração mensal</div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                className={`px-2 py-1.5 rounded-lg border ${monthlyMode === 'bymonthday' ? 'bg-[#10B981] text-white border-[#10B981]' : 'border-gray-300 hover:border-[#10B981]'}`}
                                onClick={() => setMonthlyMode('bymonthday')}
                              >
                                Dia do mês ({dateObj.getDate()})
                              </button>
                              <button
                                type="button"
                                className={`px-2 py-1.5 rounded-lg border ${monthlyMode === 'byweekdaypos' ? 'bg-[#10B981] text-white border-[#10B981]' : 'border-gray-300 hover:border-[#10B981]'}`}
                                onClick={() => setMonthlyMode('byweekdaypos')}
                              >
                                {weekOfMonth(dateObj)}ª {WEEKDAYS[dateObj.getDay()].label}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* End config */}
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500">Termina</div>
                          <div className="grid grid-cols-3 gap-2">
                            {(['never','count','until'] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                className={`px-2 py-1.5 rounded-lg border ${endType === t ? 'bg-[#10B981] text-white border-[#10B981]' : 'border-gray-300 hover:border-[#10B981]'}`}
                                onClick={() => setEndType(t)}
                              >
                                {t === 'never' && 'Nunca'}
                                {t === 'count' && 'Após N'}
                                {t === 'until' && 'Até data'}
                              </button>
                            ))}
                          </div>
                          {endType === 'count' && (
                            <div className="mt-2">
                              <input
                                type="number"
                                min={1}
                                value={count}
                                onChange={(e) => setCount(Math.max(1, parseInt(e.target.value || '1')))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300"
                              />
                            </div>
                          )}
                          {endType === 'until' && (
                            <div className="mt-2">
                              <button
                                type="button"
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-300 hover:border-[#10B981]"
                                onClick={() => { setCalendarTarget('until'); setIsCalendarOpen(true); }}
                              >
                                <span className="text-sm">{untilDate ? format(untilDate, 'dd/MM/yyyy') : 'Selecionar data'}</span>
                                <CalendarIcon size={18} className="text-gray-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button type="button" className="px-3 py-1.5 rounded-lg bg-church-primary text-white hover:bg-church-primary/90" onClick={() => setActivePane('idle')}>Concluir</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar modal nested */}
      <CalendarModal
        isOpen={isCalendarOpen}
        initialDate={calendarTarget === 'until' ? (untilDate || new Date()) : dateObj}
        onClose={() => setIsCalendarOpen(false)}
        onConfirm={(d) => {
          if (calendarTarget === 'start') {
            setDateObj(d);
            setIsCalendarOpen(false);
            setActivePane(isAllDay ? 'idle' : 'time-start');
          } else {
            setUntilDate(d);
            setIsCalendarOpen(false);
          }
        }}
        confirmColor={calendarTarget === 'until' ? '#10B981' : '#246BFD'}
      />

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

export default DateTimeRecurrenceModal;