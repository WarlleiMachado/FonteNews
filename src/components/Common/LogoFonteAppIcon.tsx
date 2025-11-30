import React from 'react';

type LogoFonteAppIconProps = {
  className?: string;
  title?: string;
};

// Usa máscara baseada no SVG público para herdar a cor atual (currentColor)
const LogoFonteAppIcon: React.FC<LogoFonteAppIconProps> = ({ className, title }) => {
  const style: React.CSSProperties = {
    backgroundColor: 'currentColor',
    WebkitMaskImage: 'url(/Logo-Fonte-App.svg)',
    maskImage: 'url(/Logo-Fonte-App.svg)',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    display: 'inline-block',
  };

  return (
    <span
      role="img"
      aria-label={title || 'Logo Fonte App'}
      className={className}
      style={style}
    />
  );
};

export default LogoFonteAppIcon;