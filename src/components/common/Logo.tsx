import React from 'react';

type LogoProps = {
  showTagline?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'sidebar' | 'header';
};

const Logo: React.FC<LogoProps> = ({ 
  showTagline = false, 
  size = 'medium',
  variant = 'sidebar' 
}) => {
  const PRIMARY_COLOR = "#0071E0";
  const PRIMARY_COLOR_DARK = "#005bb5";

  // Size variants
  const iconSizes = {
    small: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-lg' },
    medium: { container: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-xl' },
    large: { container: 'w-12 h-12', icon: 'w-7 h-7', text: 'text-2xl' },
  };

  const sizes = iconSizes[size];

  return (
    <div className="flex items-center space-x-3">
      <div 
        className={`inline-flex items-center justify-center ${sizes.container} rounded-xl shadow-sm`}
        style={{ background: `linear-gradient(to bottom right, ${PRIMARY_COLOR}, ${PRIMARY_COLOR_DARK})` }}
      >
        <svg
          className={`${sizes.icon} text-white`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div className="flex flex-col">
        <h1 className={`${sizes.text} font-bold text-gray-900 dark:text-white tracking-tight`}>
          XGSM
        </h1>
        {showTagline && (
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
            {variant === 'sidebar' ? 'Admin Panel' : 'Electronics Trading Platform'}
          </p>
        )}
      </div>
    </div>
  );
};

export default Logo;


