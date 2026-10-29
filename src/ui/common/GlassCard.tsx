import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  active = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl transition-all duration-250 backdrop-blur-md
        ${
          active
            ? 'bg-indigo-600/20 border border-indigo-400/40 shadow-lg shadow-indigo-600/20'
            : 'bg-white/[0.05] border border-white/10 shadow-lg hover:border-white/20 hover:bg-white/[0.08]'
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
};
