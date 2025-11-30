// --- CONSTANTS ---
export const ANNOUNCEMENT_TYPES = ['aviso', 'evento', 'retiro', 'jantar', 'visita', 'evangelismo', 'audicao', 'curso', 'confraternizacao', 'jornada-vida'] as const;

// --- TYPES ---
export type AnnouncementType = typeof ANNOUNCEMENT_TYPES[number];
export type UserRole = 'admin' | 'editor' | 'leader';
export type ScriptStatus = 'rascunho' | 'pronto' | 'revisado';

// --- INTERFACES ---
export interface TickerSettings {
  enabled: boolean;
  direction: 'left' | 'right';
  scope: 'week' | 'month' | 'year';
  speed: number; // 1 (slow) to 100 (fast)
  // Pausas na animação do ticker (segundos)
  startDelaySec?: number; // pausa antes de começar a mover
  restartDelaySec?: number; // pausa ao final antes do próximo ciclo
}

export interface VideoNewsSettings {
  enabled: boolean;
  sourceType: 'youtube' | 'url';
  url: string;
}

// Configurações do YouTube Live (indicador e player de fundo)
export interface YouTubeLiveSettings {
  enabled: boolean; // habilitar indicador e tile 16:9
  apiKey?: string; // YouTube Data API v3
  channelId?: string; // ID do canal
  cacheSeconds?: number; // duração do cache local (segundos)
  forceVideoId?: string; // opcional: força um ID específico (11 chars)
  // Reprodução de fundo no tile (autoplay e mudo)
  backgroundAutoplayMuted?: boolean; // padrão true
  backgroundOpacity?: number; // 0 a 1 (padrão 1.0)
  hideBackgroundOnPopup?: boolean; // oculta reprodução de fundo quando pop-up está aberto
  monthlyLimit?: number; // limite informativo de chamadas à API (controle local)
}

export interface AwarenessCalendarSettings {
  text?: string;
  imageSource?: 'url' | 'upload';
  imageUrl?: string;        // quando selecionado URL
  imageUploadUrl?: string;  // quando feito upload (Storage)
  priorityEnabled?: boolean; // quando ligado, tem prioridade sobre o conteúdo normal
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  // Versão rica (HTML sanitizado) do conteúdo, quando disponível
  contentHtml?: string;
  type: string; // dinâmico via Taxonomias ('tipo')
  rruleString: string;
  endTime?: string;
  author: string;
  authorId: string;
  ministry?: string; 
  image?: string;
  destaqueCountdownUrl?: string;
  // Vídeo associado à programação
  videoUrl?: string;
  // Indica se está ao vivo
  isLive?: boolean;
  priority: string; // dinâmico via Taxonomias ('prioridade')
  status: 'pending' | 'approved' | 'rejected';
  // Flag para diferenciar pendências por restauração de pendências normais
  restoreRequested?: boolean;
  createdAt: Date;
}

export interface Culto {
  id: string;
  title: string;
  description: string;
  // Versão rica (HTML sanitizado) da descrição, quando disponível
  descriptionHtml?: string;
  rruleString: string;
  endTime?: string;
  image?: string;
  destaqueCountdownUrl?: string;
  // Vídeo associado ao culto
  videoUrl?: string;
  // Indica se está ao vivo
  isLive?: boolean;
  // Taxonomias (tema/tópico) opcionais para organização
  temaId?: string;
  topicoId?: string;
  temaName?: string;
  topicoName?: string;
}

