import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Info, PlusCircle, ListChecks } from 'lucide-react';
import FormList from '../../components/FonteAdd/FormList';
import FormBuilder from '../../components/FonteAdd/FormBuilder';

const FonteAddPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'builder' | 'list' | 'help'>('builder');

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-jkd-heading">Fonte Add</h1>
          <span className="text-xs text-jkd-text">Sistema de formulários dinâmicos</span>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${activeTab==='builder' ? 'bg-church-primary text-white border-church-primary' : 'bg-jkd-bg-sec text-jkd-heading border-jkd-border'}`}
          >
            <PlusCircle size={16} /> Criar Formulário
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${activeTab==='list' ? 'bg-church-primary text-white border-church-primary' : 'bg-jkd-bg-sec text-jkd-heading border-jkd-border'}`}
          >
            <ListChecks size={16} /> Formulários
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('help')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${activeTab==='help' ? 'bg-church-primary text-white border-church-primary' : 'bg-jkd-bg-sec text-jkd-heading border-jkd-border'}`}
          >
            <Info size={16} /> Pop-ups & Snippet
          </button>
        </div>

        {activeTab === 'builder' && (
          <div className="mt-6">
            <FormBuilder />
          </div>
        )}

        {activeTab === 'list' && (
          <div className="mt-6">
            <FormList />
          </div>
        )}

        {activeTab === 'help' && (
          <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-4">
            <h2 className="text-xl font-semibold text-jkd-heading">Como usar pop-ups em qualquer página</h2>
            <p className="text-sm text-jkd-text">Cada formulário tem um <strong>ID de Pop-up</strong>. Para abrir um pop-up em qualquer página React do site, use o componente utilitário abaixo:</p>
            <pre className="bg-jkd-bg rounded-lg border border-jkd-border p-3 text-xs overflow-auto"><code>{`import OpenFormButton from '@/components/FonteAdd/OpenFormButton';

// Em qualquer componente do site:
<OpenFormButton popupId="SEU_POPUP_ID" label="Inscrever-se" />`}</code></pre>
            <p className="text-sm text-jkd-text">Se preferir HTML puro (por exemplo dentro de conteúdo renderizado), você pode usar um handler global que adicionaremos em breve: <code>window.FonteAdd.open('SEU_POPUP_ID')</code>.</p>
            <p className="text-xs text-jkd-text">Obs.: Os campos e modelos são adaptados para contexto de igreja: voluntários, membros, ministérios, cursos, líderes. Você pode personalizar no construtor.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FonteAddPage;