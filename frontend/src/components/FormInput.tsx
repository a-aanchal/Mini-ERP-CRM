import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label htmlFor={inputId} className="text-xs font-semibold text-slate-700">
        {label} {props.required && <span className="text-rose-500">*</span>}
      </label>
      <input
        id={inputId}
        className={`w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-slate-400 ${
          error ? 'border-rose-500 focus:ring-rose-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-rose-500 font-medium">{error}</span>}
    </div>
  );
};
