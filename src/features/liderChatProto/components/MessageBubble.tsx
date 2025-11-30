import React from 'react';
import { cn } from '../lib/utils';
import { Trash2, Eraser, FileText } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';

type Attachment = {
  type: 'image' | 'video' | 'audio' | 'pdf';
  url: string;
  storagePath?: string;
  name?: string;
};

interface MessageBubbleProps {
  text: string;
  attachments?: Attachment[];
  timestamp?: number; // ms
  isMe?: boolean;
  read?: boolean;
  pinned?: boolean;
  onTogglePin?: () => void;
  onDeleteForMe?: () => void;
  onDeleteForAll?: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, attachments = [], timestamp, isMe = false, read = true, pinned = false, onTogglePin, onDeleteForMe, onDeleteForAll }) => {
  const { settings } = useApp();
  const appearance = settings?.leaderChatAppearance || {} as any;
  const meBg = appearance?.sentMessageBackground || '#1D4ED8'; // tailwind blue-600
  const meText = appearance?.sentMessageTextColor || '#ffffff';
  const otherBg = appearance?.receivedMessageBackground || '#F3F4F6'; // tailwind gray-100
  const otherText = appearance?.receivedMessageTextColor || '#111827'; // tailwind gray-900

  const dateStr = timestamp ? new Date(timestamp).toLocaleString() : undefined;

  const bubbleStyle: React.CSSProperties = {
    backgroundColor: isMe ? meBg : otherBg,
    color: isMe ? meText : otherText,
  };

  const metaStyle: React.CSSProperties = {
    color: isMe ? meText : otherText,
    opacity: 0.75,
  };

  const actionStyle: React.CSSProperties = {
    color: isMe ? meText : otherText,
  };

  const hasText = !!text && text.trim().length > 0;
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  return (
    <div
      className={cn(
        'max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm space-y-2',
        isMe ? 'ml-auto' : 'mr-auto'
      )}
      style={bubbleStyle}
    >
      {hasAttachments && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((a, idx) => (
            <div key={idx} className="overflow-hidden rounded-md">
              {a.type === 'image' && (
                <img
                  src={a.url}
                  alt={a.name || 'imagem'}
                  className="max-h-56 max-w-[280px] object-cover rounded-md cursor-pointer"
                  onClick={() => window.open(a.url, '_blank')}
                />
              )}
              {a.type === 'video' && (
                <video
                  src={a.url}
                  controls
                  className="max-h-56 max-w-[320px] rounded-md"
                />
              )}
              {a.type === 'audio' && (
                <audio
                  src={a.url}
                  controls
                  className="w-[280px]"
                />
              )}
              {a.type === 'pdf' && (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2 py-2 rounded-md bg-light-bg-muted dark:bg-dark-bg-muted text-light-text dark:text-dark-text"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">{a.name || 'PDF'}</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {hasText && <div className="whitespace-pre-wrap break-words">{text}</div>}

      <div className={cn('mt-1 text-[11px] flex items-center justify-between')} style={metaStyle}>
        {dateStr && <span>{dateStr}</span>}
        {typeof read === 'boolean' && (
          <span>{read ? 'Lida' : 'Não lida'}</span>
        )}
      </div>

      {(onTogglePin || onDeleteForMe || onDeleteForAll) && (
        <div className="flex items-center gap-2 mt-1" style={actionStyle}>
          {onTogglePin && (
            <button
              type="button"
              onClick={onTogglePin}
              title={pinned ? 'Desafixar' : 'Fixar'}
              className={cn('inline-flex items-center justify-center rounded hover:opacity-80')}
              style={actionStyle}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pin text-light-text-alt dark:text-dark-text-alt" aria-hidden="true"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>
            </button>
          )}
          {onDeleteForMe && (
            <button
              type="button"
              onClick={onDeleteForMe}
              title="Excluir para mim"
              className={cn('inline-flex items-center justify-center rounded hover:opacity-80')}
              style={actionStyle}
            >
              <Eraser className="w-4 h-4" />
            </button>
          )}
          {onDeleteForAll && (
            <button
              type="button"
              onClick={onDeleteForAll}
              title="Excluir para todos"
              className={cn('inline-flex items-center justify-center rounded hover:opacity-80')}
              style={actionStyle}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;