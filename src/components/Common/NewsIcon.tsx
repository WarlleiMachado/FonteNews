import React from 'react';

const NewsIcon: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, style, ...rest }) => {
  const finalStyle: React.CSSProperties = {
    display: 'inline-block',
    backgroundColor: 'currentColor',
    WebkitMask: "url('/News-icon-02.svg') center / contain no-repeat",
    mask: "url('/News-icon-02.svg') center / contain no-repeat",
    ...style,
  };
  return <span aria-hidden="true" className={className} style={finalStyle} {...rest} />;
};

export default NewsIcon;
