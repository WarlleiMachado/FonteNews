import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: number; // px
  isOnline?: boolean; // quando definido, renderiza indicador
}

const Avatar: React.FC<AvatarProps> = ({ src, alt = 'Avatar', className, size = 36, isOnline }) => {
  const style: React.CSSProperties = { width: size, height: size };
  const initialsBg = 'https://api.dicebear.com/8.x/initials/svg?seed=' + encodeURIComponent(alt || 'User');

  return (
    <div className={cn('relative rounded-full flex-shrink-0 bg-light-bg-muted dark:bg-dark-bg-muted', className)} style={style}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full rounded-full object-cover"/>
      ) : (
        <img src={initialsBg} alt={alt} className="w-full h-full rounded-full object-cover"/>
      )}
      {typeof isOnline === 'boolean' && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border ${isOnline ? 'bg-green-500' : 'bg-gray-400'} border-white dark:border-jkd-bg`}
        />
      )}
    </div>
  );
};

export default Avatar;