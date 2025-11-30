import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

class PresenceManager {
  private userId: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isOnline = false;
  private tabId: string;

  constructor() {
    this.tabId = this.generateTabId();
    this.setupEventListeners();
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners() {
    // Detectar quando a aba/janela está sendo fechada
    window.addEventListener('beforeunload', () => {
      this.setOfflineSync();
    });

    // Detectar quando a aba perde o foco (usuário mudou de aba)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Aba ficou oculta - reduzir frequência do heartbeat
        this.reduceHeartbeatFrequency();
      } else {
        // Aba ficou visível - restaurar heartbeat normal
        this.restoreHeartbeatFrequency();
      }
    });

    // Detectar quando a janela perde o foco
    window.addEventListener('blur', () => {
      this.reduceHeartbeatFrequency();
    });

    window.addEventListener('focus', () => {
      this.restoreHeartbeatFrequency();
    });

    // Detectar quando a conexão com a internet é perdida
    window.addEventListener('offline', () => {
      this.setOfflineSync();
    });

    window.addEventListener('online', () => {
      if (this.userId) {
        this.setOnline(this.userId);
      }
    });
  }

  async setOnline(userId: string) {
    try {
      this.userId = userId;
      this.isOnline = true;

      // Criar documento de presença com informações da aba
      await setDoc(doc(db, 'onlineUsers', `${userId}_${this.tabId}`), {
        userId,
        tabId: this.tabId,
        lastSeen: serverTimestamp(),
        isOnline: true,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      });

      // Iniciar heartbeat para manter presença ativa
      this.startHeartbeat();

      console.log('✅ Usuário marcado como online:', userId, 'Tab:', this.tabId);
    } catch (error) {
      console.error('❌ Erro ao marcar usuário como online:', error);
    }
  }

  async setOffline() {
    if (!this.userId || !this.isOnline) return;

    try {
      // Remover documento de presença desta aba específica
      await deleteDoc(doc(db, 'onlineUsers', `${this.userId}_${this.tabId}`));
      
      this.stopHeartbeat();
      this.isOnline = false;
      
      console.log('✅ Usuário marcado como offline:', this.userId, 'Tab:', this.tabId);
    } catch (error) {
      console.error('❌ Erro ao marcar usuário como offline:', error);
    }
  }

  // Versão síncrona para usar no beforeunload
  private setOfflineSync() {
    if (!this.userId || !this.isOnline) return;

    // Usar navigator.sendBeacon para envio garantido mesmo quando a página está sendo fechada
    const data = JSON.stringify({
      action: 'setOffline',
      userId: this.userId,
      tabId: this.tabId,
      timestamp: Date.now()
    });

    // Tentar enviar via beacon (mais confiável para beforeunload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/presence-offline', data);
    }

    // Fallback: tentar deletar diretamente (pode não funcionar no beforeunload)
    try {
      deleteDoc(doc(db, 'onlineUsers', `${this.userId}_${this.tabId}`));
    } catch (error) {
      // Ignorar erros no beforeunload
    }

    this.stopHeartbeat();
    this.isOnline = false;
  }

  private startHeartbeat() {
    this.stopHeartbeat(); // Limpar qualquer heartbeat anterior
    
    // Heartbeat a cada 30 segundos
    this.heartbeatInterval = setInterval(async () => {
      if (this.userId && this.isOnline) {
        try {
          await setDoc(doc(db, 'onlineUsers', `${this.userId}_${this.tabId}`), {
            userId: this.userId,
            tabId: this.tabId,
            lastSeen: serverTimestamp(),
            isOnline: true,
            userAgent: navigator.userAgent,
            timestamp: Date.now()
          });
        } catch (error) {
          console.warn('⚠️ Erro no heartbeat:', error);
        }
      }
    }, 30000); // 30 segundos
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private reduceHeartbeatFrequency() {
    this.stopHeartbeat();
    
    // Heartbeat reduzido a cada 2 minutos quando a aba não está ativa
    this.heartbeatInterval = setInterval(async () => {
      if (this.userId && this.isOnline) {
        try {
          await setDoc(doc(db, 'onlineUsers', `${this.userId}_${this.tabId}`), {
            userId: this.userId,
            tabId: this.tabId,
            lastSeen: serverTimestamp(),
            isOnline: true,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            inactive: true // Marcar como inativo
          });
        } catch (error) {
          console.warn('⚠️ Erro no heartbeat reduzido:', error);
        }
      }
    }, 120000); // 2 minutos
  }

  private restoreHeartbeatFrequency() {
    this.startHeartbeat(); // Volta ao heartbeat normal de 30 segundos
  }

  getTabId(): string {
    return this.tabId;
  }

  isUserOnline(): boolean {
    return this.isOnline;
  }

  getCurrentUserId(): string | null {
    return this.userId;
  }
}

// Instância singleton
export const presenceManager = new PresenceManager();