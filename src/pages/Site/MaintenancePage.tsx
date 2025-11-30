import React from 'react';
import { useMaintenance } from '../../contexts/MaintenanceContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Mail, ExternalLink } from 'lucide-react';

interface MaintenancePageProps {
  isPreview?: boolean;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ isPreview = false }) => {
  const { config } = useMaintenance();
  const navigate = useNavigate();

  // Verificar configuração da logo
  console.log(`[MaintenancePage] ===== INICIANDO RENDERIZAÇÃO =====`);
  console.log(`[MaintenancePage] Modo: ${isPreview ? 'PREVIEW' : 'PRODUÇÃO'}`);
  console.log(`[MaintenancePage] HeaderImageUrl:`, config.headerImageUrl);
  console.log(`[MaintenancePage] Tem HeaderImageUrl?`, !!config.headerImageUrl);
  console.log(`[MaintenancePage] HeaderImageUrl length:`, config.headerImageUrl?.length);
  console.log(`[MaintenancePage] HeaderImageUrl type:`, typeof config.headerImageUrl);
  console.log(`[MaintenancePage] HeaderImageUrl primeiro chars:`, config.headerImageUrl?.substring(0, 50));
  console.log(`[MaintenancePage] Config completo:`, JSON.stringify(config, null, 2));

  // Se o redirecionamento estiver ativo e houver URL, redirecionar imediatamente
  // Mas apenas se não estivermos na página de manutenção por URL direta e não for preview
  if (config.useRedirect && config.redirectUrl && !window.location.pathname.includes('/site/maintenance') && !isPreview) {
    console.log('[MaintenancePage] Redirecionando para:', config.redirectUrl);
    window.location.href = config.redirectUrl;
    return null;
  }

  const getTextAlign = () => {
    switch (config.contentAlignment) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      default: return 'text-center';
    }
  };

  const getVerticalAlign = () => {
    switch (config.verticalAlignment) {
      case 'top': return 'justify-start pt-20';
      case 'bottom': return 'justify-end pb-20';
      default: return 'justify-center';
    }
  };

  const getMaxWidth = () => {
    switch (config.containerMaxWidth) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      case '3xl': return 'max-w-3xl';
      case '4xl': return 'max-w-4xl';
      case '5xl': return 'max-w-5xl';
      case '6xl': return 'max-w-6xl';
      case '7xl': return 'max-w-7xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-4xl';
    }
  };

  const getLogoSize = () => {
    switch (config.logoSize) {
      case 'sm': return 'h-12';
      case 'md': return 'h-16';
      case 'lg': return 'h-20';
      case 'xl': return 'h-24';
      default: return 'h-16';
    }
  };

  const getTitleSize = () => {
    switch (config.titleSize) {
      case 'xs': return 'text-xs';
      case 'sm': return 'text-sm';
      case 'base': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case '2xl': return 'text-2xl';
      case '3xl': return 'text-3xl';
      case '4xl': return 'text-4xl';
      case '5xl': return 'text-5xl';
      case '6xl': return 'text-6xl';
      default: return 'text-4xl';
    }
  };

  const getDescriptionSize = () => {
    switch (config.descriptionSize) {
      case 'xs': return 'text-xs';
      case 'sm': return 'text-sm';
      case 'base': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case '2xl': return 'text-2xl';
      default: return 'text-xl';
    }
  };

  const getTitleWeight = () => {
    switch (config.titleWeight) {
      case 'normal': return 'font-normal';
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      case 'extrabold': return 'font-extrabold';
      default: return 'font-bold';
    }
  };

  const getDescriptionWeight = () => {
    switch (config.descriptionWeight) {
      case 'normal': return 'font-normal';
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      default: return 'font-normal';
    }
  };

  const calculateCountdown = () => {
    if (!config.showCountdown || !config.countdownDate) return null;
    
    const targetDate = new Date(config.countdownDate);
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  };

  const countdown = calculateCountdown();

  return (
    <div 
      className="fixed inset-0 z-[9998] overflow-hidden"
      style={{ 
        backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : 'none',
        backgroundColor: config.backgroundColor,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay */}
      {config.overlayImage && (
        <div 
          className="absolute inset-0 z-[9998]"
          style={{
            backgroundImage: `url(${config.overlayImage})`,
            opacity: config.overlayOpacity,
            backgroundSize: 'repeat'
          }}
        />
      )}

      {/* Backdrop blur */}
      {config.backdropBlur && (
        <div className="absolute inset-0 z-[9997] backdrop-blur-sm bg-black bg-opacity-30" />
      )}

      {/* Header Image - Acima de tudo com z-index 9999 */}
      {config.headerImageUrl && (
        <div className="fixed inset-x-0 top-20 flex justify-center pointer-events-none z-[9999]">
          <div className="text-center pointer-events-auto">
            <img 
              src={config.headerImageUrl.trim()} 
              alt="Header Image" 
              className="max-h-32 max-w-full object-contain"
              style={{ 
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
              }}
              onError={(e) => {
                console.error('❌ [MaintenancePage] Erro ao carregar header image:', config.headerImageUrl);
                e.currentTarget.style.display = 'none';
              }}
              onLoad={() => {
                console.log('✅ [MaintenancePage] Header image carregada com sucesso:', config.headerImageUrl);
              }}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`relative z-10 min-h-screen flex items-center ${getVerticalAlign()}`} style={{ pointerEvents: 'auto' }}>
        <div className={`${getMaxWidth()} mx-auto px-4 sm:px-6 lg:px-8 w-full`}>
          <div className={`${getTextAlign()} space-y-8`}>
            {/* Title */}
            <h1 
              className={`${getTitleSize()} ${getTitleWeight()} ${config.textShadow ? 'text-shadow' : ''}`}
              style={{ color: config.titleColor }}
              dangerouslySetInnerHTML={{ __html: config.title }}
            />

            {/* Description */}
            <p 
              className={`${getDescriptionSize()} ${getDescriptionWeight()} ${config.textShadow ? 'text-shadow' : ''}`}
              style={{ color: config.descriptionColor }}
              dangerouslySetInnerHTML={{ __html: config.description }}
            />

            {/* Countdown */}
            {config.showCountdown && countdown && (
              <div className="flex justify-center space-x-4">
                {countdown.days > 0 && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{countdown.days}</div>
                    <div className="text-sm text-gray-300">dias</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{countdown.hours}</div>
                  <div className="text-sm text-gray-300">horas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{countdown.minutes}</div>
                  <div className="text-sm text-gray-300">min</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{countdown.seconds}</div>
                  <div className="text-sm text-gray-300">seg</div>
                </div>
              </div>
            )}

            {/* Buttons */}
            {config.buttons.filter(btn => btn.showButton).length > 0 && (
              <div className="flex flex-wrap justify-center gap-4">
                {config.buttons.filter(btn => btn.showButton).map((button) => (
                  <a
                    key={button.id}
                    href={button.url}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
                    style={{
                      backgroundColor: button.backgroundColor,
                      color: button.textColor,
                    }}
                  >
                    {button.url.startsWith('mailto:') && <Mail size={16} />}
                    {button.url.startsWith('http') && <ExternalLink size={16} />}
                    {!button.url.startsWith('mailto:') && !button.url.startsWith('http') && <ArrowRight size={16} />}
                    {button.text}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      {config.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: config.customCSS }} />
      )}

      <style jsx>{`
        .text-shadow {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
};

export default MaintenancePage;
