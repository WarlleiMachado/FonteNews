import React from 'react';
import { Smile, Paperclip, Send } from 'lucide-react';

interface ChatComposerModernProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const ChatComposerModern: React.FC<ChatComposerModernProps> = ({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        className="px-2 py-2 rounded-md border border-jkd-border text-jkd-text hover:bg-jkd-bg"
        title="Emojis (em breve)"
      >
        <Smile size={16} />
      </button>
      <button
        type="button"
        className="px-2 py-2 rounded-md border border-jkd-border text-jkd-text hover:bg-jkd-bg"
        title="Anexar arquivo (em breve)"
      >
        <Paperclip size={16} />
      </button>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }}
        placeholder={placeholder || 'Digite sua mensagem...'}
        className="flex-1 min-w-0 bg-jkd-bg border border-jkd-border rounded-md px-3 py-2 text-sm text-jkd-heading focus:outline-none focus:ring-2 focus:ring-church-primary"
      />
      <button
        onClick={onSend}
        className="px-4 py-2 rounded-md bg-church-primary text-white text-sm font-semibold hover:bg-church-primary/90 inline-flex items-center gap-1"
        disabled={disabled}
        title="Enviar"
      >
        <Send size={16} />
        <span>Enviar</span>
      </button>
    </div>
  );
};

export default ChatComposerModern;