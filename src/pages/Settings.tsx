import { useState, useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';
import { ArrowLeft, Upload, Settings as SettingsIcon, X } from 'lucide-react';
import { BottomSheet } from '../components/ui/BottomSheet';
import { useTranslation } from 'react-i18next';
import { CustomDatePicker } from '../components/CustomDatePicker';

export default function Settings({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useSettingsStore();
  const { addToast } = useToastStore();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    teamName: '',
    logoUrl: '',
    foundedYear: '',
    seasonStartDate: '',
    seasonEndDate: ''
  });

  useEffect(() => {
    setFormData({
      teamName: settings.teamName || '',
      logoUrl: settings.logoUrl || '',
      foundedYear: settings.foundedYear ? settings.foundedYear.toString() : '',
      seasonStartDate: settings.seasonStartDate || '',
      seasonEndDate: settings.seasonEndDate || ''
    });
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      teamName: formData.teamName,
      logoUrl: formData.logoUrl,
      foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
      seasonStartDate: formData.seasonStartDate || undefined,
      seasonEndDate: formData.seasonEndDate || undefined
    });
    
    addToast({ type: 'success', message: t('settings.saved_toast', 'Đã lưu cài đặt') });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <SettingsIcon size={24} /> {t('settings.title', 'Cài đặt đội bóng')}
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 pr-1">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('settings.team_name', 'Tên đội bóng *')}</label>
            <input 
              type="text" 
              inputMode="text"
              enterKeyHint="next"
              required
              value={formData.teamName}
              onChange={e => setFormData({...formData, teamName: e.target.value})}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-lg text-primary"
              placeholder={t('settings.team_name_placeholder', 'Ví dụ: 5TactiQ')}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('settings.founded_year', 'Năm thành lập (Tùy chọn)')}</label>
            <input 
              type="text" 
              inputMode="numeric"
              enterKeyHint="done"
              pattern="[0-9]*"
              value={formData.foundedYear}
              onChange={e => setFormData({...formData, foundedYear: e.target.value.replace(/[^0-9]/g, '')})}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium"
              placeholder={t('settings.founded_year_placeholder', 'Ví dụ: 2023')}
            />
          </div>
          
          <div className="pt-2 border-t-2 border-border-main">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">{t('settings.season_title', 'Thời gian mùa giải')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <CustomDatePicker
                label={t('settings.season_start', 'Bắt đầu')}
                value={formData.seasonStartDate}
                onChange={(date) => setFormData({...formData, seasonStartDate: date})}
              />
              <CustomDatePicker
                label={t('settings.season_end', 'Kết thúc')}
                value={formData.seasonEndDate}
                onChange={(date) => setFormData({...formData, seasonEndDate: date})}
              />
            </div>
            {(formData.seasonStartDate || formData.seasonEndDate) && (
              <p className="mt-2 text-xs font-medium text-text-muted">
                {t('settings.season_note', 'Dùng để lọc thống kê và trận đấu trong khoảng thời gian này.')}
              </p>
            )}
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" className="w-full bg-secondary text-white font-display uppercase tracking-wider py-3 border-2 border-secondary hover:bg-[#d05c21] transition-colors active:scale-95">
            {t('settings.save_btn', 'LƯU THAY ĐỔI')}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
