import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { RRule, rrulestr, RRuleSet } from 'rrule';
import {
  Announcement, Culto, ChurchSettings, AuthorizedUser, LeaderRequest, Message, MinistryDepartment, Script, ScriptHistoryEntry, User, VideoNewsSettings
} from '../types';
import {
  saveAnnouncement as saveAnnouncementToFirestore,
  updateAnnouncement as updateAnnouncementInFirestore,
  deleteAnnouncement as deleteAnnouncementFromFirestore,
  saveCulto as saveCultoToFirestore,
  updateCulto as updateCultoInFirestore,
  deleteCulto as deleteCultoFromFirestore,
  
  saveScript as saveScriptToFirestore,
  updateScript as updateScriptInFirestore,
  deleteScript as deleteScriptFromFirestore,
  
  saveSettings as saveSettingsToFirestore,
  getSettings,
  
  saveAuthorizedUser as saveAuthorizedUserToFirestore,
  updateAuthorizedUser as updateAuthorizedUserInFirestore,
  deleteAuthorizedUser as deleteAuthorizedUserFromFirestore,
  saveMessage as saveMessageToFirestore,
  updateMessage as updateMessageInFirestore,
  
  saveLeaderRequest as saveLeaderRequestToFirestore,
  updateLeaderRequest as updateLeaderRequestInFirestore,
  
  
  saveMinistryDepartment as saveMinistryDepartmentToFirestore,
  updateMinistryDepartment as updateMinistryDepartmentInFirestore,
  deleteMinistryDepartment as deleteMinistryDepartmentFromFirestore
} from '../services/firestoreService';
import { useToast } from './ToastContext';
import { db, auth } from '../lib/firebase';
import { isFirebaseEnabled } from '../lib/env';
import { api } from '../lib/api';
import { doc, setDoc, deleteDoc, onSnapshot, collection, serverTimestamp, getDocs, getDoc } from 'firebase/firestore';
import { debugAuth } from '../utils/authDebug';


// --- UTILITY ---
function hexToRgbValues(hex: string): string {
  let r = '0', g = '0', b = '0';
  if (hex.length === 4) { // #RGB
    r = '0x' + hex[1] + hex[1];
    g = '0x' + hex[2] + hex[2];
    b = '0x' + hex[3] + hex[3];
  } else if (hex.length === 7) { // #RRGGBB
    r = '0x' + hex[1] + hex[2];
    g = '0x' + hex[3] + hex[4];
    b = '0x' + hex[5] + hex[6];
  }
  return `${+r} ${+g} ${+b}`;
}

// --- INTERFACES ---
interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface InputPromptState {
  isOpen: boolean;
  title: string;
  message: string;
  inputLabel: string;
  onConfirm: (value: string) => void;
}

interface ScriptViewState {
  isOpen: boolean;
  script: Script | null;
}

interface ComposeMessageState {
  isOpen: boolean;
  replyTo?: Message;
}

