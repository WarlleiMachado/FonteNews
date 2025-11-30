import React from 'react';
import { MessageCircle, Pin, PinOff, Trash2, CalendarClock, Eraser } from 'lucide-react';
import type { AuthorizedUser } from '../../types';

interface ChatHeaderModernProps {
  selectedUser?: AuthorizedUser;
  isSelectedUserOnline: boolean;
  selectedPinned: boolean;
  onTogglePinSelected: () => void;
  onClearForMe: () => void;
  onClearOlderThanToday: () => void;
  onClearAll: () => void;
}

const ChatHeaderModern: React.FC<ChatHeaderModernProps> = ({
  selectedUser,
  isSelectedUserOnline,
  selectedPinned,
  onTogglePinSelected,
  onClearForMe,
  onClearOlderThanToday,
  onClearAll,
}) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-jkd-heading" />
          <span className="text-jkd-heading font-medium truncate">{selectedUser?.name || 'Conversa'}</span>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <span className={`inline-block h-2 w-2 rounded-full ${isSelectedUserOnline ? 'bg-green-500' : 'bg-gray-400'}`} aria-label={isSelectedUserOnline ? 'online' : 'offline'}></span>
          <span className="text-xs text-jkd-text">{isSelectedUserOnline ? 'online' : 'offline'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="text-xs px-3 py-1 rounded-md border border-jkd-border hover:bg-jkd-bg inline-flex items-center gap-1"
          onClick={onTogglePinSelected}
          title={selectedPinned ? 'Desfixar' : 'Fixar'}
        >
          {selectedPinned ? <PinOff size={14} /> : <Pin size={14} />}
          <span>{selectedPinned ? 'Desfixar' : 'Fixar'}</span>
        </button>
        <button
          className="text-xs px-3 py-1 rounded-md border border-jkd-border hover:bg-jkd-bg inline-flex items-center gap-1"
          onClick={onClearForMe}
          title="Limpar para mim"
        >
          <Eraser size={14} />
          <span>Limpar para mim</span>
        </button>
        <button
          className="text-xs px-3 py-1 rounded-md border border-jkd-border hover:bg-jkd-bg inline-flex items-center gap-1"
          onClick={onClearOlderThanToday}
          title="Limpar de Ontem"
        >
          <CalendarClock size={14} />
          <span>Limpar de Ontem</span>
        </button>
        <button
          className="text-xs px-3 py-1 rounded-md border border-jkd-border hover:bg-jkd-bg inline-flex items-center gap-1"
          onClick={onClearAll}
          title="Esvaziar Conversa"
        >
          <Trash2 size={14} />
          <span>Esvaziar</span>
        </button>
      </div>
    </div>
  );
};

export default ChatHeaderModern;