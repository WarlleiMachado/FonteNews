import React from 'react';
import { useMaintenance } from '../../contexts/MaintenanceContext';
import { ArrowRight, Clock, Mail, ExternalLink } from 'lucide-react';

/**
 * Componente de manutenção para overlay fullscreen
 * Versão simplificada sem redirecionamento para uso como overlay
 */
const MaintenanceOverlay: React.FC = () => {
  const { config } = useMaintenance();

  // Funções auxiliares para estilos
  const getVerticalAlign = () => {
    switch (config.verticalAlign) {
      case 'top': return 'items-start pt-20';
      case 'bottom': return 'items-end pb-20';
      default: return 'items-center';
    }
  };

  const getTextAlign = () => {
    switch (config.titleAlign) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      default: return 'text-center';
    }
  };

  const getTitleSize = () => {
    switch (config.titleSize) {
      case 'small': return 'text-2xl md:text-3xl';
      case 'large': return 'text-5xl md:text-6xl';
      default: return 'text-4xl md:text-5xl';
    }
  };

  const getDescriptionSize = () => {
    switch (config.descriptionSize) {
      case 'small': return 'text-sm md:text-base';
      case 'large': return 'text-lg md:text-xl';
      default: return 'text-base md:text-lg';
    }
  };

  const getTitleWeight = () => {
    switch (config.titleWeight) {
      case 'normal': return 'font-normal';
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
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
      default: return 'max-w-3xl';
    }
  };

  const getLogoSize = () => {
    switch (config.logoSize) {
      case 'small': return 'h-16';
      case 'large': return 'h-32';
      default: return 'h-24';
    }
  };

  // Calcular countdown
  const calculateCountdown = () => {
    if (!config.showCountdown || !config.countdownDate) return null;
    
    const now = new Date().getTime();
    const targetDate = new Date(config.countdownDate).getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isFinished: false };
  };

  const countdown = calculateCountdown();

  // Log para debug da header image
  console.log('[MaintenanceOverlay] HeaderImageUrl:', config.headerImageUrl);
  console.log('[MaintenanceOverlay] Tem HeaderImageUrl?', !!config.headerImageUrl);

  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{
        backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : 'none',
        backgroundColor: config.backgroundColor,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay */}
      {config.overlayImage && (
        <div 
          className="absolute inset-0 z-[9998]"
          style={{
            backgroundImage: `url(${config.overlayImage})`,
            opacity: config.overlayOpacity,
            backgroundSize: 'repeat',
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
                console.error('❌ [MaintenanceOverlay] Erro ao carregar header image:', config.headerImageUrl);
                e.currentTarget.style.display = 'none';
              }}
              onLoad={() => {
                console.log('✅ [MaintenanceOverlay] Header image carregada com sucesso:', config.headerImageUrl);
              }}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`relative z-10 min-h-screen flex items-center ${getVerticalAlign()}`} style={{ pointerEvents: 'auto' }}>
        <div className={`${getMaxWidth()} mx-auto px-4 sm:px-6 lg:px-8 w-full`}>
          <div className={`${getTextAlign()} space-y-8`}>
            {/* Logo */}
            {config.showLogo && config.logoImage && (
              <div className="flex justify-center">
                <img 
                  src={config.logoImage} 
                  alt="Logo" 
                  className={`${getLogoSize()} object-contain`}
                />
              </div>
            )}

            {/* Title */}
            <h1 
              className={`${getTitleSize()} ${getTitleWeight()} ${config.textShadow ? 'text-shadow' : ''}`}
              style={{ color: config.titleColor }}
            >
              {config.title}
            </h1>

            {/* Description */}
            {config.description && (
              <p 
                className={`${getDescriptionSize()} ${getDescriptionWeight()} ${config.textShadow ? 'text-shadow' : ''}`}
                style={{ color: config.descriptionColor }}
              >
                {config.description}
              </p>
            )}

            {/* Countdown */}
            {countdown && !countdown.isFinished && (
              <div className="flex justify-center">
                <div className="bg-black bg-opacity-50 rounded-lg p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-2 text-white mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">{config.countdownText || 'Tempo restante'}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center text-white">
                    <div>
                      <div className="text-2xl md:text-3xl font-bold">{countdown.days}</div>
                      <div className="text-xs opacity-75">Dias</div>
                    </div>
                    <div>
                      <div className="text-2xl md:text-3xl font-bold">{countdown.hours}</div>
                      <div className="text-xs opacity-75">Horas</div>
                    </div>
                    <div>
                      <div className="text-2xl md:text-3xl font-bold">{countdown.minutes}</div>
                      <div className="text-xs opacity-75">Min</div>
                    </div>
                    <div>
                      <div className="text-2xl md:text-3xl font-bold">{countdown.seconds}</div>
                      <div className="text-xs opacity-75">Seg</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              {config.buttons.filter(btn => btn.showButton).map((button, index) => (
                <a
                  key={index}
                  href={button.url}
                  target={button.openNewTab ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: button.backgroundColor,
                    color: button.textColor,
                    border: button.borderColor ? `2px solid ${button.borderColor}` : 'none',
                  }}
                >
                  {button.text}
                  {button.openNewTab && <ExternalLink className="w-4 h-4" />}
                </a>
              ))}
            </div>

            {/* Custom HTML */}
            {config.customHTML && (
              <div 
                className="prose prose-lg mx-auto text-white"
                dangerouslySetInnerHTML={{ __html: config.customHTML }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      {config.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: config.customCSS }} />
      )}
    </div>
  );
};

export default MaintenanceOverlay;