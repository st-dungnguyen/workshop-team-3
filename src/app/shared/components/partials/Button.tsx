import React, { type Ref } from 'react';
import { Spinner } from '../common';

interface ButtonProps {
  title: React.ReactNode;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'submit' | 'button';
  ref?: Ref<HTMLButtonElement>;
}

export const Button = ({
  title,
  isDisabled = false,
  isLoading = false,
  className = 'btn-primary',
  onClick,
  type = 'submit',
  ref,
}: ButtonProps) => {
  return (
    <button
      className={`btn ${className}`}
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
    >
      <span>{title}</span>
      {isLoading && <Spinner size="sm" />}
    </button>
  );
};
