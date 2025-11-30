import React from 'react';

type VerseEntry = {
  chapter: number;
  verse: number;
  text: string;
};

interface BibleShareModalProps {
  verses: VerseEntry[];
  bookName: string;
  chapter: number;
  versionAbbr: string;
  onClose: () => void;
}

const BibleShareModal: React.FC<BibleShareModalProps> = ({ verses, bookName, chapter, versionAbbr, onClose }) => {
  const shareText = verses
    .sort((a, b) => a.verse - b.verse)
    .map(v => `${v.verse} ${v.text}`)
    .join('\n');
  const header = `${bookName} ${chapter} (${versionAbbr})`;
  const fullText = `${header}\n\n${shareText}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullText);
      alert('Texto copiado para a área de transferência.');
    } catch (e) {
      console.warn('Falha ao copiar:', e);
    }
  }

  async function handleNativeShare() {
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({
          title: header,
          text: fullText,
        });
      } else {
        await handleCopy();
      }
    } catch (e) {
      console.warn('Falha ao compartilhar:', e);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-jkd-bg rounded-lg border border-jkd-border w-full max-w-lg mx-4 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-jkd-heading">Compartilhar Versículos</h3>
          <button onClick={onClose} className="px-3 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded-lg">Fechar</button>
        </div>
        <div className="text-sm text-jkd-text mb-2">{header}</div>
        <div className="bg-jkd-bg-sec rounded border border-jkd-border p-3 max-h-64 overflow-auto">
          {verses.length > 0 ? (
            <div className="space-y-2">
              {verses.sort((a,b)=>a.verse-b.verse).map(v => (
                <div key={v.verse}>
                  <span className="font-semibold text-jkd-heading mr-2">{v.verse}</span>
                  <span className="text-jkd-text">{v.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-jkd-text">Nenhum versículo selecionado.</div>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={handleCopy} className="px-3 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded-lg">Copiar</button>
          <button onClick={handleNativeShare} className="px-3 py-2 bg-church-primary text-white rounded-lg">Compartilhar</button>
        </div>
      </div>
    </div>
  );
};

export default BibleShareModal;