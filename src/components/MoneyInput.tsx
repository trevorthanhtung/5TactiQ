import React from 'react';

export interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string | null | undefined;
  onChange: (value: number) => void;
  currencySymbol?: string;
}

export function MoneyInput({
  value,
  onChange,
  currencySymbol,
  className = '',
  placeholder,
  ...props
}: MoneyInputProps) {
  // Format numeric value to thousand-separated string (e.g. 400000 -> "400.000")
  const displayValue = React.useMemo(() => {
    if (value === null || value === undefined || value === '' || value === 0) {
      return '';
    }
    const num = typeof value === 'number' ? value : Number(String(value).replace(/\D/g, ''));
    if (isNaN(num) || num === 0) return '';
    return new Intl.NumberFormat('vi-VN').format(num);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    onChange(num);
  };

  // Format placeholder if it's a numeric string
  const formattedPlaceholder = React.useMemo(() => {
    if (!placeholder) return '';
    return placeholder.replace(/(\d+)/g, (match) => {
      const n = parseInt(match, 10);
      return !isNaN(n) && n >= 1000 ? new Intl.NumberFormat('vi-VN').format(n) : match;
    });
  }, [placeholder]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={formattedPlaceholder}
        className={className}
        {...props}
      />
      {currencySymbol && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted pointer-events-none">
          {currencySymbol}
        </span>
      )}
    </div>
  );
}
