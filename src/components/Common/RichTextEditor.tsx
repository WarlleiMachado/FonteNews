import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface RichTextEditorProps {
  initialHtml?: string;
  onChangeHtml: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialHtml = '', onChangeHtml, placeholder, className }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);

  // Inicializa uma única vez para evitar múltiplas instâncias/duplicações de toolbar
  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    quillRef.current = new Quill(containerRef.current, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link'],
          ['clean'],
        ],
      },
      placeholder,
    });

    if (initialHtml) {
      quillRef.current.root.innerHTML = initialHtml;
    }

    const handleChange = () => {
      const html = quillRef.current?.root.innerHTML || '';
      onChangeHtml(html);
    };
    quillRef.current.on('text-change', handleChange);

    return () => {
      quillRef.current?.off('text-change', handleChange as any);
      // remove a estrutura do quill do container para evitar resíduos visuais
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      quillRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualiza o conteúdo quando initialHtml mudar externamente, sem recriar o Quill
  useEffect(() => {
    if (!quillRef.current) return;
    const current = quillRef.current.root.innerHTML;
    if (initialHtml && current !== initialHtml) {
      quillRef.current.root.innerHTML = initialHtml;
    }
  }, [initialHtml]);

  return <div ref={containerRef} className={className} />;
};

export default RichTextEditor;