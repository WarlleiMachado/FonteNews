import React from 'react';
import { motion } from 'framer-motion';
import { useThrottle } from '../../hooks/useDebounce';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  isActive?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ children, onClick, className = '', isActive = false }) => {
  // Temporarily removing throttle to test click functionality
  // const throttledOnClick = useThrottle(onClick || (() => {}), 300);

  return (
    <motion.button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg overflow-hidden transition-all duration-300 group ${className}`}
      whileHover="hover"
      whileTap={{ scale: 0.95 }}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br from-glass-light to-transparent dark:from-glass-dark dark:to-transparent transition-colors duration-300 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />

      {/* Inner Glow */}
      <motion.div 
        className="absolute inset-0 bg-church-primary/30"
        variants={{
          hover: { scale: 2, opacity: 0 },
          initial: { scale: 0, opacity: 0.5 }
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      
      {/* Border */}
      <div className={`absolute inset-0 rounded-lg border transition-colors duration-300 ${isActive ? 'border-church-primary' : 'border-border-light dark:border-border-dark group-hover:border-church-primary/50'}`} />
      
      {/* Content */}
      <div className="relative z-10 flex items-center gap-2 text-text-light-primary dark:text-text-dark-primary">
        {children}
      </div>
    </motion.button>
  );
};

export default AnimatedButton;
