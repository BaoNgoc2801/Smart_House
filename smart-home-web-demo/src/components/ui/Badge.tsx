import React, { type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'gray';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'primary', children, ...props }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-blue-100 text-blue-800': variant === 'primary',
          'bg-green-100 text-green-800': variant === 'success',
          'bg-yellow-100 text-yellow-800': variant === 'warning',
          'bg-red-100 text-red-800': variant === 'error',
          'bg-gray-100 text-gray-800': variant === 'gray',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
