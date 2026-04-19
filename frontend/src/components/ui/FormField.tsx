import type { ReactNode } from 'react';
import Input from './Input';
import type { InputProps } from './Input';

export interface FormFieldProps extends InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const FormField = ({
  label,
  error,
  helperText,
  required,
  leftIcon,
  rightIcon,
  id,
  className = '',
  ...inputProps
}: FormFieldProps) => {
  const inputId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Input
        id={inputId}
        error={error}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...inputProps}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-600 flex items-start gap-1">
          <span className="inline-block mt-0.5">⚠</span>
          <span>{error}</span>
        </p>
      )}
      {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};

export default FormField;
