import React from 'react';

type PedidoIconProps = {
  className?: string;
  title?: string;
};

const PedidoIcon: React.FC<PedidoIconProps> = ({ className, title }) => {
  const style: React.CSSProperties = {
    backgroundColor: 'currentColor',
    WebkitMaskImage: 'url(/icone-pedido.svg)',
    maskImage: 'url(/icone-pedido.svg)',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'cover',
    maskSize: 'cover',
    display: 'inline-block',
  };

  return (
    <span
      role="img"
      aria-label={title || 'Ícone Pedido de Oração'}
      className={className}
      style={style}
    />
  );
};

export default PedidoIcon;