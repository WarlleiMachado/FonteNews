import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../lib/firebase';
import { addDoc, collection, getDocs, limit, query, serverTimestamp, where } from 'firebase/firestore';
import { X, Send } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'date';
  required?: boolean;
  options?: string[];
}

interface Props {
  popupId: string;
  onClose?: () => void;
}

const PopupForm: React.FC<Props> = ({ popupId, onClose }) => {
  const { user } = useAuth();
  const [meta, setMeta] = useState<{ title: string; description?: string; paid?: boolean; price?: number; fields: FormField[] } | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, 'forms'), where('popupId', '==', popupId), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return;
      const d = snap.docs[0];
      setMeta({ title: d.get('title'), description: d.get('description'), paid: d.get('paid'), price: d.get('price'), fields: d.get('fields') || [] });
    };
    load();
  }, [popupId]);

  const change = (id: string, v: any) => setValues(prev => ({ ...prev, [id]: v }));

  const allValid = useMemo(() => {
    if (!meta) return false;
    return (meta.fields||[]).every(f => !f.required || (values[f.id] !== undefined && values[f.id] !== '' && !(Array.isArray(values[f.id]) && values[f.id].length === 0)));
  }, [values, meta]);

  const submit = async () => {
    if (!meta) return;
    if (!allValid) { alert('Preencha os campos obrigatórios.'); return; }
    try {
      setSubmitting(true);
      await addDoc(collection(db, 'form_submissions'), {
        popupId,
        formTitle: meta.title,
        data: values,
        paid: !!meta.paid,
        price: meta.price || 0,
        submittedByUid: user?.uid || null,
        submittedAt: serverTimestamp(),
        status: 'pending',
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-2xl bg-gradient-to-b from-jkd-bg-sec to-jkd-bg rounded-2xl border border-jkd-border shadow-2xl ring-1 ring-white/10"
          >
            <button type="button" className="absolute top-3 right-3 icon-btn" onClick={onClose} aria-label="Fechar">
              <X />
            </button>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-jkd-heading">{meta?.title || 'Formulário'}</h3>
              {meta?.description && <p className="mt-1 text-sm text-jkd-text">{meta.description}</p>}

              <div className="mt-4 space-y-3">
                {meta?.fields?.map(f => (
                  <div key={f.id}>
                    <label className="text-xs text-jkd-text">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                    {f.type === 'text' && (
                      <input className="mt-1 input" onChange={e=>change(f.id, e.target.value)} />
                    )}
                    {f.type === 'email' && (
                      <input type="email" className="mt-1 input" onChange={e=>change(f.id, e.target.value)} />
                    )}
                    {f.type === 'phone' && (
                      <input className="mt-1 input" onChange={e=>change(f.id, e.target.value)} placeholder="(00) 00000-0000" />
                    )}
                    {f.type === 'textarea' && (
                      <textarea rows={3} className="mt-1 input" onChange={e=>change(f.id, e.target.value)} />
                    )}
                    {f.type === 'date' && (
                      <input type="date" className="mt-1 input" onChange={e=>change(f.id, e.target.value)} />
                    )}
                    {f.type === 'select' && (
                      <select className="mt-1 input" onChange={e=>change(f.id, e.target.value)}>
                        <option value="">Selecione...</option>
                        {(f.options||[]).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}
                    {f.type === 'checkbox' && (
                      <div className="mt-1 flex flex-wrap gap-3">
                        {(f.options||[]).map(opt => (
                          <label key={opt} className="inline-flex items-center gap-2 text-xs text-jkd-text">
                            <input type="checkbox" onChange={e=>{
                              const curr = Array.isArray(values[f.id]) ? values[f.id] : [];
                              change(f.id, e.target.checked ? [...curr, opt] : curr.filter((x:any)=>x!==opt));
                            }} /> {opt}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {meta?.paid && (
                <div className="mt-4 bg-jkd-bg-sec rounded-lg border border-jkd-border p-3">
                  <p className="text-sm text-jkd-heading">Este formulário é pago.</p>
                  <p className="text-xs text-jkd-text">Valor: R$ {Number(meta.price||0).toFixed(2)}</p>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-2">
                <button type="button" className="btn-sec" onClick={onClose}>Cancelar</button>
                <button type="button" className="btn" onClick={submit} disabled={!allValid || submitting}>
                  <Send size={16} /> {submitting ? 'Enviando...' : submitted ? 'Enviado!' : 'Enviar'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PopupForm;