import React from 'react';
import { cn } from '../lib/utils';

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button
    {...props}
    className={cn(
      'inline-flex items-center justify-center rounded-md p-2 transition-colors',
      'text-light-text dark:text-dark-text hover:bg-light-bg-muted dark:hover:bg-dark-bg-muted',
      className
    )}
  />
);

export const IconCircle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div
    className={cn(
      'inline-flex items-center justify-center rounded-full',
      'bg-light-bg-muted dark:bg-dark-bg-muted text-light-text dark:text-dark-text',
      className
    )}
  >
    {children}
  </div>
);