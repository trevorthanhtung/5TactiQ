import { useState } from 'react';
import { useFundStore } from '../store/useFundStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { ArrowLeft, Plus, Wallet, TrendingUp, TrendingDown, X, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { FundTransaction } from '../types';
import { BottomSheet } from '../components/ui/BottomSheet';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { useTranslation } from 'react-i18next';

export default function Fund() {
  const { t } = useTranslation();
  const { transactions, addTransaction } = useFundStore();
  const { players } = usePlayerStore();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);

  const [newTx, setNewTx] = useState<{
    date: string;
    type: 'Thu' | 'Chi';
    category: FundTransaction['category'];
    amount: string;
    note: string;
    playerId: string | null;
  }>({
    date: new Date().toISOString().split('T')[0],
    type: 'Thu',
    category: 'Đóng quỹ thành viên',
    amount: '',
    note: '',
    playerId: null
  });

  const totalThu = transactions.filter(t => t.type === 'Thu').reduce((sum, t) => sum + t.amount, 0);
  const totalChi = transactions.filter(t => t.type === 'Chi').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalThu - totalChi;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.amount || isNaN(Number(newTx.amount))) return;
    
    addTransaction({
      date: newTx.date,
      type: newTx.type,
      category: newTx.category,
      amount: Number(newTx.amount),
      note: newTx.note,
      playerId: newTx.category === 'Đóng quỹ thành viên' ? newTx.playerId : null
    });
    
    setShowAddModal(false);
    setNewTx({
      date: new Date().toISOString().split('T')[0],
      type: 'Thu',
      category: 'Đóng quỹ thành viên',
      amount: '',
      note: '',
      playerId: null
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}/${m}/${y}`;
  };

  const categoriesThu: FundTransaction['category'][] = ['Đóng quỹ thành viên', 'Khác'];
  const categoriesChi: FundTransaction['category'][] = ['Thuê sân', 'Đồng phục', 'Nước uống', 'Khác'];

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Đóng quỹ thành viên': return t('fund.cat_member_fund', 'Đóng quỹ thành viên');
      case 'Thuê sân': return t('fund.cat_pitch_fee', 'Thuê sân');
      case 'Đồng phục': return t('fund.cat_kit', 'Đồng phục');
      case 'Nước uống': return t('fund.cat_drinks', 'Nước uống');
      case 'Khác': return t('fund.cat_other', 'Khác');
      default: return cat;
    }
  };

  const getPlayerName = (id?: string | null) => {
    if (!id) return '';
    const p = players.find(x => x.id === id);
    return p ? p.name : t('fund.player_deleted', 'Cầu thủ đã xóa');
  };

  return (
    <div className="p-4 flex flex-col min-h-full max-w-5xl mx-auto w-full pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 @sm:gap-3 mb-6 pt-2">
        <div className="flex items-center gap-2 @sm:gap-3">
          <button 
            onClick={() => navigate('/more')}
            className="p-2 text-primary hover:bg-primary/10 border-2 border-primary/30 hover:border-primary transition-all shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl @md:text-4xl font-display uppercase text-primary leading-none">{t('fund.title', 'Quỹ đội')}</h1>
            <p className="text-sm text-text-muted font-medium mt-1">{t('fund.desc', 'Quản lý thu chi')}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 font-display uppercase tracking-widest text-secondary hover:text-primary transition-colors"
        >
          <Plus size={20} /> <span className="hidden @xl:inline">{t('fund.add_btn', 'Thêm GD')}</span>
        </button>
      </div>

      <div className="hallmark-divider mb-6"></div>

      {/* Stats */}
      <div className="grid grid-cols-1 @sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-surface p-4 border-2 border-border-main flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-text-muted uppercase tracking-widest font-bold text-xs">
            <TrendingUp size={16} className="text-emerald-500" /> {t('fund.total_thu', 'Tổng thu')}
          </div>
          <div className="font-display font-bold text-2xl text-emerald-600">{formatCurrency(totalThu)}</div>
        </div>
        <div className="bg-surface p-4 border-2 border-border-main flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-text-muted uppercase tracking-widest font-bold text-xs">
            <TrendingDown size={16} className="text-rose-500" /> {t('fund.total_chi', 'Tổng chi')}
          </div>
          <div className="font-display font-bold text-2xl text-rose-600">{formatCurrency(totalChi)}</div>
        </div>
        <div className={`p-4 border-2 flex flex-col justify-center ${balance >= 0 ? 'bg-emerald-50 border-emerald-600/30' : 'bg-rose-50 border-rose-600/30'}`}>
          <div className="flex items-center gap-2 mb-2 text-text-muted uppercase tracking-widest font-bold text-xs">
            <Wallet size={16} className={balance >= 0 ? 'text-emerald-600' : 'text-rose-600'} /> {t('fund.balance', 'Số dư hiện tại')}
          </div>
          <div className={`font-display font-bold text-3xl ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(balance)}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-text-muted font-medium">{t('fund.no_tx', 'Chưa có giao dịch nào.')}</div>
        ) : (
          transactions.map(tr => (
            <div key={tr.id} className="bg-surface border-2 border-border-main shadow-sm p-4 flex flex-col @sm:flex-row justify-between items-start @sm:items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 text-[10px] font-display uppercase tracking-widest font-bold text-white ${tr.type === 'Thu' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {tr.type === 'Thu' ? t('fund.type_thu', 'Thu') : t('fund.type_chi', 'Chi')}
                  </span>
                  <span className="text-sm font-bold text-primary">{getCategoryLabel(tr.category)}</span>
                </div>
                <div className="text-xs text-text-muted font-medium">{t('fund.date', 'Ngày')}: {formatDate(tr.date)}</div>
                {tr.playerId && (
                  <div className="text-xs text-text-muted flex items-center gap-1 mt-1">
                    <User size={12} className="text-secondary" /> {getPlayerName(tr.playerId)}
                  </div>
                )}
                {tr.note && <div className="text-sm text-text-muted mt-2">{tr.note}</div>}
              </div>
              <div className={`font-display font-bold text-xl @sm:text-2xl ${tr.type === 'Thu' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {tr.type === 'Thu' ? '+' : '-'}{formatCurrency(tr.amount)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <BottomSheet
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={
          <span className="flex items-center gap-2">
            <Plus size={24} /> {t('fund.add_modal_title', 'Thêm giao dịch')}
          </span>
        }
      >
        <form onSubmit={handleAdd} className="space-y-4 pr-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">{t('fund.tx_type', 'Loại giao dịch')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewTx({ ...newTx, type: 'Thu', category: 'Đóng quỹ thành viên' })}
                className={`p-3 text-sm font-bold uppercase tracking-widest border-2 transition-colors ${
                  newTx.type === 'Thu' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border-main text-text-muted hover:border-emerald-300'
                }`}
              >
                {t('fund.type_thu', 'Thu')}
              </button>
              <button
                type="button"
                onClick={() => setNewTx({ ...newTx, type: 'Chi', category: 'Thuê sân' })}
                className={`p-3 text-sm font-bold uppercase tracking-widest border-2 transition-colors ${
                  newTx.type === 'Chi' ? 'border-rose-500 bg-rose-500 text-white' : 'border-border-main text-text-muted hover:border-rose-300'
                }`}
              >
                {t('fund.type_chi', 'Chi')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('fund.category', 'Danh mục')}</label>
            <select 
              value={newTx.category} 
              onChange={e => setNewTx({...newTx, category: e.target.value as any})}
              className="w-full border-2 border-border-main bg-accent/10 p-3 rounded-none focus:border-primary outline-none font-bold"
            >
              {(newTx.type === 'Thu' ? categoriesThu : categoriesChi).map(c => (
                <option key={c} value={c}>{getCategoryLabel(c)}</option>
              ))}
            </select>
          </div>

          {newTx.category === 'Đóng quỹ thành viên' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('fund.player_label', 'Cầu thủ đóng quỹ')}</label>
              <select 
                value={newTx.playerId || ''} 
                onChange={e => setNewTx({...newTx, playerId: e.target.value})}
                required
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold"
              >
                <option value="" disabled>{t('fund.select_player', '-- Chọn cầu thủ --')}</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('fund.amount_label', 'Số tiền (VNĐ)')}</label>
            <input 
              type="number" 
              required
              min="0"
              value={newTx.amount}
              onChange={e => setNewTx({...newTx, amount: e.target.value})}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-xl text-primary"
              placeholder={t('fund.amount_placeholder', 'Ví dụ: 200000')}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('fund.date', 'Ngày')}</label>
            <CustomDatePicker 
              value={newTx.date}
              onChange={d => setNewTx({...newTx, date: d})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('fund.note_label', 'Ghi chú')}</label>
            <input 
              type="text" 
              value={newTx.note}
              onChange={e => setNewTx({...newTx, note: e.target.value})}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium"
              placeholder={t('fund.note_placeholder', 'Ghi chú chi tiết...')}
            />
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full bg-secondary text-white font-display uppercase tracking-wider py-3 border-2 border-secondary hover:bg-[#d05c21] transition-colors active:scale-95">
              {t('fund.save_btn', 'LƯU GIAO DỊCH')}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
