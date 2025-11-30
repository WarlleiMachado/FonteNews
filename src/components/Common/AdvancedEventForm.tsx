import React, { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { UploadCloud, Image as ImageIcon, Calendar as CalendarIcon, Clock, Images } from 'lucide-react';
import { RRule } from 'rrule';
import { format } from 'date-fns';

import { uploadImage } from '../../services/uploadService';
import GalleryLightModal from './GalleryLightModal';
import RichTextEditor from './RichTextEditor';

import DateTimeRecurrenceModal from './DateTimeRecurrenceModal';

interface AdvancedEventFormValues {
  title: string;
  description: string;
  descriptionHtml?: string;
  imageUrl?: string; // Imagem Principal
  destaqueCountdownUrl?: string; // Imagem para overlay do Countdown
  rruleString: string;
  endTime?: string;
  // Campos de vídeo por item
  videoUrl?: string;
  isLive?: boolean;
}

interface AdvancedEventFormProps {
  initialTitle?: string;
  initialDescription?: string;
  initialImageUrl?: string;
  initialCountdownUrl?: string;
  initialVideoUrl?: string;
  initialIsLive?: boolean;
  initialDate?: string; // yyyy-MM-dd
  initialStartTime?: string; // HH:mm
  initialEndTime?: string; // HH:mm
  initialRruleString?: string;
  uploaderAuthorizedUserId?: string;
  onSubmit: (values: AdvancedEventFormValues) => Promise<void> | void;
  submitLabel?: string;
  entityLabel?: 'Programação' | 'Culto';
}

const AdvancedEventForm: React.FC<AdvancedEventFormProps> = ({
  initialTitle = '',
  initialDescription = '',
  initialImageUrl = '',
  initialCountdownUrl = '',
  initialVideoUrl = '',
  initialIsLive = false,
  initialDate,
  initialStartTime,
  initialEndTime,
  initialRruleString,
  uploaderAuthorizedUserId,
  onSubmit,
  submitLabel = 'Salvar',
  entityLabel = 'Programação',
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [descriptionHtml, setDescriptionHtml] = useState<string>(initialDescription);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [countdownUrl, setCountdownUrl] = useState<string>(initialCountdownUrl || '');
  const [countdownFile, setCountdownFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>(initialVideoUrl || '');
  const [isLive, setIsLive] = useState<boolean>(initialIsLive || false);
  const [date, setDate] = useState<string>(initialDate || format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string>(initialStartTime || '19:00');
  const [endTime, setEndTime] = useState<string | undefined>(initialEndTime);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [isAllDay, setIsAllDay] = useState<boolean>(false);
  const [rruleString, setRruleString] = useState<string>(() => {
    if (initialRruleString) return initialRruleString;
    const baseDateStr = initialDate || format(new Date(), 'yyyy-MM-dd');
    const baseTimeStr = initialStartTime || '19:00';
    const [y, m, d] = baseDateStr.split('-').map(Number);
    const [sh, sm] = baseTimeStr.split(':').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1, sh || 0, sm || 0, 0, 0);
    const out = new RRule({ freq: RRule.DAILY, count: 1, dtstart: dt })
      .toString()
      .replace(/DTSTART:(\d{8}T\d{6})Z/g, 'DTSTART:$1')
      .replace(/UNTIL=(\d{8}T\d{6})Z/g, 'UNTIL=$1');
    return out;
  });
  const [submitting, setSubmitting] = useState(false);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const startTimeRef = useRef<HTMLInputElement | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isGalleryCountdownOpen, setIsGalleryCountdownOpen] = useState(false);
  const endTimeRef = useRef<HTMLInputElement | null>(null);
  const [isDateTimeOpen, setIsDateTimeOpen] = useState(false);

  // Parse yyyy-MM-dd as local date to avoid timezone shift
  const parseYmdToLocal = (s: string) => {
    try {
      const [yy, mm, dd] = (s || format(new Date(), 'yyyy-MM-dd')).split('-').map(Number);
      return new Date(yy || new Date().getFullYear(), (mm || 1) - 1, dd || 1, 0, 0, 0, 0);
    } catch {
      return new Date();
    }
  };

  const recurrenceSummary = useMemo(() => {
    try {
      if (!isRecurring) return 'Sem recorrência';
      if (!rruleString) return 'Recorrência não configurada';
      const rule = RRule.fromString(rruleString);
      const opt = rule.options;

      const freqLabel = (freq: number, interval: number) => {
        const base = freq === RRule.DAILY ? 'Diariamente'
          : freq === RRule.WEEKLY ? 'Semanalmente'
          : freq === RRule.MONTHLY ? 'Mensalmente'
          : freq === RRule.YEARLY ? 'Anualmente'
          : 'Recorrente';
        if (interval && interval > 1) return `A cada ${interval} ${base.toLowerCase()}`;
        return base;
      };

      // Arrays em português (segunda=0 .. domingo=6)
      const weekShortMon = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      const weekFullMon = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'];
      const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
      const ord = (n: number) => ({1:'Primeira',2:'Segunda',3:'Terceira',4:'Quarta',5:'Quinta'}[n] || `${n}ª`);
      const wdIndex = (w: any) => (typeof w === 'number' ? w : w.weekday);

      let part = freqLabel(opt.freq, opt.interval || 1);

      if (opt.freq === RRule.WEEKLY && opt.byweekday && opt.byweekday.length) {
        const days = opt.byweekday.map((w: any) => weekShortMon[wdIndex(w)]).join(', ');
        part += `: ${days}`;
      } else if (opt.freq === RRule.MONTHLY) {
        if (opt.bymonthday && opt.bymonthday.length) {
          part += ` no dia ${opt.bymonthday[0]}`;
        } else if (opt.bysetpos && opt.byweekday && opt.byweekday.length) {
          const pos = Array.isArray(opt.bysetpos) ? opt.bysetpos[0] : opt.bysetpos;
          const w0 = opt.byweekday[0];
          const wd = weekFullMon[wdIndex(w0)];
          part += ` na ${ord(pos)} ${wd} do mês`;
        }
      } else if (opt.freq === RRule.YEARLY) {
        if (opt.bymonth && opt.bymonth.length && opt.bymonthday && opt.bymonthday.length) {
          part += ` em ${months[(opt.bymonth[0] || 1) - 1]} no dia ${opt.bymonthday[0]}`;
        }
      }

      let tail = '';
      if (opt.count) {
        tail = `, por ${opt.count} ocorrência${opt.count > 1 ? 's' : ''}`;
      } else if (opt.until) {
        tail = `, até ${format(opt.until, 'dd/MM/yyyy')}`;
      }

      return `${part}${tail}`;
    } catch {
      return 'Recorrência';
    }
  }, [isRecurring, rruleString]);

  // REMOVIDO: atualização automática de rruleString para não recorrente
  useEffect(() => {
    if (!isRecurring) {
      const baseStart = isAllDay ? '00:00' : startTime;
      const [sh, sm] = baseStart.split(':').map(Number);
      const [y, m, d] = date.split('-').map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1, sh || 0, sm || 0, 0, 0);
      const single = new RRule({ freq: RRule.DAILY, count: 1, dtstart: dt });
      const out = single
        .toString()
        .replace(/DTSTART:(\d{8}T\d{6})Z/g, 'DTSTART:$1')
        .replace(/UNTIL=(\d{8}T\d{6})Z/g, 'UNTIL=$1');
      setRruleString(out);
    }
  }, [date, startTime, isRecurring, isAllDay]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setImageFile(f);
  };

  const handleCountdownFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setCountdownFile(f);
  };

  const combinedPreviewUrl = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    return imageUrl || '';
  }, [imageFile, imageUrl]);

  const countdownPreviewUrl = useMemo(() => {
    if (countdownFile) return URL.createObjectURL(countdownFile);
    return countdownUrl || '';
  }, [countdownFile, countdownUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let finalImageUrl = imageUrl?.trim() ? imageUrl.trim() : undefined;
      if (imageFile) {
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const basePath = uploaderAuthorizedUserId
          ? `images/uploads/${uploaderAuthorizedUserId}`
          : `images/announcements`;
        finalImageUrl = await uploadImage(imageFile, `${basePath}/${Date.now()}_${safeName}`);
      }

      let finalCountdownUrl = countdownUrl?.trim() ? countdownUrl.trim() : undefined;
      if (countdownFile) {
        const safeName = countdownFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const basePath = uploaderAuthorizedUserId
          ? `images/uploads/${uploaderAuthorizedUserId}`
          : `images/announcements`;
        finalCountdownUrl = await uploadImage(countdownFile, `${basePath}/${Date.now()}_${safeName}`);
      }

      const safeHtml = DOMPurify.sanitize(descriptionHtml || '');
      const toPlainText = (html: string) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html || '';
        return (tmp.textContent || tmp.innerText || '').trim();
      };

      const values: AdvancedEventFormValues = {
        title: title.trim(),
        description: toPlainText(safeHtml),
        descriptionHtml: safeHtml,
        imageUrl: finalImageUrl,
        destaqueCountdownUrl: finalCountdownUrl,
        rruleString,
        endTime,
        videoUrl: videoUrl?.trim() ? videoUrl.trim() : undefined,
        isLive,
      };

      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-jkd-bg-sec border border-jkd-border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-jkd-heading">{entityLabel === 'Culto' ? 'Informações do Culto' : 'Informações da Programação'}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-jkd-heading mb-1">{entityLabel === 'Culto' ? 'Nome do Culto' : 'Nome da Programação'}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full input-style"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-jkd-heading mb-1">Imagem Principal (URL)</label>
            <p className="text-xs text-jkd-text mb-2">Use imagens com proporção 1:1 (1000x1000 - Feed) ou 9:16 (1080x1920-Reels/History)</p>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 input-style"
              />
              <label className="inline-flex items-center gap-2 px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg cursor-pointer hover:bg-jkd-border">
                <UploadCloud size={18} />
                <span>Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              <button type="button" onClick={() => setIsGalleryOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg hover:bg-jkd-border">
                <Images size={18} />
                <span>Galeria</span>
              </button>
            </div>
            {combinedPreviewUrl && (
              <div className="mt-2 flex items-center gap-2 text-sm text-jkd-text">
                <ImageIcon size={16} />
                <span>Pré-visualização</span>
              </div>
            )}
            {combinedPreviewUrl && (
              <img src={combinedPreviewUrl} alt="Preview" className="mt-1 h-24 w-auto rounded border border-jkd-border object-cover" />
            )}
          </div>
        </div>

        <div className="mt-4">
          <div>
            <label className="block text-sm font-medium text-jkd-heading mb-1">Destaque Countdown (URL)</label>
            <p className="text-xs text-jkd-text mb-2">Use imagens com proporção 16:9 (1920x1080)-Paisagem/Horizontal</p>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://..."
                value={countdownUrl}
                onChange={(e) => setCountdownUrl(e.target.value)}
                className="flex-1 input-style"
              />
              <label className="inline-flex items-center gap-2 px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg cursor-pointer hover:bg-jkd-border">
                <UploadCloud size={18} />
                <span>Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleCountdownFileChange} />
              </label>
              <button type="button" onClick={() => setIsGalleryCountdownOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg hover:bg-jkd-border">
                <Images size={18} />
                <span>Galeria</span>
              </button>
            </div>
            {countdownPreviewUrl && (
              <div className="mt-2 flex items-center gap-2 text-sm text-jkd-text">
                <ImageIcon size={16} />
                <span>Pré-visualização (Countdown)</span>
              </div>
            )}
            {countdownPreviewUrl && (
              <img src={countdownPreviewUrl} alt="Preview Countdown" className="mt-1 h-24 w-auto rounded border border-jkd-border object-cover" />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-jkd-heading mb-1">Descrição</label>
          <RichTextEditor
            initialHtml={descriptionHtml}
            onChangeHtml={setDescriptionHtml}
            className="min-h-[150px]"
          />
        </div>
      </div>

      {/* Vídeo por item */}
      <div className="bg-jkd-bg-sec border border-jkd-border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-jkd-heading">Vídeo</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-jkd-heading mb-1">URL do vídeo (YouTube ou MP4/MOV)</label>
            <input
              type="url"
              placeholder="https://youtu.be/... ou https://.../video.mp4"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full input-style"
            />
            <p className="text-xs text-jkd-text mt-1">Se preenchido, o cartão mostrará um botão de play.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-jkd-heading">Transmissão Ao Vivo</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isLive} onChange={(e) => setIsLive(e.target.checked)} />
              <div className="toggle-container bg-jkd-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-church-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:transition-all"></div>
            </label>
            <span className={`${isLive ? 'bg-church-primary text-white' : 'bg-jkd-bg-sec border border-jkd-border text-jkd-text'} text-xs px-2 py-0.5 rounded`}>{isLive ? 'Ativo' : 'Inativo'}</span>
          </div>
        </div>
      </div>

      <div className="bg-jkd-bg-sec border border-jkd-border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-jkd-heading">Configuração de Data e Horário</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="text-gray-600">Selecionado</div>
              <div className="font-medium">
                {isAllDay
                  ? `${format(parseYmdToLocal(date), 'dd/MM/yyyy')} (dia inteiro)`
                  : `${format(parseYmdToLocal(date), 'dd/MM/yyyy')} às ${startTime}${endTime ? ` — ${endTime}` : ''}`}
              </div>
              <div className="text-xs text-jkd-text mt-1">{recurrenceSummary}</div>
            </div>
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-[#246BFD] text-white hover:bg-[#1e5be0]"
              onClick={() => setIsDateTimeOpen(true)}
            >
              Data e Horário
            </button>
          </div>

          <DateTimeRecurrenceModal
            isOpen={isDateTimeOpen}
            initialDate={date}
            initialStartTime={startTime}
            initialEndTime={endTime}
            initialAllDay={isAllDay}
            initialIsRecurring={isRecurring}
            initialRruleString={rruleString}
            onClose={() => setIsDateTimeOpen(false)}
            onConfirm={({ date: d, startTime: st, endTime: et, isAllDay: all, isRecurring: recur, rruleString: rrs }) => {
              setDate(d);
              setStartTime(st);
              setEndTime(et);
              setIsAllDay(all);
              setIsRecurring(recur);
              setRruleString(rrs);
              setIsDateTimeOpen(false);
            }}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-church-primary text-white hover:bg-church-primary/90 disabled:opacity-60">
          {submitLabel}
        </button>
      </div>

      <style>{`.input-style { @apply px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary; }`}</style>
      <GalleryLightModal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} onInsert={(url) => { setImageUrl(url); setIsGalleryOpen(false); }} initialTab="principal" />
      <GalleryLightModal isOpen={isGalleryCountdownOpen} onClose={() => setIsGalleryCountdownOpen(false)} onInsert={(url) => { setCountdownUrl(url); setIsGalleryCountdownOpen(false); }} initialTab="countdown" />
    </form>
  );
};

export default AdvancedEventForm;