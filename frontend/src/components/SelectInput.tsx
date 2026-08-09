import React from 'react';

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  label,
  options,
  error,
  id,
  className = '',
  ...props
}) => {
  const selectId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label htmlFor={selectId} className="text-xs font-semibold text-slate-700">
        {label} {props.required && <span className="text-rose-500">*</span>}
      </label>
      <select
        id={selectId}
        className={`w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
          error ? 'border-rose-500 focus:ring-rose-500' : ''
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-rose-500 font-medium">{error}</span>}
    </div>
  );
};
