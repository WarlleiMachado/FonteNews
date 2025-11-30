export interface MaintenanceButton {
  id: string;
  text: string;
  url: string;
  backgroundColor: string;
  textColor: string;
  showButton: boolean;
}

export interface MaintenanceConfig {
  isActive: boolean;
  useRedirect: boolean;
  redirectUrl: string;
  backgroundImage: string;
  overlayImage: string;
  overlayOpacity: number;
  backgroundColor: string;
  title: string;
  titleSize: string;
  titleColor: string;
  titleWeight: string;
  description: string;
  descriptionSize: string;
  descriptionColor: string;
  descriptionWeight: string;
  contentAlignment: 'left' | 'center' | 'right';
  verticalAlignment: 'top' | 'center' | 'bottom';
  buttons: MaintenanceButton[];
  showLogo: boolean; // Campo antigo - mantido para compatibilidade
  logoUrl: string; // Campo antigo - mantido para compatibilidade
  logoSize: string; // Campo antigo - mantido para compatibilidade
  headerImageUrl: string; // NOVO CAMPO para header image
  containerMaxWidth: string;
  textShadow: boolean;
  backdropBlur: boolean;
  showCountdown: boolean;
  countdownDate: string;
  customCSS: string;
}

export const defaultMaintenanceConfig: MaintenanceConfig = {
  isActive: false,
  useRedirect: false,
  redirectUrl: '',
  backgroundImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
  overlayImage: '',
  overlayOpacity: 0.3,
  backgroundColor: '#1a1a2e',
  title: 'Estamos em Manutenção',
  titleSize: '4xl',
  titleColor: '#ffffff',
  titleWeight: 'bold',
  description: 'Nosso site está passando por melhorias. Voltaremos em breve com novidades incríveis!',
  descriptionSize: 'xl',
  descriptionColor: '#e0e0e0',
  descriptionWeight: 'normal',
  contentAlignment: 'center',
  verticalAlignment: 'center',
  buttons: [
    {
      id: '1',
      text: 'Entre em Contato',
      url: 'mailto:contato@exemplo.com',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      showButton: true,
    },
  ],
  showLogo: false, // Campo antigo
  logoUrl: '', // Campo antigo
  logoSize: 'md', // Campo antigo
  headerImageUrl: '', // NOVO CAMPO
  containerMaxWidth: '4xl',
  textShadow: true,
  backdropBlur: true,
  showCountdown: false,
  countdownDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  customCSS: '',
};