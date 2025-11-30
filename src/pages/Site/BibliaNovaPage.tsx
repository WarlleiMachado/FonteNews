import React, { useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, getDoc, getDocs, collectionGroup } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { getDownloadURL, getBlob, ref as storageRef } from 'firebase/storage';
import { ChevronLeft, ChevronRight, Play as IconPlay, Pause as IconPause, Search as IconSearch, X as IconX } from 'lucide-react';
import BibleShareModal from '../../components/Site/BibleShareModal';

type VerseEntry = {
  chapter: number;
  verse: number;
  text: string;
};

type VersionFile = {
  versionId?: string;
  meta?: any;
  verses?: Record<string, VerseEntry>;
};

type BibleVersion = {
  id?: string;
  name: string;
  abbr: string;
  language?: string;
  active?: boolean;
  default?: boolean;
  storagePath?: string;
};

// Lista canônica de livros (PT-BR) para fallback Firestore
const BOOKS_PT: { id: number; nome: string }[] = [
  { id: 1, nome: 'Gênesis' }, { id: 2, nome: 'Êxodo' }, { id: 3, nome: 'Levítico' }, { id: 4, nome: 'Números' }, { id: 5, nome: 'Deuteronômio' },
  { id: 6, nome: 'Josué' }, { id: 7, nome: 'Juízes' }, { id: 8, nome: 'Rute' }, { id: 9, nome: '1 Samuel' }, { id: 10, nome: '2 Samuel' },
  { id: 11, nome: '1 Reis' }, { id: 12, nome: '2 Reis' }, { id: 13, nome: '1 Crônicas' }, { id: 14, nome: '2 Crônicas' }, { id: 15, nome: 'Esdras' },
  { id: 16, nome: 'Neemias' }, { id: 17, nome: 'Ester' }, { id: 18, nome: 'Jó' }, { id: 19, nome: 'Salmos' }, { id: 20, nome: 'Provérbios' },
  { id: 21, nome: 'Eclesiastes' }, { id: 22, nome: 'Cânticos' }, { id: 23, nome: 'Isaías' }, { id: 24, nome: 'Jeremias' }, { id: 25, nome: 'Lamentações' },
  { id: 26, nome: 'Ezequiel' }, { id: 27, nome: 'Daniel' }, { id: 28, nome: 'Oséias' }, { id: 29, nome: 'Joel' }, { id: 30, nome: 'Amós' },
  { id: 31, nome: 'Obadias' }, { id: 32, nome: 'Jonas' }, { id: 33, nome: 'Miquéias' }, { id: 34, nome: 'Naum' }, { id: 35, nome: 'Habacuque' },
  { id: 36, nome: 'Sofonias' }, { id: 37, nome: 'Ageu' }, { id: 38, nome: 'Zacarias' }, { id: 39, nome: 'Malaquias' },
  { id: 40, nome: 'Mateus' }, { id: 41, nome: 'Marcos' }, { id: 42, nome: 'Lucas' }, { id: 43, nome: 'João' }, { id: 44, nome: 'Atos' },
  { id: 45, nome: 'Romanos' }, { id: 46, nome: '1 Coríntios' }, { id: 47, nome: '2 Coríntios' }, { id: 48, nome: 'Gálatas' }, { id: 49, nome: 'Efésios' },
  { id: 50, nome: 'Filipenses' }, { id: 51, nome: 'Colossenses' }, { id: 52, nome: '1 Tessalonicenses' }, { id: 53, nome: '2 Tessalonicenses' }, { id: 54, nome: '1 Timóteo' },
  { id: 55, nome: '2 Timóteo' }, { id: 56, nome: 'Tito' }, { id: 57, nome: 'Filemom' }, { id: 58, nome: 'Hebreus' }, { id: 59, nome: 'Tiago' },
  { id: 60, nome: '1 Pedro' }, { id: 61, nome: '2 Pedro' }, { id: 62, nome: '1 João' }, { id: 63, nome: '2 João' }, { id: 64, nome: '3 João' },
  { id: 65, nome: 'Judas' }, { id: 66, nome: 'Apocalipse' }
];

// Aliases comuns para nomes de livros em diferentes arquivos JSON
const BOOK_ALIASES: Record<string, string[]> = {
  'Cânticos': ['Cântico dos Cânticos', 'Cantares'],
};

function getBookIdByName(name: string): number {
  const lower = name.toLowerCase();
  const direct = BOOKS_PT.find(b => b.nome.toLowerCase() === lower);
  if (direct) return direct.id;
  // tentar aliases
  for (const b of BOOKS_PT) {
    const aliases = BOOK_ALIASES[b.nome] || [];
    if (aliases.some(a => a.toLowerCase() === lower)) {
      return b.id;
    }
  }
  return 43; // fallback João
}

// Resolve a chave correta de um livro dentro de um JSON de versão
function resolveBookKey(json: any, canonicalName: string): string | null {
  if (!json || typeof json !== 'object') return null;
  const keys = Object.keys(json);
  const lowerCanon = canonicalName.toLowerCase();
  // 1) match direto por nome
  for (const k of keys) {
    if (k.toLowerCase() === lowerCanon) return k;
  }
  // 2) match por alias
  const aliases = BOOK_ALIASES[canonicalName] || [];
  for (const alias of aliases) {
    const la = alias.toLowerCase();
    for (const k of keys) {
      if (k.toLowerCase() === la) return k;
    }
  }
  // 3) match por índice numérico ("22", 22)
  const id = getBookIdByName(canonicalName);
  for (const k of keys) {
    if (k === String(id)) return k;
  }
  return null;
}

function parseId(id: string | number) {
  const v = typeof id === 'string' ? parseInt(id, 10) : id;
  const book = Math.floor(v / 1_000_000);
  const chapter = Math.floor((v % 1_000_000) / 1_000);
  const verse = v % 1_000;
  return { book, chapter, verse };
}

