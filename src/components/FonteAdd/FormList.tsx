import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { Eye, Copy, ToggleLeft, ToggleRight } from 'lucide-react';
import PopupForm from './PopupForm';

interface FormDoc {
  id: string;
  title: string;
  category?: string;
  popupId: string;
  status?: 'active' | 'inactive';
}

const FormList: React.FC = () => {
  const [items, setItems] = useState<FormDoc[]>([]);
  const [previewPopupId, setPreviewPopupId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, 'forms'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: FormDoc[] = snap.docs.map(d => ({ id: d.id, popupId: d.get('popupId'), title: d.get('title'), category: d.get('category'), status: d.get('status') || 'active' }));
      setItems(list);
    };
    load();
  }, []);

  const toggleStatus = async (item: FormDoc) => {
    const next = item.status === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, 'forms', item.id), { status: next });
    setItems(prev => prev.map(p => p.id === item.id ? { ...p, status: next } : p));
  };

  const copySnippet = async (popupId: string) => {
    const snippet = `<OpenFormButton popupId=\"${popupId}\" label=\"Abrir formulário\" />`;
    await navigator.clipboard.writeText(snippet);
    alert('Snippet copiado!');
  };

  return (
    <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(item => (
          <div key={item.id} className="bg-jkd-bg rounded-lg border border-jkd-border p-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-jkd-heading">{item.title}</h3>
                <p className="text-xs text-jkd-text">ID: {item.popupId} · {item.category}</p>
              </div>
              <button type="button" className="icon-btn" onClick={()=>setPreviewPopupId(item.popupId)} title="Pré-visualizar">
                <Eye size={16} />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button type="button" className="btn-sm" onClick={()=>copySnippet(item.popupId)}>
                <Copy size={14} /> Copiar snippet
              </button>
              <button type="button" className="icon-btn" onClick={()=>toggleStatus(item)} title="Ativar/Desativar">
                {item.status === 'active' ? <ToggleRight className="text-church-primary" size={18} /> : <ToggleLeft className="text-jkd-text" size={18} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {previewPopupId && (
        <PopupForm popupId={previewPopupId} onClose={()=>setPreviewPopupId(null)} />
      )}
    </div>
  );
};

export default FormList;