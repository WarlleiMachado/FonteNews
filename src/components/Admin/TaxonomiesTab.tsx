import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Tags, FolderTree, AlertTriangle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaxonomyItem, TaxonomyType, listTaxonomies, createTaxonomy, deleteTaxonomy } from '../../services/taxonomyService';

// Hoist child components to avoid remounts that break input focus during typing
const TabButton: React.FC<{id: 'temas'|'topicos'|'tipos'|'prioridades'; icon: React.ReactNode; label: string; count: number; active: boolean; onSelect: (id: 'temas'|'topicos'|'tipos'|'prioridades') => void}> = ({ id, icon, label, count, active, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(id)}
    className={`flex items-center gap-2 px-3 py-2 rounded-md border ${active ? 'border-church-primary bg-church-primary/10 text-church-primary' : 'border-jkd-border hover:bg-jkd-border/30 text-jkd-text'}`}
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-jkd-border/50 text-jkd-heading">{count}</span>
  </button>
);

const Panel: React.FC<{id: 'temas'|'topicos'|'tipos'|'prioridades'; title: string; icon: React.ReactNode; inputValue: string; onInputChange: (v: string) => void; onCreate: () => void; items: TaxonomyItem[]; emptyText: string; expanded: boolean; onToggleExpand: (id: 'temas'|'topicos'|'tipos'|'prioridades') => void; onDeleteItem: (id: string) => void;}> = ({ id, title, icon, inputValue, onInputChange, onCreate, items, emptyText, expanded, onToggleExpand, onDeleteItem }) => (
  <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border">
    <div className="flex items-center justify-between p-6 border-b border-jkd-border">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-jkd-heading">{title}</h2>
      </div>
      <button
        type="button"
        onClick={() => onToggleExpand(id)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-jkd-border hover:bg-jkd-border/30 text-jkd-text"
      >
        <span className="text-sm">{expanded ? 'Ocultar lista' : 'Mostrar lista'}</span>
        <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
    </div>

    <div className="p-6">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder={`Novo ${title.split(' ')[0]}...`}
          className="flex-1 px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-heading placeholder-jkd-text/50 focus:outline-none focus:ring-2 focus:ring-church-primary"
        />
        <button type="button" onClick={onCreate} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-jkd-bg border border-jkd-border hover:bg-jkd-border">
          <Plus size={16} /> Criar
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="divide-y divide-jkd-border overflow-hidden"
          >
            {items.map(item => (
              <li key={item.id} className="flex items-center justify-between py-2">
                <span className="text-jkd-text">{item.name}</span>
                <button type="button" onClick={() => onDeleteItem(item.id)} className="p-1 rounded hover:bg-red-500/10 text-red-500">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
            {items.length === 0 && (
              <li className="py-2 text-sm text-jkd-text/70">{emptyText}</li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  </div>
);

const TaxonomiesTab: React.FC = () => {
  const [temas, setTemas] = useState<TaxonomyItem[]>([]);
  const [topicos, setTopicos] = useState<TaxonomyItem[]>([]);
  const [tipos, setTipos] = useState<TaxonomyItem[]>([]);
  const [prioridades, setPrioridades] = useState<TaxonomyItem[]>([]);
  const [newTema, setNewTema] = useState('');
  const [newTopico, setNewTopico] = useState('');
  const [newTipo, setNewTipo] = useState('');
  const [newPrioridade, setNewPrioridade] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'temas' | 'topicos' | 'tipos' | 'prioridades'>('temas');
  const [expanded, setExpanded] = useState<{[k in 'temas' | 'topicos' | 'tipos' | 'prioridades']: boolean}>({
    temas: true,
    topicos: true,
    tipos: true,
    prioridades: true,
  });

  const refresh = async () => {
    setLoading(true);
    try {
      const [tt, tp, tTipos, tPrioridades] = await Promise.all([
        listTaxonomies('tema'),
        listTaxonomies('topico'),
        listTaxonomies('tipo'),
        listTaxonomies('prioridade')
      ]);
      // Garantir ordenação alfabética na UI
      const sortBR = (arr: TaxonomyItem[]) => [...arr].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
      setTemas(sortBR(tt));
      setTopicos(sortBR(tp));
      setTipos(sortBR(tTipos));
      setPrioridades(sortBR(tPrioridades));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleCreate = async (name: string, type: TaxonomyType) => {
    if (!name.trim()) return;
    await createTaxonomy(name.trim(), type);
    if (type === 'tema') setNewTema('');
    else if (type === 'topico') setNewTopico('');
    else if (type === 'tipo') setNewTipo('');
    else if (type === 'prioridade') setNewPrioridade('');
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteTaxonomy(id);
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton id="temas" icon={<FolderTree size={16} />} label="Temas" count={temas.length} active={activeTab === 'temas'} onSelect={setActiveTab} />
        <TabButton id="topicos" icon={<Tags size={16} />} label="Tópicos" count={topicos.length} active={activeTab === 'topicos'} onSelect={setActiveTab} />
        <TabButton id="tipos" icon={<FolderTree size={16} />} label="Tipos" count={tipos.length} active={activeTab === 'tipos'} onSelect={setActiveTab} />
        <TabButton id="prioridades" icon={<AlertTriangle size={16} />} label="Prioridades" count={prioridades.length} active={activeTab === 'prioridades'} onSelect={setActiveTab} />
      </div>

      {/* Active Panel */}
      {activeTab === 'temas' && (
        <Panel
          id="temas"
          title="Temas (Categorias)"
          icon={<FolderTree size={18} />}
          inputValue={newTema}
          onInputChange={setNewTema}
          onCreate={() => handleCreate(newTema, 'tema')}
          items={temas}
          emptyText="Nenhum tema cadastrado."
          expanded={expanded.temas}
          onToggleExpand={(id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))}
          onDeleteItem={handleDelete}
        />
      )}

      {activeTab === 'topicos' && (
        <Panel
          id="topicos"
          title="Tópicos (Tags)"
          icon={<Tags size={18} />}
          inputValue={newTopico}
          onInputChange={setNewTopico}
          onCreate={() => handleCreate(newTopico, 'topico')}
          items={topicos}
          emptyText="Nenhum tópico cadastrado."
          expanded={expanded.topicos}
          onToggleExpand={(id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))}
          onDeleteItem={handleDelete}
        />
      )}

      {activeTab === 'tipos' && (
        <Panel
          id="tipos"
          title="Tipos de Programação"
          icon={<FolderTree size={18} />}
          inputValue={newTipo}
          onInputChange={setNewTipo}
          onCreate={() => handleCreate(newTipo, 'tipo')}
          items={tipos}
          emptyText="Nenhum tipo cadastrado."
          expanded={expanded.tipos}
          onToggleExpand={(id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))}
          onDeleteItem={handleDelete}
        />
      )}

      {activeTab === 'prioridades' && (
        <Panel
          id="prioridades"
          title="Prioridades"
          icon={<AlertTriangle size={18} />}
          inputValue={newPrioridade}
          onInputChange={setNewPrioridade}
          onCreate={() => handleCreate(newPrioridade, 'prioridade')}
          items={prioridades}
          emptyText="Nenhuma prioridade cadastrada."
          expanded={expanded.prioridades}
          onToggleExpand={(id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))}
          onDeleteItem={handleDelete}
        />
      )}

      {loading && (
        <div className="text-sm text-jkd-text/70">Carregando...</div>
      )}
    </div>
  );
};

export default TaxonomiesTab;