export interface ChurchSettings {
  logoUrl: string;
  churchName: string;
  cultosLogoUrl: string;
  primaryColor: string;
  titleGradient?: {
    enabled: boolean;
    from: string;
    via: string;
    to: string;
    durationSec?: number;
  };
  copyrightText: string;
  parallaxBgUrl?: string;
  newsHighlightImages?: string[];
  newsHighlightOptions?: {
    effect: 'fade' | 'slide';
    durationSec: number;
  };
  countdownOverlayEnabled?: boolean;
  countdownOverlayCycle?: {
    visibleSec: number; // duração exibida
    hiddenSec: number;  // duração oculto
    fadeInSec: number;  // duração do fade-in
    fadeOutSec: number; // duração do fade-out
  };
  // URLs para alertas sonoros (MP3)
  audioAlertChatUrl?: string;
  audioAlertChatName?: string;
  audioAlertApprovalsUrl?: string;
  audioAlertApprovalsName?: string;
  audioAlertRequestsUrl?: string;
  audioAlertRequestsName?: string;
  // Áudio para início de programação (limite 30s)
  programStartAudioUrl?: string;
  programStartAudioName?: string;
  programStartAudioMuted?: boolean;
  awarenessCalendar?: AwarenessCalendarSettings;
  // Página externa com Slider (WordPress Revolution Slider)
  sliderUrl?: string;
  // Intervalo de auto-atualização do slider (minutos) para cache-busting
  sliderAutoRefreshMinutes?: number;
  // Altura fixa do iframe em pixels
  sliderHeight?: number;
  // Rolagem por botões do Slider (via postMessage)
  sliderScrollEnabled?: boolean; // habilita a escuta de mensagens para rolagem
  sliderMessageOrigin?: string; // origem esperada do iframe (ex.: https://seuwordpress.com)
  sliderScrollAnchors?: SiteScrollAnchor[]; // mapeamento de âncoras
  contactInfo: {
    email: string;
    phone: string;
    address: string;
    services: string;
  };
  tickerSettings: TickerSettings;
  videoNewsSettings: VideoNewsSettings;
  youtubeLive?: YouTubeLiveSettings; // novo bloco de configurações do YouTube Live
  // Configurações da Página Início (contêiners e sobreposição de fundo)
  siteHome?: SiteHomeSettings;
  // Aparência do Líder-Chat (cores e imagem de sobreposição)
  leaderChatAppearance?: LeaderChatAppearanceSettings;
  // Removido: Configurações da Bíblia
  
  // Modo Manutenção Global
  maintenanceMode?: {
    enabled: boolean;
    redirectMode?: boolean;
    redirectUrl?: string;
    // Campos visuais do modo manutenção
    title?: string;
    description?: string;
    backgroundImage?: string;
    overlayImage?: string;
    backgroundColor?: string;
    overlayColor?: string;
    textColor?: string;
    titleSize?: string;
    descriptionSize?: string;
    titleAlign?: string;
    descriptionAlign?: string;
    titleWeight?: string;
    descriptionWeight?: string;
    showCountdown?: boolean;
    countdownDate?: string;
    countdownText?: string;
    buttons?: any[];
    containerMaxWidth?: string;
    verticalAlignment?: string;
    overlayOpacity?: number;
    overlayBlur?: number;
    customCSS?: string;
    customHTML?: string;
    contentAlignment?: string;
    titleColor?: string;
    descriptionColor?: string;
    textShadow?: boolean;
    backdropBlur?: boolean;
    showLogo?: boolean;
    logoUrl?: string;
    logoSize?: string;
    headerImageUrl?: string; // ADICIONADO: Campo crucial!
  };
}

// Removidos: Tipos relacionados à Bíblia e TTS

export interface AuthorizedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  password?: string;
  avatarUrl?: string;
  firebaseUid?: string;
  status: 'active' | 'blocked' | 'inactive';
  createdAt: Date;
  isProtected?: boolean;
}

export interface User extends Omit<AuthorizedUser, 'password' | 'status' | 'createdAt' | 'isProtected'> {}


export interface LeaderRequest {
    id: string;
    name: string;
    email: string;
    phone: string;
    ministry: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
}

export interface Message {
    id: string;
    subject: string;
    body: string;
    senderId: string;
    recipientIds: string[];
    createdAt: Date;
    readBy: string[];
    // Campos auxiliares (opcionais) para regras e exclusão suave
    senderFirebaseUid?: string;
    recipientFirebaseUids?: string[];
    deletedForUserIds?: string[];
}

export interface MinistryDepartment {
  id: string;
  name: string;
  leaderIds: string[];
  // Campos adicionais para exibição no Site
  slug?: string; // para URL amigável
  description?: string;
  logoUrl?: string; // logo pequena
  highlightUrl?: string; // imagem de destaque (quadrada compacta ou hero expandido)
  colorHex?: string; // cor opcional para etiquetas/realces
  order?: number; // ordenação manual
  active?: boolean; // controle de visibilidade
  // Configurações de degradê do herói nas subpáginas
  gradientHeightPx?: number; // altura do degradê na base da imagem
  gradientIntensityPercent?: number; // quão "forte" é o degradê (0–100)
}

