import React from 'react';

type Props = React.HTMLAttributes<HTMLSpanElement> & { size?: number };

const TransbordeIcon: React.FC<Props> = ({ className, style, size = 20, ...rest }) => {
  const finalStyle: React.CSSProperties = {
    display: 'inline-block',
    width: size,
    height: size,
    backgroundColor: 'currentColor',
    WebkitMask: "url('/Transborde-icon-02.svg') center / contain no-repeat",
    mask: "url('/Transborde-icon-02.svg') center / contain no-repeat",
    ...style,
  };
  return <span aria-hidden="true" className={className} style={finalStyle} {...rest} />;
};

export default TransbordeIcon;
