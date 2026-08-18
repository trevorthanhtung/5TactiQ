import { useState, useEffect } from 'react';
import { useVenueStore } from '../store/useVenueStore';
import { ArrowLeft, MapPin, Phone, Plus, Map, Trash2, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHardwareBack } from '../hooks/useHardwareBack';
import { VenuesSkeleton } from '../components/ui/VenuesSkeleton';
import { BottomSheet } from '../components/ui/BottomSheet';
import { TimeRangePicker } from '../components/TimeRangePicker';
import { MoneyInput } from '../components/MoneyInput';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/useSettingsStore';
import { formatCurrencyAmount, getCurrencyConfig, LANGUAGE_DEFAULT_CURRENCY } from '../utils/currencyUtils';
import type { Venue } from '../types';

export default function Venues() {
  const { t, i18n } = useTranslation();
  const { venues, addVenue, updateVenue, deleteVenue } = useVenueStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();

  const activeCurrency = settings.currency || LANGUAGE_DEFAULT_CURRENCY[i18n.language] || 'VND';
  const currencyConfig = getCurrencyConfig(activeCurrency);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useHardwareBack(showModal, () => handleCloseModal());
  useHardwareBack(deleteConfirmId !== null, () => setDeleteConfirmId(null));

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    note: '',
    priceDay: '' as string | number,
    priceNight: '' as string | number,
    dayTimeRange: '06:00 - 17:00',
    nightTimeRange: '17:00 - 23:00',
  });

  const handleOpenModal = (venue?: Venue) => {
    if (venue) {
      setEditingId(venue.id);
      setFormData({
        name: venue.name,
        address: venue.address,
        phone: venue.phone,
        note: venue.note || '',
        priceDay: venue.priceDay !== null && venue.priceDay !== undefined ? venue.priceDay : '',
        priceNight: venue.priceNight !== null && venue.priceNight !== undefined ? venue.priceNight : '',
        dayTimeRange: venue.dayTimeRange || '06:00 - 17:00',
        nightTimeRange: venue.nightTimeRange || '17:00 - 23:00',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        note: '',
        priceDay: '',
        priceNight: '',
        dayTimeRange: '06:00 - 17:00',
        nightTimeRange: '17:00 - 23:00',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      note: '',
      priceDay: '',
      priceNight: '',
      dayTimeRange: '06:00 - 17:00',
      nightTimeRange: '17:00 - 23:00',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      note: formData.note.trim(),
      priceDay: formData.priceDay !== '' ? Number(formData.priceDay) : null,
      priceNight: formData.priceNight !== '' ? Number(formData.priceNight) : null,
      dayTimeRange: formData.dayTimeRange.trim() || '06:00 - 17:00',
      nightTimeRange: formData.nightTimeRange.trim() || '17:00 - 23:00',
    };

    if (editingId) {
      updateVenue(editingId, payload);
    } else {
      addVenue(payload);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    deleteVenue(id);
    setDeleteConfirmId(null);
    handleCloseModal();
  };

  if (isLoading) {
    return <VenuesSkeleton />;
  }

  return (
    <div className="p-4 flex flex-col min-h-full max-w-6xl mx-auto w-full pb-32 lg:pb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <div className="flex items-center gap-2 @sm:gap-3">
          <button
            onClick={() => navigate('/more')}
            className="p-2 text-primary hover:bg-primary/10 border-2 border-primary/30 hover:border-primary transition-all shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl @md:text-4xl font-display uppercase text-primary leading-none">{t('venues.title', 'Danh bạ Sân bóng')}</h1>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="hallmark-btn flex items-center gap-2 bg-secondary text-white shrink-0"
        >
          <Plus size={20} /> <span className="hidden @xl:inline">{t('venues.add_venue', 'Thêm sân')}</span>
        </button>
      </div>

      <div className="hallmark-divider mb-6"></div>

      {/* Search Bar */}
      {venues.length > 0 && (
        <div className="mb-6 relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-text-muted" />
          </div>
          <input
            type="text"
            placeholder={t('venues.search_placeholder', 'Tìm tên sân, địa chỉ...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border-2 border-border-main text-text-main py-2.5 pl-10 pr-3 outline-none focus:border-primary transition-colors text-sm placeholder:text-text-muted/60 placeholder:uppercase tracking-wider"
          />
        </div>
      )}

      {venues.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-primary/30 bg-primary/5 text-primary text-center">
          <Map className="mb-4 opacity-50" size={48} />
          <h3 className="font-display text-xl uppercase mb-2">{t('venues.no_venues', 'Chưa có sân bóng nào')}</h3>
          <p className="text-text-muted text-sm max-w-sm mb-6">{t('venues.no_venues_desc', 'Hãy thêm các sân bóng thường xuyên thi đấu vào danh bạ để dễ dàng quản lý và đặt sân.')}</p>
          <button
            onClick={() => handleOpenModal()}
            className="hallmark-btn bg-primary text-white"
          >
            {t('venues.add_first_venue', 'THÊM SÂN ĐẦU TIÊN')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues
            .filter(v => 
              v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              (v.address && v.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (v.note && v.note.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .map(venue => (
            <div
              key={venue.id}
              onClick={() => handleOpenModal(venue)}
              className="bg-surface border-2 border-border-main p-4 hover:border-primary/50 transition-all group relative shadow-sm cursor-pointer hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_var(--color-primary)] flex flex-col justify-between h-full"
            >
              <div>
                <div className="mb-2">
                  <h3 className="font-display font-bold text-primary uppercase text-lg leading-tight group-hover:text-secondary transition-colors">{venue.name}</h3>
                </div>

                <div className="flex flex-col text-sm text-text-muted space-y-2.5">
                  {venue.address && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-start gap-2 hover:text-secondary group/link transition-colors"
                    >
                      <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5 group-hover/link:text-secondary transition-colors" />
                      <span className="underline-offset-2 group-hover/link:underline line-clamp-2">{venue.address}</span>
                    </a>
                  )}

                  {/* Day / Night Pricing Badges */}
                  {(venue.priceDay || venue.priceNight) ? (
                    <div className="grid grid-cols-2 gap-2 my-1 pt-1.5 border-t border-border-main">
                      {venue.priceDay ? (
                        <div className="p-2 bg-surface-2 border-2 border-border-main flex flex-col justify-between">
                          <span className="text-[10px] uppercase font-bold font-display tracking-widest text-text-muted">
                            {t('venues.day_slot', 'Sáng')}
                          </span>
                          <span className="font-display font-bold text-primary text-sm mt-0.5 tracking-tight">
                            {formatCurrencyAmount(venue.priceDay, activeCurrency)}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2 bg-surface-2/50 border border-dashed border-border-main/50 flex flex-col justify-between opacity-50">
                          <span className="text-[10px] uppercase font-bold font-display tracking-widest text-text-muted">
                            {t('venues.day_slot', 'Sáng')}
                          </span>
                          <span className="text-xs text-text-muted italic mt-0.5">—</span>
                        </div>
                      )}

                      {venue.priceNight ? (
                        <div className="p-2 bg-surface-2 border-2 border-border-main flex flex-col justify-between">
                          <span className="text-[10px] uppercase font-bold font-display tracking-widest text-text-muted">
                            {t('venues.night_slot', 'Tối')}
                          </span>
                          <span className="font-display font-bold text-primary text-sm mt-0.5 tracking-tight">
                            {formatCurrencyAmount(venue.priceNight, activeCurrency)}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2 bg-surface-2/50 border border-dashed border-border-main/50 flex flex-col justify-between opacity-50">
                          <span className="text-[10px] uppercase font-bold font-display tracking-widest text-text-muted">
                            {t('venues.night_slot', 'Tối')}
                          </span>
                          <span className="text-xs text-text-muted italic mt-0.5">—</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="my-1 pt-1.5 border-t border-border-main">
                      <div className="py-2 px-2.5 bg-surface-2/60 border border-dashed border-border-main text-center text-xs text-text-muted/70 italic">
                        {t('venues.no_price_note', 'Chưa lưu giá sân')}
                      </div>
                    </div>
                  )}

                  {venue.note && (
                    <div className="flex items-start gap-2 p-2 bg-surface-2 border border-border-main/60 text-xs text-text-muted">
                      <FileText size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="whitespace-pre-line leading-relaxed font-sans line-clamp-2">{venue.note}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              {venue.phone && (
                <div className="mt-3 pt-2.5 flex items-center border-t border-border-main/40">
                  <a
                    href={`tel:${venue.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 hover:-translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(4,120,87,1)] border-2 border-emerald-700 active:scale-95"
                  >
                    <Phone size={13} /> {t('venues.call_book', 'GỌI: ')} {venue.phone}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm/Sửa */}
      <BottomSheet
        isOpen={showModal}
        onClose={handleCloseModal}
        maxWidth="2xl"
        title={
          <span className="flex items-center gap-2">
            <Map size={24} /> {editingId ? t('venues.modal_edit_title', 'Cập nhật') : t('venues.modal_add_title', 'Thêm Sân Bóng')}
          </span>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 pr-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('venues.venue_name', 'Tên sân bóng *')}</label>
            <input
              type="text"
              inputMode="text"
              enterKeyHint="next"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-primary"
              placeholder={t('venues.venue_name_placeholder', 'Ví dụ: Sân Chảo Lửa')}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('venues.address', 'Địa chỉ')}</label>
            <input
              type="text"
              inputMode="text"
              enterKeyHint="next"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium"
              placeholder={t('venues.address_placeholder', 'Ví dụ: 30 Phan Thúc Duyện, Tân Bình')}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('venues.phone', 'Số điện thoại liên hệ')}</label>
            <input
              type="tel"
              inputMode="tel"
              enterKeyHint="next"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium"
              placeholder={t('venues.phone_placeholder', 'Ví dụ: 0901234567')}
            />
          </div>

          {/* Pricing & Time Slots Configuration */}
          <div className="pt-2 border-t-2 border-border-main">
            <div className="text-xs font-display uppercase tracking-widest text-primary font-bold mb-3">
              {t('venues.pricing_section_title', 'BẢNG GIÁ & KHUNG GIỜ THI ĐẤU')}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Day Slot */}
              <div className="bg-surface-2 p-3 border-2 border-border-main space-y-2.5">
                <div className="text-xs font-bold uppercase text-amber-500">
                  {t('venues.day_slot_title', 'Ban Ngày')}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    {t('venues.time_range_label', 'Khung giờ')}
                  </label>
                  <TimeRangePicker
                    value={formData.dayTimeRange}
                    onChange={val => setFormData({ ...formData, dayTimeRange: val })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">
                    {t('venues.price_label', 'Giá tiền sân')}
                  </label>
                  <MoneyInput
                    value={formData.priceDay}
                    onChange={val => setFormData({ ...formData, priceDay: val })}
                    className="w-full border border-border-main bg-surface px-2.5 py-1.5 text-sm font-display font-bold text-primary focus:border-primary outline-none"
                    placeholder={`Ví dụ: ${currencyConfig.defaultPitchDay}`}
                  />
                </div>
              </div>

              {/* Night Slot */}
              <div className="bg-surface-2 p-3 border-2 border-border-main space-y-2.5">
                <div className="text-xs font-bold uppercase text-indigo-400">
                  {t('venues.night_slot_title', 'Ban Đêm')}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    {t('venues.time_range_label', 'Khung giờ')}
                  </label>
                  <TimeRangePicker
                    value={formData.nightTimeRange}
                    onChange={val => setFormData({ ...formData, nightTimeRange: val })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">
                    {t('venues.price_label', 'Giá tiền sân')}
                  </label>
                  <MoneyInput
                    value={formData.priceNight}
                    onChange={val => setFormData({ ...formData, priceNight: val })}
                    className="w-full border border-border-main bg-surface px-2.5 py-1.5 text-sm font-display font-bold text-secondary focus:border-primary outline-none"
                    placeholder={`Ví dụ: ${currencyConfig.defaultPitchNight}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('venues.note', 'Ghi chú / Lưu ý')}</label>
            <textarea
              rows={2}
              value={formData.note}
              onChange={e => setFormData({ ...formData, note: e.target.value })}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium text-sm resize-none"
              placeholder={t('venues.note_placeholder', 'Ví dụ: Sân cỏ 7 người, có đèn chiếu sáng ban đêm, bãi gửi xe ô tô rộng...')}
            />
          </div>

          <div className="pt-4 flex gap-3 mt-4">
            {editingId && (
              <button
                type="button"
                onClick={() => setDeleteConfirmId(editingId)}
                className="p-3 bg-rose-50 border-2 border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors flex items-center justify-center shrink-0 active:scale-95"
                title={t('venues.delete_tooltip', 'Xóa sân bóng')}
              >
                <Trash2 size={24} />
              </button>
            )}
            <button type="button" onClick={handleCloseModal} className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-slate-300 hover:bg-surface transition-colors active:scale-95">
              {t('venues.cancel', 'HỦY')}
            </button>
            <button type="submit" className="flex-1 bg-secondary text-white font-display uppercase tracking-wider py-3 border-2 border-secondary hover:bg-[#d05c21] transition-colors active:scale-95">
              {editingId ? t('venues.update_btn', 'CẬP NHẬT') : t('venues.add_btn', 'THÊM SÂN')}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Modal Xác nhận Xóa */}
      <BottomSheet
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        variant="danger"
        title={
          <span className="flex items-center gap-2">
            <Trash2 size={24} /> {t('venues.delete_title', 'Xóa sân bóng')}
          </span>
        }
      >
        <p className="text-text-muted text-sm md:text-base font-sans mb-8 leading-relaxed">{t('venues.delete_msg', 'Bạn có chắc chắn muốn xóa sân bóng này khỏi danh bạ không? Hành động này không thể hoàn tác.')}</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setDeleteConfirmId(null)}
            className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-slate-300 hover:bg-surface transition-colors active:scale-95"
          >
            {t('venues.delete_cancel', 'HỦY BỎ')}
          </button>
          <button
            type="button"
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            className="flex-1 bg-rose-600 text-white font-display uppercase tracking-wider py-3 border-2 border-rose-700 hover:bg-rose-700 transition-colors active:scale-95"
          >
            {t('venues.delete_confirm', 'XÁC NHẬN')}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
