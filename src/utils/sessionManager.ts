/**
 * Session Manager para controlar sessões independentes por aba
 * Permite que usuários diferentes façam login em abas diferentes
 * mesmo usando browserLocalPersistence
 */

export interface SessionData {
  userId: string;
  userEmail: string;
  loginTime: number;
  tabId: string;
}

class SessionManager {
  private readonly SESSION_KEY = 'fontenews_session';
  private readonly TAB_ID_KEY = 'fontenews_tab_id';
  private tabId: string;

  constructor() {
    // Gerar ID único para esta aba
    this.tabId = this.generateTabId();
    sessionStorage.setItem(this.TAB_ID_KEY, this.tabId);
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Salva dados da sessão para esta aba específica
   */
  setSession(userId: string, userEmail: string): void {
    const sessionData: SessionData = {
      userId,
      userEmail,
      loginTime: Date.now(),
      tabId: this.tabId
    };

    // Salvar no sessionStorage (específico da aba)
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
  }

  /**
   * Obtém dados da sessão desta aba
   */
  getSession(): SessionData | null {
    try {
      const sessionStr = sessionStorage.getItem(this.SESSION_KEY);
      if (!sessionStr) return null;

      const sessionData: SessionData = JSON.parse(sessionStr);
      
      // Verificar se é da aba atual
      if (sessionData.tabId !== this.tabId) {
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
      return null;
    }
  }

  /**
   * Remove a sessão desta aba
   */
  clearSession(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  /**
   * Verifica se existe uma sessão ativa para esta aba
   */
  hasActiveSession(): boolean {
    return this.getSession() !== null;
  }

  /**
   * Verifica se o usuário atual da sessão corresponde ao usuário logado
   */
  isCurrentUser(userId: string): boolean {
    const session = this.getSession();
    return session?.userId === userId;
  }

  /**
   * Obtém o ID da aba atual
   */
  getTabId(): string {
    return this.tabId;
  }
}

export const sessionManager = new SessionManager();