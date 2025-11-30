import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { useToast } from '../../contexts/ToastContext';
import { Save, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface CultoBlocoImage {
  imageUrl?: string;
  imageStoragePath?: string;
  weekOfMonth?: '1'|'2'|'3'|'4'|'last';
}

interface CultoBlocoSettingsBlock {
  dayOfWeek: number | null; // 0=Domingo ... 6=Sábado
  imageUrl?: string;
  imageStoragePath?: string;
  images?: CultoBlocoImage[];
  rotationMinutes?: number;
}

interface CultoBlocosSettings {
  blocks: CultoBlocoSettingsBlock[];
  containerHeightDesktop?: number;
  containerHeightMobile?: number;
  contentHeightDesktop?: number;
  contentHeightMobile?: number;
  contentPaddingBottomDesktop?: number;
  contentPaddingBottomMobile?: number;
  clampTitleMobile?: boolean;
  updatedAt?: any;
}

const defaultSettings: CultoBlocosSettings = {
  blocks: [
    { dayOfWeek: null, imageUrl: '', imageStoragePath: '', images: [], rotationMinutes: 0 },
    { dayOfWeek: null, imageUrl: '', imageStoragePath: '', images: [], rotationMinutes: 0 },
    { dayOfWeek: null, imageUrl: '', imageStoragePath: '', images: [], rotationMinutes: 0 },
    { dayOfWeek: null, imageUrl: '', imageStoragePath: '', images: [], rotationMinutes: 0 },
    { dayOfWeek: null, imageUrl: '', imageStoragePath: '', images: [], rotationMinutes: 0 },
  ],
  containerHeightDesktop: 400,
  containerHeightMobile: 400,
  contentHeightDesktop: 140,
  contentHeightMobile: 120,
  contentPaddingBottomDesktop: 24,
  contentPaddingBottomMobile: 16,
  clampTitleMobile: false,
};

const weekDays = [
  { label: 'Domingo', value: 0 },
  { label: 'Segunda-feira', value: 1 },
  { label: 'Terça-feira', value: 2 },
  { label: 'Quarta-feira', value: 3 },
  { label: 'Quinta-feira', value: 4 },
  { label: 'Sexta-feira', value: 5 },
  { label: 'Sábado', value: 6 },
];

const CultoBlocosSettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<CultoBlocosSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const ref = doc(db, 'culto_blocos_settings', 'default');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as any;
          const blocks = Array.isArray(data.blocks) ? data.blocks : defaultSettings.blocks;
          const normalized = blocks.map((b: any) => {
            const images: CultoBlocoImage[] = Array.isArray(b?.images)
              ? b.images.map((im: any) => ({
                  imageUrl: typeof im?.imageUrl === 'string' ? im.imageUrl : '',
                  imageStoragePath: typeof im?.imageStoragePath === 'string' ? im.imageStoragePath : '',
                  weekOfMonth: (im?.weekOfMonth === 'last' || ['1','2','3','4','5'].includes(String(im?.weekOfMonth))) ? (im.weekOfMonth === '5' ? 'last' : im.weekOfMonth) : undefined,
                }))
              : (typeof b?.imageUrl === 'string' && b.imageUrl
                  ? [{ imageUrl: b.imageUrl, imageStoragePath: typeof b?.imageStoragePath === 'string' ? b.imageStoragePath : '', weekOfMonth: undefined }]
                  : []);
            return {
              dayOfWeek: typeof b.dayOfWeek === 'number' ? b.dayOfWeek : null,
              imageUrl: typeof b.imageUrl === 'string' ? b.imageUrl : '',
              imageStoragePath: typeof b.imageStoragePath === 'string' ? b.imageStoragePath : '',
              images,
              rotationMinutes: Number(b?.rotationMinutes ?? 0) || 0,
            } as CultoBlocoSettingsBlock;
          });
          const padded = [...normalized];
          while (padded.length < 5) padded.push({ dayOfWeek: null, imageUrl: '', imageStoragePath: '', images: [], rotationMinutes: 0 });
          const containerHeightDesktop = Number(data.containerHeightDesktop ?? data.desktopHeight ?? 400) || 400;
          const containerHeightMobile = Number(data.containerHeightMobile ?? data.mobileHeight ?? containerHeightDesktop) || containerHeightDesktop;
          const contentHeightDesktop = Number(data.contentHeightDesktop ?? 140) || 140;
          const contentHeightMobile = Number(data.contentHeightMobile ?? contentHeightDesktop) || contentHeightDesktop;
          const contentPaddingBottomDesktop = Number(data.contentPaddingBottomDesktop ?? 24) || 24;
          const contentPaddingBottomMobile = Number(data.contentPaddingBottomMobile ?? 16) || 16;
          const clampTitleMobile = Boolean(data.clampTitleMobile ?? false);
          setSettings({
            blocks: padded,
            containerHeightDesktop,
            containerHeightMobile,
            contentHeightDesktop,
            contentHeightMobile,
            contentPaddingBottomDesktop,
            contentPaddingBottomMobile,
            clampTitleMobile,
            updatedAt: data.updatedAt || null,
          });
        }
      } catch (err) {
        console.error('Erro ao carregar configurações de Culto-Blocos', err);
        showToast('error', 'Erro ao carregar configurações.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const ref = doc(db, 'culto_blocos_settings', 'default');
      const payload: CultoBlocosSettings = {
        blocks: settings.blocks.map(b => ({
          dayOfWeek: typeof b.dayOfWeek === 'number' ? b.dayOfWeek : null,
          imageUrl: (b.imageUrl || '').trim(),
          imageStoragePath: (b.imageStoragePath || '').trim(),
          images: Array.isArray(b.images) ? b.images.map(im => ({
            imageUrl: (im.imageUrl || '').trim(),
            imageStoragePath: (im.imageStoragePath || '').trim(),
            weekOfMonth: im.weekOfMonth ?? undefined,
          })) : [],
          rotationMinutes: Number(b.rotationMinutes ?? 0) || 0,
        })),
        containerHeightDesktop: Number(settings.containerHeightDesktop) || 400,
        containerHeightMobile: Number(settings.containerHeightMobile) || Number(settings.containerHeightDesktop) || 400,
        contentHeightDesktop: Number(settings.contentHeightDesktop) || 140,
        contentHeightMobile: Number(settings.contentHeightMobile) || Number(settings.contentHeightDesktop) || 140,
        contentPaddingBottomDesktop: Number(settings.contentPaddingBottomDesktop) || 24,
        contentPaddingBottomMobile: Number(settings.contentPaddingBottomMobile) || 16,
        clampTitleMobile: Boolean(settings.clampTitleMobile),
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, payload, { merge: true });
      showToast('success', 'Configurações salvas!');
    } catch (err: any) {
      console.error('Erro ao salvar configurações de Culto-Blocos', err);
      const msg = err?.message ? `Falha ao salvar: ${err.message}` : 'Falha ao salvar configurações';
      showToast('error', msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(blockIndex: number, file: File) {
    setUploadingIndex(blockIndex);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const path = `images/cultos/blocos/block_${blockIndex + 1}/${Date.now()}_${safeName}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);

      // Remover anterior se existir e for de storage
      const prevPath = settings.blocks[blockIndex].imageStoragePath;
      if (prevPath && prevPath.length > 0 && prevPath !== path) {
        try { await deleteObject(storageRef(storage, prevPath)); } catch {}
      }

      setSettings(prev => {
        const blocks = [...prev.blocks];
        blocks[blockIndex] = { ...blocks[blockIndex], imageUrl: url, imageStoragePath: path };
        return { ...prev, blocks };
      });
      showToast('success', `Imagem do Bloco ${blockIndex + 1} atualizada.`);
    } catch (err: any) {
      console.error('Falha no upload da imagem do bloco', err);
      const msg = err?.message ? `Falha no upload: ${err.message}` : 'Falha no upload';
      showToast('error', msg);
    } finally {
      setUploadingIndex(null);
    }
  }

  async function handleUploadPerImage(blockIndex: number, imageIndex: number, file: File) {
    setUploadingIndex(blockIndex * 100 + imageIndex);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const path = `images/cultos/blocos/block_${blockIndex + 1}/img_${imageIndex + 1}/${Date.now()}_${safeName}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);

      const prevPath = settings.blocks[blockIndex]?.images?.[imageIndex]?.imageStoragePath;
      if (prevPath && prevPath.length > 0 && prevPath !== path) {
        try { await deleteObject(storageRef(storage, prevPath)); } catch {}
      }

      setSettings(prev => {
        const blocks = [...prev.blocks];
        const imgs = [...(blocks[blockIndex].images ?? [])];
        imgs[imageIndex] = { ...imgs[imageIndex], imageUrl: url, imageStoragePath: path };
        blocks[blockIndex] = { ...blocks[blockIndex], images: imgs };
        return { ...prev, blocks };
      });
      showToast('success', `Imagem ${imageIndex + 1} do Bloco ${blockIndex + 1} atualizada.`);
    } catch (err: any) {
      console.error('Falha no upload da imagem do bloco', err);
      const msg = err?.message ? `Falha no upload: ${err.message}` : 'Falha no upload';
      showToast('error', msg);
    } finally {
      setUploadingIndex(null);
    }
  }

  const canSubmit = useMemo(() => !saving, [saving]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Culto-Blocos — Configurações</h1>
      <p className="text-sm text-jkd-text mb-6">Defina o dia da semana para cada bloco e atribua uma imagem de largura total (por upload ou URL). A linha divisória entre blocos usa a cor do tema automaticamente.</p>

      <form onSubmit={handleSave} className="bg-jkd-bg-sec border border-jkd-border rounded-lg p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-jkd-border p-4 bg-jkd-bg">
            <label className="block text-sm font-medium text-jkd-heading mb-1">Altura dos blocos (Desktop, px)</label>
            <input
              type="number"
              min={200}
              max={1200}
              className="w-full px-3 py-2 rounded border border-jkd-border bg-transparent text-jkd-text"
              value={settings.containerHeightDesktop ?? 400}
              onChange={e => setSettings(prev => ({ ...prev, containerHeightDesktop: Number(e.target.value) }))}
            />
            <p className="mt-1 text-xs text-jkd-text">Afeta contêiner, blocos e linhas divisórias.</p>
          </div>
          <div className="rounded-lg border border-jkd-border p-4 bg-jkd-bg">
            <label className="block text-sm font-medium text-jkd-heading mb-1">Altura dos blocos (Mobile, px)</label>
            <input
              type="number"
              min={200}
              max={1200}
              className="w-full px-3 py-2 rounded border border-jkd-border bg-transparent text-jkd-text"
              value={settings.containerHeightMobile ?? settings.containerHeightDesktop ?? 400}
              onChange={e => setSettings(prev => ({ ...prev, containerHeightMobile: Number(e.target.value) }))}
            />
            <p className="mt-1 text-xs text-jkd-text">Aplicado em telas pequenas.</p>
          </div>
          <div className="rounded-lg border border-jkd-border p-4 bg-jkd-bg">
            <label className="block text-sm font-medium text-jkd-heading mb-1">Altura do conteúdo (Desktop, px)</label>
            <input
              type="number"
              min={60}
              max={800}
              className="w-full px-3 py-2 rounded border border-jkd-border bg-transparent text-jkd-text"
              value={settings.contentHeightDesktop ?? 140}
              onChange={e => setSettings(prev => ({ ...prev, contentHeightDesktop: Number(e.target.value) }))}
            />
            <p className="mt-1 text-xs text-jkd-text">Altura mínima reservada para textos; alinhado ao rodapé por padrão.</p>
          </div>
          <div className="rounded-lg border border-jkd-border p-4 bg-jkd-bg">
            <label className="block text-sm font-medium text-jkd-heading mb-1">Altura do conteúdo (Mobile, px)</label>
            <input
              type="number"
              min={60}
              max={800}
              className="w-full px-3 py-2 rounded border border-jkd-border bg-transparent text-jkd-text"
              value={settings.contentHeightMobile ?? settings.contentHeightDesktop ?? 140}
              onChange={e => setSettings(prev => ({ ...prev, contentHeightMobile: Number(e.target.value) }))}
            />
            <p className="mt-1 text-xs text-jkd-text">Aplicado em telas pequenas; texto pode subir quando for extenso.</p>
          </div>

          <div className="rounded-lg border border-jkd-border p-4 bg-jkd-bg">
            <label className="block text-sm font-medium text-jkd-heading mb-1">Respiro inferior do conteúdo (Desktop, px)</label>
            <input
              type="number"
              min={0}
              max={160}
              className="w-full px-3 py-2 rounded border border-jkd-border bg-transparent text-jkd-text"
              value={settings.contentPaddingBottomDesktop ?? 24}
              onChange={e => setSettings(prev => ({ ...prev, contentPaddingBottomDesktop: Number(e.target.value) }))}
            />
            <p className="mt-1 text-xs text-jkd-text">Espaço abaixo do texto no desktop. Padrão 24px (pb-6).</p>
          </div>

          <div className="rounded-lg border border-jkd-border p-4 bg-jkd-bg">
            <label className="block text-sm font-medium text-jkd-heading mb-1">Respiro inferior do conteúdo (Mobile, px)</label>
            <input
              type="number"
              min={0}
              max={160}
              className="w-full px-3 py-2 rounded border border-jkd-border bg-transparent text-jkd-text"
              value={settings.contentPaddingBottomMobile ?? 16}
              onChange={e => setSettings(prev => ({ ...prev, contentPaddingBottomMobile: Number(e.target.value) }))}
            />
            <p className="mt-1 text-xs text-jkd-text">Espaço abaixo do texto em telas pequenas. Padrão 16px (pb-4).</p>
          </div>

          <div className="rounded-lg border border-jkd-border p-4 bg-jkd-bg">
            <label className="block text-sm font-medium text-jkd-heading mb-1">Limitar título a duas linhas no mobile</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(settings.clampTitleMobile)}
                onChange={e => setSettings(prev => ({ ...prev, clampTitleMobile: e.target.checked }))}
              />
              <span className="text-xs text-jkd-text">Aplica truncamento com duas linhas (line-clamp).</span>
            </div>
          </div>
        </div>
        {settings.blocks.map((block, idx) => (
          <div key={idx} className="rounded-lg border border-jkd-border p-4 bg-jkd-bg">
            <h2 className="text-lg font-semibold text-jkd-heading mb-3">Bloco {idx + 1}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">Dia da Semana</label>
                <select
                  className="w-full px-3 py-2 rounded border border-jkd-border bg-transparent text-jkd-text"
                  value={block.dayOfWeek ?? ''}
                  onChange={e => {
                    const value = e.target.value === '' ? null : Number(e.target.value);
                    setSettings(prev => {
                      const blocks = [...prev.blocks];
                      blocks[idx] = { ...blocks[idx], dayOfWeek: value };
                      return { ...prev, blocks };
                    });
                  }}
                >
                  <option value="">Selecione...</option>
                  {weekDays.map(w => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">Alternância de imagens (minutos)</label>
                <input
                  type="number"
                  min={0}
                  max={180}
                  className="w-full px-3 py-2 rounded border border-jkd-border bg-transparent text-jkd-text"
                  value={block.rotationMinutes ?? 0}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setSettings(prev => {
                      const blocks = [...prev.blocks];
                      blocks[idx] = { ...blocks[idx], rotationMinutes: val };
                      return { ...prev, blocks };
                    });
                  }}
                />
                <p className="mt-1 text-xs text-jkd-text">0 desativa; com 2+ imagens na mesma semana alterna com transição suave.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">Imagens por semana</label>
                <div className="space-y-3">
                  {(block.images ?? []).map((img, imIdx) => (
                    <div key={imIdx} className="border border-jkd-border rounded p-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div className="md:col-span-1">
                          <label className="block text-xs font-medium text-jkd-heading mb-1">Semana do mês</label>
                          <select
                            className="w-full px-3 py-2 rounded border border-jkd-border bg-transparent text-jkd-text"
                            value={img.weekOfMonth ?? '1'}
                            onChange={e => {
                              const val = e.target.value as '1'|'2'|'3'|'4'|'last';
                              setSettings(prev => {
                                const blocks = [...prev.blocks];
                                const imgs = [...(blocks[idx].images ?? [])];
                                imgs[imIdx] = { ...imgs[imIdx], weekOfMonth: val };
                                blocks[idx] = { ...blocks[idx], images: imgs };
                                return { ...prev, blocks };
                              });
                            }}
                          >
                            <option value="1">Primeira</option>
                            <option value="2">Segunda</option>
                            <option value="3">Terceira</option>
                            <option value="4">Quarta</option>
                            <option value="last">Última</option>
                          </select>
                          <p className="mt-1 text-[11px] text-jkd-text">Com uma imagem, ela é usada sempre; com várias, usa a da semana.</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-jkd-heading mb-1">Imagem (URL)</label>
                          <input
                            type="url"
                            className="w-full px-3 py-2 rounded border border-jkd-border bg-transparent text-jkd-text"
                            placeholder="https://exemplo.com/imagem.jpg"
                            value={img.imageUrl || ''}
                            onChange={e => {
                              const url = e.target.value;
                              setSettings(prev => {
                                const blocks = [...prev.blocks];
                                const imgs = [...(blocks[idx].images ?? [])];
                                imgs[imIdx] = { ...imgs[imIdx], imageUrl: url };
                                blocks[idx] = { ...blocks[idx], images: imgs };
                                return { ...prev, blocks };
                              });
                            }}
                          />
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <input
                              type="file"
                              accept="image/*"
                              className="w-full sm:w-auto"
                              onChange={e => e.target.files?.[0] && handleUploadPerImage(idx, imIdx, e.target.files[0])}
                            />
                            <button
                              type="button"
                              disabled={uploadingIndex === (idx * 100 + imIdx)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded bg-church-primary text-white disabled:opacity-60 w-full sm:w-auto"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = () => {
                                  const f = (input.files && input.files[0]) || null;
                                  if (f) handleUploadPerImage(idx, imIdx, f);
                                };
                                input.click();
                              }}
                            >
                              <UploadCloud className="w-4 h-4" /> {uploadingIndex === (idx * 100 + imIdx) ? 'Enviando...' : 'Enviar imagem'}
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded bg-red-600 text-white w-full sm:w-auto"
                              onClick={() => {
                                setSettings(prev => {
                                  const blocks = [...prev.blocks];
                                  const imgs = [...(blocks[idx].images ?? [])];
                                  imgs.splice(imIdx, 1);
                                  blocks[idx] = { ...blocks[idx], images: imgs };
                                  return { ...prev, blocks };
                                });
                              }}
                            >
                              Remover
                            </button>
                          </div>
                          {img.imageUrl && (
                            <div className="mt-2 text-xs text-jkd-text flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" /> <span>Atual: {img.imageUrl}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded bg-blue-600 text-white w-full sm:w-auto"
                    onClick={() => {
                      setSettings(prev => {
                        const blocks = [...prev.blocks];
                        const imgs = [...(blocks[idx].images ?? [])];
                        imgs.push({ imageUrl: '', imageStoragePath: '', weekOfMonth: '1' });
                        blocks[idx] = { ...blocks[idx], images: imgs };
                        return { ...prev, blocks };
                      });
                    }}
                  >
                    Adicionar imagem
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </form>

      {loading && <p className="text-sm text-jkd-text mt-4">Carregando...</p>}

      <div className="mt-6 text-xs text-jkd-text">
        <p>Documento: <code>culto_blocos_settings/default</code></p>
        <p>Armazenamento: <code>images/cultos/blocos/block_N/...</code></p>
      </div>
    </div>
  );
};

export default CultoBlocosSettingsPage;