export interface ScriptHistoryEntry {
  userId: string;
  date: Date;
}

export interface ScriptAttachment {
  name: string;
  url: string;
}

export interface Script {
  id: string;
  title: string;
  content: string;
  rruleString: string;
  endTime?: string;
  status: ScriptStatus;
  authorId: string;
  image?: string;
  recordingMonth: string;
  history: ScriptHistoryEntry[];
  attachments: ScriptAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

// Pedido de Oração
export type PrayerStatus = 'pending' | 'approved' | 'rejected' | 'archived' | 'active';

export interface PrayerRequest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  motif: string; // motivo
  motifOther?: string;
  wantsVisit?: boolean;
  // Vínculo com a Igreja (origem do solicitante)
  affiliation?: 'membro' | 'visitante' | 'outro';
  address?: {
    street?: string;
    number?: string;
    district?: string;
    city?: string;
    state?: string;
  };
  isPrivate?: boolean; // pedido privado (conteúdo visível apenas a administradores no mural público)
  hideName?: boolean; // ocultar nome público (Reservado)
  text: string; // pedido
  imageUrl?: string;
  ownerUserId?: string; // uid firebase
  status: PrayerStatus;
  prayCount: number;
  prayedBy?: string[]; // firebase uids
  prayedByAnon?: string[]; // ids anônimos persistidos no navegador
  createdAt: Date;
}

export interface PrayerComment {
  id: string;
  prayerId: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  text: string;
  createdAt: Date;
}

export interface PrayerSettings {
  prayersPerPage: number;
  hideArchivedOnWall: boolean;
  allowUnpray: boolean;
  heartIconFilledUrl?: string;
  heartIconOutlineUrl?: string;
  notificationEmails: string[];
  // Plano de fundo do Mural de Oração
  bgImageSource?: 'url' | 'upload' | 'plugin';
  bgImageUrl?: string;
  bgImageUploadUrl?: string;
  bgRepeat?: boolean; // repetir imagem
  bgSize?: 'auto' | 'cover' | 'contain'; // estender (cover), conter, auto
  bgPosition?: 'top' | 'center' | 'bottom';
  bgOpacity?: number; // 0 a 1
  // Cores dos motivos (slug -> hex/rgb)
  motifColors?: Record<string, string>;
}

// Configurações da Página Início
export interface SiteHomeSettings {
  // Sobreposição de fundo do primeiro contêiner
  bgImageSource?: 'url' | 'upload';
  bgImageUrl?: string;          // quando selecionado URL
  bgImageUploadUrl?: string;    // quando feito upload (Storage)
  bgRepeat?: boolean;           // repetir imagem
  bgSize?: 'auto' | 'cover' | 'contain'; // estender (cover), conter, auto
  bgPosition?: 'top' | 'center' | 'bottom';
  bgOpacity?: number;           // 0 a 1
  // Layout do primeiro contêiner (1 linha, 2 colunas)
  leftColSpan?: number;         // 1–12 (padrão 4)
  rightColSpan?: number;        // 1–12 (padrão 8)
}

export interface LeaderChatAppearanceSettings {
  messageSentBgColorHex?: string;
  messageReceivedBgColorHex?: string;
  messageSentTextColorHex?: string;
  messageReceivedTextColorHex?: string;
  overlayImageSource?: 'url' | 'upload';
  overlayImageUrl?: string;          // quando selecionado URL
  overlayImageUploadUrl?: string;    // quando feito upload (Storage)
  overlayRepeat?: boolean;           // repetir imagem
  overlaySize?: 'auto' | 'cover' | 'contain'; // estender (cover), conter, auto
  overlayPosition?: 'top' | 'center' | 'bottom';
  overlayOpacity?: number;           // 0 a 1
}

// Âncora de rolagem para integração com botões do Slider externo (WordPress)
export interface SiteScrollAnchor {
  key: string;        // chave usada no postMessage (anchorKey)
  selector: string;   // seletor CSS para localizar o alvo (ex.: #agenda, .secao-contatos)
  offsetPx?: number;  // ajuste de deslocamento (considerar header fixo)
  title?: string;     // rótulo amigável
  enabled?: boolean;  // controle de ativação
}
