/**
 * Reusable glass morphism panel component
 * Based on the preferred transcript window styling from memory
 */
import React from 'react';
import '@/styles/shared.css';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  animate?: boolean;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ 
  children, 
  className = '', 
  style = {},
  animate = false
}) => {
  const baseClasses = `glass-panel ${animate ? 'animate-slide-up' : ''} ${className}`;
  
  return (
    <div className={baseClasses} style={style}>
      {children}
    </div>
  );
};
