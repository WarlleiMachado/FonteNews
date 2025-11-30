import React from 'react';

const OndeEstamosIcon: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, style, ...rest }) => {
  const finalStyle: React.CSSProperties = {
    display: 'inline-block',
    backgroundColor: 'currentColor',
    WebkitMask: "url('/onde-estamos.svg') center / contain no-repeat",
    mask: "url('/onde-estamos.svg') center / contain no-repeat",
    ...style,
  };
  return <span aria-hidden="true" className={className} style={finalStyle} {...rest} />;
};

export default OndeEstamosIcon;
