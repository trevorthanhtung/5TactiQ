import { useState } from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from './ui/BottomSheet';

interface CustomTimePickerProps {
  value: string; // HH:mm in 24h format e.g. "19:00"
  onChange: (time: string) => void;
  label?: string;
}

export function CustomTimePicker({ value, onChange, label }: CustomTimePickerProps) {
  const { t } = useTranslation();
  const displayLabel = label || t('common.match_time');
  const [isOpen, setIsOpen] = useState(false);

  // Helper 24h -> 12h AM/PM
  const parse24to12 = (time24: string) => {
    const [hStr, mStr] = (time24 || '19:00').split(':');
    let h = parseInt(hStr || '19', 10);
    const m = mStr || '00';
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const h12Str = String(h).padStart(2, '0');
    return { h12Str, mStr: m, period };
  };

  // Helper 12h -> 24h
  const parse12to24 = (h12Str: string, mStr: string, period: 'AM' | 'PM') => {
    let h = parseInt(h12Str || '12', 10);
    if (isNaN(h)) h = 12;
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    const h24Str = String(h).padStart(2, '0');
    
    let m = parseInt(mStr || '00', 10);
    if (isNaN(m)) m = 0;
    const m24Str = String(m).padStart(2, '0');
    
    return `${h24Str}:${m24Str}`;
  };

  const initialParsed = parse24to12(value || '19:00');
  const [hour12, setHour12] = useState(initialParsed.h12Str);
  const [minute, setMinute] = useState(initialParsed.mStr);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialParsed.period);

  const handleOpenModal = () => {
    const parsed = parse24to12(value || '19:00');
    setHour12(parsed.h12Str);
    setMinute(parsed.mStr);
    setPeriod(parsed.period);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    const final24 = parse12to24(hour12, minute, period);
    onChange(final24);
    setIsOpen(false);
  };

  const getCurrentDisplay = () => {
    return parse12to24(hour12, minute, period);
  };

  return (
    <div className="w-full">
      {displayLabel && <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">{displayLabel}</label>}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpenModal}
        className="w-full h-12 bg-surface text-text-main font-bold border-2 border-border-main px-4 flex justify-between items-center transition-colors focus:border-primary active:bg-border-main/50"
      >
        <span className={value ? 'text-lg font-display tracking-wider' : 'text-text-muted font-sans font-normal'}>
          {value || t('common.select_time')}
        </span>
        <Clock size={18} className="text-secondary shrink-0 ml-2" />
      </button>

      {/* DEDICATED 5TactiQ BRANDED TIME PICKER MODAL BOX */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <Clock size={20} /> {t('common.select_match_time')}
          </span>
        }
      >
        <div className="flex flex-col">
          {/* Selected Time Banner */}
          <div className="bg-surface/50 border-b-2 border-primary/10 pb-3 mb-4 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">{t('timepicker.selected_time')}</span>
            <span className="text-xl font-display text-primary font-bold tracking-wider">{getCurrentDisplay()}</span>
          </div>

          {/* Main Time Display Box Row */}
          <div className="p-4 sm:p-8 flex items-center justify-center gap-2 sm:gap-3">
            
            {/* Hour Input Box */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/5 border-2 border-primary flex items-center justify-center focus-within:border-secondary focus-within:bg-secondary/10 transition-colors">
                <input
                  type="text"
                  maxLength={2}
                  value={hour12}
                  onChange={(e) => setHour12(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  className="w-full h-full text-center font-display text-4xl sm:text-5xl text-primary font-bold bg-transparent outline-none cursor-text"
                />
              </div>
              <span className="font-display text-xs font-bold uppercase tracking-widest text-text-muted mt-2">{t('timepicker.hour')}</span>
            </div>

            {/* Colon */}
            <div className="text-3xl sm:text-4xl font-display font-bold text-primary -mt-6">:</div>

            {/* Minute Input Box */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/5 border-2 border-primary flex items-center justify-center focus-within:border-secondary focus-within:bg-secondary/10 transition-colors">
                <input
                  type="text"
                  maxLength={2}
                  value={minute}
                  onChange={(e) => setMinute(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  className="w-full h-full text-center font-display text-4xl sm:text-5xl text-primary font-bold bg-transparent outline-none cursor-text"
                />
              </div>
              <span className="font-display text-xs font-bold uppercase tracking-widest text-text-muted mt-2">{t('timepicker.minute')}</span>
            </div>

            {/* AM / PM Toggle Stack */}
            <div className="flex flex-col border-2 border-primary rounded-none bg-surface ml-1 sm:ml-2 -mt-6 overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setPeriod('AM')}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 font-display text-xs sm:text-sm font-bold uppercase transition-colors ${
                  period === 'AM' 
                    ? 'bg-secondary text-white' 
                    : 'bg-surface text-text-muted hover:bg-surface'
                }`}
              >
                AM
              </button>
              <div className="border-t-2 border-primary"></div>
              <button
                type="button"
                onClick={() => setPeriod('PM')}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 font-display text-xs sm:text-sm font-bold uppercase transition-colors ${
                  period === 'PM' 
                    ? 'bg-secondary text-white' 
                    : 'bg-surface text-text-muted hover:bg-surface'
                }`}
              >
                PM
              </button>
            </div>

          </div>

          {/* Quick Football Time Slot Pills */}
          <div className="pb-6 border-t border-border-main/60 pt-4">
            <div className="text-[10px] font-bold font-display uppercase tracking-widest text-slate-400 mb-2">{t('common.suggested_times')}</div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    const parsed = parse24to12(slot);
                    setHour12(parsed.h12Str);
                    setMinute(parsed.mStr);
                    setPeriod(parsed.period);
                  }}
                  className="px-2.5 py-1 text-xs font-bold font-display uppercase border border-border-main bg-surface-2 text-text-main hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex gap-3 mt-2 pt-4 border-t-2 border-primary/10">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-border-main hover:bg-surface transition-colors active:scale-95"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
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
