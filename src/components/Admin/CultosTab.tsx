import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { Culto } from '../../types';
import RecurrenceEditor from '../Common/RecurrenceEditor';
import { Plus, Save, Trash2, Edit, X, Image, UploadCloud } from 'lucide-react';
import { RRule } from 'rrule';

interface CultosTabProps {
  onSave: () => void;
}

const CultosTab: React.FC<CultosTabProps> = ({ onSave }) => {
  const { cultos, settings, updateSettings, addCulto, updateCulto, deleteCulto, showConfirmation } = useApp();
  const [editingCulto, setEditingCulto] = useState<Partial<Culto> | null>(null);
  const [rruleString, setRruleString] = useState('');
  const [logoUrl, setLogoUrl] = useState(settings.cultosLogoUrl);
  const [error, setError] = useState<string | null>(null);

  const handleAddNew = () => {
    setEditingCulto({ title: '', description: '', image: '' });
    setRruleString('');
    setError(null);
  };

  const handleEdit = (culto: Culto) => {
    setEditingCulto(culto);
    setRruleString(culto.rruleString);
    setError(null);
  };

  const handleCancel = () => {
    setEditingCulto(null);
    setRruleString('');
    setError(null);
  };

  const handleSaveCulto = () => {
    if (!editingCulto || !editingCulto.title) return;
    if (!rruleString || rruleString.trim() === '') {
      setError('Configure data e horário na recorrência antes de salvar.');
      return;
    }
    
    const cultoData = {
      title: editingCulto.title,
      description: editingCulto.description || '',
      rruleString: rruleString,
      ...(editingCulto.image && editingCulto.image.trim() && { image: editingCulto.image.trim() }),
      createdAt: editingCulto.id ? editingCulto.createdAt : new Date(), // Adiciona createdAt para novos cultos
    };

    if (editingCulto.id) {
      updateCulto(editingCulto.id, cultoData);
    } else {
      addCulto(cultoData);
    }
    onSave();
    handleCancel();
  };

  const handleDeleteCulto = (id: string, title: string) => {
    showConfirmation(
      'Excluir Culto',
      `Tem certeza que deseja excluir o culto "${title}"?`,
      () => deleteCulto(id)
    );
  };

  const handleLogoSave = () => {
    updateSettings({ cultosLogoUrl: logoUrl });
    onSave();
  };

  if (editingCulto) {
    return (
      <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-4">
        <h3 className="text-lg font-semibold text-jkd-heading">{editingCulto.id ? 'Editar Culto' : 'Novo Culto'}</h3>
        <div>
          <label className="block text-sm font-medium text-jkd-heading mb-1">Título</label>
          <input type="text" value={editingCulto.title} onChange={e => setEditingCulto({ ...editingCulto, title: e.target.value })} className="w-full input-style" />
        </div>
        <div>
          <label className="block text-sm font-medium text-jkd-heading mb-1">Descrição</label>
          <textarea value={editingCulto.description} onChange={e => setEditingCulto({ ...editingCulto, description: e.target.value })} rows={3} className="w-full input-style" />
        </div>
        <div>
            <label htmlFor="image" className="block text-sm font-medium text-jkd-heading mb-2">
                <div className="flex items-center space-x-2"><Image size={16} /><span>Imagem (opcional)</span></div>
                <p className="text-xs text-jkd-text/70">Recomendado: formato vertical (9:16). Tamanho máximo: <strong>5MB</strong>.</p>
            </label>
            <div className="flex gap-2">
                <input type="url" id="image" value={editingCulto.image || ''} onChange={(e) => setEditingCulto({ ...editingCulto, image: e.target.value })}
                    className="w-full input-style"
                    placeholder="https://exemplo.com/imagem.jpg" />
                <button type="button" disabled title="Conecte o Supabase para habilitar uploads" className="inline-flex items-center gap-2 px-4 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text disabled:opacity-50 disabled:cursor-not-allowed">
                    <UploadCloud size={16} />
                    <span>Upload</span>
                </button>
            </div>
        </div>
        <RecurrenceEditor rruleString={rruleString} onChange={setRruleString} />
        {error && (<div className="text-red-600 text-sm">{error}</div>)}
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={handleCancel} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-jkd-bg">
            <X size={16} /> Cancelar
          </button>
          <button onClick={handleSaveCulto} className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90">
            <Save size={16} /> Salvar
          </button>
        </div>
        <style>{`.input-style { @apply px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary; }`}</style>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border">
            <div className="p-6 border-b border-jkd-border">
                <h2 className="text-lg font-semibold text-jkd-heading">Logo da Página de Cultos</h2>
                <p className="text-sm text-jkd-text">Personalize o logo que aparece no topo da página de cultos.</p>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <label htmlFor="cultosLogoUrl" className="block text-sm font-medium text-jkd-heading mb-1"><div className="flex items-center gap-2"><Image size={16} /> URL do Logo</div></label>
                    <input type="url" id="cultosLogoUrl" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="w-full input-style" />
                </div>
                <div className="text-right">
                    <button onClick={handleLogoSave} className="inline-flex items-center space-x-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90">
                        <Save size={16} />
                        <span>Salvar Logo</span>
                    </button>
                </div>
            </div>
        </div>

        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border">
            <div className="p-6 border-b border-jkd-border flex justify-between items-center">
                <div>
                <h2 className="text-lg font-semibold text-jkd-heading">Gerenciar Cultos</h2>
                <p className="text-sm text-jkd-text">Adicione ou edite os cultos regulares da igreja.</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/new-culto2" className="inline-flex items-center space-x-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90">
                    <Plus size={16} />
                    <span>Novo Culto</span>
                    </Link>
                </div>
            </div>
            <div className="p-6">
                <ul className="space-y-3">
                {cultos.map(culto => (
                    <li key={culto.id} className="flex items-center justify-between p-3 bg-jkd-bg rounded-lg border border-jkd-border">
                    <div>
                        <p className="font-medium text-jkd-heading">{culto.title}</p>
                        <p className="text-sm text-jkd-text">{culto.description}</p>
                    </div>
                    <div className="flex gap-1">
                        <Link to={`/edit-culto/${culto.id}`} className="p-2 rounded-md text-jkd-text hover:bg-church-primary/10 hover:text-church-primary"><Edit size={16} /></Link>
                        <button onClick={() => handleDeleteCulto(culto.id, culto.title)} className="p-2 rounded-md text-jkd-text hover:bg-red-500/10 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                    </li>
                ))}
                </ul>
            </div>
        </div>
        <style>{`.input-style { @apply px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary; }`}</style>
    </div>
  );
};

export default CultosTab;