const BibliaNovaPage: React.FC = () => {
  const [verses, setVerses] = useState<VerseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Versão e capítulo
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [chapter, setChapter] = useState<number>(3);
  const [bookId, setBookId] = useState<number>(43);
  const [bookName, setBookName] = useState<string>('João');
  const [availableBooks, setAvailableBooks] = useState<string[]>([]);

  // Estado inteligente de leitura (continuar de onde parou)
  const [canContinue, setCanContinue] = useState<boolean>(false);
  const [lastReading, setLastReading] = useState<{ versionId: string; bookName: string; chapter: number } | null>(null);

  // Cache de JSON por versão para pesquisa avançada
  const [versionJsonById, setVersionJsonById] = useState<Record<string, any>>({});
  const advTimerRef = useRef<number | undefined>(undefined);
  const [advQuery, setAdvQuery] = useState('');
  const [advLoading, setAdvLoading] = useState(false);
  const [advResults, setAdvResults] = useState<Array<{ book: string; chapter: number; verse: number; text: string }>>([]);
  const [advShowFilters, setAdvShowFilters] = useState(false);
  const [advVersionId, setAdvVersionId] = useState<string>('');
  const [advBookName, setAdvBookName] = useState<string>('');
  // Mostrar/ocultar painel de Pesquisa Bíblica via ícone de lupa no topo
  const [showSearchPanel, setShowSearchPanel] = useState<boolean>(false);

  // Voice settings
  const [provider, setProvider] = useState<'browser' | 'system' | 'google' | 'elevenlabs'>('browser');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  // Cloud provider voices (Google/ElevenLabs)
  const [cloudVoices, setCloudVoices] = useState<Array<{ id: string; name: string; info?: string; languageCode?: string }>>([]);
  const [cloudLoading, setCloudLoading] = useState<boolean>(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Persist settings
  useEffect(() => {
    const saved = localStorage.getItem('bibleVoiceSettings');
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        setProvider(obj.provider ?? 'browser');
        setSelectedVoice(obj.selectedVoice ?? '');
        // sliders removidos da UI; manter valores padrão
        setRate(1);
        setPitch(1);
        setVolume(1);
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('bibleVoiceSettings', JSON.stringify({ provider, selectedVoice }));
  }, [provider, selectedVoice, rate, pitch, volume]);

  // Load cloud provider voices when provider changes
  useEffect(() => {
    async function loadCloud() {
      if (provider !== 'google' && provider !== 'elevenlabs') {
        setCloudVoices([]);
        setCloudError(null);
        setCloudLoading(false);
        return;
      }
      setCloudLoading(true);
      setCloudError(null);
      try {
        if (provider === 'google') {
          const key = localStorage.getItem('bible-google-api-key') || '';
          if (!key) {
            setCloudError('Chave da API Google não configurada.');
            setCloudVoices([]);
            return;
          }
          const resp = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${encodeURIComponent(key)}`);
          if (!resp.ok) throw new Error(`Falha ${resp.status}`);
          const data = await resp.json();
          const list: Array<{ id: string; name: string; info?: string; languageCode?: string }> = (data.voices || []).map((v: any) => ({
            id: String(v.name || ''),
            name: String(v.name || ''),
            info: `${(v.languageCodes||[]).join(', ')}${v.ssmlGender ? ` · ${v.ssmlGender}` : ''}`,
            languageCode: Array.isArray(v.languageCodes) && v.languageCodes.length > 0 ? String(v.languageCodes[0]) : undefined,
          }));
          setCloudVoices(list);
          if (!selectedVoice && list.length > 0) setSelectedVoice(list[0].id);
        } else if (provider === 'elevenlabs') {
          const key = localStorage.getItem('bible-elevenlabs-api-key') || '';
          if (!key) {
            setCloudError('Chave da API ElevenLabs não configurada.');
            setCloudVoices([]);
            return;
          }
          const resp = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: { 'xi-api-key': key }
          });
          if (!resp.ok) throw new Error(`Falha ${resp.status}`);
          const data = await resp.json();
          const list: Array<{ id: string; name: string; info?: string; languageCode?: string }> = (data.voices || []).map((v: any) => ({
            id: String(v.voice_id || v.id || v.name || ''),
            name: String(v.name || ''),
            info: v.category ? String(v.category) : ''
          }));
          setCloudVoices(list);
          if (!selectedVoice && list.length > 0) setSelectedVoice(list[0].id);
        }
      } catch (err: any) {
        setCloudError('Não foi possível carregar vozes: ' + (err?.message || String(err)));
        setCloudVoices([]);
      } finally {
        setCloudLoading(false);
      }
    }
    loadCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  // Carregar lista de versões e selecionar padrão
  useEffect(() => {
    async function loadVersions() {
      try {
        const snap = await getDocs(collection(db, 'bibleVersions'));
        const list: BibleVersion[] = [];
        snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
        const active = list.filter(v => v.active);
        const def = active.find(v => v.default) || active[0] || list[0];
        setVersions(list);
        if (def?.id) setSelectedVersionId(def.id);
      } catch (e) {
        console.warn('Falha ao carregar versões, usando NVI padrão.', e);
      }
    }
    loadVersions();
  }, []);

  // Carregar última leitura do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bibleLastReading');
      if (saved) {
        const obj = JSON.parse(saved);
        if (obj?.versionId && obj?.bookName && obj?.chapter) {
          setLastReading({ versionId: obj.versionId, bookName: obj.bookName, chapter: Number(obj.chapter) });
          setCanContinue(true);
        }
      }
    } catch {}
  }, []);

  // Carregar lista de livros quando a versão utiliza JSON no Storage
  useEffect(() => {
    async function loadBooks() {
      const sel = versions.find(v => v.id === selectedVersionId);
      // Se não houver storagePath, usar lista canônica (Firestore fallback)
      if (!sel?.storagePath) {
        const canon = BOOKS_PT.map(b => b.nome);
        setAvailableBooks(canon);
        if (!canon.includes(bookName) && canon.length > 0) {
          setBookName(canon[0]);
        }
        return;
      }
      try {
        // Tenta via Storage
        const fileRef = storageRef(storage, sel.storagePath);
        const blob = await getBlob(fileRef);
        const text = await blob.text();
        const json = JSON.parse(text);
        // Derivar lista canônica de livros disponíveis no JSON
        const canon = BOOKS_PT.filter(b => resolveBookKey(json, b.nome)).map(b => b.nome);
        const out = canon.length > 0 ? canon : Object.keys(json || {}).sort((a,b)=>a.localeCompare(b));
        setAvailableBooks(out);
        if (!out.includes(bookName) && out.length > 0) {
          setBookName(out[0]);
        }
      } catch (err) {
        console.warn('Falha ao carregar via Storage; tentando assets públicos...', err);
        try {
          const resp = await fetch(`/${sel.storagePath}`);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const json = await resp.json();
          const canon = BOOKS_PT.filter(b => resolveBookKey(json, b.nome)).map(b => b.nome);
          const out = canon.length > 0 ? canon : Object.keys(json || {}).sort((a,b)=>a.localeCompare(b));
          setAvailableBooks(out);
          if (!out.includes(bookName) && out.length > 0) {
            setBookName(out[0]);
          }
        } catch (fetchErr) {
          console.warn('Falha ao carregar por assets; usando lista canônica.', fetchErr);
          const canon = BOOKS_PT.map(b => b.nome);
          setAvailableBooks(canon);
          if (!canon.includes(bookName) && canon.length > 0) {
            setBookName(canon[0]);
          }
        }
      }
    }
    if (selectedVersionId) {
      loadBooks();
    }
  }, [versions, selectedVersionId]);

  // Atualiza bookId quando bookName muda (para Firestore fallback)
  useEffect(() => {
    setBookId(getBookIdByName(bookName));
  }, [bookName]);

  // Persistir leitura atual
  useEffect(() => {
    if (!selectedVersionId || !bookName || !chapter) return;
    localStorage.setItem('bibleLastReading', JSON.stringify({ versionId: selectedVersionId, bookName, chapter }));
    setCanContinue(true);
    setLastReading({ versionId: selectedVersionId, bookName, chapter });
  }, [selectedVersionId, bookName, chapter]);

  // Carregar conteúdo do capítulo conforme versão selecionada
  useEffect(() => {
    async function loadChapter() {
      setIsLoading(true);
      setError(null);
      try {
        const sel = versions.find(v => v.id === selectedVersionId);
        // Preferir arquivo JSON no Storage quando disponível
        if (sel?.storagePath) {
          try {
            // Tenta via Firebase Storage
            const fileRef = storageRef(storage, sel.storagePath);
            const blob = await getBlob(fileRef);
            const text = await blob.text();
            const json = JSON.parse(text);
            const bKey = resolveBookKey(json, bookName);
            const chapterObj = bKey ? json?.[bKey]?.[String(chapter)] : null;
            if (!chapterObj || typeof chapterObj !== 'object') {
              throw new Error(`Capítulo não encontrado no JSON: ${bookName} ${chapter}`);
            }
            const out: VerseEntry[] = Object.keys(chapterObj).map(k => ({
              chapter,
              verse: parseInt(k, 10),
              text: chapterObj[k],
            }));
            out.sort((a, b) => a.verse - b.verse);
            setVerses(out);
            return;
          } catch (err) {
            console.warn('Falha ao carregar via Storage JSON. Tentando fallback via fetch de assets do site...', err);
            try {
              // Fallback: tentar carregar do próprio site (dist/public)
              const resp = await fetch(`/${sel.storagePath}`);
              if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
              const json = await resp.json();
              const bKey = resolveBookKey(json, bookName);
              const chapterObj = bKey ? json?.[bKey]?.[String(chapter)] : null;
              if (!chapterObj || typeof chapterObj !== 'object') {
                throw new Error(`Capítulo não encontrado no JSON (assets): ${bookName} ${chapter}`);
              }
              const out: VerseEntry[] = Object.keys(chapterObj).map(k => ({
                chapter,
                verse: parseInt(k, 10),
                text: chapterObj[k],
              }));
              out.sort((a, b) => a.verse - b.verse);
              setVerses(out);
              return;
            } catch (fetchErr) {
              console.warn('Fallback via fetch também falhou, tentando Firestore NVI...', fetchErr);
              // Continua para tentar Firestore abaixo
            }
          }
        }

        // Fallback generalizado para Firestore NVI
        // Mesmo se a versão não for NVI, garantimos que a página não fique em branco
        try {
          const snap = await getDoc(doc(db, 'nvi', String(bookId), 'capitulos', String(chapter)));
          if (!snap.exists()) {
            throw new Error(`Documento não encontrado em Firestore: nvi/${bookId}/capitulos/${chapter}`);
          }
          const data = snap.data() as { versiculos?: Record<string, string> };
          const versMap = data.versiculos || {};
          const out: VerseEntry[] = Object.keys(versMap).map((k) => ({
            chapter,
            verse: parseInt(k, 10),
            text: versMap[k],
          }));
          out.sort((a, b) => a.verse - b.verse);
          setVerses(out);
          return;
        } catch (fsErr) {
          console.warn('Fallback Firestore NVI falhou:', fsErr);
        }

        throw new Error('Versão selecionada sem fonte conhecida (Storage ou NVI Firestore).');
      } catch (e: any) {
        console.error('Erro ao carregar capítulo:', e);
        const code = e?.code || e?.message || 'erro-desconhecido';
        setError(`Não foi possível carregar o conteúdo: ${code}`);
      } finally {
        setIsLoading(false);
      }
    }
    // Só carregar quando houver uma versão selecionada
    if (selectedVersionId) {
      loadChapter();
    }
  }, [versions, selectedVersionId, chapter, bookName]);

  // Função utilitária: carregar JSON completo de uma versão (Storage -> assets)
  async function loadVersionJson(versionId: string): Promise<any | null> {
    if (!versionId) return null;
    if (versionJsonById[versionId]) return versionJsonById[versionId];
    const sel = versions.find(v => v.id === versionId);
    if (!sel?.storagePath) return null;
    // Tentar Storage, depois assets
    try {
      const fileRef = storageRef(storage, sel.storagePath);
      const blob = await getBlob(fileRef);
      const text = await blob.text();
      const json = JSON.parse(text);
      setVersionJsonById(prev => ({ ...prev, [versionId]: json }));
      return json;
    } catch (err) {
      try {
        const resp = await fetch(`/${sel.storagePath}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        setVersionJsonById(prev => ({ ...prev, [versionId]: json }));
        return json;
      } catch {
        return null;
      }
    }
  }

  // Pesquisa Avançada (debounce, resultados até 100)
  useEffect(() => {
    const q = advQuery.trim();
    if (advTimerRef.current) {
      window.clearTimeout(advTimerRef.current);
    }
    if (q.length < 2) {
      setAdvResults([]);
      setAdvLoading(false);
      return;
    }
    advTimerRef.current = window.setTimeout(async () => {
      setAdvLoading(true);
      try {
        const verId = advVersionId || selectedVersionId;
        // Tenta buscar em JSON da versão
        const json = await loadVersionJson(verId);
        const results: Array<{ book: string; chapter: number; verse: number; text: string }> = [];
        const term = q.toLowerCase();
        if (json && typeof json === 'object') {
          const books = Object.keys(json);
          for (const b of books) {
            if (advBookName && advBookName !== b) continue;
            const chaptersObj = json[b] || {};
            const chapterKeys = Object.keys(chaptersObj);
            for (const ck of chapterKeys) {
              const chNum = parseInt(ck, 10);
              const versesObj = chaptersObj[ck] || {};
              const verseKeys = Object.keys(versesObj);
              for (const vk of verseKeys) {
                const vNum = parseInt(vk, 10);
                const text = String(versesObj[vk] || '');
                if (text.toLowerCase().includes(term)) {
                  results.push({ book: b, chapter: chNum, verse: vNum, text });
                  if (results.length >= 100) break;
                }
              }
              if (results.length >= 100) break;
            }
            if (results.length >= 100) break;
          }
          setAdvResults(results);
        } else {
          const verId = advVersionId || selectedVersionId;
          if (verId) {
            // Fallback Firestore para a versão selecionada (usa NVI como base disponível)
            try {
              const cg = await getDocs(collectionGroup(db, 'capitulos'));
              for (const d of cg.docs) {
                const parent = d.ref.parent;
                const grand = parent.parent;
                const bIdStr = grand?.id || '';
                const bId = parseInt(bIdStr, 10);
                const bName = BOOKS_PT.find(b => b.id === bId)?.nome || '';
                if (advBookName && advBookName !== bName) continue;
                const chNum = parseInt(d.id, 10);
                const data: any = d.data() || {};
                const versiculos = data.versiculos || {};
                for (const vk of Object.keys(versiculos)) {
                  const vNum = parseInt(vk, 10);
                  const text = String(versiculos[vk] || '');
                  if (text.toLowerCase().includes(term)) {
                    results.push({ book: bName || '—', chapter: chNum, verse: vNum, text });
                  }
                  if (results.length >= 100) break;
                }
                if (results.length >= 100) break;
              }
              setAdvResults(results);
            } catch (err) {
              console.warn('Fallback Firestore falhou:', err);
              setAdvResults([]);
            }
          } else {
            // Agregar todas as versões ativas com JSON
            try {
              const active = versions.filter(v => v.active);
              for (const v of active) {
                const vjson = await loadVersionJson(v.id || '');
                if (!vjson || typeof vjson !== 'object') continue;
                const books = Object.keys(vjson);
                for (const b of books) {
                  if (advBookName && advBookName !== b) continue;
                  const chaptersObj = vjson[b] || {};
                  for (const ck of Object.keys(chaptersObj)) {
                    const chNum = parseInt(ck, 10);
                    const versesObj = chaptersObj[ck] || {};
                    for (const vk of Object.keys(versesObj)) {
                      const vNum = parseInt(vk, 10);
                      const text = String(versesObj[vk] || '');
                      if (text.toLowerCase().includes(term)) {
                        results.push({ book: b, chapter: chNum, verse: vNum, text });
                      }
                      if (results.length >= 100) break;
                    }
                    if (results.length >= 100) break;
                  }
                  if (results.length >= 100) break;
                }
                if (results.length >= 100) break;
              }
              if (results.length === 0) {
                // Nenhuma versão com JSON: fallback Firestore NVI
                const cg = await getDocs(collectionGroup(db, 'capitulos'));
                for (const d of cg.docs) {
                  const parent = d.ref.parent;
                  const grand = parent.parent;
                  const bIdStr = grand?.id || '';
                  const bId = parseInt(bIdStr, 10);
                  const bName = BOOKS_PT.find(b => b.id === bId)?.nome || '';
                  if (advBookName && advBookName !== bName) continue;
                  const chNum = parseInt(d.id, 10);
                  const data: any = d.data() || {};
                  const versiculos = data.versiculos || {};
                  for (const vk of Object.keys(versiculos)) {
                    const vNum = parseInt(vk, 10);
                    const text = String(versiculos[vk] || '');
                    if (text.toLowerCase().includes(term)) {
                      results.push({ book: bName || '—', chapter: chNum, verse: vNum, text });
                    }
                    if (results.length >= 100) break;
                  }
                  if (results.length >= 100) break;
                }
              }
              setAdvResults(results);
            } catch (err) {
              setAdvResults([]);
            }
          }
        }
      } catch (err) {
        console.warn('Falha na pesquisa avançada:', err);
        setAdvResults([]);
      } finally {
        setAdvLoading(false);
      }
    }, 250);
    return () => {
      if (advTimerRef.current) window.clearTimeout(advTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advQuery, advVersionId, advBookName, selectedVersionId, verses, bookName]);

  // Load browser voices
  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis?.getVoices() || [];
      setVoices(v);
      if (!selectedVoice && v.length > 0) {
        setSelectedVoice(v[0].name);
      }
    }
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, [selectedVoice]);

  const filteredVerses = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return verses;
    return verses.filter(v => v.text.toLowerCase().includes(term));
  }, [verses, search]);

  // ======== Controles de Texto (sem degradê) ========
  const [showTextControls, setShowTextControls] = useState(false);
  const [fontSize, setFontSize] = useState<number>(16);
  const [lineHeight, setLineHeight] = useState<number>(24);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const verseTextStyle = useMemo(() => ({
    fontSize: `${fontSize}px`,
    lineHeight: `${lineHeight}px`,
    fontWeight: isBold ? 600 : 400,
    fontStyle: isItalic ? 'italic' as const : 'normal' as const,
  }), [fontSize, lineHeight, isBold, isItalic]);

  // ======== Seleção de Versículos e Compartilhamento ========
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  function toggleVerseSelect(n: number) {
    setSelectedVerses(prev => prev.includes(n) ? prev.filter(v => v !== n) : [...prev, n].sort((a, b) => a - b));
  }

  // ======== Playback por versículo com destaque ========
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState<number>(0);
  function stopPlayback() {
    setIsPlaying(false);
    setCurrentVerseIndex(0);
    if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
    utteranceRef.current = null;
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {}
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }
  function speakNext() {
    const list = filteredVerses;
    if (currentVerseIndex >= list.length) {
      stopPlayback();
      return;
    }
    const v = list[currentVerseIndex];
    const text = `${v.verse}. ${v.text}`;
    if (provider === 'browser' || provider === 'system') {
      const u = new SpeechSynthesisUtterance(text);
      const voice = voices.find(vv => vv.name === selectedVoice);
      if (voice) u.voice = voice;
      u.rate = Math.min(2, Math.max(0.5, rate));
      u.pitch = Math.min(2, Math.max(0, pitch));
      u.volume = Math.min(1, Math.max(0, volume));
      u.onend = () => setCurrentVerseIndex(i => i + 1);
      u.onerror = () => setCurrentVerseIndex(i => i + 1);
      utteranceRef.current = u;
      window.speechSynthesis?.speak(u);
      return;
    }
    if (provider === 'elevenlabs') {
      const key = localStorage.getItem('bible-elevenlabs-api-key') || '';
      if (!key || !selectedVoice) {
        setCurrentVerseIndex(i => i + 1);
        return;
      }
      fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(selectedVoice)}`, {
        method: 'POST',
        headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' })
      }).then(async (resp) => {
        if (!resp.ok) throw new Error('Falha ao sintetizar áudio');
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setCurrentVerseIndex(i => i + 1);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setCurrentVerseIndex(i => i + 1);
        };
        audioRef.current = audio;
        audio.play();
      }).catch(() => setCurrentVerseIndex(i => i + 1));
      return;
    }
    if (provider === 'google') {
      const key = localStorage.getItem('bible-google-api-key') || '';
      if (!key || !selectedVoice) {
        setCurrentVerseIndex(i => i + 1);
        return;
      }
      const cv = cloudVoices.find(cv => cv.id === selectedVoice);
      const languageCode = cv?.languageCode || 'pt-BR';
      fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { name: selectedVoice, languageCode },
          audioConfig: { audioEncoding: 'MP3' }
        })
      }).then(async (resp) => {
        if (!resp.ok) throw new Error('Falha ao sintetizar áudio');
        const data = await resp.json();
        const audioContent = data?.audioContent;
        if (!audioContent) throw new Error('Resposta sem áudio');
        const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
        audio.onended = () => setCurrentVerseIndex(i => i + 1);
        audio.onerror = () => setCurrentVerseIndex(i => i + 1);
        audioRef.current = audio;
        audio.play();
      }).catch(() => setCurrentVerseIndex(i => i + 1));
      return;
    }
  }
  useEffect(() => {
    if (!isPlaying) return;
    speakNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentVerseIndex]);
  function togglePlayback() {
    if (!isPlaying) {
      setIsPlaying(true);
      setCurrentVerseIndex(0);
    } else {
      stopPlayback();
    }
  }
  function nextChapter() {
    stopPlayback();
    setSelectedVerses([]);
    setChapter(c => c + 1);
  }
  function previousChapter() {
    stopPlayback();
    setSelectedVerses([]);
    setChapter(c => Math.max(1, c - 1));
  }

  function stopSpeaking() {
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    utteranceRef.current = null;
  }

  function speakText(text: string) {
    stopSpeaking();
    if (provider === 'browser' || provider === 'system') {
      const u = new SpeechSynthesisUtterance(text);
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) u.voice = voice;
      u.rate = Math.min(2, Math.max(0.5, rate));
      u.pitch = Math.min(2, Math.max(0, pitch));
      u.volume = Math.min(1, Math.max(0, volume));
      u.onend = () => setIsSpeaking(false);
      utteranceRef.current = u;
      setIsSpeaking(true);
      window.speechSynthesis?.speak(u);
      return;
    }
    if (provider === 'elevenlabs') {
      const key = localStorage.getItem('bible-elevenlabs-api-key') || '';
      if (!key || !selectedVoice) return;
      setIsSpeaking(true);
      fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(selectedVoice)}`, {
        method: 'POST',
        headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' })
      }).then(async (resp) => {
        if (!resp.ok) throw new Error('Falha ao sintetizar áudio');
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audioRef.current = audio;
        audio.play();
      }).catch(() => setIsSpeaking(false));
      return;
    }
    if (provider === 'google') {
      const key = localStorage.getItem('bible-google-api-key') || '';
      if (!key || !selectedVoice) return;
      const cv = cloudVoices.find(v => v.id === selectedVoice);
      const languageCode = cv?.languageCode || 'pt-BR';
      setIsSpeaking(true);
      fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: { text }, voice: { name: selectedVoice, languageCode }, audioConfig: { audioEncoding: 'MP3' } })
      }).then(async (resp) => {
        if (!resp.ok) throw new Error('Falha ao sintetizar áudio');
        const data = await resp.json();
        const audioContent = data?.audioContent;
        if (!audioContent) throw new Error('Resposta sem áudio');
        const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        audioRef.current = audio;
        audio.play();
      }).catch(() => setIsSpeaking(false));
      return;
    }
  }

  function speakChapter() {
    const full = verses.map(v => `${v.verse} ${v.text}`).join('\n');
    speakText(full);
  }
  async function testVoice() {
    const sel = versions.find(v => v.id === selectedVersionId);
    const ab = sel?.abbr || 'NVI';
    const text = `Teste de voz. ${bookName} ${chapter} (${ab}). Configuração aplicada com sucesso.`;
    if (provider === 'browser' || provider === 'system') {
      speakText(text);
      return;
    }
    if (!selectedVoice) {
      alert('Selecione uma voz primeiro.');
      return;
    }
    try {
      if (provider === 'elevenlabs') {
        const key = localStorage.getItem('bible-elevenlabs-api-key') || '';
        if (!key) {
          alert('Chave ElevenLabs não configurada.');
          return;
        }
        const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(selectedVoice)}`, {
          method: 'POST',
          headers: {
            'xi-api-key': key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2'
          })
        });
        if (!resp.ok) throw new Error('Falha ao sintetizar áudio');
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        audio.play();
        return;
      }
      if (provider === 'google') {
        const key = localStorage.getItem('bible-google-api-key') || '';
        if (!key) {
          alert('Chave Google TTS não configurada.');
          return;
        }
        const cv = cloudVoices.find(v => v.id === selectedVoice);
        const languageCode = cv?.languageCode || 'pt-BR';
        const resp = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text },
            voice: { name: selectedVoice, languageCode },
            audioConfig: { audioEncoding: 'MP3' }
          })
        });
        if (!resp.ok) throw new Error('Falha ao sintetizar áudio');
        const data = await resp.json();
        const audioContent = data?.audioContent;
        if (!audioContent) throw new Error('Resposta sem áudio');
        const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
        audio.play();
        return;
      }
    } catch (err: any) {
      alert('Erro ao testar voz: ' + (err?.message || String(err)));
    }
  }

  async function shareSelected() {
    if (selectedVerses.length === 0) return;
    const selected = verses.filter(v => selectedVerses.includes(v.verse));
    const ab = versions.find(v => v.id === selectedVersionId)?.abbr || '';
    const header = `${bookName} ${chapter}${ab ? ` (${ab})` : ''}`;
    const text = `${header}\n\n${selected.map(v => `${v.verse}. ${v.text}`).join('\n')}`;
    try {
      const nav: any = navigator;
      if (nav?.share) {
        await nav.share({ title: header, text });
        return;
      }
    } catch (err) {
      // Falha ou cancelamento do share nativo; continua para copiar
    }
    try {
      await navigator.clipboard.writeText(text);
      setShowCopyToast(true);
      window.setTimeout(() => setShowCopyToast(false), 2000);
    } catch (err) {
      setShowShareModal(true);
    }
  }

  // Modais de seleção de capítulo e versículo
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showVerseModal, setShowVerseModal] = useState(false);
  const [chapterNumbers, setChapterNumbers] = useState<number[]>([]);
  const [verseNumbers, setVerseNumbers] = useState<number[]>([]);
  const [verseCountByChapter, setVerseCountByChapter] = useState<Record<number, number>>({});

  async function openChapterModal(bName: string) {
    setBookName(bName);
    setShowChapterModal(true);
    const json = await loadVersionJson(selectedVersionId);
    const bKey = resolveBookKey(json, bName);
    const chaptersObj = bKey ? json?.[bKey] : null;
    if (chaptersObj) {
      const nums = Object.keys(chaptersObj).map(n => Number(n)).sort((a,b)=>a-b);
      const counts: Record<number, number> = {};
      for (const n of nums) {
        const vmap = chaptersObj[String(n)] || {};
        counts[n] = typeof vmap === 'object' ? Object.keys(vmap).length : 0;
      }
      setVerseCountByChapter(counts);
      setChapterNumbers(nums);
    } else {
      // Fallback: obter capítulos e contagem de versículos via Firestore (NVI)
      try {
        const bId = getBookIdByName(bName);
        const chapCol = collection(db, 'nvi', String(bId), 'capitulos');
        const snap = await getDocs(chapCol);
        const nums: number[] = [];
        const counts: Record<number, number> = {};
        snap.forEach((d) => {
          const n = Number(d.id);
          nums.push(n);
          const data: any = d.data() || {};
          const versMap = data.versiculos || {};
          counts[n] = Object.keys(versMap).length;
        });
        nums.sort((a,b)=>a-b);
        setVerseCountByChapter(counts);
        setChapterNumbers(nums);
      } catch (e) {
        // Sem fallback arbitrário; mantém vazio para evitar contagem incorreta
        setVerseCountByChapter({});
        setChapterNumbers([]);
      }
    }
  }
  async function selectChapterAndOpenVerses(n: number) {
    setChapter(n);
    setShowChapterModal(false);
    const json = await loadVersionJson(selectedVersionId);
    const bKey = resolveBookKey(json, bookName);
    const vmap = bKey ? json?.[bKey]?.[String(n)] : null;
    if (vmap) {
      const nums = Object.keys(vmap).map(k=>Number(k)).sort((a,b)=>a-b);
      setVerseNumbers(nums);
    } else {
      // Fallback: obter contagem de versículos no Firestore (NVI)
      try {
        const bId = getBookIdByName(bookName);
        const snap = await getDoc(doc(db, 'nvi', String(bId), 'capitulos', String(n)));
        if (snap.exists()) {
          const data: any = snap.data() || {};
          const versiculos = data.versiculos || {};
          const nums = Object.keys(versiculos).map(k=>Number(k)).sort((a,b)=>a-b);
          setVerseNumbers(nums);
        } else {
          setVerseNumbers([]);
        }
      } catch (e) {
        setVerseNumbers([]);
      }
    }
    setShowVerseModal(true);
  }
  function chooseVerse(vn: number) {
    setShowVerseModal(false);
    // Seleciona automaticamente o versículo escolhido, mantendo seleção existente
    setSelectedVerses(prev => (prev.includes(vn) ? prev : [...prev, vn].sort((a,b)=>a-b)));
    const el = document.querySelector(`[data-verse="${vn}"]`);
    if (el && 'scrollIntoView' in el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="min-h-screen bg-jkd-bg-sec">
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna esquerda: controles */}
          <div className="space-y-6">

        {/* Escolha o que ler */}
        <div className="bg-jkd-bg rounded-lg border border-jkd-border p-4 mb-6">
          <h2 className="text-lg font-semibold text-jkd-heading mb-3">Bíblia</h2>
          <div className="mb-3">
            <label className="block text-sm font-medium text-jkd-heading mb-1">Versão</label>
            <select value={selectedVersionId} onChange={e=>setSelectedVersionId(e.target.value)} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text">
              <option value="" disabled>Selecione uma versão</option>
              {versions.filter(v=>v.active).map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.abbr})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-jkd-heading mb-1">Livro</label>
            <select value={bookName} onChange={e=>openChapterModal(e.target.value)} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text">
              <option value="" disabled>Selecione um livro</option>
              {(availableBooks.length > 0 ? availableBooks : BOOKS_PT.map(b=>b.nome)).map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Assistente */}
        <div className="bg-jkd-bg rounded-lg border border-jkd-border p-4 mb-6">
          <h2 className="text-lg font-semibold text-jkd-heading mb-3">Assistente</h2>
          <div className="mb-3">
            <label className="block text-sm font-medium text-jkd-heading mb-1">Seleção de Voz</label>
            <select
              value={provider}
              onChange={(e)=>setProvider(e.target.value as 'browser'|'system'|'google'|'elevenlabs')}
              className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text"
            >
              <option value="browser">Navegador</option>
              <option value="system">Sistema</option>
              <option value="google">Google</option>
              <option value="elevenlabs">ElevenLabs</option>
            </select>
          </div>

          {(provider === 'browser' || provider === 'system') && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">Voz ({provider === 'system' ? 'Sistema' : 'Navegador'})</label>
                <select value={selectedVoice} onChange={e=>setSelectedVoice(e.target.value)} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text">
                  {voices.map(v => (
                    <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={testVoice} className="px-3 py-2 border border-jkd-border bg-jkd-bg text-jkd-heading rounded-lg">Testar Voz</button>
            </div>
          )}
          {provider !== 'browser' && (
            <div className="space-y-3">
              {cloudLoading && (
                <div className="text-sm text-jkd-text">Carregando vozes…</div>
              )}
              {!cloudLoading && cloudError && (
                <div className="text-sm text-jkd-text">{cloudError}</div>
              )}
              {!cloudLoading && !cloudError && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-jkd-heading mb-1">Voz ({provider === 'google' ? 'Google' : 'ElevenLabs'})</label>
                    <select value={selectedVoice} onChange={e=>setSelectedVoice(e.target.value)} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text">
                      {cloudVoices.length === 0 && (
                        <option value="" disabled>Nenhuma voz disponível</option>
                      )}
                      {cloudVoices.map(v => (
                        <option key={v.id} value={v.id}>{v.name}{v.info ? ` (${v.info})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={testVoice} className="px-3 py-2 border border-jkd-border bg-jkd-bg text-jkd-heading rounded-lg">Testar Voz</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pesquisa Bíblica (unificada) como pop-up flutuante */}
        {showSearchPanel && (
          <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/40" onClick={() => setShowSearchPanel(false)}>
            <div className="mt-10 w-full max-w-3xl mx-4 bg-jkd-bg rounded-lg border border-jkd-border p-4" onClick={(e)=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-jkd-heading">Pesquisa Bíblica</h2>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setAdvShowFilters(v => !v)} className="px-3 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded-lg">
                    {advShowFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                  </button>
                  <button type="button" onClick={() => setShowSearchPanel(false)} aria-label="Fechar" className="w-8 h-8 rounded-full border border-jkd-border bg-jkd-bg text-jkd-heading flex items-center justify-center">✕</button>
                </div>
              </div>
              {advShowFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-jkd-heading mb-1">Versão</label>
                    <select value={advVersionId} onChange={e=>setAdvVersionId(e.target.value)} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text">
                      <option value="">Todas</option>
                      {versions.filter(v=>v.active).map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.abbr})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-jkd-heading mb-1">Livro</label>
                    <select value={advBookName} onChange={e=>setAdvBookName(e.target.value)} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text">
                      <option value="">Todos</option>
                      {(availableBooks.length > 0 ? availableBooks : BOOKS_PT.map(b=>b.nome)).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div>
                <input value={advQuery} onChange={e=>setAdvQuery(e.target.value)} placeholder="Digite palavras-chave para pesquisar..." className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
              </div>
              <div className="mt-3 max-h-[60vh] overflow-auto">
                {advLoading ? (
                  <div className="text-jkd-text">Pesquisando...</div>
                ) : advResults.length > 0 ? (
                  <div className="space-y-2">
                    {advResults.map((r, idx) => (
                      <div key={`${r.book}-${r.chapter}-${r.verse}-${idx}`} className="bg-jkd-bg rounded-lg border border-jkd-border p-3">
                        <div className="text-sm text-jkd-heading mb-1">{r.book} {r.chapter}:{r.verse}</div>
                        <div className="text-jkd-text">{r.text}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-jkd-text">Nenhum resultado para a consulta atual.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Controles de Texto */}
        {showTextControls && (
          <div className="bg-jkd-bg rounded-lg border border-jkd-border p-4">
            <h2 className="text-lg font-semibold text-jkd-heading mb-3">Controles de Texto</h2>
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">Tamanho</label>
                <div className="flex gap-2">
                  <button className="px-3 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded-lg" onClick={()=>setFontSize(s=>Math.max(12, s-1))}>A-</button>
                  <button className="px-3 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded-lg" onClick={()=>setFontSize(s=>Math.min(28, s+1))}>A+</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">Espaçamento</label>
                <div className="flex gap-2">
                  <button className="px-3 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded-lg" onClick={()=>setLineHeight(l=>Math.max(18, l-2))}>-</button>
                  <button className="px-3 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded-lg" onClick={()=>setLineHeight(l=>Math.min(36, l+2))}>+</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">Estilo</label>
                <div className="flex gap-2">
                  <button className={`px-3 py-2 border rounded-lg ${isBold ? 'bg-church-primary text-white border-church-primary' : 'bg-jkd-bg text-jkd-heading border-jkd-border'}`} onClick={()=>setIsBold(b=>!b)}>Negrito</button>
                  <button className={`px-3 py-2 border rounded-lg ${isItalic ? 'bg-church-primary text-white border-church-primary' : 'bg-jkd-bg text-jkd-heading border-jkd-border'}`} onClick={()=>setIsItalic(i=>!i)}>Itálico</button>
                </div>
              </div>
            </div>
          </div>
        )}
          </div>

          {/* Coluna direita: texto da Bíblia */}
          <div className="lg:col-span-2">
            {/* Cabeçalho de texto: anterior, título central, próximo; com play/pause e pesquisa à direita */}
            <div className="relative mb-4">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center w-full pr-20">
                <div className="justify-self-start">
                  <button type="button" onClick={previousChapter} aria-label="Anterior" className="w-8 h-8 rounded-full border border-church-primary bg-church-primary text-white flex items-center justify-center">
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="justify-self-center text-center text-jkd-heading font-bold text-base px-2 whitespace-nowrap overflow-hidden text-ellipsis">
                  {bookName} {chapter}
                </div>
                <div className="justify-self-end">
                  <button type="button" onClick={nextChapter} aria-label="Próximo" className="w-8 h-8 rounded-full border border-church-primary bg-church-primary text-white flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              <div className="absolute right-0 top-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlayback}
                  aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                  className={`w-8 h-8 rounded-full border border-church-primary bg-church-primary text-white flex items-center justify-center`}
                >
                  {isPlaying ? (
                    <IconPause className="w-4 h-4 text-white" />
                  ) : (
                    <IconPlay className="w-4 h-4 text-white" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSearchPanel(v => !v)}
                  aria-label="Pesquisar"
                  className="w-8 h-8 rounded-full border border-church-primary bg-church-primary text-white flex items-center justify-center"
                >
                  <IconSearch className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Botão flutuante de compartilhar quando há seleção */}
            {selectedVerses.length > 0 && (
              <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
                <button
                  type="button"
                  onClick={shareSelected}
                  aria-label="Compartilhar seleção"
                  className="px-4 py-2 rounded-full shadow-lg bg-church-primary text-white hover:bg-church-primary/90"
                >
                  Compartilhar ({selectedVerses.length})
                </button>
                <button
                  type="button"
                  aria-label="Limpar seleção"
                  className="w-8 h-8 rounded-full border border-jkd-border bg-jkd-bg text-jkd-heading flex items-center justify-center"
                  onClick={() => { setSelectedVerses([]); setShowShareModal(false); }}
                  title="Desmarcar selecionados"
                >
                  <IconX className="w-4 h-4 text-jkd-heading" />
                </button>
              </div>
            )}

            {showCopyToast && (
              <div className="fixed top-16 right-4 z-50 px-4 py-2 rounded-lg shadow-lg bg-green-600 text-white">
                Copiado para a área de transferência
              </div>
            )}

            {isLoading && (
              <div className="text-jkd-text">Carregando...</div>
            )}
        {error && (
          <div className="text-red-600">{error}</div>
        )}

        {!isLoading && !error && (
          <div className="space-y-3">
            {verses.length > 0 ? (
              verses.map(v => {
                const isSelected = selectedVerses.includes(v.verse);
                const isCurrent = isPlaying && (verses[currentVerseIndex]?.verse === v.verse);
                return (
                  <div
                    key={v.verse}
                    data-verse={v.verse}
                    className={`group flex items-start space-x-3 p-3 rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-church-primary/10 border-2 border-church-primary'
                        : isCurrent
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-300'
                        : 'hover:bg-jkd-bg border-2 border-transparent'
                    }`}
                    onClick={() => toggleVerseSelect(v.verse)}
                  >
                    <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isSelected
                        ? 'bg-church-primary text-white'
                        : isCurrent
                        ? 'bg-yellow-600 text-white'
                        : 'bg-church-primary/10 text-jkd-text'
                    }`}>
                      {v.verse}
                    </span>
                    <p className="flex-1 text-jkd-text leading-relaxed" style={verseTextStyle}>
                      {v.text}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="text-jkd-text">Nenhum versículo encontrado para {bookName} {chapter} nesta versão.</div>
            )}
          </div>
        )}

        {/* Navegação no final do texto */}
        <div className="mt-6 flex items-center justify-between">
          <button type="button" onClick={previousChapter} className="px-4 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded-lg">Anterior</button>
          <button type="button" onClick={nextChapter} className="px-4 py-2 bg-church-primary text-white rounded-lg">Próximo</button>
        </div>
          </div>
        </div>

        {/* Controles de Texto */}
        {showTextControls && (
          <div className="bg-jkd-bg rounded-lg border border-jkd-border p-4 mt-6">
            <h2 className="text-lg font-semibold text-jkd-heading mb-3">Controles de Texto</h2>
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">Tamanho</label>
                <div className="flex gap-2">
                  <button className="px-3 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded-lg" onClick={()=>setFontSize(s=>Math.max(12, s-1))}>A-</button>
                  <button className="px-3 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded-lg" onClick={()=>setFontSize(s=>Math.min(28, s+1))}>A+</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">Espaçamento</label>
                <div className="flex gap-2">
                  <button className="px-3 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded-lg" onClick={()=>setLineHeight(l=>Math.max(18, l-2))}>-</button>
                  <button className="px-3 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded-lg" onClick={()=>setLineHeight(l=>Math.min(36, l+2))}>+</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">Estilo</label>
                <div className="flex gap-2">
                  <button className={`px-3 py-2 border rounded-lg ${isBold ? 'bg-church-primary text-white border-church-primary' : 'bg-jkd-bg text-jkd-heading border-jkd-border'}`} onClick={()=>setIsBold(b=>!b)}>Negrito</button>
                  <button className={`px-3 py-2 border rounded-lg ${isItalic ? 'bg-church-primary text-white border-church-primary' : 'bg-jkd-bg text-jkd-heading border-jkd-border'}`} onClick={()=>setIsItalic(i=>!i)}>Itálico</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Compartilhamento */}
        {showShareModal && (
          <BibleShareModal
            verses={verses.filter(v => selectedVerses.includes(v.verse))}
            bookName={bookName}
            chapter={chapter}
            versionAbbr={versions.find(v=>v.id===selectedVersionId)?.abbr || ''}
            onClose={() => setShowShareModal(false)}
          />
        )}

        {/* Modal: Seleção de Capítulo */}
        {showChapterModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={()=>setShowChapterModal(false)} />
            <div className="relative bg-jkd-bg rounded-lg border border-jkd-border w-full max-w-lg mx-4 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-jkd-heading">Selecionar Capítulo</h3>
                <button onClick={()=>setShowChapterModal(false)} className="px-3 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded-lg">Fechar</button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {chapterNumbers.map(n => (
                  <button
                    key={n}
                    onClick={()=>selectChapterAndOpenVerses(n)}
                    className="px-2 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded hover:bg-jkd-bg-sec flex flex-col items-center"
                    aria-label={`Capítulo ${n} (${verseCountByChapter[n] ?? 0} versículos)`}
                  >
                    <span className="text-sm font-semibold">{n}</span>
                    <span className="text-xs text-jkd-text">{(verseCountByChapter[n] ?? 0)} versículos</span>
                  </button>
                ))}
                {chapterNumbers.length === 0 && (
                  <div className="col-span-4 text-sm text-jkd-text">Capítulos indisponíveis para esta versão.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Seleção de Versículo */}
        {showVerseModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={()=>setShowVerseModal(false)} />
            <div className="relative bg-jkd-bg rounded-lg border border-jkd-border w-full max-w-lg mx-4 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-jkd-heading">Selecionar Versículo</h3>
                <button onClick={()=>setShowVerseModal(false)} className="px-3 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded-lg">Fechar</button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {(verseNumbers.length > 0 ? verseNumbers : verses.map(v=>v.verse)).map(n => (
                  <button key={n} onClick={()=>chooseVerse(n)} className="px-2 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded hover:bg-jkd-bg-sec">{n}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BibliaNovaPage;