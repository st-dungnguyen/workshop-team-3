import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';
type SpinnerVariant = 'default' | 'primary';

interface SpinnerProps {
  className?: string;
  size?: SpinnerSize;
  variant?: SpinnerVariant;
}

const SPINNER_BOUNCE_KEYS = ['first', 'second', 'third'];

export const Spinner = ({
  className = '',
  size = 'md',
  variant = 'default',
}: SpinnerProps) => {
  const variantClass = variant !== 'default' ? `spinner-${variant}` : '';
  return (
    <div
      className={`spinner spinner-${size} ${variantClass} ${className}`.trim()}
    >
      {SPINNER_BOUNCE_KEYS.map((key) => (
        <span key={key} className="bounce" />
      ))}
    </div>
  );
};
