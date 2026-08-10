import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from './ui/BottomSheet';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
  buttonClassName?: string;
}

export function CustomSelect({ value, onChange, options, className = "relative w-full", buttonClassName }: CustomSelectProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className={className} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName || "w-full border-2 border-border-main bg-accent/10 p-3 pr-10 rounded-none focus:border-primary outline-none font-bold text-left flex items-center justify-between text-text-main"}
      >
        <span>{selectedOption?.label || ''}</span>
        <ChevronDown size={20} className={`text-primary transition-transform duration-200 ${buttonClassName ? 'ml-2' : 'absolute right-3 top-1/2 -translate-y-1/2'} ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* OPTIONS BOTTOM SHEET */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('select.title')}
      >
        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-4 font-bold text-sm border-2 transition-all active:scale-95 flex justify-between items-center ${
                opt.value === value 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border-main bg-surface text-text-main hover:border-primary/30'
              }`}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check size={18} className="text-primary" />}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
