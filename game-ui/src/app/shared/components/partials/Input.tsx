import React, { useState, type Ref } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface InputProps {
  type: string;
  name: string;
  ref?: Ref<HTMLInputElement>;
  label?: string;
  placeHolder?: string;
  className?: string;
  maxLength?: number;
  errorMsg?: string;
  minLength?: number;
  onInputBlur?: (value: string) => void;
  onInputChange?: (value: string) => void;
  isReadOnly?: boolean;
  hasApiErr?: boolean;
  isDisabled?: boolean;
  register?: UseFormRegisterReturn;
}

export const Input = ({
  type,
  name,
  ref,
  label,
  placeHolder,
  className = '',
  maxLength,
  errorMsg,
  onInputBlur,
  onInputChange,
  isReadOnly = false,
  hasApiErr = false,
  isDisabled = false,
  register,
}: InputProps) => {
  const [inputState, setInputState] = useState({
    dirty: false,
    touched: false,
  });

  const isShowError = () => (inputState.dirty || hasApiErr) && errorMsg;

  const inputClassName = `form-control ${className} ${isShowError() ? 'is-invalid' : ''}`;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setInputState((prev) => ({ ...prev, dirty: true, touched: false }));
    onInputBlur?.(e.target.value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange?.(e.target.value);
  };

  const handleFocus = () => {
    setInputState((prev) => ({ ...prev, touched: true }));
  };

  return (
    <div className="form-group">
      <div className="input-group">
        <input
          ref={ref}
          className={inputClassName}
          type={type}
          name={name}
          placeholder={label || placeHolder}
          maxLength={maxLength}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          readOnly={isReadOnly}
          disabled={isDisabled}
          {...register}
        />
        {label && (
          <label className="form-label" htmlFor={name}>
            {label}
          </label>
        )}
      </div>
      {isShowError() && <span className="msg-error">{errorMsg}</span>}
    </div>
  );
};
