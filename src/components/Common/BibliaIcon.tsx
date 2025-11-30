import React from 'react';

const BibliaIcon: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, style, ...rest }) => {
  const finalStyle: React.CSSProperties = {
    display: 'inline-block',
    backgroundColor: 'currentColor',
    WebkitMask: "url('/biblia-02.svg') center / contain no-repeat",
    mask: "url('/biblia-02.svg') center / contain no-repeat",
    ...style,
  };
  return <span aria-hidden="true" className={className} style={finalStyle} {...rest} />;
};

export default BibliaIcon;
