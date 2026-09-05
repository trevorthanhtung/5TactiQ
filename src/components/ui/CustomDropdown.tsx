import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface DropdownOption {
  value: string;
  label: string;
  badge?: string | number | null;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
}

export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  searchable = false,
  disabled = false,
  className = 'relative w-full',
  buttonClassName,
}: CustomDropdownProps) {
  const { t } = useTranslation();
  const displayPlaceholder = placeholder || t('common.select_option', '-- Chọn một mục --');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && (searchable || options.length > 7)) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, searchable, options.length]);

  const showSearch = searchable || options.length > 7;

  const filteredOptions = showSearch
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.badge && String(opt.badge).toLowerCase().includes(searchQuery.toLowerCase())) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  return (
    <div className={className} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          buttonClassName ||
          `w-full border-2 bg-surface p-3 pr-10 rounded-none outline-none font-bold text-left flex items-center justify-between text-text-main transition-colors ${
            isOpen ? 'border-primary ring-1 ring-primary/30' : 'border-border-main hover:border-primary/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`
        }
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          {selectedOption?.badge !== undefined && selectedOption.badge !== null && (
            <span className="px-1.5 py-0.5 text-[10px] font-display font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
              #{selectedOption.badge}
            </span>
          )}
          <span className={`truncate text-sm ${selectedOption ? 'text-text-main font-bold' : 'text-text-muted font-normal'}`}>
            {selectedOption ? selectedOption.label : displayPlaceholder}
          </span>
        </div>

        <ChevronDown
          size={18}
          className={`text-primary shrink-0 transition-transform duration-200 absolute right-3 top-1/2 -translate-y-1/2 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Custom Hallmark Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-[120] left-0 right-0 top-full mt-1 bg-surface shadow-2xl border-2 border-primary rounded-none overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search bar inside dropdown */}
          {showSearch && (
            <div className="p-2 border-b-2 border-border-main bg-accent/20 sticky top-0 z-10">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('common.search_quick', 'Tìm kiếm nhanh...')}
                  className="w-full bg-surface border border-border-main pl-8 pr-2 py-1.5 text-xs outline-none focus:border-primary font-medium"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <ul className="max-h-56 overflow-y-auto divide-y divide-border-main/40">
            {filteredOptions.length === 0 ? (
              <li className="p-4 text-center text-xs text-text-muted font-medium">
                {t('common.no_options_found', 'Không tìm thấy lựa chọn nào phù hợp.')}
              </li>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between text-sm ${
                        isSelected
                          ? 'bg-primary/15 text-primary font-bold border-l-4 border-primary pl-2.5'
                          : 'text-text-main hover:bg-primary/10 hover:text-primary font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        {opt.badge !== undefined && opt.badge !== null && (
                          <span className={`px-1.5 py-0.5 text-[10px] font-display font-bold shrink-0 ${
                            isSelected ? 'bg-primary text-white' : 'bg-accent/30 text-text-main border border-border-main'
                          }`}>
                            #{opt.badge}
                          </span>
                        )}
                        <span className="truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="text-xs text-text-muted truncate">({opt.sublabel})</span>
                        )}
                      </div>

                      {isSelected && <Check size={16} className="text-primary shrink-0 ml-2" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
