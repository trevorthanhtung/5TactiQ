import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from './ui/BottomSheet';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
}

export function CustomDatePicker({ value, onChange, label }: CustomDatePickerProps) {
  const { t } = useTranslation();
  const displayLabel = label || t('common.match_date');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || new Date().toISOString().split('T')[0]);

  // View state for calendar month navigation
  const [viewDate, setViewDate] = useState(() => {
    const [y, m] = (value || new Date().toISOString().split('T')[0]).split('-');
    return new Date(Number(y), Number(m) - 1, 1);
  });

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return t('common.select_date');
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const getQuickDates = () => {
    const today = new Date();
    const getFormatted = (d: Date) => d.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const getNextDayOfWeek = (dayOfWeek: number) => {
      const result = new Date(today);
      const currentDay = today.getDay();
      let distance = dayOfWeek - currentDay;
      if (distance <= 0) distance += 7;
      result.setDate(today.getDate() + distance);
      return result;
    };

    return [
      { label: t('common.today'), date: getFormatted(today) },
      { label: t('common.tomorrow'), date: getFormatted(tomorrow) },
      { label: t('common.next_tue'), date: getFormatted(getNextDayOfWeek(3)) },
      { label: t('common.next_thu'), date: getFormatted(getNextDayOfWeek(5)) },
      { label: t('common.next_sat'), date: getFormatted(getNextDayOfWeek(6)) },
      { label: t('common.next_sun'), date: getFormatted(getNextDayOfWeek(0)) },
    ];
  };

  const handleOpenModal = () => {
    const currentVal = value || new Date().toISOString().split('T')[0];
    setSelectedDate(currentVal);
    const [y, m] = currentVal.split('-');
    setViewDate(new Date(Number(y), Number(m) - 1, 1));
    setIsOpen(true);
  };

  const handleConfirm = () => {
    onChange(selectedDate);
    setIsOpen(false);
  };

  // Calendar Grid Math
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    t('common.january'), t('common.february'), t('common.march'), t('common.april'), t('common.may'), t('common.june'),
    t('common.july'), t('common.august'), t('common.september'), t('common.october'), t('common.november'), t('common.december')
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  // Shift so Monday = 0, Sunday = 6
  const startOffset = (firstDayIndex + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevDays = Array.from({ length: startOffset }, (_, i) => daysInPrevMonth - startOffset + 1 + i);
  const currentDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleSelectDay = (d: number) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateStr = `${year}-${mStr}-${dStr}`;
    setSelectedDate(dateStr);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full">
      {displayLabel && <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{displayLabel}</label>}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpenModal}
        className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-left flex items-center justify-between hover:border-primary transition-colors shadow-sm cursor-pointer"
      >
        <span className="text-text-main text-sm font-bold">{formatDateDisplay(value)}</span>
        <CalendarIcon size={18} className="text-secondary shrink-0 ml-2" />
      </button>

      {/* DEDICATED VISUAL CALENDAR MODAL BOX */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <CalendarIcon size={20} /> {t('common.select_match_date')}
          </span>
        }
      >
        <div className="flex flex-col">
          {/* Selected Date Header Banner */}
          <div className="bg-surface/50 border-b-2 border-primary/10 pb-3 mb-4 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">{t('datepicker.currently_selected')}</span>
            <span className="text-lg font-display text-primary font-bold">{formatDateDisplay(selectedDate)}</span>
          </div>

          {/* Main Content Area: Visual Month Calendar Grid */}
          <div>
            {/* Main Interactive Month Calendar Grid */}
            <div>
              {/* Month Navigator Header */}
              <div className="flex justify-between items-center mb-4">
                <button 
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 border border-border-main text-text-muted hover:bg-surface hover:border-primary transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <span className="font-display text-xl text-primary font-bold tracking-widest">
                  {monthNames[month]} {year}
                </span>

                <button 
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 border border-border-main text-text-muted hover:bg-surface hover:border-primary transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Day of Week Labels (Monday to Sunday) */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day, i) => (
                  <div key={day} className={`text-center text-[10px] sm:text-xs font-bold uppercase ${i >= 5 ? 'text-secondary' : 'text-primary'}`}>
                    {t(`common.${day}`)}
                  </div>
                ))}
              </div>

              {/* Days Cells Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Previous Month Padding */}
                {prevDays.map((d) => (
                  <div 
                    key={`prev-${d}`} 
                    className="h-10 flex items-center justify-center text-text-muted opacity-50 text-xs font-medium cursor-not-allowed select-none"
                  >
                    {d}
                  </div>
                ))}

                {/* Current Month Days */}
                {currentDays.map((d) => {
                  const mStr = String(month + 1).padStart(2, '0');
                  const dStr = String(d).padStart(2, '0');
                  const cellDateStr = `${year}-${mStr}-${dStr}`;
                  const isSelected = selectedDate === cellDateStr;
                  const isToday = todayStr === cellDateStr;

                  return (
                    <button
                      key={`curr-${d}`}
                      type="button"
                      onClick={() => handleSelectDay(d)}
                      className={`h-10 w-full flex flex-col items-center justify-center text-sm font-bold transition-all relative ${
                        isSelected
                          ? 'bg-primary text-white shadow-md font-extrabold ring-2 ring-secondary'
                          : isToday
                          ? 'bg-accent/40 text-primary border-2 border-primary'
                          : 'bg-surface text-text-main hover:bg-primary/10 hover:text-primary border border-border-main'
                      }`}
                    >
                      <span>{d}</span>
                      {isToday && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary absolute bottom-1"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t-2 border-primary/10">
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
