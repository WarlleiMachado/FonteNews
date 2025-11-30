import React, { useState, useEffect } from 'react';
import { RRule, rrulestr, Weekday } from 'rrule';
import { format } from 'date-fns';

interface RecurrenceEditorProps {
  rruleString: string;
  onChange: (rruleString: string) => void;
  endTime?: string;
  onEndTimeChange?: (endTime: string) => void;
}

const WEEKDAYS = [
  { label: 'D', value: RRule.SU },
  { label: 'S', value: RRule.MO },
  { label: 'T', value: RRule.TU },
  { label: 'Q', value: RRule.WE },
  { label: 'Q', value: RRule.TH },
  { label: 'S', value: RRule.FR },
  { label: 'S', value: RRule.SA },
];

const POSITIONS = [
    { label: 'primeiro(a)', value: 1 },
    { label: 'segundo(a)', value: 2 },
    { label: 'terceiro(a)', value: 3 },
    { label: 'quarto(a)', value: 4 },
    { label: 'quinto(a)', value: 5 },
    { label: 'último(a)', value: -1 },
];

// Mapeia getDay() (0=Dom → 6=Sáb) para índice do RRule (0=Seg → 6=Dom)
const toRRuleWeekday = (jsDay: number) => (jsDay === 0 ? 6 : jsDay - 1);
 
 const RecurrenceEditor: React.FC<RecurrenceEditorProps> = ({ rruleString, onChange, endTime, onEndTimeChange }) => {
  const [options, setOptions] = useState<any>({});
  const [monthlyType, setMonthlyType] = useState<'day' | 'weekday'>('day');

  useEffect(() => {
    if (!rruleString || rruleString.trim() === '') {
      // Para rruleString vazio, definir dtstart para hoje às 00:00 (evita marcar como "em andamento" por padrão)
      const now = new Date();
      const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      setOptions({
        dtstart: localMidnight,
        endTime: endTime || '',
      });
      return;
    }

    try {
      const rule = rrulestr(rruleString) as RRule;
      const opts = rule.options;
      
      let byweekday = opts.byweekday;
      if (byweekday && byweekday.length > 0 && typeof byweekday[0] === 'number') {
        byweekday = byweekday.map((dayIndex: number) => new Weekday(dayIndex));
      }

      setOptions({
        freq: opts.freq,
        interval: opts.interval,
        byweekday: byweekday || [],
        bymonthday: opts.bymonthday,
        bysetpos: opts.bysetpos,
        dtstart: (() => { const d = new Date(opts.dtstart as any); return Number.isNaN(d.getTime()) ? new Date() : d; })(),
        until: opts.until,
        count: opts.count,
        endTime: endTime || '',
      });

      if (opts.freq === RRule.MONTHLY) {
        if (opts.bysetpos && opts.byweekday) {
          setMonthlyType('weekday');
        } else {
          setMonthlyType('day');
        }
      }

    } catch (e) {
      console.error("Invalid rrule string:", rruleString);
      const now = new Date();
      const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      setOptions({
        dtstart: localMidnight,
        endTime: endTime || '',
      });
    }
  }, [rruleString]);

  const updateRule = (newOpts: any) => {
    const updatedOptions = { ...options, ...newOpts };
    
    // Sempre manter estado local (inclui endTime) para controle dos inputs
    setOptions(updatedOptions);

    // Se não há frequência definida, ainda assim gerar uma regra única (COUNT=1) com o dtstart atual
    if (!updatedOptions.freq) {
      const base = updatedOptions.dtstart;
      const start = (() => { const d = new Date(base as any); return Number.isNaN(d.getTime()) ? new Date() : d; })();
      const singleRule = new RRule({ freq: RRule.DAILY, count: 1, dtstart: start });
      const out = singleRule
        .toString()
        .replace(/DTSTART:(\d{8}T\d{6})Z/g, 'DTSTART:$1')
        .replace(/UNTIL=(\d{8}T\d{6})Z/g, 'UNTIL=$1');
      onChange(out);
      return;
    }
    
    if (newOpts.freq !== undefined) {
        if (newOpts.freq !== RRule.WEEKLY) {
            if (newOpts.freq !== RRule.MONTHLY || monthlyType === 'day') {
                updatedOptions.byweekday = undefined;
            }
        }
        if (newOpts.freq !== RRule.MONTHLY) {
            updatedOptions.bymonthday = undefined;
            updatedOptions.bysetpos = undefined;
        }
    }

    if (newOpts.monthlyType) {
        const base = (() => { const d = new Date(updatedOptions.dtstart as any); return Number.isNaN(d.getTime()) ? new Date() : d; })();
        if (newOpts.monthlyType === 'day') {
            updatedOptions.bymonthday = base.getDate();
            updatedOptions.bysetpos = undefined;
            updatedOptions.byweekday = undefined;
        } else {
            updatedOptions.bymonthday = undefined;
            const dayOfMonth = base.getDate();
            const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
            const pos = Math.floor((dayOfMonth - 1) / 7) + 1;
            const isLastWeek = dayOfMonth + 7 > daysInMonth;
            updatedOptions.bysetpos = isLastWeek ? -1 : pos;
            updatedOptions.byweekday = [new Weekday(toRRuleWeekday(base.getDay()))];
        }
    }

    // Remover propriedades não suportadas pelo RRule antes de construir a regra
    const rruleOptions = { ...updatedOptions };
    delete (rruleOptions as any).monthlyType;
    delete (rruleOptions as any).endTime;

    if (rruleOptions.dtstart) {
      const d = new Date((rruleOptions as any).dtstart as any);
      (rruleOptions as any).dtstart = Number.isNaN(d.getTime()) ? new Date() : d;
    }

    const rule = new RRule(rruleOptions);
    const out = rule
      .toString()
      .replace(/DTSTART:(\d{8}T\d{6})Z/g, 'DTSTART:$1')
      .replace(/UNTIL=(\d{8}T\d{6})Z/g, 'UNTIL=$1');
    onChange(out);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split('-').map(Number);
    const base = new Date(options.dtstart as any);
    const newStartDate = Number.isNaN(base.getTime()) ? new Date() : base;
    // Ao alterar a data, resetar horário para 00:00 por padrão (o usuário pode ajustar após isso)
    newStartDate.setFullYear(year, month - 1, day);
    newStartDate.setHours(0, 0, 0, 0);
    updateRule({ dtstart: newStartDate });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hour, minute] = e.target.value.split(':').map(Number);
    const base = new Date(options.dtstart as any);
    const newStartDate = Number.isNaN(base.getTime()) ? new Date() : base;
    newStartDate.setHours(hour, minute);
    updateRule({ dtstart: newStartDate });
  };
  
  const handleWeekdayToggle = (dayValue: Weekday) => {
    const currentWeekdays: Weekday[] = options.byweekday || [];
    const isSelected = currentWeekdays.some(d => d.weekday === dayValue.weekday);

    let newWeekdays: Weekday[];
    if (isSelected) {
        newWeekdays = currentWeekdays.filter(d => d.weekday !== dayValue.weekday);
    } else {
        newWeekdays = [...currentWeekdays, dayValue];
    }
    
    newWeekdays.sort((a, b) => a.weekday - b.weekday);
    
    updateRule({ byweekday: newWeekdays.length > 0 ? newWeekdays : undefined });
  };

  const handleUntilDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUntilDate = new Date(e.target.value + 'T00:00:00');
    newUntilDate.setHours(23, 59, 59, 999);
    updateRule({ until: newUntilDate, count: undefined });
  };

  const getFullDayName = (weekdayIndex: number): string => {
    switch (weekdayIndex) {
      case 0: return 'Domingo';
      case 1: return 'Segunda-feira';
      case 2: return 'Terça-feira';
      case 3: return 'Quarta-feira';
      case 4: return 'Quinta-feira';
      case 5: return 'Sexta-feira';
      case 6: return 'Sábado';
      default: return '';
    }
  };

  if (!options.dtstart) {
    return <div>Carregando agendamento...</div>;
  }

  return (
    <div className="space-y-4 p-4 border border-jkd-border rounded-lg bg-jkd-bg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-jkd-heading mb-1">Data de Início</label>
          <input type="date" value={(() => { const d = new Date(options.dtstart as any); return Number.isNaN(d.getTime()) ? format(new Date(), 'yyyy-MM-dd') : format(d, 'yyyy-MM-dd'); })()} onChange={handleDateChange} className="w-full input-style" />
        </div>
        <div>
          <label className="block text-sm font-medium text-jkd-heading mb-1">Horário de Início</label>
          <input type="text" value={(() => { const d = new Date(options.dtstart as any); return Number.isNaN(d.getTime()) ? '' : format(d, 'HH:mm'); })()} onChange={handleTimeChange} className="w-full input-style" inputMode="numeric" placeholder="HH:mm" pattern="^([01]\\d|2[0-3]):([0-5]\\d)$" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-jkd-heading mb-1">Horário de Término</label>
          <input 
            type="text" 
            value={(endTime ?? options.endTime) || ''} 
            onChange={(e) => {
              const value = e.target.value;
              updateRule({ endTime: value });
              if (onEndTimeChange) onEndTimeChange(value);
            }} 
            className="w-full input-style" 
            inputMode="numeric"
            placeholder="HH:mm"
            pattern="^([01]\\d|2[0-3]):([0-5]\\d)$"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-jkd-text mb-1 text-xs">
            * Deixe em branco para eventos sem horário definido de término
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-jkd-heading mb-1">Repetir</label>
        <select value={options.freq || 'none'} onChange={e => {
          const value = e.target.value;
          if (value === 'none') {
            updateRule({ freq: undefined, interval: undefined, byweekday: undefined, bymonthday: undefined, bysetpos: undefined, count: 1 });
          } else {
            updateRule({ freq: Number(value), interval: 1, count: undefined });
          }
        }} className="w-full input-style">
          <option value="none">Nenhuma (evento único)</option>
          <option value={RRule.DAILY}>Diariamente</option>
          <option value={RRule.WEEKLY}>Semanalmente</option>
          <option value={RRule.MONTHLY}>Mensalmente</option>
          <option value={RRule.YEARLY}>Anualmente</option>
        </select>
      </div>

      {options.freq === RRule.WEEKLY && (
        <div>
          <label className="block text-sm font-medium text-jkd-heading mb-1">Dias da Semana</label>
          <div className="flex gap-2">
            {WEEKDAYS.map(({ label, value }) => (
              <button
                key={value.weekday}
                type="button"
                className={`px-3 py-1 rounded border ${options.byweekday?.some((d: Weekday) => d.weekday === value.weekday) ? 'bg-church-primary text-white border-church-primary' : 'bg-jkd-bg text-jkd-text border-jkd-border'}`}
                onClick={() => handleWeekdayToggle(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {options.freq === RRule.MONTHLY && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-jkd-heading mb-1">Recorrência Mensal</label>
          <div className="flex gap-3 items-center">
            <select value={monthlyType} onChange={e => updateRule({ monthlyType: e.target.value })} className="input-style">
              <option value="day">Dia do mês (ex: dia 10)</option>
              <option value="weekday">Dia da semana (ex: terceiro domingo)</option>
            </select>
            <span className="text-jkd-text text-sm">em relação à data inicial</span>
          </div>
          {monthlyType === 'weekday' && (
            <div className="text-xs text-jkd-text">Exemplo: "{format(new Date(options.dtstart as any), 'MMMM', { locale: { code: 'pt-BR' } as any })} - {POSITIONS.find(p => p.value === options.bysetpos)?.label || 'semana'} - {getFullDayName((options.byweekday?.[0]?.weekday ?? 0) + 1)}"</div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-jkd-heading mb-1">Intervalo</label>
          <input type="number" min={1} value={options.interval || 1} onChange={e => updateRule({ interval: Number(e.target.value) })} className="w-full input-style" />
        </div>
        <div>
          <label className="block text-sm font-medium text-jkd-heading mb-1">Ocorrências (COUNT)</label>
          <input type="number" min={1} value={options.count || ''} onChange={e => updateRule({ count: e.target.value ? Number(e.target.value) : undefined, until: undefined })} className="w-full input-style" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-jkd-heading mb-1">Fim</label>
          <select value={options.until ? 'date' : (options.count ? 'count' : 'never')} onChange={e => {
            const v = e.target.value;
            if (v === 'never') updateRule({ until: undefined, count: undefined });
            else if (v === 'count') updateRule({ count: 1, until: undefined });
            else updateRule({ until: new Date(), count: undefined });
          }} className="w-full input-style">
            <option value="never">Nunca</option>
            <option value="date">Em uma data específica</option>
            <option value="count">Após um número de ocorrências</option>
          </select>
        </div>
        {options.until && (
          <div>
            <label className="block text-sm font-medium text-jkd-heading mb-1">Data de término</label>
            <input type="date" value={(() => { const d = new Date(options.until as any); return Number.isNaN(d.getTime()) ? '' : format(d, 'yyyy-MM-dd'); })()} onChange={handleUntilDateChange} className="w-full input-style" />
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurrenceEditor;
