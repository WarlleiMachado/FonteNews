import React, { useState, useRef } from 'react';
import { SendHorizonal, Smile, Paperclip, X, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../../../hooks/useAuth';
import { uploadChatAttachment } from '../../../services/uploadService';

type Attachment = {
  type: 'image' | 'video' | 'audio' | 'pdf';
  url: string;
  storagePath: string;
  name?: string;
  size?: number;
  contentType?: string;
};

interface ChatInputProps {
  onSend: (text: string, attachments?: Attachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, placeholder = 'Escreva uma mensagem...' }) => {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleSend = () => {
    const text = value.trim();
    if (!text && attachments.length === 0) return;
    onSend(text, attachments);
    setValue('');
    setAttachments([]);
    setShowEmoji(false);
  };

  const handleAttachClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    setUploading(true);
    try {
      const uploads: Attachment[] = [];
      for (const file of files) {
        const meta = await uploadChatAttachment(file, user.id);
        let type: Attachment['type'] = 'image';
        if ((file.type || '').startsWith('video/')) type = 'video';
        else if ((file.type || '').startsWith('audio/')) type = 'audio';
        else if ((file.type || '').toLowerCase() === 'application/pdf') type = 'pdf';
        uploads.push({ type, url: meta.url, storagePath: meta.storagePath, name: meta.name, size: meta.size, contentType: meta.contentType });
      }
      setAttachments(prev => [...prev, ...uploads]);
    } catch (err) {
      console.error('Falha ao anexar arquivo(s):', err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const emojis = ['😀','😊','😁','😍','🙏','🎉','👍','💬','🔥','✨'];

  return (
    <div className="flex flex-col gap-2 p-2 border-t border-jkd-border bg-light-bg dark:bg-dark-bg relative">
      <div className="flex items-center gap-2">
        <button
          className={cn('p-2 rounded-md hover:bg-light-bg-muted dark:hover:bg-dark-bg-muted')}
          title="Emoji"
          disabled={disabled}
          onClick={() => setShowEmoji(v => !v)}
        >
          <Smile className="w-5 h-5 text-light-text dark:text-dark-text" />
        </button>
        {/* Emoji popover */}
        {showEmoji && (
          <div className="absolute bottom-12 left-2 z-10 bg-light-bg-muted dark:bg-dark-bg-muted border border-jkd-border rounded-md p-2 shadow-md flex flex-wrap gap-1 w-56">
            {emojis.map((e) => (
              <button
                key={e}
                className="px-2 py-1 rounded hover:bg-light-bg dark:hover:bg-dark-bg"
                onClick={() => setValue(v => v + e)}
              >{e}</button>
            ))}
          </div>
        )}
    
        <button
          className={cn('p-2 rounded-md hover:bg-light-bg-muted dark:hover:bg-dark-bg-muted')}
          title="Anexar"
          disabled={disabled || uploading || !user}
          onClick={handleAttachClick}
        >
          <Paperclip className="w-5 h-5 text-light-text dark:text-dark-text" />
        </button>
        <input ref={fileRef} type="file" className="hidden" multiple onChange={handleFileChange} accept="image/*,video/*,audio/*,application/pdf" />
    
        <input
          className={cn('flex-1 px-3 py-2 rounded-md bg-light-bg-muted dark:bg-dark-bg-muted text-light-text dark:text-dark-text outline-none')}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
        />
    
        <button
          className={cn('inline-flex items-center gap-1 px-3 py-2 rounded-md bg-church-primary/90 text-white hover:bg-church-primary/80 disabled:opacity-50 disabled:cursor-not-allowed')}
          onClick={handleSend}
          disabled={disabled || uploading || (!value.trim() && attachments.length === 0)}
          title="Enviar"
        >
          <SendHorizonal className="w-4 h-4" />
          Enviar
        </button>
      </div>
    
      {/* Attachments preview: static, below input row */}
      {attachments.length > 0 && (
        <div className="mt-2 w-full bg-light-bg dark:bg-dark-bg border border-jkd-border rounded-md p-2 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-light-text dark:text-dark-text">Anexos ({attachments.length})</span>
            <span className="text-xs text-light-text dark:text-dark-text opacity-70">{uploading ? 'Carregando...' : ''}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {attachments.map((a, idx) => (
              <div key={idx} className="relative">
                {a.type === 'image' && (
                  <img src={a.url} alt={a.name || 'imagem'} className="w-20 h-20 object-cover rounded" />
                )}
                {a.type === 'video' && (
                  <video src={a.url} className="w-32 h-20 rounded" />
                )}
                {a.type === 'audio' && (
                  <div className="px-2 py-1 text-xs rounded bg-light-bg-muted dark:bg-dark-bg-muted text-light-text dark:text-dark-text">{a.name || 'Áudio'}</div>
                )}
                {a.type === 'pdf' && (
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-2 py-1 text-xs rounded bg-light-bg-muted dark:bg-dark-bg-muted text-light-text dark:text-dark-text">
                    <FileText className="w-4 h-4" />
                    <span>{a.name || 'Documento PDF'}</span>
                  </a>
                )}
                <button
                  type="button"
                  className="absolute -top-2 -right-2 bg-black/50 text-white rounded-full p-1"
                  title="Remover"
                  onClick={() => removeAttachment(idx)}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInput;