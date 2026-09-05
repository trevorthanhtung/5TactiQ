import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from './ui/BottomSheet';

export interface PickerOption {
  value: string;
  label: string;
  badge?: string;
  desc?: string;
  icon?: React.ReactNode;
}

interface OptionPickerModalProps {
  value: string;
  onChange: (value: string) => void;
  options: PickerOption[];
  title: string;
  placeholder?: string;
}

export function OptionPickerModal({
  value,
  onChange,
  options,
  title,
  placeholder,
}: OptionPickerModalProps) {
  const { t } = useTranslation();
  const displayPlaceholder = placeholder || t('common.tap_to_select', '-- Bấm để chọn --');
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="w-full">
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full border-2 bg-surface px-3 py-3 rounded-none outline-none font-bold text-left flex items-center justify-between gap-2 text-text-main transition-colors cursor-pointer ${
          isOpen ? 'border-primary' : 'border-border-main hover:border-primary/60'
        }`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="text-sm font-bold text-primary truncate">
            {selectedOption ? selectedOption.label : displayPlaceholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium text-text-muted bg-surface-2 border border-border-main shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown size={18} className="text-primary/70 shrink-0 ml-2" />
      </button>

      {/* POPUP BOX / BOTTOMSHEET FOR OPTIONS */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        zIndex={115}
        title={title}
      >
        <div className="space-y-2 pb-2 max-h-[50vh] overflow-y-auto pr-1">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full p-3.5 border-2 text-left flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                    : 'border-border-main bg-surface text-text-main hover:border-primary/50 font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {opt.icon && <div className="shrink-0">{opt.icon}</div>}
                  <div className="min-w-0">
                    <div className="text-sm truncate">
                      {opt.label}
                    </div>
                    {opt.desc && (
                      <div className="text-xs text-text-muted mt-0.5">
                        {opt.desc}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {opt.badge && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-surface-2 text-text-muted border border-border-main'
                    }`}>
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && (
                    <div className="w-5 h-5 bg-primary text-white flex items-center justify-center">
                      <Check size={12} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}
