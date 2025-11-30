// Tipos do slider LegacyFSC (compatíveis com o legado)
export interface SlideData {
  category?: string;
  title: string;
  link?: string;
  target?: '_self' | '_blank';
  image?: string; // imagem principal
  background?: string; // opcional: background separado
  // Novos campos para contraste e fallback de fundo
  fontColor?: string;
  bgColor?: string;
  email?: string; // email de contato por slide
}

export interface SettingsData {
  transition_time?: number; // em ms
  enable_particles?: boolean; // ignorado no LegacyFSC
  enable_spotlight?: boolean; // ignorado no LegacyFSC
  pause_on_hover?: boolean; // pausa autoplay ao passar mouse
  background_image?: string;
  contact_email?: string;
  email_color?: string;
}

export interface FsData {
  slides: SlideData[];
  settings?: SettingsData;
}