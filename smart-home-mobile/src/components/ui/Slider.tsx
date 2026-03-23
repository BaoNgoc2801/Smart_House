import React from 'react';
import { cn } from '../../utils/cn';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  disabled,
  ...props
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('relative w-full h-6 flex items-center', className)}>
      <div className="absolute w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full bg-primary-500 transition-all duration-150 ease-out",
            disabled && "bg-gray-400"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className={cn(
          "absolute w-full h-full opacity-0 cursor-pointer",
          disabled && "cursor-not-allowed"
        )}
        {...props}
      />
      {/* Custom Thumb indicator could go here if needed, but the native range track handles input */}
    </div>
  );
};
