import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useVenueStore } from '../store/useVenueStore';

interface VenueAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function VenueAutocomplete({ value, onChange, placeholder = "Nhập tên sân bóng..." }: VenueAutocompleteProps) {
  const { venues } = useVenueStore();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredVenues = venues.filter(v => 
    v.name.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input 
          type="text" 
          required
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full border-2 border-border-main bg-surface p-3 pr-10 rounded-none focus:border-primary outline-none font-bold"
          placeholder={placeholder}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-primary"
        >
          <ChevronDown size={20} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && filteredVenues.length > 0 && (
        <div className="absolute z-[100] left-0 right-0 top-full mt-1 bg-surface shadow-2xl rounded-none overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 border-2 border-primary divide-y divide-slate-100">
          <ul className="max-h-60 overflow-y-auto">
            {filteredVenues.map(venue => (
              <li key={venue.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(venue.name);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-slate-800 hover:bg-surface hover:text-primary transition-colors font-bold text-sm"
                >
                  {venue.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
