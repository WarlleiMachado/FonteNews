import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

class AnonPresenceManager {
  private visitorId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isOnline = false;
  private tabId: string;

  constructor() {
    this.visitorId = this.getOrCreateVisitorId();
    this.tabId = this.generateTabId();
    this.setupEventListeners();
  }

  private getOrCreateVisitorId(): string {
    try {
      const key = 'fonteVisitorId';
      const existing = localStorage.getItem(key);
      if (existing) return existing;
      const generated = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(key, generated);
      return generated;
    } catch {
      // Fallback quando localStorage indisponível
      return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners() {
    window.addEventListener('beforeunload', () => {
      this.setOfflineSync();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.reduceHeartbeatFrequency();
      } else {
        this.restoreHeartbeatFrequency();
      }
    });

    window.addEventListener('blur', () => {
      this.reduceHeartbeatFrequency();
    });

    window.addEventListener('focus', () => {
      this.restoreHeartbeatFrequency();
    });

    window.addEventListener('offline', () => {
      this.setOfflineSync();
    });

    window.addEventListener('online', () => {
      if (!this.isOnline) {
        this.setOnline();
      }
    });
  }

  async setOnline() {
    try {
      this.isOnline = true;

      await setDoc(doc(db, 'anonOnlineUsers', `${this.visitorId}_${this.tabId}`), {
        visitorId: this.visitorId,
        tabId: this.tabId,
        lastSeen: serverTimestamp(),
        isOnline: true,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      });

      this.startHeartbeat();
      console.log('✅ Anônimo online:', this.visitorId, 'Tab:', this.tabId);
    } catch (error) {
      console.error('❌ Erro ao marcar anônimo como online:', error);
    }
  }

  async setOffline() {
    if (!this.isOnline) return;
    try {
      await deleteDoc(doc(db, 'anonOnlineUsers', `${this.visitorId}_${this.tabId}`));
      this.stopHeartbeat();
      this.isOnline = false;
      console.log('✅ Anônimo offline:', this.visitorId, 'Tab:', this.tabId);
    } catch (error) {
      console.error('❌ Erro ao marcar anônimo como offline:', error);
    }
  }

  private setOfflineSync() {
    if (!this.isOnline) return;
    const payload = JSON.stringify({
      action: 'anonSetOffline',
      visitorId: this.visitorId,
      tabId: this.tabId,
      timestamp: Date.now(),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/anon-presence-offline', payload);
    }

    try {
      deleteDoc(doc(db, 'anonOnlineUsers', `${this.visitorId}_${this.tabId}`));
    } catch {
      // Ignorar erros no beforeunload
    }

    this.stopHeartbeat();
    this.isOnline = false;
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(async () => {
      if (this.isOnline) {
        try {
          await setDoc(doc(db, 'anonOnlineUsers', `${this.visitorId}_${this.tabId}`), {
            visitorId: this.visitorId,
            tabId: this.tabId,
            lastSeen: serverTimestamp(),
            isOnline: true,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.warn('⚠️ Erro no heartbeat anônimo:', error);
        }
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private reduceHeartbeatFrequency() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(async () => {
      if (this.isOnline) {
        try {
          await setDoc(doc(db, 'anonOnlineUsers', `${this.visitorId}_${this.tabId}`), {
            visitorId: this.visitorId,
            tabId: this.tabId,
            lastSeen: serverTimestamp(),
            isOnline: true,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            inactive: true,
          });
        } catch (error) {
          console.warn('⚠️ Erro no heartbeat reduzido anônimo:', error);
        }
      }
    }, 120000);
  }

  private restoreHeartbeatFrequency() {
    this.startHeartbeat();
  }

  getVisitorId(): string {
    return this.visitorId;
  }

  getTabId(): string {
    return this.tabId;
  }

  isAnonOnline(): boolean {
    return this.isOnline;
  }
}

export const anonPresenceManager = new AnonPresenceManager();