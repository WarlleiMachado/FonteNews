export interface User {
  id: string;
  name: string;
  avatar?: string | null;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  text: string;
  timestamp: number; // ms
  senderId: string; // 'me' vs other ids for UI
  read?: boolean;
}

export type ChatType = 'private' | 'group';

export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  avatar?: string | null;
  participants: User[];
  messages: Message[];
  unreadCount?: number;
  pinned?: boolean;
}