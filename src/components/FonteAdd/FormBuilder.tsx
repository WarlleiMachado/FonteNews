import React, { useMemo, useState } from 'react';
import { db } from '../../lib/firebase';
import { addDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { CheckCircle2, Plus, Trash } from 'lucide-react';

export type FormFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'date';

interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: string[]; // select / checkbox group
}

const defaultField = (): FormField => ({
  id: nanoid(8),
  label: 'Nome',
  type: 'text',
  required: true,
});

const categories = ['Voluntários', 'Membros', 'Ministérios', 'Cursos', 'Líderes'];

const FormBuilder: React.FC = () => {
  const [title, setTitle] = useState('Inscrição');
  const [description, setDescription] = useState('Preencha para participar.');
  const [category, setCategory] = useState(categories[0]);
  const [paid, setPaid] = useState(false);
  const [price, setPrice] = useState<number | ''>('');
  const [popupId, setPopupId] = useState<string>(() => `FA-${nanoid(6)}`);
  const [fields, setFields] = useState<FormField[]>([defaultField(), { id: nanoid(8), label: 'Email', type: 'email', required: true }]);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const totalFields = useMemo(() => fields.length, [fields]);

  const addField = () => setFields(prev => [...prev, defaultField()]);
  const removeField = (id: string) => setFields(prev => prev.filter(f => f.id !== id));
  const updateField = (id: string, patch: Partial<FormField>) => setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));

  const regeneratePopupId = async () => {
    const newId = `FA-${nanoid(6)}`;
    setPopupId(newId);
  };

  const ensureUniquePopupId = async (id: string): Promise<string> => {
    const q = query(collection(db, 'forms'), where('popupId', '==', id));
    const snap = await getDocs(q);
    if (snap.empty) return id;
    const newId = `FA-${nanoid(7)}`;
    return ensureUniquePopupId(newId);
  };

  const save = async () => {
    try {
      setSaving(true);
      const finalPopupId = await ensureUniquePopupId(popupId);
      const docRef = await addDoc(collection(db, 'forms'), {
        title,
        description,
        category,
        paid,
        price: paid ? Number(price || 0) : 0,
        popupId: finalPopupId,
        status: 'active',
        fields,
        createdAt: serverTimestamp(),
      });
      setSavedId(docRef.id);
      setPopupId(finalPopupId);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar formulário');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border">
      <div className="p-4 border-b border-jkd-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-jkd-heading">Construtor de Formulários</h2>
          <p className="text-xs text-jkd-text">Modelos modernos inspirados no Amelia, adaptados para igreja.</p>
        </div>
        <div className="text-xs text-jkd-text">
          {totalFields} campos
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-jkd-text">Título</span>
              <input className="mt-1 input" value={title} onChange={e=>setTitle(e.target.value)} />
            </label>
            <label className="text-sm">
              <span className="text-jkd-text">Categoria</span>
              <select className="mt-1 input" value={category} onChange={e=>setCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="text-jkd-text">Descrição</span>
              <textarea className="mt-1 input" rows={2} value={description} onChange={e=>setDescription(e.target.value)} />
            </label>
          </div>

          <div className="bg-jkd-bg rounded-lg border border-jkd-border p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-jkd-heading">Campos</h3>
              <button type="button" onClick={addField} className="btn-sm">
                <Plus size={14} /> Adicionar campo
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {fields.map(field => (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                  <label className="text-xs sm:col-span-2">
                    <span className="text-jkd-text">Rótulo</span>
                    <input className="mt-1 input" value={field.label} onChange={e=>updateField(field.id, { label: e.target.value })} />
                  </label>
                  <label className="text-xs">
                    <span className="text-jkd-text">Tipo</span>
                    <select className="mt-1 input" value={field.type} onChange={e=>updateField(field.id, { type: e.target.value as FormFieldType })}>
                      <option value="text">Texto</option>
                      <option value="email">Email</option>
                      <option value="phone">Telefone</option>
                      <option value="textarea">Texto longo</option>
                      <option value="select">Seleção</option>
                      <option value="checkbox">Caixa de seleção</option>
                      <option value="date">Data</option>
                    </select>
                  </label>
                  {(field.type === 'select' || field.type === 'checkbox') && (
                    <label className="text-xs sm:col-span-2">
                      <span className="text-jkd-text">Opções (separar por vírgula)</span>
                      <input className="mt-1 input" value={(field.options||[]).join(', ')} onChange={e=>updateField(field.id, { options: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} />
                    </label>
                  )}
                  <div className="flex items-center gap-3">
                    <label className="text-xs inline-flex items-center gap-2">
                      <input type="checkbox" checked={!!field.required} onChange={e=>updateField(field.id, { required: e.target.checked })} /> Obrigatório
                    </label>
                    <button type="button" onClick={()=>removeField(field.id)} className="icon-btn text-red-500">
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-jkd-bg rounded-lg border border-jkd-border p-3 space-y-2">
            <h3 className="text-sm font-medium text-jkd-heading">Pop-up</h3>
            <label className="text-xs block">
              <span className="text-jkd-text">ID do Pop-up</span>
              <div className="mt-1 flex gap-2">
                <input className="input flex-1" value={popupId} onChange={e=>setPopupId(e.target.value)} />
                <button type="button" className="btn-sm" onClick={regeneratePopupId}>Gerar</button>
              </div>
            </label>
            <p className="text-xs text-jkd-text">Use este ID para abrir o pop-up em qualquer página.</p>
          </div>

          <div className="bg-jkd-bg rounded-lg border border-jkd-border p-3 space-y-2">
            <h3 className="text-sm font-medium text-jkd-heading">Pagamento</h3>
            <label className="text-xs inline-flex items-center gap-2">
              <input type="checkbox" checked={paid} onChange={e=>setPaid(e.target.checked)} /> Formulário pago
            </label>
            {paid && (
              <label className="text-xs block">
                <span className="text-jkd-text">Preço (R$)</span>
                <input className="mt-1 input" type="number" min={0} step={0.5} value={price} onChange={e=>setPrice(e.target.value ? Number(e.target.value) : '')} />
              </label>
            )}
          </div>

          <div>
            <button type="button" onClick={save} disabled={saving} className="btn w-full">
              {saving ? 'Salvando...' : 'Salvar formulário'}
            </button>
            {savedId && (
              <p className="mt-2 text-xs text-green-600 inline-flex items-center gap-2"><CheckCircle2 size={14} /> Salvo! Use o ID {popupId} para abrir o pop-up.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;