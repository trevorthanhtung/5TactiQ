import { useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from './ui/BottomSheet';

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  allowNew?: boolean;
}

export function Autocomplete({ value, onChange, options, placeholder, allowNew = false }: AutocompleteProps) {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('autocomplete.input_placeholder', 'Nhập...');
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Smart filter with number boundary support
  // E.g. "Vòng 1" will match "Vòng 1", but NOT "Vòng 10" or "Vòng 1/8"
  const filteredOptions = options.filter(opt => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return true;
    const o = opt.trim().toLowerCase();
    if (o === q) return true;

    const words = q.split(/\s+/).filter(Boolean);
    return words.every(word => {
      if (/^\d+$/.test(word)) {
        // Whole number check: must not be followed or preceded by digits or fraction slash
        const regex = new RegExp(`(?<!\\d)${word}(?!\\d|/)`, 'i');
        return regex.test(o);
      }
      return o.includes(word);
    });
  });

  const handleOpenModal = () => {
    // Reset search value so user sees all available options immediately
    setSearchValue('');
    setIsOpen(true);
  };

  return (
    <div className="relative w-full">
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={handleOpenModal}
        className="w-full border-2 border-border-main bg-surface p-3 pr-10 rounded-none focus:border-primary outline-none font-bold uppercase text-left flex items-center justify-between text-text-main"
      >
        <span className={value ? "text-text-main" : "text-text-muted"}>
          {value || defaultPlaceholder}
        </span>
        <ChevronDown size={20} className="text-primary absolute right-3 top-1/2 -translate-y-1/2" />
      </button>

      {/* AUTOCOMPLETE BOTTOM SHEET */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('autocomplete.title')}
      >
        <div className="flex flex-col gap-4">
          
          {/* SEARCH INPUT */}
          <div className="relative">
            <input 
              type="text" 
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              className="w-full border-2 border-primary/40 bg-surface p-3 pl-10 rounded-none focus:border-primary outline-none font-bold uppercase"
              placeholder={value ? t('autocomplete.current', 'Hiện tại: {{value}}', { value }) : defaultPlaceholder}
              autoComplete="off"
              autoFocus
            />
            <Search size={20} className="text-primary/60 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* OPTIONS LIST */}
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.trim().toLowerCase() === value.trim().toLowerCase();
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3.5 font-bold text-sm uppercase border-2 transition-all active:scale-95 flex items-center justify-between ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border-main bg-surface text-text-main hover:border-primary/30'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && (
                      <Check size={18} className="text-primary shrink-0" />
                    )}
                  </button>
                );
              })
            ) : allowNew ? (
              <div className="text-center p-6 text-text-muted text-sm border-2 border-dashed border-border-main mt-4">
                {searchValue.trim() ? (
                  <span>
                    {t('autocomplete.press_apply', 'Bấm')} <b className="text-primary">{t('common.apply', 'ÁP DỤNG')}</b> {t('autocomplete.to_choose', 'để chọn')} "<b className="text-text-main">{searchValue.trim()}</b>"
                  </span>
                ) : (
                  <span>{t('autocomplete.not_found')}</span>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-sm font-medium text-text-muted">
                {t('autocomplete.not_found')}
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex gap-3 mt-2 pt-4 border-t-2 border-primary/10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-border-main hover:bg-surface transition-colors active:scale-95"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (searchValue.trim()) {
                  onChange(searchValue.trim());
                }
                setIsOpen(false);
              }}
              className="flex-1 bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-[#323d29] transition-colors active:scale-95"
            >
              {t('common.apply')}
            </button>
          </div>

        </div>
      </BottomSheet>
    </div>
  );
}
