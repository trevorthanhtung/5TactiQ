import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from './ui/BottomSheet';

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  allowNew?: boolean;
}

export function Autocomplete({ value, onChange, options, placeholder = "Nhập...", allowNew = false }: AutocompleteProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleOpenModal = () => {
    setSearchValue(value);
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
          {value || placeholder}
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
              placeholder={placeholder}
              autoComplete="off"
              autoFocus
            />
            <Search size={20} className="text-primary/60 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* OPTIONS LIST */}
          <div className="flex flex-col gap-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-4 font-bold text-sm uppercase border-2 transition-all active:scale-95 border-border-main bg-surface text-text-main hover:border-primary/30"
                >
                  {opt}
                </button>
              ))
            ) : allowNew ? (
              <div className="text-center p-6 text-text-muted text-sm border-2 border-dashed border-border-main mt-4">
                {t('autocomplete.not_found')}
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
                onChange(searchValue);
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