export interface AppContextType {
  announcements: Announcement[];
  cultos: Culto[];
  scripts: Script[];
  settings: ChurchSettings;
  authorizedUsers: AuthorizedUser[];
  leaderRequests: LeaderRequest[];
  messages: Message[];
  ministryDepartments: MinistryDepartment[];
  onlineUserIds: string[];
  isLoading: boolean;
  setOnlineStatus: (userId: string, isOnline: boolean) => Promise<void>;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'author' | 'authorId' | 'status'>, author: User) => void;
  updateAnnouncement: (id: string, updatedFields: Partial<Omit<Announcement, 'id' | 'createdAt'>>) => void;
  deleteAnnouncement: (id: string) => void;
  updateSettings: (settings: Partial<ChurchSettings>) => void;
  getAnnouncementById: (id: string) => Announcement | undefined;
  getOccurrences: (rruleString: string, start: Date, end: Date) => Date[];
  addCulto: (culto: Omit<Culto, 'id'>) => void;
  updateCulto: (id: string, updatedFields: Partial<Culto>) => void;
  deleteCulto: (id: string) => void;
  addAuthorizedUser: (user: Omit<AuthorizedUser, 'id' | 'createdAt'>) => Promise<string>;
  updateAuthorizedUser: (id: string, updatedFields: Partial<AuthorizedUser>) => void;
  removeAuthorizedUser: (id: string) => void;
  getAuthorizedUserById: (id: string) => AuthorizedUser | undefined;
  addLeaderRequest: (request: Omit<LeaderRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateLeaderRequestStatus: (id: string, status: 'approved' | 'rejected') => void;
  addMessage: (message: Omit<Message, 'id' | 'createdAt' | 'readBy'>) => void;
  markMessageAsRead: (messageId: string, userId: string) => void;
  getMessagesForUser: (userId: string) => Message[];
  deleteMessageForUser: (messageId: string, userId: string) => Promise<void>;
  clearMessagesForUser: (userId: string, mode: 'inbox' | 'sent') => Promise<void>;
  addMinistryDepartment: (group: Omit<MinistryDepartment, 'id'>) => Promise<void>;
  deleteMinistryDepartment: (id: string) => Promise<void>;
  updateLeaderMinistryDepartmentMembership: (leaderId: string, targetGroupIds: string[]) => Promise<void>;
  addScript: (script: Omit<Script, 'id' | 'createdAt' | 'updatedAt' | 'history'>, authorId: string) => void;
  updateScript: (id: string, updatedFields: Partial<Omit<Script, 'id' | 'createdAt' | 'updatedAt' | 'history'>>, authorId: string) => void;
  deleteScript: (id: string) => void;
  getScriptById: (id: string) => Script | undefined;
  confirmation: ConfirmationState;
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
  hideConfirmation: () => void;
  inputPrompt: InputPromptState;
  showInputPrompt: (title: string, message: string, inputLabel: string, onConfirm: (value: string) => void) => void;
  hideInputPrompt: () => void;
  composeMessage: ComposeMessageState;
  showComposeMessage: (replyTo?: Message) => void;
  hideComposeMessage: () => void;
  isVideoModalOpen: boolean;
  videoSettingsOverride: VideoNewsSettings | null;
  toggleVideoModal: (isOpen: boolean, override?: VideoNewsSettings | null) => void;
  scriptView: ScriptViewState;
  showScriptView: (script: Script) => void;
  hideScriptView: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

// --- INITIAL DATA (CLEAN STATE) ---
// Start with an empty list; real admin documents must be created in Firestore or via the admin scripts.
const INITIAL_AUTHORIZED_USERS: AuthorizedUser[] = [];

const INITIAL_MINISTRY_DEPARTMENTS: MinistryDepartment[] = [
    { id: 'group-geral', name: 'Liderança Geral', leaderIds: [] },
    { id: 'group-worship', name: 'Fonte Worship', leaderIds: [] },
    { id: 'group-kids', name: 'Fonte Kids', leaderIds: [] },
    { id: 'group-diaconia', name: 'Diaconia', leaderIds: [] },
    { id: 'group-atos', name: 'Fonte Atos', leaderIds: [] },
];

// --- PROVIDER ---
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [cultos, setCultos] = useState<Culto[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>(INITIAL_AUTHORIZED_USERS);
  const [leaderRequests, setLeaderRequests] = useState<LeaderRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ministryDepartments, setMinistryDepartments] = useState<MinistryDepartment[]>(INITIAL_MINISTRY_DEPARTMENTS);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<ChurchSettings>({
    logoUrl: '', // Não definir logo padrão aqui - será definido no carregamento
    churchName: 'Igreja Fonte de Vida Laranjeiras',
    cultosLogoUrl: '/fonte-news-logo-cam.svg',
    primaryColor: '#6f83a5',
    titleGradient: { enabled: false, from: '#c084fc', via: '#ec4899', to: '#ef4444', durationSec: 6 },
    copyrightText: '© 2025 Fonte News. Todos os direitos reservados.',
    audioAlertChatUrl: '',
    audioAlertApprovalsUrl: '',
    audioAlertRequestsUrl: '',
      programStartAudioUrl: '',
      programStartAudioMuted: false,
    sliderUrl: '',
    sliderAutoRefreshMinutes: 5,
    sliderScrollEnabled: true,
    sliderMessageOrigin: '',
    sliderScrollAnchors: [],
    contactInfo: { email: 'secretaria@fontevida.com', phone: '(21) 98765-4321', address: 'Laranjeiras, Rio de Janeiro', services: 'Domingos às 19h' },
    tickerSettings: { enabled: true, direction: 'left', scope: 'week', speed: 50, startDelaySec: 0, restartDelaySec: 1 },
    videoNewsSettings: { enabled: true, sourceType: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    youtubeLive: {
      enabled: true,
      apiKey: '',
      channelId: '',
      cacheSeconds: 60,
      forceVideoId: '',
      backgroundAutoplayMuted: true,
      backgroundOpacity: 1.0,
      hideBackgroundOnPopup: true,
      monthlyLimit: 10000,
    },
    maintenanceMode: {
      enabled: false,
      redirectMode: false,
      redirectUrl: ''
    },
    awarenessCalendar: { text: '', imageSource: 'url', imageUrl: '', imageUploadUrl: '', priorityEnabled: false },
    parallaxBgUrl: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    siteHome: {
      bgImageSource: 'url',
      bgImageUrl: '',
      bgImageUploadUrl: '',
      bgRepeat: false,
      bgSize: 'cover',
      bgPosition: 'center',
      bgOpacity: 0.35,
      leftColSpan: 4,
      rightColSpan: 8,
    },
    leaderChatAppearance: {
      messageSentBgColorHex: '#DCF8C6',
      messageReceivedBgColorHex: '#FFFFFF',
      messageSentTextColorHex: '#000000',
      messageReceivedTextColorHex: '#000000',
      overlayImageSource: 'url',
      overlayImageUrl: '',
      overlayImageUploadUrl: '',
      overlayRepeat: false,
      overlaySize: 'cover',
      overlayPosition: 'center',
      overlayOpacity: 0.2,
    },
    // Removido: configurações de Bíblia e TTS
  });
  const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [inputPrompt, setInputPrompt] = useState<InputPromptState>({ isOpen: false, title: '', message: '', inputLabel: '', onConfirm: () => {} });
  const [composeMessage, setComposeMessage] = useState<ComposeMessageState>({ isOpen: false });
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoSettingsOverride, setVideoSettingsOverride] = useState<VideoNewsSettings | null>(null);
  const [scriptView, setScriptView] = useState<ScriptViewState>({ isOpen: false, script: null });

  // Carregar configurações do localStorage na inicialização
  useEffect(() => {
    try {
      const raw = localStorage.getItem('churchSettings');
      let merged: any = {};

      if (raw) {
        merged = JSON.parse(raw);
        console.log('⚙️ Configurações carregadas do localStorage');
      }

      // Mesclar logos padrão atualizadas sempre
      merged = { ...merged, cultosLogoUrl: '/fonte-news-logo-cam.svg' };
      // Apenas definir logo padrão se não houver uma logo definida
      if (!merged.logoUrl) {
        merged.logoUrl = '/fonte-news-logo-cam.svg';
      }

      setSettings(prev => ({ ...prev, ...merged }));
    } catch (err) {
      console.warn('Falha ao carregar configurações do localStorage', err);
    }
  }, []);

  // Carregar dados do Firestore na inicialização
  useEffect(() => {
    if (!isFirebaseEnabled()) {
      (async () => {
        try {
          const [settingsRes, annRes, cultosRes] = await Promise.all([
            api.get('/settings'),
            api.get('/announcements'),
            api.get('/cultos')
          ])
          const mergedSettings = { ...settings, ...settingsRes.data, cultosLogoUrl: '/fonte-news-logo-cam.svg' } as ChurchSettings
          if (!mergedSettings.logoUrl) mergedSettings.logoUrl = '/fonte-news-logo-cam.svg'
          setSettings(mergedSettings)
          setAnnouncements(annRes.data || [])
          setCultos(cultosRes.data || [])
        } catch {}
        setIsLoading(false)
      })()
      return;
    }
    // Use onSnapshot listeners to keep client state in sync with server in real-time.
    console.log('🔄 Inicializando listeners em tempo real do Firestore...');

    const announcementsUnsub = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      const items = snapshot.docs.map(d => {
        const data = d.data();
        // Garantir que o ID do Firestore (d.id) prevaleça sobre qualquer campo "id" salvo dentro do documento
        return {
          ...data,
          id: d.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
        } as any;
      }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setAnnouncements(items);
    }, (err) => console.error('❌ Erro no listener de anúncios:', err));

    const cultosUnsub = onSnapshot(collection(db, 'cultos'), (snapshot) => {
      const items = snapshot.docs.map(d => { const data = d.data(); return { id: d.id, ...data, createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt } as any; });
      
      setCultos(items);
    }, (err) => console.error('❌ Erro no listener de cultos:', err));

    const scriptsUnsub = onSnapshot(
      collection(db, 'roteiros'),
      (snapshot) => {
        const items = snapshot.docs.map(d => {
          const data = d.data();
          return {
            // Garantir que o ID do Firestore prevaleça sobre qualquer 'id' salvo no documento
            ...data,
            id: d.id,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
            history: (data.history?.map((h: any) => ({
              ...h,
              date: h.date?.toDate ? h.date.toDate() : h.date,
            })) || []),
          } as any;
        });

        setScripts(
          items.sort((a, b) => {
            // Tratamento seguro de datas
            const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
            const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
            return bTime - aTime;
          })
        );
      },
      (err) => {
        console.error('❌ Erro no listener de roteiros:', err);
      }
    );

    const usersUnsub = onSnapshot(collection(db, 'authorizedUsers'), (snapshot) => {
      const items = snapshot.docs.map(d => { 
        const data = d.data(); 
        return { 
          // Garantir que o ID do documento do Firestore prevaleça sobre qualquer campo "id" salvo dentro do documento
          ...data,
          id: d.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt, 
          isProtected: data.isProtected || false 
        } as any; 
      });
      setAuthorizedUsers(items);
    }, (err) => console.error('Erro no listener de usuários:', err));

    const messagesUnsub = onSnapshot(collection(db, 'messages'), (snapshot) => {
      const items = snapshot.docs.map(d => { 
        const data = d.data(); 
        return { 
          id: d.id, 
          ...data, 
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt 
        } as any; 
      });
      setMessages(items);
    }, (err) => console.error('Erro no listener de mensagens:', err));

    const leaderRequestsUnsub = onSnapshot(collection(db, 'leaderRequests'), (snapshot) => {
      const items = snapshot.docs.map(d => {
        const data: any = d.data();
        const { id: _ignored, createdAt, ...rest } = data || {};
        return {
          ...rest,
          id: d.id,
          createdAt: createdAt?.toDate ? createdAt.toDate() : createdAt
        } as any;
      });
      setLeaderRequests(items);
    }, (err) => console.error('Erro no listener de solicitações:', err));

    const ministryUnsub = onSnapshot(collection(db, 'ministryDepartments'), (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any;
      setMinistryDepartments(items.length > 0 ? items : INITIAL_MINISTRY_DEPARTMENTS);
    }, (err) => console.error('Erro no listener de departamentos:', err));

    // **LISTENER EM TEMPO REAL PARA CONFIGURAÇÕES**
    const settingsUnsub = onSnapshot(doc(db, 'settings', 'church-settings'), (doc) => {
      console.log('[AppContext] 📡 LISTENER DE CONFIGURAÇÕES DISPARADO');
      console.log('[AppContext] Documento existe:', doc.exists());
      console.log('[AppContext] Auth atual:', auth.currentUser?.uid || 'Usuário não autenticado');
      
      if (doc.exists()) {
        const firestoreSettings = doc.data() as ChurchSettings;
        console.log('[AppContext] ===== CONFIGURAÇÕES RECEBIDAS DO FIRESTORE =====');
        console.log('[AppContext] Configurações completas:', firestoreSettings);
        console.log('[AppContext] MaintenanceMode completo:', firestoreSettings.maintenanceMode);
        console.log('[AppContext] HeaderImageUrl:', firestoreSettings.maintenanceMode?.headerImageUrl);
        console.log('[AppContext] LogoUrl:', firestoreSettings.maintenanceMode?.logoUrl);
        console.log('[AppContext] ShowLogo:', firestoreSettings.maintenanceMode?.showLogo);
        console.log('[AppContext] Enabled:', firestoreSettings.maintenanceMode?.enabled);
        
        // VERIFICAÇÃO ESPECÍFICA DO HEADERIMAGEURL
        console.log('[AppContext] 🔍 VERIFICAÇÃO HEADERIMAGEURL:');
        console.log('[AppContext] headerImageUrl existe?', firestoreSettings.maintenanceMode?.headerImageUrl !== undefined);
        console.log('[AppContext] headerImageUrl valor:', firestoreSettings.maintenanceMode?.headerImageUrl);
        console.log('[AppContext] headerImageUrl tipo:', typeof firestoreSettings.maintenanceMode?.headerImageUrl);
        console.log('[AppContext] headerImageUrl length:', firestoreSettings.maintenanceMode?.headerImageUrl?.length);
        
        console.log('[AppContext] ===== FIM CONFIGURAÇÕES =====');
        
        let mergedSettings = { ...firestoreSettings, cultosLogoUrl: '/fonte-news-logo-cam.svg' };
        // Apenas usar logo padrão se não houver uma logo definida no Firestore
        if (!mergedSettings.logoUrl) {
          mergedSettings.logoUrl = '/fonte-news-logo-cam.svg';
        }

        // Override de desenvolvimento do slider (restaurado)
        if (import.meta.env.DEV) {
          mergedSettings.sliderUrl = mergedSettings.sliderUrl || '/slider-test.html';
          mergedSettings.sliderAutoRefreshMinutes = mergedSettings.sliderAutoRefreshMinutes ?? 5;
          // Garantir defaults para novas chaves
          mergedSettings.sliderScrollEnabled = mergedSettings.sliderScrollEnabled ?? true;
          mergedSettings.sliderMessageOrigin = mergedSettings.sliderMessageOrigin ?? '';
          mergedSettings.sliderScrollAnchors = mergedSettings.sliderScrollAnchors ?? [];
        }

        setSettings(mergedSettings);
        console.log('✅ Configurações sincronizadas em tempo real do Firestore');
      }
    }, (err) => {
      console.error('❌ Erro no listener de configurações:', err);
      console.error('❌ Detalhes do erro:', {
        code: err.code,
        message: err.message,
        name: err.name
      });
      // Fallback: carregar configurações uma vez se o listener falhar
      getSettings().then(firestoreSettings => {
        if (firestoreSettings) {
          console.log('[AppContext] Fallback: Configurações carregadas via getSettings:', firestoreSettings);
          console.log('[AppContext] Fallback: HeaderImageUrl:', firestoreSettings.maintenanceMode?.headerImageUrl);
          let mergedSettings = { ...firestoreSettings, cultosLogoUrl: '/fonte-news-logo-cam.svg' };
          // Apenas usar logo padrão se não houver uma logo definida no Firestore
          if (!mergedSettings.logoUrl) {
            mergedSettings.logoUrl = '/fonte-news-logo-cam.svg';
          }
          if (import.meta.env.DEV) {
            mergedSettings.sliderUrl = mergedSettings.sliderUrl || '/slider-test.html';
            mergedSettings.sliderAutoRefreshMinutes = mergedSettings.sliderAutoRefreshMinutes ?? 5;
            mergedSettings.sliderScrollEnabled = mergedSettings.sliderScrollEnabled ?? true;
            mergedSettings.sliderMessageOrigin = mergedSettings.sliderMessageOrigin ?? '';
            mergedSettings.sliderScrollAnchors = mergedSettings.sliderScrollAnchors ?? [];
          }
          setSettings(mergedSettings);
        }
      }).catch(err => console.error('Erro no fallback de configurações:', err));
    });

    // **CARREGAMENTO INICIAL** - Agora as configurações são sincronizadas em tempo real
    // Mas precisamos garantir que o loading seja finalizado corretamente
    (async () => {
      try {
        const firestoreSettings = await getSettings();
        if (firestoreSettings) {
          let mergedSettings = { ...firestoreSettings, cultosLogoUrl: '/fonte-news-logo-cam.svg' };
          // Apenas usar logo padrão se não houver uma logo definida no Firestore
          if (!mergedSettings.logoUrl) {
            mergedSettings.logoUrl = '/fonte-news-logo-cam.svg';
          }

      // Override de desenvolvimento do slider (restaurado)
      if (import.meta.env.DEV) {
        mergedSettings.sliderUrl = mergedSettings.sliderUrl || '/slider-test.html';
        mergedSettings.sliderAutoRefreshMinutes = mergedSettings.sliderAutoRefreshMinutes ?? 5;
        // Garantir defaults para novas chaves
        mergedSettings.sliderScrollEnabled = mergedSettings.sliderScrollEnabled ?? true;
        mergedSettings.sliderMessageOrigin = mergedSettings.sliderMessageOrigin ?? '';
        mergedSettings.sliderScrollAnchors = mergedSettings.sliderScrollAnchors ?? [];
      }

          setSettings(mergedSettings);
          console.log('✅ Configurações carregadas e mescladas com novas logos');
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      announcementsUnsub();
      cultosUnsub();
      scriptsUnsub();
      usersUnsub();
      messagesUnsub();
      leaderRequestsUnsub();
      ministryUnsub();
      settingsUnsub();
    };
  }, []);

  // Listener para usuários online em tempo real - agora com suporte a múltiplas abas
  useEffect(() => {
    if (!isFirebaseEnabled()) return;
    let unsubscribe: (() => void) | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isActive = true;

    const setupListener = () => {
      if (!isActive) return;
      
      try {
        unsubscribe = onSnapshot(
          collection(db, 'onlineUsers'), 
          (snapshot) => {
            if (!isActive) return;
            
            // Agrupar por userId para detectar usuários únicos online
            const userPresenceMap = new Map<string, { lastSeen: Date, isActive: boolean }>();
            
            snapshot.docs.forEach(doc => {
              const data = doc.data();
              const userId = data.userId;
              const lastSeen = data.lastSeen?.toDate() || new Date();
              const isTabActive = !data.inactive;
              
              // Manter o registro mais recente ou mais ativo para cada usuário
              const existing = userPresenceMap.get(userId);
              if (!existing || lastSeen > existing.lastSeen || (isTabActive && !existing.isActive)) {
                userPresenceMap.set(userId, { lastSeen, isActive: isTabActive });
              }
            });
            
            // Filtrar usuários que estão realmente online (última atividade < 2 minutos)
            const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
            const onlineIds = Array.from(userPresenceMap.entries())
              .filter(([_, presence]) => presence.lastSeen > twoMinutesAgo)
              .map(([userId, _]) => userId);
            
            setOnlineUserIds(onlineIds);
            
            // Reset reconnect attempts on successful connection
            if (reconnectTimeout) {
              clearTimeout(reconnectTimeout);
              reconnectTimeout = null;
            }
          },
          (error) => {
            console.error('Erro no listener de usuários online:', error);
            
            // Attempt to reconnect after 5 seconds if still active
            if (isActive && !reconnectTimeout) {
              reconnectTimeout = setTimeout(() => {
                if (isActive) {
                  if (unsubscribe) {
                    try {
                      unsubscribe();
                    } catch (e) {
                      console.warn('Erro ao desconectar listener anterior:', e);
                    }
                  }
                  setupListener();
                }
              }, 5000);
            }
          }
        );
      } catch (error) {
        console.error('Erro ao configurar listener de usuários online:', error);
        
        // Retry setup after 3 seconds
        if (isActive && !reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            if (isActive) setupListener();
          }, 3000);
        }
      }
    };

    setupListener();

    return () => {
      console.log('🛑 Desconectando listener de usuários online...');
      isActive = false;
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('⚠️ Erro ao desconectar listener:', error);
        }
      }
    };
  }, []);

  // Limpeza automática de usuários offline antigos - melhorada para múltiplas abas
  useEffect(() => {
    if (!isFirebaseEnabled()) return;
    const cleanupOfflineUsers = async () => {
      try {
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const onlineUsersRef = collection(db, 'onlineUsers');
        const snapshot = await getDocs(onlineUsersRef);
        
        const deletePromises: Promise<void>[] = [];
        
        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          const lastSeen = data.lastSeen?.toDate();
          
          // Se lastSeen é mais antigo que 2 minutos, remover o documento
          if (lastSeen && lastSeen < twoMinutesAgo) {
            deletePromises.push(deleteDoc(doc(db, 'onlineUsers', docSnapshot.id)));
          }
        });
        
        // Executar todas as exclusões em paralelo
        if (deletePromises.length > 0) {
          await Promise.all(deletePromises);
          console.log(`🧹 Limpeza: ${deletePromises.length} registros de presença antigos removidos`);
        }
      } catch (error) {
        // Silenciar erros de limpeza para reduzir logs
        console.warn('⚠️ Erro na limpeza de usuários offline:', error);
      }
    };

    // Executar limpeza a cada 1 minuto (mais frequente para melhor responsividade)
    const cleanupInterval = setInterval(cleanupOfflineUsers, 60000);
    
    // Executar uma vez imediatamente
    cleanupOfflineUsers();

    return () => clearInterval(cleanupInterval);
  }, []);

  // REMOVIDO: Limpeza automática de itens antigos
  // A limpeza deve ser feita no Firestore via Cloud Functions ou manualmente
  // O estado local deve apenas refletir o que está no Firestore via onSnapshot

  // Fallback: limpeza automática de programações não recorrentes 30 dias após a ocorrência
  // Executa apenas quando um administrador está logado. Roda ao iniciar e a cada 12h.
  useEffect(() => {
    const runAutoCleanup = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        // Verificar privilégios admin (claims, authorizedUsers, /users/{uid})
        let hasAdminClaim = false;
        try {
          const tokenResult = await currentUser.getIdTokenResult();
          hasAdminClaim = tokenResult.claims.admin === true;
        } catch {}

        const mappedAuthUser = authorizedUsers.find(u => u.firebaseUid === currentUser.uid);
        const isActiveAdmin = mappedAuthUser?.role === 'admin' && mappedAuthUser?.status === 'active';

        let usersDocIsAdmin = false;
        try {
          const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDocSnap.exists()) {
            const userDocData = userDocSnap.data() as any;
            usersDocIsAdmin = userDocData?.role === 'admin';
          }
        } catch {}

        const isAdmin = Boolean(hasAdminClaim || isActiveAdmin || usersDocIsAdmin);
        if (!isAdmin) return;

        const now = new Date();
        const cutoffMillis = 30 * 24 * 60 * 60 * 1000; // 30 dias
        const wideStart = new Date(2000, 0, 1);
        const wideEnd = new Date(2100, 0, 1);

        const isNonRecurring = (a: Announcement): boolean => {
          try {
            const allOcc = getOccurrences(a.rruleString, wideStart, wideEnd);
            return allOcc.length <= 1;
          } catch {
            return false;
          }
        };

        const getLastOccurrenceEnd = (a: Announcement): Date | null => {
          try {
            const pastOcc = getOccurrences(a.rruleString, wideStart, now);
            if (pastOcc.length === 0) return null;
            const lastStart = pastOcc[pastOcc.length - 1];
            if (a.endTime) {
              const [eh, em] = a.endTime.split(':').map(Number);
              const end = new Date(lastStart);
              end.setHours(eh || 0, em || 0, 0, 0);
              return end;
            }
            return lastStart;
          } catch {
            return null;
          }
        };

        const deletions: Promise<void>[] = [];
        announcements.forEach(a => {
          if (!isNonRecurring(a)) return;
          const lastEnd = getLastOccurrenceEnd(a);
          if (!lastEnd) return;
          const age = now.getTime() - lastEnd.getTime();
          if (age > cutoffMillis) {
            deletions.push(deleteAnnouncementFromFirestore(a.id));
          }
        });

        if (deletions.length > 0) {
          await Promise.allSettled(deletions);
        }
      } catch (err) {
        console.warn('⚠️ Falha na limpeza automática de programações não recorrentes:', err);
      }
    };

    const intervalId = window.setInterval(runAutoCleanup, 12 * 60 * 60 * 1000);
    runAutoCleanup();
    return () => clearInterval(intervalId);
  }, [announcements, authorizedUsers]);

  useEffect(() => {
    if (settings.primaryColor) {
      const rgbValues = hexToRgbValues(settings.primaryColor);
      document.documentElement.style.setProperty('--church-primary', rgbValues);
    }
  }, [settings.primaryColor]);

  const setOnlineStatus = useCallback(async (userId: string, isOnline: boolean) => {
    try {
      // Gate writes: ensure firebase auth currentUser is mapped to an authorizedUsers entry matching this userId
      const currentFirebaseUid = auth.currentUser ? auth.currentUser.uid : null;
      
      const mapped = authorizedUsers.find(u => u.id === userId && u.firebaseUid && currentFirebaseUid && u.firebaseUid === currentFirebaseUid);

      // Diagnostic log (silenciado)
      try {
        const key = 'fonte:auth-log';
        const raw = localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        arr.push({ ts: new Date().toISOString(), event: 'setOnlineStatus', userId, isOnline, currentFirebaseUid, mapped: !!mapped });
        localStorage.setItem(key, JSON.stringify(arr.slice(-200)));
      } catch (e) {}

      if (!mapped) {
        return;
      }

      if (isOnline) {
        // Usar o novo sistema de presença com suporte a múltiplas abas
        const { presenceManager } = await import('../utils/presenceManager');
        await presenceManager.setOnline(userId);
      } else {
        // Usar o novo sistema de presença para marcar como offline
        const { presenceManager } = await import('../utils/presenceManager');
        await presenceManager.setOffline();
      }
    } catch (error: any) {
      console.error('❌ Erro ao atualizar status online:', error);
      
      // Log specific error types for debugging
      if (error.code === 'permission-denied') {
        console.error('❌ Permissão negada para atualizar status online. Verifique as regras do Firestore.');
      } else if (error.code === 'unavailable') {
        console.error('❌ Firestore temporariamente indisponível. Tentativa será feita novamente automaticamente.');
      } else if (error.code === 'unauthenticated') {
        console.error('❌ Usuário não autenticado. Faça login novamente.');
      }
    }
  }, [authorizedUsers]);

  const getOccurrences = useCallback((rruleString: string, start: Date, end: Date): Date[] => {
    try {
      // Normaliza DTSTART/UNTIL para horário local ao remover o sufixo 'Z' (UTC) de strings salvas
      const normalized = rruleString
        .replace(/DTSTART:(\d{8}T\d{6})Z/g, 'DTSTART:$1')
        .replace(/UNTIL=(\d{8}T\d{6})Z/g, 'UNTIL=$1');
      // Usa rrulestr com forceset=true para suportar RRule e RRuleSet (INCLUDE/EXDATE etc.)
      const parsed = rrulestr(normalized, { forceset: true });
      if (parsed instanceof RRuleSet) {
        return parsed.between(start, end, true);
      }
      // Fallback: se vier como RRule simples
      const rule = parsed as unknown as RRule;
      return rule.between(start, end, true);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Erro ao processar rruleString (rrulestr):', e);
      }
      // Último fallback: tentar parser clássico
      try {
        const rule = RRule.fromString(rruleString);
        return rule.between(start, end, true);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Erro ao processar rruleString (RRule.fromString):', err);
        }
        return [];
      }
    }
  }, []);

  const addAnnouncement = async (announcementData: Omit<Announcement, 'id' | 'createdAt' | 'author' | 'authorId' | 'status'>, user: User) => {
    try {
      if (!isFirebaseEnabled()) {
        const payload: any = { ...announcementData, author: user.name, authorId: user.id }
        const res = await api.post('/announcements', payload)
        const newItem = { id: res.data.id, createdAt: new Date(), ...payload } as Announcement
        setAnnouncements(prev => [newItem, ...prev])
        showToast('success', 'Anúncio criado com sucesso!')
        return
      }
      const newAnnouncement: Announcement = {
        ...announcementData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        author: user.name,
        authorId: user.id,
        status: user.role === 'admin' ? 'approved' : 'pending'
      };
      
      console.log('📝 Anúncio preparado:', newAnnouncement);
      
      // Salvar no Firestore - o listener onSnapshot irá atualizar o estado automaticamente
      const firestoreId = await saveAnnouncementToFirestore(newAnnouncement);
      console.log('✅ Anúncio salvo no Firestore com ID:', firestoreId);
      console.log('📡 O listener onSnapshot irá sincronizar automaticamente o novo anúncio');
      
      showToast('success', 'Anúncio criado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao criar anúncio:', error);
      console.error('❌ Detalhes do erro:', error.message);
      console.error('❌ Stack trace:', error.stack);
      showToast('error', `Erro ao criar anúncio: ${error.message}`);
    }
  };

  const updateAnnouncement = async (id: string, updatedFields: Partial<Omit<Announcement, 'id' | 'createdAt'>>) => {
    try {
      if (!isFirebaseEnabled()) {
        await api.patch(`/announcements/${id}`, updatedFields)
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...updatedFields } as any : a))
        showToast('success', 'Anúncio atualizado')
        return
      }
      // Determinar se é uma restauração (expirado -> com próximas ocorrências)
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

      const current = announcements.find(a => a.id === id);
      let finalUpdates = { ...updatedFields } as Partial<Announcement>;

      if (current) {
        const hasUpcoming = (a: Announcement) => getOccurrences(a.rruleString, now, nextYear).length > 0;
        const isInProgress = (a: Announcement) => {
          if (!a.endTime) return false;
          const todays = getOccurrences(a.rruleString, startOfToday, endOfToday);
          if (todays.length === 0) return false;
          const date = todays[0];
          const [eh, em] = a.endTime.split(':').map(Number);
          const endDate = new Date(date);
          endDate.setHours(eh || 0, em || 0, 0, 0);
          return date <= now && endDate >= now;
        };

        const wasExpired = !(hasUpcoming(current) || isInProgress(current));
        const merged: Announcement = { ...current, ...updatedFields } as Announcement;
        const nowHasUpcoming = hasUpcoming(merged) || isInProgress(merged);

        // Bloquear restauração de programações rejeitadas
        if (current.status === 'rejected' && wasExpired && nowHasUpcoming) {
          showToast('warning', 'Programações rejeitadas não podem ser restauradas.');
          return; // Não aplicar atualização
        }

        // Se era expirado e agora passou a ter próximas ocorrências, enviar para nova aprovação
        if (wasExpired && nowHasUpcoming) {
          // Determinar papel do usuário atual
          let currentRole: 'admin' | 'leader' | 'editor' | undefined;
          try {
            const firebaseUid = auth.currentUser?.uid;
            if (firebaseUid) {
              const authorized = authorizedUsers.find(u => (u as any).firebaseUid === firebaseUid) as any;
              currentRole = authorized?.role;
            }
          } catch {}

          if (currentRole === 'admin') {
            // Restauradas por administradores ficam aprovadas automaticamente
            finalUpdates.status = 'approved';
            finalUpdates.restoreRequested = false;
            showToast('success', 'Programação restaurada e aprovada automaticamente (Administrador).');
          } else {
            // Líderes/editores: vão para aprovação em "Restaurados"
            finalUpdates.status = 'pending';
            finalUpdates.restoreRequested = true;
            showToast('info', 'Programação restaurada: enviada para aprovação em "Restaurados". Avise o Administrador via chat.');
          }
        } else if (typeof updatedFields.status !== 'undefined') {
          // Se status foi atualizado manualmente (aprovar/rejeitar), limpar flag de restauração
          finalUpdates.restoreRequested = false;
        }
      }

      // Atualizar no Firestore - o listener onSnapshot irá atualizar o estado automaticamente
      await updateAnnouncementInFirestore(id, finalUpdates);
      console.log('✅ Anúncio atualizado no Firestore:', id);
      console.log('📡 O listener onSnapshot irá sincronizar automaticamente as alterações');
    } catch (error) {
      console.error('❌ Erro ao atualizar anúncio:', error);
      showToast('error', 'Erro ao atualizar anúncio: verifique sua autenticação/permissões. A atualização não foi aplicada no servidor.');
      return;
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      if (!isFirebaseEnabled()) {
        await api.delete(`/announcements/${id}`)
        setAnnouncements(prev => prev.filter(announcement => announcement.id !== id))
        showToast('success', 'Programação excluída com sucesso!')
        return
      }
      setAnnouncements(prev => {
        const updated = prev.filter(announcement => announcement.id !== id);
        console.log('✅ [AppContext] Estado local atualizado - programações restantes:', updated.length);
        return updated;
      });
      
      showToast('success', 'Programação excluída com sucesso!');
    } catch (error: any) {
      console.error('❌ [AppContext] Erro ao excluir programação:', error);
      
      // Tratar diferentes tipos de erro com mensagens específicas
      let errorMessage = 'Erro inesperado ao excluir programação.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Você não tem permissão para excluir programações.';
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'Sua sessão expirou. Faça login novamente.';
      }
      
      showToast('error', errorMessage);
      return;
    }
  };

  const updateSettings = async (newSettings: Partial<ChurchSettings>) => {
    const finalSettings = {...settings, ...newSettings};
    if (newSettings.tickerSettings) finalSettings.tickerSettings = {...settings.tickerSettings, ...newSettings.tickerSettings};
    if (newSettings.videoNewsSettings) finalSettings.videoNewsSettings = {...settings.videoNewsSettings, ...newSettings.videoNewsSettings};
    if (newSettings.youtubeLive) finalSettings.youtubeLive = {...settings.youtubeLive, ...newSettings.youtubeLive};
    if (newSettings.siteHome) finalSettings.siteHome = {...(settings.siteHome || {}), ...newSettings.siteHome};
    if (newSettings.leaderChatAppearance) finalSettings.leaderChatAppearance = { ...(settings.leaderChatAppearance || {}), ...newSettings.leaderChatAppearance };
    if (newSettings.maintenanceMode) finalSettings.maintenanceMode = { ...(settings.maintenanceMode || {}), ...newSettings.maintenanceMode };
    // Arrays simples e flags são mesclados por cima (sem deep-merge)
    if (newSettings.sliderScrollAnchors) finalSettings.sliderScrollAnchors = [...newSettings.sliderScrollAnchors];
    if (typeof newSettings.sliderScrollEnabled !== 'undefined') finalSettings.sliderScrollEnabled = newSettings.sliderScrollEnabled;
    if (typeof newSettings.sliderMessageOrigin !== 'undefined') finalSettings.sliderMessageOrigin = newSettings.sliderMessageOrigin;
    
    try {
      if (!isFirebaseEnabled()) {
        await api.put('/settings', finalSettings as any)
      } else {
        await saveSettingsToFirestore(finalSettings)
      }
      setSettings(finalSettings)
      try { localStorage.setItem('churchSettings', JSON.stringify(finalSettings)); } catch {}
    } catch (error) {
      setSettings(finalSettings)
      try { localStorage.setItem('churchSettings', JSON.stringify(finalSettings)); } catch {}
    }
  };
  const getAnnouncementById = (id: string) => announcements.find(a => a.id === id);
  
  const addCulto = async (culto: Omit<Culto, 'id'>) => {
    try {
      if (!isFirebaseEnabled()) {
        const res = await api.post('/cultos', culto as any)
        const newItem = { ...culto, id: res.data.id } as any
        setCultos(prev => [...prev, newItem])
        showToast('success', 'Culto criado com sucesso!')
        return
      }
      const newCulto = { ...culto, id: crypto.randomUUID() };
      console.log('📝 Culto preparado:', newCulto);
      
      // Salvar no Firestore primeiro
      const firestoreId = await saveCultoToFirestore(newCulto);
      console.log('✅ Culto salvo no Firestore com ID:', firestoreId);
      
      // Atualizar o ID com o ID do Firestore
      newCulto.id = firestoreId;
      
      // Atualizar estado local apenas após sucesso no Firestore
      setCultos(prev => [...prev, newCulto]);
      console.log('✅ Estado local atualizado');
      
      showToast('success', 'Culto criado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao criar culto:', error);
      console.error('❌ Detalhes do erro:', error.message);
      console.error('❌ Stack trace:', error.stack);
      showToast('error', `Erro ao criar culto: ${error.message}`);
    }
  };
  
  const updateCulto = async (id: string, updatedFields: Partial<Culto>) => {
    try {
      if (!isFirebaseEnabled()) {
        await api.patch(`/cultos/${id}`, updatedFields)
        setCultos(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c))
        showToast('success', 'Culto atualizado')
        return
      }
      await updateCultoInFirestore(id, updatedFields)
      setCultos(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c))
    } catch (error) {
      console.error('❌ Erro ao atualizar culto:', error);
      showToast('error', 'Erro ao atualizar culto: verifique sua autenticação/permissões. A atualização não foi aplicada no servidor.');
      return;
    }
  };
  
  const deleteCulto = async (id: string) => {
    try {
      if (!isFirebaseEnabled()) {
        await api.delete(`/cultos/${id}`)
        setCultos(prev => prev.filter(c => c.id !== id))
        showToast('success', 'Culto excluído com sucesso!')
        return
      }
      await deleteCultoFromFirestore(id)
      showToast('success', 'Culto excluído com sucesso!')
    } catch (error: any) {
      console.error('❌ [AppContext] Erro ao excluir culto:', error);
      
      // Tratar diferentes tipos de erro com mensagens específicas
      let errorMessage = 'Erro inesperado ao excluir culto.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Você não tem permissão para excluir cultos.';
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'Sua sessão expirou. Faça login novamente.';
      }
      
      showToast('error', errorMessage);
      return;
    }
  };
  
  const addAuthorizedUser = async (user: Omit<AuthorizedUser, 'id' | 'createdAt'>): Promise<string> => {
    const newId = crypto.randomUUID();
    const newUser = { ...user, id: newId, createdAt: new Date() };
    
    try {
      // Salvar no Firestore
      const firestoreId = await saveAuthorizedUserToFirestore(newUser);
      const finalUser = { ...newUser, id: firestoreId };
      
      // REMOÇÃO: Evitar atualização otimista local que causa duplicidade.
      // O listener onSnapshot irá sincronizar automaticamente a criação.
      console.log('✅ Usuário autorizado salvo no Firestore:', firestoreId);
      return firestoreId;
    } catch (error) {
      console.error('❌ Erro ao salvar usuário autorizado:', error);
      showToast('error', 'Erro ao salvar usuário autorizado: verifique sua autenticação/permissões. A operação não foi salva no servidor.');
      return newId;
    }
  };
  
  const updateAuthorizedUser = async (id: string, updatedFields: Partial<AuthorizedUser>) => {
    try {
      console.log('🔄 Iniciando atualização de usuário:', id, 'Campos:', updatedFields);
      
      // Atualizar no Firestore
      await updateAuthorizedUserInFirestore(id, updatedFields);
      
      // REMOÇÃO: Evitar atualização otimista local para impedir estado inconsistente/duplicado.
      // O listener onSnapshot irá refletir a atualização automaticamente.
      console.log('✅ Usuário autorizado atualizado no Firestore:', id);
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário autorizado:', error);
      const msg = error instanceof Error ? error.message : String(error);
      showToast('error', `Erro ao atualizar usuário autorizado: ${msg}`);
      return;
    }
  };

  const removeAuthorizedUser = async (id: string) => {
    try {
      // Antes de deletar, remover o usuário de todos os ministérios/departamentos em que ele está associado
      const groupsWithLeader = ministryDepartments.filter(group => group.leaderIds.includes(id));
      if (groupsWithLeader.length > 0) {
        await Promise.all(groupsWithLeader.map(async (group) => {
          const updatedLeaderIds = group.leaderIds.filter(lid => lid !== id);
          await updateMinistryDepartmentInFirestore(group.id, { leaderIds: updatedLeaderIds });
        }));
        console.log(`🧹 Removidas ${groupsWithLeader.length} associações de ministério/departamento para o usuário:`, id);
      }

      // Deletar do Firestore
      await deleteAuthorizedUserFromFirestore(id);
      
      // REMOÇÃO: Evitar remoção otimista local; confiar no onSnapshot para refletir a exclusão.
      console.log('✅ Usuário autorizado deletado do Firestore:', id);
    } catch (error: any) {
      console.error('❌ Erro ao deletar usuário autorizado:', error);
      // Tratar mensagens mais claras por tipo de erro
      let message = 'Erro ao deletar usuário autorizado: verifique sua autenticação/permissões. A exclusão não foi feita no servidor.';
      if (error?.code === 'permission-denied') {
        message = 'Permissão negada para excluir este usuário. Somente administradores (custom claim) ou contas administrativas podem excluir usuários.';
      } else if (error?.code === 'unauthenticated') {
        message = 'Sua sessão expirou. Faça login novamente para continuar.';
      }
      showToast('error', message);
      return;
    }
  };
  const getAuthorizedUserById = (id: string) => authorizedUsers.find(u => u.id === id);

  const addLeaderRequest = async (request: Omit<LeaderRequest, 'id' | 'createdAt' | 'status'>) => {
    const newRequest = { 
      ...request, 
      id: crypto.randomUUID(), 
      createdAt: new Date(), 
      status: 'pending' as const 
    };
    
    try {
      // Salvar no Firestore
      const firestoreId = await saveLeaderRequestToFirestore(newRequest);
      const finalRequest = { ...newRequest, id: firestoreId };
      
      // Atualizar estado local
      setLeaderRequests(prev => [finalRequest, ...prev]);
      console.log('✅ Solicitação de liderança salva no Firestore:', firestoreId);
    } catch (error) {
      console.error('❌ Erro ao salvar solicitação de liderança:', error);
      showToast('error', 'Erro ao enviar solicitação de liderança: verifique sua conexão e tente novamente.');
      return;
    }
  };

  const updateLeaderRequestStatus = async (id: string, status: 'approved' | 'rejected') => {
    const request = leaderRequests.find(r => r.id === id);

    // 1) Atualiza o status da solicitação no Firestore (operações sempre permitidas pelas regras)
    try {
      await updateLeaderRequestInFirestore(id, { status });
    } catch (error) {
      console.error('❌ Erro ao atualizar status da solicitação no Firestore:', error);
      // Mensagens mais claras por tipo de erro
      let message = 'Erro ao atualizar status da solicitação: a operação foi bloqueada.';
      const code = (error as any)?.code;
      if (code === 'permission-denied') {
        message = 'Permissão negada para atualizar a solicitação. Faça login como administrador.';
      } else if (code === 'unauthenticated') {
        message = 'Sua sessão expirou. Faça login novamente e tente de novo.';
      } else if ((error as any)?.message) {
        message = `Erro ao atualizar status da solicitação: ${(error as any).message}`;
      }
      showToast('error', message);
      return;
    }

    // 2) Se aprovado, tenta criar/ativar usuário autorizado (pode falhar por autenticação)
    if (request && status === 'approved') {
      try {
        // Evita duplicidade: se já existe usuário com o mesmo e-mail, apenas garante status ativo
        const existing = authorizedUsers.find(u => u.email?.toLowerCase() === request.email?.toLowerCase());
        let savedUserId: string | undefined;
        if (existing) {
          await updateAuthorizedUser(existing.id, { status: 'active' });
          savedUserId = existing.id;
        } else {
          savedUserId = await addAuthorizedUser({
            name: request.name,
            email: request.email,
            phone: request.phone,
            role: 'leader',
            status: 'active',
            password: crypto.randomUUID().slice(0, 8),
          });
        }

        // Vincular o líder aprovado ao Ministério/Departamento selecionado na solicitação
        if (savedUserId && request.ministry) {
          const targetGroup = ministryDepartments.find(g => g.name?.toLowerCase() === request.ministry?.toLowerCase());
          if (targetGroup) {
            await updateLeaderMinistryDepartmentMembership(savedUserId, [targetGroup.id]);
          }
        }
      } catch (error: any) {
        console.error('⚠️ Solicitação aprovada, mas falha ao criar/ativar usuário autorizado:', error);
        let message = 'Solicitação aprovada, mas houve falha ao criar o usuário. Verifique se você está autenticado.';
        if (error?.code === 'permission-denied') {
          message = 'Solicitação aprovada, porém sem permissão para criar usuário. Faça login como administrador.';
        } else if (error?.code === 'unauthenticated') {
          message = 'Solicitação aprovada, mas sua sessão expirou. Faça login novamente.';
        }
        showToast('warning', message);
        // Continua fluxo: status da solicitação permanece atualizado
      }
    }

    // 3) Atualiza estado local independentemente da criação do usuário
    setLeaderRequests(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
    console.log('✅ Status da solicitação atualizado (UI sincronizada):', id, status);
  };
  
  const addMessage = async (message: Omit<Message, 'id' | 'createdAt' | 'readBy'>) => {
    const newMessage = { 
      ...message, 
      id: crypto.randomUUID(), 
      createdAt: new Date(), 
      readBy: [message.senderId]
    };
    
    try {
      // Prevent save attempts when auth is not stable to avoid permission errors
      if (!auth.currentUser) {
        try { const key = 'fonte:auth-log'; const raw = localStorage.getItem(key); const arr = raw ? JSON.parse(raw) : []; arr.push({ ts: new Date().toISOString(), event: 'blocked-addMessage-no-auth', message: { subject: message.subject || message.content?.slice(0,40) } }); localStorage.setItem(key, JSON.stringify(arr.slice(-200))); } catch(e){}
        console.warn('addMessage blocked: auth.currentUser is null');
        showToast('error', 'Sua sessão não está pronta. Aguarde alguns segundos e tente novamente.');
        return;
      }
      // Mapear recipientIds -> recipientFirebaseUids para cumprir regras de atualização/exclusão
      const recipientFirebaseUids = Array.isArray(newMessage.recipientIds)
        ? newMessage.recipientIds
            .map(rid => authorizedUsers.find(u => u.id === rid)?.firebaseUid)
            .filter((uid): uid is string => Boolean(uid))
        : [];
      const firestoreId = await saveMessageToFirestore({
        ...newMessage,
        // Metadados para regras: mapeia o usuário autenticado como remetente,
        // e permite passar recipientFirebaseUids (se conhecidos) – opcional
        senderFirebaseUid: auth.currentUser.uid,
        recipientFirebaseUids
      } as any);
      const finalMessage = { ...newMessage, id: firestoreId };
      
      // Atualizar estado local
      setMessages(prev => [finalMessage, ...prev]);
      console.log('✅ Mensagem salva no Firestore:', firestoreId);
    } catch (error) {
      console.error('❌ Erro ao salvar mensagem:', error);
      showToast('error', 'Erro ao salvar mensagem: verifique sua autenticação/permissões. A operação não foi salva no servidor.');
      return;
    }
  };
  
  const markMessageAsRead = (messageId: string, userId: string) => {
    setMessages(prev => prev.map(msg => (msg.id === messageId && !msg.readBy.includes(userId)) ? { ...msg, readBy: [...msg.readBy, userId] } : msg));
  };
  
  const getMessagesForUser = (userId: string) => messages
    .filter(msg => 
      (msg.recipientIds.includes(userId) || msg.senderId === userId) &&
      !(Array.isArray(msg.deletedForUserIds) && msg.deletedForUserIds.includes(userId))
    )
    .sort((a,b) => {
        // Tratamento seguro de datas
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime;
    });

  const deleteMessageForUser = async (messageId: string, userId: string) => {
    try {
      const target = messages.find(m => m.id === messageId);
      const current = Array.isArray(target?.deletedForUserIds) ? target!.deletedForUserIds : [];
      const next = Array.from(new Set([...current, userId]));

      // Atualiza no Firestore (exclusão suave)
      await updateMessageInFirestore(messageId, { deletedForUserIds: next });

      // Atualiza estado local imediatamente
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deletedForUserIds: next } as any : m));
      showToast('success', 'Mensagem excluída para você.');
    } catch (error: any) {
      console.error('❌ Erro ao excluir mensagem para usuário:', error);
      let message = 'Erro ao excluir mensagem.';
      if (error?.code === 'permission-denied') message = 'Permissão negada para excluir esta mensagem.';
      if (error?.code === 'unauthenticated') message = 'Sessão expirada. Faça login novamente.';
      showToast('error', message);
    }
  };

  const clearMessagesForUser = async (userId: string, mode: 'inbox' | 'sent') => {
    try {
      const candidates = messages.filter(m => mode === 'sent' ? m.senderId === userId : (m.recipientIds.includes(userId) && m.senderId !== userId));
      const ops = candidates.map(m => {
        const current = Array.isArray(m.deletedForUserIds) ? m.deletedForUserIds : [];
        const next = Array.from(new Set([...current, userId]));
        return updateMessageInFirestore(m.id, { deletedForUserIds: next });
      });
      await Promise.all(ops);
      setMessages(prev => prev.map(m => {
        if (candidates.some(c => c.id === m.id)) {
          const current = Array.isArray(m.deletedForUserIds) ? m.deletedForUserIds : [];
          const next = Array.from(new Set([...current, userId]));
          return { ...m, deletedForUserIds: next } as any;
        }
        return m;
      }));
      showToast('success', 'Mensagens esvaziadas para você.');
    } catch (error: any) {
      console.error('❌ Erro ao esvaziar mensagens:', error);
      let message = 'Erro ao esvaziar mensagens.';
      if (error?.code === 'permission-denied') message = 'Permissão negada para esvaziar mensagens.';
      if (error?.code === 'unauthenticated') message = 'Sessão expirada. Faça login novamente.';
      showToast('error', message);
    }
  };
  
  const addMinistryDepartment = async (group: Omit<MinistryDepartment, 'id'>) => {
    try {
      const id = await saveMinistryDepartmentToFirestore(group);
      // Não atualizar estado local aqui para evitar duplicação.
      // O listener onSnapshot de ministryDepartments sincroniza automaticamente o novo item.
      console.log('✅ Ministério/Departamento salvo no Firestore com sucesso:', group.name, 'ID:', id);
    } catch (error) {
      console.error('❌ Erro ao salvar ministério/departamento:', error);
      showToast('error', 'Erro ao salvar ministério/departamento: verifique sua autenticação/permissões. A operação não foi salva no servidor.');
      return;
    }
  };
  
  const deleteMinistryDepartment = async (id: string) => {
    try {
      await deleteMinistryDepartmentFromFirestore(id);
      setMinistryDepartments(prev => prev.filter(g => g.id !== id));
      console.log('✅ Ministério/Departamento deletado com sucesso:', id);
    } catch (error) {
      console.error('❌ Erro ao deletar ministério/departamento:', error);
      showToast('error', 'Erro ao deletar ministério/departamento: verifique sua autenticação/permissões. A exclusão não foi feita no servidor.');
      return;
    }
  };
  
  const updateLeaderMinistryDepartmentMembership = async (leaderId: string, targetGroupIds: string[]) => {
    try {
      // Identificar apenas os grupos que precisam ser atualizados
      const groupsToUpdate = ministryDepartments.filter(group => {
        const isMember = group.leaderIds.includes(leaderId);
        const shouldBeMember = targetGroupIds.includes(group.id);
        return isMember !== shouldBeMember; // Só atualiza se há mudança
      });

      if (groupsToUpdate.length === 0) {
        console.log('ℹ️ Nenhuma mudança necessária nas associações de ministério/departamento');
        return;
      }

      // Atualizar apenas os grupos que mudaram no Firestore
      const updatePromises = groupsToUpdate.map(async (group) => {
        const isMember = group.leaderIds.includes(leaderId);
        const shouldBeMember = targetGroupIds.includes(group.id);
        
        if (isMember && !shouldBeMember) {
          // Remover usuário do grupo
          const updatedLeaderIds = group.leaderIds.filter(id => id !== leaderId);
          await updateMinistryDepartmentInFirestore(group.id, { leaderIds: updatedLeaderIds });
          return { ...group, leaderIds: updatedLeaderIds };
        } else if (!isMember && shouldBeMember) {
          // Adicionar usuário ao grupo
          const updatedLeaderIds = [...group.leaderIds, leaderId];
          await updateMinistryDepartmentInFirestore(group.id, { leaderIds: updatedLeaderIds });
          return { ...group, leaderIds: updatedLeaderIds };
        }
        return group;
      });

      const updatedGroups = await Promise.all(updatePromises);
      
      // Atualizar estado local apenas para os grupos modificados
      setMinistryDepartments(prevGroups => prevGroups.map(group => {
        const updatedGroup = updatedGroups.find(ug => ug.id === group.id);
        return updatedGroup || group;
      }));
      
      console.log(`✅ ${groupsToUpdate.length} associações de ministério/departamento atualizadas no Firestore para usuário:`, leaderId);
    } catch (error) {
      console.error('❌ Erro ao atualizar associações de ministério/departamento:', error);
      showToast('error', 'Erro ao atualizar associações de ministério/departamento: verifique sua autenticação/permissões. As alterações não foram aplicadas no servidor.');
      return;
    }
  };

  const addScript = async (script: Omit<Script, 'id' | 'createdAt' | 'updatedAt' | 'history'>, authorId: string) => {
    try {
      console.log('🚀 Iniciando criação de script:', script);
      
      // Debug da autenticação
      const authDebugInfo = debugAuth();
      console.log('🔍 Auth Debug Info:', authDebugInfo);
      
      // Verificar se o usuário está autenticado no Firebase
      if (!auth.currentUser) {
        console.error('❌ Usuário não autenticado no Firebase');
        console.error('❌ Auth state:', authDebugInfo);
        showToast('error', 'Usuário não autenticado. Faça login novamente.');
        return;
      }
      
      console.log('✅ Usuário autenticado no Firebase:', auth.currentUser.uid);
      
      const now = new Date();
      // Preparar payload sem ID para deixar o Firestore gerar o ID
      const newScriptPayload: Omit<Script, 'id'> = {
        ...script,
        createdAt: now,
        updatedAt: now,
        history: [{ userId: authorId, date: now }],
        attachments: [],
      } as any;

      console.log('📝 Script preparado (sem ID):', newScriptPayload);

      // Salvar no Firestore – o onSnapshot irá atualizar o estado automaticamente
      const firestoreId = await saveScriptToFirestore(newScriptPayload as any);
      console.log('✅ Script salvo no Firestore com ID:', firestoreId);
      console.log('📡 O listener onSnapshot irá sincronizar automaticamente o novo roteiro');
      
      showToast('success', 'Roteiro criado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao criar script:', error);
      console.error('❌ Detalhes do erro:', error.message);
      console.error('❌ Stack trace:', error.stack);
      showToast('error', `Erro ao criar script: ${error.message}`);
    }
  };

  const updateScript = async (id: string, updatedFields: Partial<Omit<Script, 'id' | 'createdAt' | 'updatedAt' | 'history'>>, authorId: string) => {
    const now = new Date();
    const newHistoryEntry: ScriptHistoryEntry = { userId: authorId, date: now };
    const updates = { ...updatedFields, updatedAt: now, history: [...(scripts.find(s => s.id === id)?.history || []), newHistoryEntry] };
    
    try {
      // Atualizar no Firestore
      await updateScriptInFirestore(id, updates);
      
      // Atualizar estado local
      setScripts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      console.log('✅ Script atualizado no Firestore:', id);
    } catch (error) {
      console.error('❌ Erro ao atualizar script:', error);
      showToast('error', 'Erro ao atualizar roteiro: verifique sua autenticação/permissões. A atualização não foi aplicada no servidor.');
      return;
    }
  };

  const deleteScript = async (id: string) => {
    try {
      console.log('🗑️ [AppContext] Iniciando exclusão de roteiro:', id);
      
      // Deletar do Firestore com verificação de permissões
      await deleteScriptFromFirestore(id);
      
      console.log('✅ [AppContext] Roteiro excluído com sucesso do Firestore:', id);
      
      // 🔧 CORREÇÃO: Atualização forçada do estado local após exclusão bem-sucedida
      console.log('🔄 [AppContext] Forçando atualização do estado local - removendo roteiro:', id);
      setScripts(prev => {
        const updated = prev.filter(script => script.id !== id);
        console.log('✅ [AppContext] Estado local atualizado - roteiros restantes:', updated.length);
        return updated;
      });
      
      showToast('success', 'Roteiro excluído com sucesso!');
    } catch (error: any) {
      console.error('❌ [AppContext] Erro ao excluir roteiro:', error);
      
      // Tratar diferentes tipos de erro com mensagens específicas
      let errorMessage = 'Erro inesperado ao excluir roteiro.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Você não tem permissão para excluir roteiros.';
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'Sua sessão expirou. Faça login novamente.';
      }
      
      showToast('error', errorMessage);
      return;
    }
  };
  const getScriptById = (id: string) => scripts.find(s => s.id === id);

  const showConfirmation = useCallback((title: string, message: string, onConfirm: () => void) => setConfirmation({ isOpen: true, title, message, onConfirm: () => { onConfirm(); hideConfirmation(); } }), []);
  const hideConfirmation = useCallback(() => setConfirmation(prev => ({ ...prev, isOpen: false })), []);

  const showInputPrompt = useCallback((title: string, message: string, inputLabel: string, onConfirm: (value: string) => void) => setInputPrompt({ isOpen: true, title, message, inputLabel, onConfirm: (value: string) => { onConfirm(value); hideInputPrompt(); } }), []);
  const hideInputPrompt = useCallback(() => setInputPrompt(prev => ({ ...prev, isOpen: false })), []);
  
  const showComposeMessage = useCallback((replyTo?: Message) => setComposeMessage({ isOpen: true, replyTo }), []);
  const hideComposeMessage = useCallback(() => setComposeMessage({ isOpen: false }), []);

  const toggleVideoModal = useCallback((isOpen: boolean, override?: VideoNewsSettings | null) => {
    setIsVideoModalOpen(isOpen);
    if (isOpen && override) {
      setVideoSettingsOverride(override);
    }
    if (!isOpen) {
      setVideoSettingsOverride(null);
    }
  }, []);

  const showScriptView = useCallback((script: Script) => setScriptView({ isOpen: true, script }), []);
  const hideScriptView = useCallback(() => setScriptView({ isOpen: false, script: null }), []);

  return (
    <AppContext.Provider value={{ announcements, cultos, scripts, settings, authorizedUsers, leaderRequests, messages, ministryDepartments, onlineUserIds, isLoading, setOnlineStatus, addAnnouncement, updateAnnouncement, deleteAnnouncement, updateSettings, getAnnouncementById, getOccurrences, addCulto, updateCulto, deleteCulto, addAuthorizedUser, updateAuthorizedUser, removeAuthorizedUser, getAuthorizedUserById, addLeaderRequest, updateLeaderRequestStatus, addMessage, markMessageAsRead, getMessagesForUser, deleteMessageForUser, clearMessagesForUser, addMinistryDepartment, deleteMinistryDepartment, updateLeaderMinistryDepartmentMembership, addScript, updateScript, deleteScript, getScriptById, confirmation, showConfirmation, hideConfirmation, inputPrompt, showInputPrompt, hideInputPrompt, composeMessage, showComposeMessage, hideComposeMessage, isVideoModalOpen, videoSettingsOverride, toggleVideoModal, scriptView, showScriptView, hideScriptView }}>
      {children}
    </AppContext.Provider>
  );
};
