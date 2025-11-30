import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { motifLabel, motifValues } from '../../utils/motifs';

const PrayerFilters: React.FC = () => {
  const [motifs, setMotifs] = useState<string[]>(['todos']);
  const [selected, setSelected] = useState('todos');
  const [search, setSearch] = useState('');
  const [dateFilterType, setDateFilterType] = useState<'none' | 'day' | 'year'>('none');
  const [dateFilterValue, setDateFilterValue] = useState('');

  useEffect(() => {
    const loadMotifs = async () => {
      const snap = await getDocs(collection(db, 'prayers'));
      const mset = new Set<string>(motifValues());
      snap.forEach(d => { const m = (d.data() as any).motif; if (m) mset.add(m); });
      setMotifs(['todos', ...Array.from(mset)]);
    };
    loadMotifs();
  }, []);

  useEffect(() => {
    const ev = new CustomEvent('prayers:filters', { detail: { motif: selected, search, dateFilterType, dateFilterValue } });
    window.dispatchEvent(ev);
  }, [selected, search, dateFilterType, dateFilterValue]);

  return (
    <div className="bg-jkd-bg-sec border border-jkd-border rounded-lg p-3 flex flex-col sm:flex-row gap-3">
      <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full sm:w-48 px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text">
        {motifs.map(m => (
          <option key={m} value={m}>{m === 'todos' ? 'Todos' : motifLabel(m)}</option>
        ))}
      </select>
      <input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text" placeholder="Buscar por nome" />
      <select value={dateFilterType} onChange={(e)=>{ setDateFilterType(e.target.value as any); setDateFilterValue(''); }} className="w-full sm:w-44 px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text">
        <option value="none">S/ filtro de data</option>
        <option value="day">Por dia</option>
        <option value="year">Por ano</option>
      </select>
      {dateFilterType === 'day' && (
        <input type="date" value={dateFilterValue} onChange={(e)=>setDateFilterValue(e.target.value)} className="w-full sm:w-44 px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text" />
      )}
      {dateFilterType === 'year' && (
        <input type="number" min={1990} max={2100} value={dateFilterValue} onChange={(e)=>setDateFilterValue(e.target.value)} placeholder="AAAA" className="w-full sm:w-28 px-3 py-2 rounded-md border border-jkd-border bg-jkd-bg text-jkd-text" />
      )}
    </div>
  );
};

export default PrayerFilters;