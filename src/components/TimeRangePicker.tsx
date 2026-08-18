import React, { useState, useMemo } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from './ui/BottomSheet';

interface TimeRangePickerProps {
  value: string; // e.g. "06:00 - 17:00"
  onChange: (val: string) => void;
  presets?: string[];
  className?: string;
  title?: string;
}

export const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  value,
  onChange,
  presets = [],
  className = '',
  title,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'start' | 'end'>('start');

  // Parse "HH:mm - HH:mm" into start and end
  const { start, end } = useMemo(() => {
    if (!value || !value.includes('-')) {
      return { start: '06:00', end: '17:00' };
    }
    const parts = value.split('-').map(s => s.trim());
    return {
      start: parts[0] || '06:00',
      end: parts[1] || '17:00',
    };
  }, [value]);

  // Helper 24h -> 12h AM/PM
  const parse24to12 = (time24: string) => {
    const [hStr, mStr] = (time24 || '06:00').split(':');
    let h = parseInt(hStr || '6', 10);
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

  // Local state for modal editing
  const [modalStart, setModalStart] = useState(start);
  const [modalEnd, setModalEnd] = useState(end);

  const currentParsed = parse24to12(activeTab === 'start' ? modalStart : modalEnd);
  const [hour12, setHour12] = useState(currentParsed.h12Str);
  const [minute, setMinute] = useState(currentParsed.mStr);
  const [period, setPeriod] = useState<'AM' | 'PM'>(currentParsed.period);

  const handleOpen = (targetTab: 'start' | 'end' = 'start') => {
    setModalStart(start);
    setModalEnd(end);
    setActiveTab(targetTab);
    const parsed = parse24to12(targetTab === 'start' ? start : end);
    setHour12(parsed.h12Str);
    setMinute(parsed.mStr);
    setPeriod(parsed.period);
    setIsOpen(true);
  };

  const handleSwitchTab = (tab: 'start' | 'end') => {
    // Save current time before switching
    const current24 = parse12to24(hour12, minute, period);
    if (activeTab === 'start') {
      setModalStart(current24);
    } else {
      setModalEnd(current24);
    }

    setActiveTab(tab);
    const nextTime = tab === 'start' ? (activeTab === 'start' ? current24 : modalStart) : (activeTab === 'end' ? current24 : modalEnd);
    const parsed = parse24to12(nextTime);
    setHour12(parsed.h12Str);
    setMinute(parsed.mStr);
    setPeriod(parsed.period);
  };

  const handleConfirm = () => {
    const current24 = parse12to24(hour12, minute, period);
    const finalStart = activeTab === 'start' ? current24 : modalStart;
    const finalEnd = activeTab === 'end' ? current24 : modalEnd;
    onChange(`${finalStart} - ${finalEnd}`);
    setIsOpen(false);
  };

  const getCurrentDisplay = () => {
    return parse12to24(hour12, minute, period);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* 2026 Dual Time Trigger Bar */}
      <div className="flex items-center gap-1 bg-surface border-2 border-border-main p-1.5 focus-within:border-primary transition-all">
        {/* Start Button */}
        <button
          type="button"
          onClick={() => handleOpen('start')}
          className="flex-1 py-1 px-1.5 bg-surface-2 hover:bg-primary/10 border border-border-main/60 font-mono text-xs sm:text-sm font-bold text-text-main text-center cursor-pointer transition-all flex items-center justify-center gap-1 active:scale-95"
        >
          <span>{start}</span>
        </button>

        {/* Arrow Separator */}
        <div className="shrink-0 flex items-center justify-center text-text-muted px-1">
          <ArrowRight size={13} className="text-secondary opacity-80" />
        </div>

        {/* End Button */}
        <button
          type="button"
          onClick={() => handleOpen('end')}
          className="flex-1 py-1 px-1.5 bg-surface-2 hover:bg-primary/10 border border-border-main/60 font-mono text-xs sm:text-sm font-bold text-text-main text-center cursor-pointer transition-all flex items-center justify-center gap-1 active:scale-95"
        >
          <span>{end}</span>
        </button>

        {/* Clock trigger button */}
        <button
          type="button"
          onClick={() => handleOpen('start')}
          className="p-1 hover:bg-primary/10 text-secondary transition-colors cursor-pointer shrink-0 ml-0.5"
          title={t('common.select_time', 'Chọn giờ')}
        >
          <Clock size={16} />
        </button>
      </div>

      {/* DEDICATED 5TactiQ BRANDED TIME PICKER MODAL */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <Clock size={20} /> {title || t('common.select_match_time', 'CHỌN KHUNG GIỜ')}
          </span>
        }
      >
        <div className="flex flex-col">
          {/* Tab Switcher: GIỜ BẮT ĐẦU vs GIỜ KẾT THÚC */}
          <div className="flex border-2 border-primary mb-4 overflow-hidden font-display text-xs font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => handleSwitchTab('start')}
              className={`flex-1 py-2.5 px-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'start'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-muted hover:bg-primary/5'
              }`}
            >
              <span>{t('timepicker.start_time', 'BẮT ĐẦU')}:</span>
              <span className="font-mono text-sm font-bold">{activeTab === 'start' ? getCurrentDisplay() : modalStart}</span>
            </button>
            <div className="w-[2px] bg-primary"></div>
            <button
              type="button"
              onClick={() => handleSwitchTab('end')}
              className={`flex-1 py-2.5 px-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'end'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-muted hover:bg-primary/5'
              }`}
            >
              <span>{t('timepicker.end_time', 'KẾT THÚC')}:</span>
              <span className="font-mono text-sm font-bold">{activeTab === 'end' ? getCurrentDisplay() : modalEnd}</span>
            </button>
          </div>

          {/* Selected Time Banner */}
          <div className="bg-surface/50 border-b-2 border-primary/10 pb-3 mb-2 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              {activeTab === 'start' ? t('timepicker.editing_start', 'ĐANG CHỈNH: GIỜ BẮT ĐẦU') : t('timepicker.editing_end', 'ĐANG CHỈNH: GIỜ KẾT THÚC')}
            </span>
            <span className="text-2xl font-display text-primary font-bold tracking-wider">{getCurrentDisplay()}</span>
          </div>

          {/* Main Time Display Box Row */}
          <div className="p-4 sm:p-6 flex items-center justify-center gap-2 sm:gap-3">
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
              <span className="font-display text-xs font-bold uppercase tracking-widest text-text-muted mt-2">{t('timepicker.hour', 'GIỜ')}</span>
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
              <span className="font-display text-xs font-bold uppercase tracking-widest text-text-muted mt-2">{t('timepicker.minute', 'PHÚT')}</span>
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

          {/* Footer Action Buttons */}
          <div className="flex gap-3 mt-4 pt-3 border-t-2 border-primary/10">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-border-main hover:bg-surface transition-colors active:scale-95 cursor-pointer"
            >
              {t('common.cancel', 'HỦY')}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
              className="flex-1 bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-primary/90 transition-colors active:scale-95 cursor-pointer"
            >
              {t('common.apply', 'ÁP DỤNG')}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
