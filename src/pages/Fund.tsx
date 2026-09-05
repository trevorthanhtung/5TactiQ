import React, { useState, useEffect } from 'react';
import { useFundStore } from '../store/useFundStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { 
  ArrowLeft, Plus, Wallet, TrendingUp, TrendingDown, User, 
  Trash2, CheckCircle2, Clock, ShieldAlert, Edit3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { FundTransaction, FineRecord } from '../types';
import { BottomSheet } from '../components/ui/BottomSheet';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { MoneyInput } from '../components/MoneyInput';
import { FundSkeleton } from '../components/ui/FundSkeleton';
import { PlayerPickerModal } from '../components/PlayerPickerModal';
import { OptionPickerModal } from '../components/OptionPickerModal';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/useSettingsStore';
import { formatCurrencyAmount, getCurrencyConfig, LANGUAGE_DEFAULT_CURRENCY } from '../utils/currencyUtils';

const COMMON_FINE_REASONS = [
  'Đi muộn (< 15 phút)',
  'Đi muộn (> 15 phút)',
  'Vắng không phép / Báo sát giờ',
  'Thẻ vàng',
  'Thẻ đỏ',
  'Quên mang áo thi đấu',
  'Khác',
];

export default function Fund() {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fund' | 'fines'>('fund');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const { 
    transactions, 
    addTransaction, 
    updateTransaction,
    deleteTransaction,
    fines,
    addFine,
    updateFine,
    deleteFine,
    payFine,
    unpayFine
  } = useFundStore();

  const { players } = usePlayerStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();

  const activeCurrency = settings.currency || LANGUAGE_DEFAULT_CURRENCY[i18n.language] || 'VND';
  const currencyConfig = getCurrencyConfig(activeCurrency);
  
  // Modals
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showAddFineModal, setShowAddFineModal] = useState(false);
  const [txFilter, setTxFilter] = useState<'all' | 'Thu' | 'Chi'>('all');
  const [fineFilter, setFineFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  // New Transaction Form State
  const [newTx, setNewTx] = useState<{
    date: string;
    type: 'Thu' | 'Chi';
    category: FundTransaction['category'];
    amount: string | number;
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

  // New Fine Form State
  const [newFine, setNewFine] = useState<{
    playerId: string;
    reason: string;
    customReason: string;
    amount: string | number;
    date: string;
    note: string;
  }>({
    playerId: '',
    reason: COMMON_FINE_REASONS[0],
    customReason: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  // Edit Fine State
  const [editingFine, setEditingFine] = useState<FineRecord | null>(null);
  const [showDeleteFineConfirm, setShowDeleteFineConfirm] = useState(false);
  const [editFineForm, setEditFineForm] = useState<{
    playerId: string;
    reason: string;
    customReason: string;
    amount: string | number;
    date: string;
    note: string;
  }>({
    playerId: '',
    reason: COMMON_FINE_REASONS[0],
    customReason: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const handleOpenEditFine = (fine: FineRecord) => {
    const isCommon = COMMON_FINE_REASONS.includes(fine.reason);
    setEditFineForm({
      playerId: fine.playerId,
      reason: isCommon ? fine.reason : 'Khác',
      customReason: isCommon ? '' : fine.reason,
      amount: fine.amount,
      date: fine.date,
      note: fine.note || ''
    });
    setEditingFine(fine);
    setShowDeleteFineConfirm(false);
  };

  const handleSaveEditFine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFine || !editFineForm.playerId || !editFineForm.amount || isNaN(Number(editFineForm.amount))) return;

    const finalReason = editFineForm.reason === 'Khác' 
      ? (editFineForm.customReason.trim() || 'Lý do khác')
      : editFineForm.reason;

    updateFine(editingFine.id, {
      playerId: editFineForm.playerId,
      reason: finalReason,
      amount: Number(editFineForm.amount),
      date: editFineForm.date,
      note: editFineForm.note
    });

    setEditingFine(null);
  };

  // Edit / View Transaction State
  const [editingTx, setEditingTx] = useState<FundTransaction | null>(null);
  const [showDeleteTxConfirm, setShowDeleteTxConfirm] = useState(false);
  const [editTxForm, setEditTxForm] = useState<{
    date: string;
    type: 'Thu' | 'Chi';
    category: FundTransaction['category'];
    amount: string | number;
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

  const isFineTransaction = (tr: FundTransaction) => {
    return tr.id.startsWith('tx_fine_') || tr.category === 'Tiền phạt' || (fines || []).some(f => f.transactionId === tr.id);
  };

  const handleOpenTx = (tr: FundTransaction) => {
    setEditTxForm({
      date: tr.date,
      type: tr.type,
      category: tr.category,
      amount: tr.amount,
      note: tr.note || '',
      playerId: tr.playerId || null
    });
    setEditingTx(tr);
    setShowDeleteTxConfirm(false);
  };

  const handleSaveEditTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !editTxForm.amount || isNaN(Number(editTxForm.amount))) return;

    updateTransaction(editingTx.id, {
      date: editTxForm.date,
      type: editTxForm.type,
      category: editTxForm.category,
      amount: Number(editTxForm.amount),
      note: editTxForm.note,
      playerId: editTxForm.playerId
    });

    setEditingTx(null);
  };

  // Calculate Fund Stats
  const totalThu = transactions.filter(t => t.type === 'Thu').reduce((sum, t) => sum + t.amount, 0);
  const totalChi = transactions.filter(t => t.type === 'Chi').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalThu - totalChi;

  // Calculate Fine Stats
  const safeFines = fines || [];
  const totalFinesAmount = safeFines.reduce((sum, f) => sum + f.amount, 0);
  const paidFinesAmount = safeFines.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
  const unpaidFinesAmount = safeFines.filter(f => f.status === 'unpaid').reduce((sum, f) => sum + f.amount, 0);

  const formatCurrency = (val: number) => {
    return formatCurrencyAmount(val, activeCurrency);
  };

  const handleAddTx = (e: React.FormEvent) => {
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
    
    setShowAddTxModal(false);
    setNewTx({
      date: new Date().toISOString().split('T')[0],
      type: 'Thu',
      category: 'Đóng quỹ thành viên',
      amount: '',
      note: '',
      playerId: null
    });
  };

  const handleAddFine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFine.playerId || !newFine.amount || isNaN(Number(newFine.amount))) return;

    const finalReason = newFine.reason === 'Khác' 
      ? (newFine.customReason.trim() || 'Lý do khác')
      : newFine.reason;

    addFine({
      playerId: newFine.playerId,
      reason: finalReason,
      amount: Number(newFine.amount),
      date: newFine.date,
      status: 'unpaid',
      note: newFine.note
    });

    setShowAddFineModal(false);
    setNewFine({
      playerId: '',
      reason: COMMON_FINE_REASONS[0],
      customReason: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: ''
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

  const getFineReasonLabel = (reason: string) => {
    switch (reason) {
      case 'Đi muộn (< 15 phút)': return t('fund.reason_late_under_15', 'Đi muộn (< 15 phút)');
      case 'Đi muộn (> 15 phút)': return t('fund.reason_late_over_15', 'Đi muộn (> 15 phút)');
      case 'Vắng không phép / Báo sát giờ': return t('fund.reason_absent', 'Vắng không phép / Báo sát giờ');
      case 'Thẻ vàng': return t('fund.reason_yellow_card', 'Thẻ vàng');
      case 'Thẻ đỏ': return t('fund.reason_red_card', 'Thẻ đỏ');
      case 'Quên mang áo thi đấu': return t('fund.reason_forgot_kit', 'Quên mang áo thi đấu');
      case 'Khác': return t('fund.reason_other', 'Khác');
      default: return reason;
    }
  };

  const formatTxNote = (note?: string) => {
    if (!note) return '';
    if (note.startsWith('Nộp phạt: ')) {
      const rawReason = note.replace('Nộp phạt: ', '').trim();
      return `${t('fund.fine_payment_prefix', 'Nộp phạt:')} ${getFineReasonLabel(rawReason)}`;
    }
    return note;
  };

  const getCategoryLabel = (cat: string, type?: 'Thu' | 'Chi') => {
    switch (cat) {
      case 'Đóng quỹ thành viên': return t('fund.cat_membership', 'Đóng quỹ thành viên');
      case 'Tiền phạt': return t('fund.cat_fine', 'Tiền phạt');
      case 'Thuê sân': return t('fund.cat_pitch', 'Thuê sân thi đấu');
      case 'Đồng phục': return t('fund.cat_uniform', 'Đồng phục & Áo đấu');
      case 'Nước uống': return t('fund.cat_drinks', 'Nước uống & Bồi bổ');
      case 'Khác': return type === 'Thu' ? t('fund.cat_other_income', 'Khoản thu khác') : t('fund.cat_other_expense', 'Khoản chi khác');
      default: return cat;
    }
  };

  const getPlayer = (id?: string | null) => {
    if (!id) return null;
    return players.find(x => x.id === id) || null;
  };

  const filteredTransactions = transactions.filter(t => {
    if (txFilter === 'all') return true;
    return t.type === txFilter;
  });

  const filteredFines = safeFines.filter(f => {
    if (fineFilter === 'all') return true;
    return f.status === fineFilter;
  });

  if (isLoading) {
    return <FundSkeleton />;
  }

  return (
    <div className="p-3 sm:p-4 flex flex-col max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pt-1">
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={() => navigate('/more')}
            className="p-1.5 sm:p-2 text-primary hover:bg-primary/10 border-2 border-primary/30 hover:border-primary transition-all shrink-0"
            title="Trở về Thêm"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl md:text-3xl font-display uppercase text-primary leading-tight truncate">
              {t('fund.page_title', 'Phạt & Quỹ Đội')}
            </h1>
          </div>
        </div>

        {activeTab === 'fund' ? (
          <button 
            onClick={() => setShowAddTxModal(true)}
            className="hallmark-btn flex items-center justify-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold uppercase tracking-wider shrink-0 whitespace-nowrap active:scale-95"
          >
            <Plus size={15} /> <span>{t('fund.btn_new_tx', 'Giao dịch')}</span>
          </button>
        ) : (
          <button 
            onClick={() => setShowAddFineModal(true)}
            className="hallmark-btn flex items-center justify-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold uppercase tracking-wider shrink-0 whitespace-nowrap active:scale-95"
          >
            <Plus size={15} /> <span>{t('fund.btn_new_fine', 'Tạo phạt')}</span>
          </button>
        )}
      </div>

      <div className="hallmark-divider my-2 sm:my-3"></div>

      {/* Tabs */}
      <div className="flex border-b-2 border-border-main mb-4">
        <button
          onClick={() => setActiveTab('fund')}
          className={`flex-1 sm:flex-initial flex items-center justify-center px-3 sm:px-5 py-2.5 sm:py-3 font-display uppercase tracking-wider text-xs sm:text-sm transition-colors border-b-4 -mb-[2px] cursor-pointer ${
            activeTab === 'fund' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          <span>{t('fund.tab_fund', 'Quỹ Đội')}</span>
        </button>
        <button
          onClick={() => setActiveTab('fines')}
          className={`flex-1 sm:flex-initial flex items-center justify-center px-3 sm:px-5 py-2.5 sm:py-3 font-display uppercase tracking-wider text-xs sm:text-sm transition-colors border-b-4 -mb-[2px] cursor-pointer ${
            activeTab === 'fines' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          <span>{t('fund.tab_fines', 'Tiền Phạt')}</span>
        </button>
      </div>

      {/* TAB 1: QUỸ ĐỘI */}
      {activeTab === 'fund' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Stats Bar (Mỗi hàng 1 card trên mobile, 3 card ngang trên desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="bg-surface p-3.5 sm:p-4 border-2 border-border-main flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1 shadow-xs">
              <div className="text-text-muted tracking-wider font-bold text-xs sm:text-sm uppercase font-display">
                {t('fund.total_thu', 'TỔNG THU')}
              </div>
              <div className="font-display font-bold text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalThu)}
              </div>
            </div>
            <div className="bg-surface p-3.5 sm:p-4 border-2 border-border-main flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1 shadow-xs">
              <div className="text-text-muted tracking-wider font-bold text-xs sm:text-sm uppercase font-display">
                {t('fund.total_chi', 'TỔNG CHI')}
              </div>
              <div className="font-display font-bold text-xl sm:text-2xl text-rose-600 dark:text-rose-400">
                {formatCurrency(totalChi)}
              </div>
            </div>
            <div className="bg-surface p-3.5 sm:p-4 border-2 border-border-main flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1 shadow-xs">
              <div className="text-text-muted tracking-wider font-bold text-xs sm:text-sm uppercase font-display">
                {t('fund.balance', 'SỐ DƯ')}
              </div>
              <div className={`font-display font-bold text-xl sm:text-2xl ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(balance)}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="font-display uppercase tracking-wider text-primary text-sm sm:text-lg font-bold">
              {t('fund.tx_history', 'Lịch sử thu chi')}
            </h3>
            <div className="flex border-2 border-border-main text-xs font-display uppercase tracking-wider bg-surface w-full sm:w-auto">
              <button
                onClick={() => setTxFilter('all')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-center transition-colors ${txFilter === 'all' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-main'}`}
              >
                {t('fund.filter_all', 'Tất cả')}
              </button>
              <button
                onClick={() => setTxFilter('Thu')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 border-l border-border-main text-center transition-colors ${txFilter === 'Thu' ? 'bg-emerald-600 text-white' : 'text-text-muted hover:text-text-main'}`}
              >
                {t('fund.filter_income', 'Khoản Thu')}
              </button>
              <button
                onClick={() => setTxFilter('Chi')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 border-l border-border-main text-center transition-colors ${txFilter === 'Chi' ? 'bg-rose-600 text-white' : 'text-text-muted hover:text-text-main'}`}
              >
                {t('fund.filter_expense', 'Khoản Chi')}
              </button>
            </div>
          </div>

          {/* Transaction List */}
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="bg-surface border-2 border-dashed border-border-main p-8 text-center text-text-muted font-medium">
                {t('fund.empty_tx', 'Chưa có giao dịch nào trong danh mục này.')}
              </div>
            ) : (
              filteredTransactions.map(tr => {
                const player = getPlayer(tr.playerId);
                return (
                  <div 
                    key={tr.id} 
                    onClick={() => handleOpenTx(tr)}
                    className="bg-surface border-2 border-border-main p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer hover:border-primary/60 transition-colors shadow-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-display uppercase tracking-widest font-bold text-white ${tr.type === 'Thu' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                          {tr.type === 'Thu' ? t('fund.badge_income', 'Thu') : t('fund.badge_expense', 'Chi')}
                        </span>
                        <span className="text-sm font-bold text-primary">{getCategoryLabel(tr.category, tr.type)}</span>
                        <span className="text-xs text-text-muted">{t('fund.label_date', 'Ngày')}: {formatDate(tr.date)}</span>
                      </div>
                      
                      {player && (
                        <div className="text-xs text-text-muted flex items-center gap-1.5 mt-1 font-medium">
                          <User size={13} className="text-secondary" />
                          <span>{player.name} {player.jersey_number ? `(#${player.jersey_number})` : ''}</span>
                        </div>
                      )}
                      
                      {tr.note && <div className="text-xs text-text-muted mt-1 italic">{formatTxNote(tr.note)}</div>}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-border-main/40 shrink-0">
                      <div className={`font-display font-bold text-lg sm:text-2xl ${tr.type === 'Thu' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tr.type === 'Thu' ? '+' : '-'}{formatCurrency(tr.amount)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TIỀN PHẠT */}
      {activeTab === 'fines' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Fines Stats (Mỗi hàng 1 card trên mobile, 3 card ngang trên desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="bg-surface p-3.5 sm:p-4 border-2 border-border-main flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1 shadow-xs">
              <div className="text-text-muted tracking-wider font-bold text-xs sm:text-sm uppercase font-display">
                {t('fund.total_fines', 'TỔNG PHẠT')}
              </div>
              <div className="font-display font-bold text-xl sm:text-2xl text-primary">
                {formatCurrency(totalFinesAmount)}
              </div>
            </div>
            <div className="bg-surface p-3.5 sm:p-4 border-2 border-border-main flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1 shadow-xs">
              <div className="text-text-muted tracking-wider font-bold text-xs sm:text-sm uppercase font-display">
                {t('fund.unpaid_fines', 'CHƯA THU')}
              </div>
              <div className="font-display font-bold text-xl sm:text-2xl text-rose-600">
                {formatCurrency(unpaidFinesAmount)}
              </div>
            </div>
            <div className="bg-surface p-3.5 sm:p-4 border-2 border-border-main flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1 shadow-xs">
              <div className="text-text-muted tracking-wider font-bold text-xs sm:text-sm uppercase font-display">
                {t('fund.paid_fines', 'ĐÃ NỘP')}
              </div>
              <div className="font-display font-bold text-xl sm:text-2xl text-emerald-600">
                {formatCurrency(paidFinesAmount)}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="font-display uppercase tracking-wider text-primary text-sm sm:text-lg font-bold">
              {t('fund.fines_list', 'Danh sách phiếu phạt')}
            </h3>
            <div className="flex border-2 border-border-main text-xs font-display uppercase tracking-wider bg-surface w-full sm:w-auto">
              <button
                onClick={() => setFineFilter('all')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-center transition-colors ${fineFilter === 'all' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-main'}`}
              >
                {t('fund.filter_all', 'Tất cả')}
              </button>
              <button
                onClick={() => setFineFilter('unpaid')}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 border-l border-border-main text-center transition-colors whitespace-nowrap ${fineFilter === 'unpaid' ? 'bg-rose-600 text-white' : 'text-text-muted hover:text-text-main'}`}
              >
                {t('fund.filter_unpaid', 'Chưa nộp')}
              </button>
              <button
                onClick={() => setFineFilter('paid')}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 border-l border-border-main text-center transition-colors whitespace-nowrap ${fineFilter === 'paid' ? 'bg-emerald-600 text-white' : 'text-text-muted hover:text-text-main'}`}
              >
                {t('fund.filter_paid', 'Đã nộp')}
              </button>
            </div>
          </div>

          {/* Fines List */}
          <div className="space-y-3">
            {filteredFines.length === 0 ? (
              <div className="bg-surface border-2 border-dashed border-border-main p-8 text-center text-text-muted font-medium">
                {t('fund.empty_fines', 'Không có phiếu phạt nào trong danh mục này. Đội bóng duy trì kỷ luật rất tốt!')}
              </div>
            ) : (
              filteredFines.map(fine => {
                const player = getPlayer(fine.playerId);
                const isPaid = fine.status === 'paid';

                return (
                  <div 
                    key={fine.id} 
                    onClick={() => handleOpenEditFine(fine)}
                    className="bg-surface border-2 border-border-main p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer hover:border-primary/60 transition-colors shadow-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-display uppercase tracking-widest font-bold text-white ${isPaid ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                          {isPaid ? t('fund.badge_paid', 'ĐÃ NỘP') : t('fund.badge_unpaid', 'CHƯA NỘP')}
                        </span>
                        <span className="font-bold text-primary text-base">
                          {player ? player.name : t('fund.label_player', 'Cầu thủ')} {player?.jersey_number ? `(#${player.jersey_number})` : ''}
                        </span>
                        <span className="text-xs text-text-muted font-medium">{t('fund.label_date', 'Ngày')}: {formatDate(fine.date)}</span>
                      </div>

                      <div className="text-sm font-medium text-text-main mt-1">
                        {t('fund.label_reason', 'Lý do')}: <span className="font-bold text-primary">{getFineReasonLabel(fine.reason)}</span>
                      </div>

                      {fine.note && (
                        <div className="text-xs text-text-muted mt-1 italic">{fine.note}</div>
                      )}
                      
                      {isPaid && fine.paidAt && (
                        <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                          {t('fund.fine_paid_on', 'Đã thu vào quỹ ngày')} {formatDate(fine.paidAt.split('T')[0])}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-border-main/40 shrink-0">
                      <div className="font-display font-bold text-lg sm:text-xl text-rose-600">
                        {formatCurrency(fine.amount)}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isPaid ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              payFine(fine.id);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-display uppercase tracking-wider hover:bg-emerald-700 transition-colors cursor-pointer shrink-0"
                            title="Xác nhận nộp phạt và cộng vào Quỹ đội"
                          >
                            {t('fund.btn_collect', 'Thu phạt')}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              unpayFine(fine.id);
                            }}
                            className="px-2.5 py-1.5 bg-surface border-2 border-border-main text-text-muted hover:text-secondary hover:border-secondary text-xs font-display uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                            title="Hoàn tác trạng thái nộp phạt (chuyển về Chưa nộp & trừ khỏi Quỹ đội)"
                          >
                            {t('fund.btn_undo', 'Hoàn tác')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal: Thêm Giao Dịch Mới */}
      <BottomSheet
        isOpen={showAddTxModal}
        onClose={() => setShowAddTxModal(false)}
        title={
          <span className="flex items-center gap-2">
            <Plus size={20} /> {t('fund.modal_new_tx_title', 'Thêm Giao Dịch Thu / Chi')}
          </span>
        }
      >
        <form onSubmit={handleAddTx} className="space-y-4 pr-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
              {t('fund.label_tx_type', 'Loại giao dịch')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewTx({ ...newTx, type: 'Thu', category: 'Đóng quỹ thành viên' })}
                className={`p-3 text-sm font-bold uppercase tracking-widest border-2 transition-colors ${
                  newTx.type === 'Thu' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-border-main text-text-muted hover:border-emerald-300'
                }`}
              >
                {t('fund.filter_income', 'Khoản Thu')}
              </button>
              <button
                type="button"
                onClick={() => setNewTx({ ...newTx, type: 'Chi', category: 'Thuê sân' })}
                className={`p-3 text-sm font-bold uppercase tracking-widest border-2 transition-colors ${
                  newTx.type === 'Chi' ? 'border-rose-600 bg-rose-600 text-white' : 'border-border-main text-text-muted hover:border-rose-300'
                }`}
              >
                {t('fund.filter_expense', 'Khoản Chi')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('fund.label_category', 'Danh mục')}
            </label>
            <OptionPickerModal
              value={newTx.category}
              onChange={(val) => setNewTx({ ...newTx, category: val as any })}
              title={newTx.type === 'Thu' ? t('fund.cat_other_income', 'Khoản thu') : t('fund.cat_other_expense', 'Khoản chi')}
              options={(newTx.type === 'Thu' ? categoriesThu : categoriesChi).map((c) => ({
                value: c,
                label: getCategoryLabel(c, newTx.type),
              }))}
            />
          </div>

          {newTx.category === 'Đóng quỹ thành viên' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('fund.label_paying_member', 'Thành viên nộp quỹ')}
              </label>
              <PlayerPickerModal
                value={newTx.playerId}
                onChange={(id) => setNewTx({ ...newTx, playerId: id })}
                label={t('fund.label_paying_member', 'Thành viên nộp quỹ')}
                placeholder={t('fund.placeholder_member_picker', '-- Bấm để chọn thành viên --')}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('fund.label_amount', 'Số tiền')} ({activeCurrency})
            </label>
            <MoneyInput 
              required
              value={newTx.amount}
              onChange={val => setNewTx({...newTx, amount: val})}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-xl text-primary"
              placeholder={`Ví dụ: ${currencyConfig.defaultExtra}`}
              currencySymbol={activeCurrency}
            />
          </div>

          <div>
            <CustomDatePicker 
              label={t('fund.label_fine_date', 'Ngày')}
              value={newTx.date}
              onChange={d => setNewTx({...newTx, date: d})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('fund.label_note', 'Ghi chú')}
            </label>
            <input 
              type="text" 
              value={newTx.note}
              onChange={e => setNewTx({...newTx, note: e.target.value})}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium"
              placeholder={t('fund.placeholder_tx_note', 'Ghi chú chi tiết khoản thu/chi...')}
            />
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full hallmark-btn flex items-center justify-center py-3 text-sm font-bold uppercase tracking-wider">
              {t('fund.btn_save_tx', 'LƯU GIAO DỊCH')}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Modal: Tạo Phiếu Phạt */}
      <BottomSheet
        isOpen={showAddFineModal}
        onClose={() => setShowAddFineModal(false)}
        title={
          <span className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-secondary" /> {t('fund.modal_new_fine_title', 'TẠO PHIẾU PHẠT')}
          </span>
        }
      >
        <form onSubmit={handleAddFine} className="space-y-4 pr-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('fund.label_player', 'Cầu thủ')}
            </label>
            <PlayerPickerModal
              value={newFine.playerId}
              onChange={(id) => setNewFine({ ...newFine, playerId: id })}
              label={t('fund.label_player', 'Cầu thủ')}
              placeholder={t('fund.placeholder_player_picker', '-- Bấm để chọn cầu thủ --')}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('fund.label_fine_reason', 'Lý do phạt')}
            </label>
            <OptionPickerModal
              value={newFine.reason}
              onChange={(val) => {
                setNewFine({
                  ...newFine,
                  reason: val,
                });
              }}
              title={t('fund.label_fine_reason', 'Lý do phạt')}
              options={COMMON_FINE_REASONS.map((r) => ({
                value: r,
                label: getFineReasonLabel(r),
              }))}
            />
          </div>

          {newFine.reason === 'Khác' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('fund.label_custom_reason', 'Chi tiết lý do')}
              </label>
              <input 
                type="text" 
                value={newFine.customReason}
                onChange={e => setNewFine({...newFine, customReason: e.target.value})}
                required
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium"
                placeholder={t('fund.placeholder_custom_reason', 'Ví dụ: Làm rách bóng, gây gổ...')}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('fund.label_fine_amount', 'Mức tiền phạt')} ({activeCurrency})
            </label>
            <MoneyInput 
              required
              value={newFine.amount}
              onChange={val => setNewFine({...newFine, amount: val})}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-xl text-secondary"
              placeholder="0"
              currencySymbol={activeCurrency}
            />
          </div>

          <div>
            <CustomDatePicker 
              label={t('fund.label_fine_date', 'Ngày phạt')}
              value={newFine.date}
              onChange={d => setNewFine({...newFine, date: d})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('fund.label_extra_note', 'Ghi chú bổ sung')}
            </label>
            <input 
              type="text" 
              value={newFine.note}
              onChange={e => setNewFine({...newFine, note: e.target.value})}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium"
              placeholder={t('fund.placeholder_fine_note', 'Ghi chú trận đấu, buổi tập hoặc tình huống...')}
            />
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full hallmark-btn flex items-center justify-center py-3 text-sm font-bold uppercase tracking-wider">
              {t('fund.btn_confirm_create_fine', 'XÁC NHẬN TẠO PHIẾU PHẠT')}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Modal: Chỉnh Sửa Phiếu Phạt */}
      <BottomSheet
        isOpen={editingFine !== null && !showDeleteFineConfirm}
        onClose={() => setEditingFine(null)}
        title={
          <span className="flex items-center gap-2">
            <Edit3 size={20} className="text-secondary" /> {t('fund.modal_edit_fine_title', 'CHỈNH SỬA PHIẾU PHẠT')}
          </span>
        }
      >
        {editingFine && (
          <form onSubmit={handleSaveEditFine} className="space-y-4 pr-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('fund.label_player', 'Cầu thủ')}
              </label>
              <PlayerPickerModal
                value={editFineForm.playerId}
                onChange={(id) => setEditFineForm({ ...editFineForm, playerId: id })}
                label={t('fund.label_player', 'Cầu thủ')}
                placeholder={t('fund.placeholder_player_picker', '-- Bấm để chọn cầu thủ --')}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('fund.label_fine_reason', 'Lý do phạt')}
              </label>
              <OptionPickerModal
                value={editFineForm.reason}
                onChange={(val) => {
                  setEditFineForm({
                    ...editFineForm,
                    reason: val,
                  });
                }}
                title={t('fund.label_fine_reason', 'Lý do phạt')}
                options={COMMON_FINE_REASONS.map((r) => ({
                  value: r,
                  label: getFineReasonLabel(r),
                }))}
              />
            </div>

            {editFineForm.reason === 'Khác' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                  {t('fund.label_custom_reason', 'Chi tiết lý do')}
                </label>
                <input 
                  type="text" 
                  value={editFineForm.customReason}
                  onChange={e => setEditFineForm({...editFineForm, customReason: e.target.value})}
                  required
                  className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium"
                  placeholder={t('fund.placeholder_custom_reason', 'Ví dụ: Làm rách bóng, gây gổ...')}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('fund.label_fine_amount', 'Mức tiền phạt')} ({activeCurrency})
              </label>
              <MoneyInput 
                required
                value={editFineForm.amount}
                onChange={val => setEditFineForm({...editFineForm, amount: val})}
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-xl text-secondary"
                placeholder="0"
                currencySymbol={activeCurrency}
              />
            </div>

            <div>
              <CustomDatePicker 
                label={t('fund.label_fine_date', 'Ngày phạt')}
                value={editFineForm.date}
                onChange={d => setEditFineForm({...editFineForm, date: d})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('fund.label_extra_note', 'Ghi chú bổ sung')}
              </label>
              <input 
                type="text" 
                value={editFineForm.note}
                onChange={e => setEditFineForm({...editFineForm, note: e.target.value})}
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium"
                placeholder={t('fund.placeholder_fine_note', 'Ghi chú trận đấu, buổi tập hoặc tình huống...')}
              />
            </div>

            <div className="pt-2 flex items-center gap-2.5 sm:gap-3">
              <button 
                type="button"
                onClick={() => setShowDeleteFineConfirm(true)}
                className="px-3.5 sm:px-4 py-3 bg-rose-500/10 border-2 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500 font-display uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs font-bold whitespace-nowrap shrink-0 active:scale-95"
                title={t('fund.btn_delete_fine', 'Xóa phiếu')}
              >
                <Trash2 size={16} className="shrink-0" />
                <span>{t('fund.btn_delete_fine', 'XÓA PHIẾU')}</span>
              </button>
              <button 
                type="submit" 
                className="flex-1 hallmark-btn flex items-center justify-center py-3 text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap active:scale-95"
              >
                {t('fund.btn_save_changes', 'LƯU THAY ĐỔI')}
              </button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Modal: Xác Nhận Xóa Phiếu Phạt */}
      <BottomSheet
        isOpen={showDeleteFineConfirm && editingFine !== null}
        onClose={() => setShowDeleteFineConfirm(false)}
        variant="danger"
        title={
          <span className="flex items-center gap-2 text-rose-600">
            <Trash2 size={22} /> {t('fund.modal_delete_fine_title', 'XÁC NHẬN XÓA PHIẾU PHẠT')}
          </span>
        }
      >
        <div className="space-y-4">
          <p className="text-text-main text-sm leading-relaxed">
            {t('fund.confirm_delete_fine_prompt', 'Bạn có chắc chắn muốn xóa phiếu phạt của cầu thủ')} <span className="font-bold text-primary">{getPlayer(editingFine?.playerId)?.name || ''}</span>?
          </p>
          {editingFine?.status === 'paid' && (
            <div className="p-3 bg-surface-2 border-2 border-border-main text-xs text-text-muted leading-relaxed">
              <span className="font-bold text-primary uppercase tracking-wider text-[11px] block mb-0.5">Lưu ý</span>
              {t('fund.confirm_delete_fine_note', 'Phiếu phạt này đã được thu vào Quỹ đội. Khi xóa, khoản thu tương ứng cũng sẽ được tự động trừ khỏi Quỹ.')}
            </div>
          )}
          <p className="text-xs text-text-muted italic">
            {t('fund.action_cannot_undo', 'Hành động này không thể hoàn tác sau khi thực hiện.')}
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteFineConfirm(false)}
              className="flex-1 bg-surface text-text-muted font-display uppercase tracking-wider py-3 border-2 border-border-main hover:bg-surface-2 transition-colors cursor-pointer text-xs font-bold"
            >
              {t('fund.btn_cancel', 'HỦY BỎ')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (editingFine) {
                  deleteFine(editingFine.id);
                  setShowDeleteFineConfirm(false);
                  setEditingFine(null);
                }
              }}
              className="flex-1 bg-rose-600 text-white font-display uppercase tracking-wider py-3 border-2 border-rose-700 hover:bg-rose-700 transition-colors cursor-pointer text-xs font-bold"
            >
              {t('fund.btn_confirm_delete', 'XÁC NHẬN XÓA')}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Modal: Chi Tiết Giao Dịch Thu Từ Phạt */}
      <BottomSheet
        isOpen={editingTx !== null && isFineTransaction(editingTx)}
        onClose={() => setEditingTx(null)}
        title={
          <span className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-secondary" /> {t('fund.modal_fine_detail_title', 'CHI TIẾT THU TIỀN PHẠT')}
          </span>
        }
      >
        {editingTx && (
          <div className="space-y-4">
            <div className="p-3.5 bg-surface-2 border-2 border-border-main space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted font-bold uppercase tracking-wider">{t('fund.label_category', 'Danh mục')}</span>
                <span className="text-sm font-bold text-primary">{getCategoryLabel(editingTx.category, editingTx.type)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted font-bold uppercase tracking-wider">{t('fund.label_amount', 'Số tiền')}</span>
                <span className="text-lg font-display font-bold text-emerald-600">+{formatCurrency(editingTx.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted font-bold uppercase tracking-wider">{t('fund.label_date', 'Ngày')}</span>
                <span className="text-sm font-medium text-text-main">{formatDate(editingTx.date)}</span>
              </div>
              {editingTx.playerId && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-muted font-bold uppercase tracking-wider">{t('fund.label_player', 'Cầu thủ')}</span>
                  <span className="text-sm font-bold text-primary">{getPlayer(editingTx.playerId)?.name}</span>
                </div>
              )}
              {editingTx.note && (
                <div className="pt-2 border-t border-border-main/50">
                  <span className="text-xs text-text-muted font-bold uppercase tracking-wider block mb-0.5">{t('fund.label_reason', 'Lý do')}</span>
                  <span className="text-sm text-text-main">{formatTxNote(editingTx.note)}</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-surface-2 border-2 border-border-main text-xs text-text-muted leading-relaxed">
              <span className="font-bold text-primary uppercase tracking-wider text-[11px] block mb-0.5">Lưu ý</span>
              {t('fund.fine_sync_note', 'Khoản thu này được đồng bộ tự động từ mục Tiền Phạt. Để hoàn tác hoặc xóa khoản phạt này, vui lòng thao tác trực tiếp tại tab Tiền Phạt.')}
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="flex-1 bg-surface text-text-muted font-display uppercase tracking-wider py-3 border-2 border-border-main hover:bg-surface-2 transition-colors cursor-pointer text-xs font-bold"
              >
                {t('fund.btn_close', 'ĐÓNG')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingTx(null);
                  setActiveTab('fines');
                }}
                className="flex-1 hallmark-btn flex items-center justify-center py-3 text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer"
              >
                {t('fund.btn_goto_fines', 'ĐẾN TAB TIỀN PHẠT')}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Modal: Chỉnh Sửa Giao Dịch Tạo Riêng */}
      <BottomSheet
        isOpen={editingTx !== null && !isFineTransaction(editingTx) && !showDeleteTxConfirm}
        onClose={() => setEditingTx(null)}
        title={
          <span className="flex items-center gap-2">
            <Edit3 size={20} className="text-secondary" /> {t('fund.modal_edit_tx_title', 'CHỈNH SỬA GIAO DỊCH')}
          </span>
        }
      >
        {editingTx && (
          <form onSubmit={handleSaveEditTx} className="space-y-4 pr-1">
            {/* Loại giao dịch (Thu / Chi) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('fund.label_tx_type', 'Loại giao dịch')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditTxForm({ ...editTxForm, type: 'Thu', category: 'Đóng quỹ thành viên' })}
                  className={`py-2.5 font-display uppercase tracking-wider text-xs font-bold border-2 transition-colors cursor-pointer ${
                    editTxForm.type === 'Thu' 
                      ? 'bg-emerald-600 text-white border-emerald-700' 
                      : 'bg-surface text-text-muted border-border-main hover:bg-surface-2'
                  }`}
                >
                  {t('fund.filter_income', 'Khoản Thu')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTxForm({ ...editTxForm, type: 'Chi', category: 'Thuê sân' })}
                  className={`py-2.5 font-display uppercase tracking-wider text-xs font-bold border-2 transition-colors cursor-pointer ${
                    editTxForm.type === 'Chi' 
                      ? 'bg-rose-600 text-white border-rose-700' 
                      : 'bg-surface text-text-muted border-border-main hover:bg-surface-2'
                  }`}
                >
                  {t('fund.filter_expense', 'Khoản Chi')}
                </button>
              </div>
            </div>

            {/* Danh mục */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('fund.label_category', 'Danh mục')}
              </label>
              <OptionPickerModal
                value={editTxForm.category}
                onChange={(val) => setEditTxForm({ ...editTxForm, category: val })}
                title={editTxForm.type === 'Thu' ? t('fund.cat_other_income', 'Khoản thu') : t('fund.cat_other_expense', 'Khoản chi')}
                options={(editTxForm.type === 'Thu' ? categoriesThu : categoriesChi).map((cat) => ({
                  value: cat,
                  label: getCategoryLabel(cat, editTxForm.type),
                }))}
              />
            </div>

            {/* Số tiền */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('fund.label_amount', 'Số tiền')} ({activeCurrency})
              </label>
              <MoneyInput 
                required
                value={editTxForm.amount}
                onChange={val => setEditTxForm({...editTxForm, amount: val})}
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-xl text-primary"
                placeholder="0"
                currencySymbol={activeCurrency}
              />
            </div>

            {/* Ngày giao dịch */}
            <div>
              <CustomDatePicker 
                label={t('fund.label_fine_date', 'Ngày')}
                value={editTxForm.date}
                onChange={d => setEditTxForm({...editTxForm, date: d})}
              />
            </div>

            {/* Thành viên liên quan (nếu có) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('fund.label_related_member', 'Thành viên liên quan (không bắt buộc)')}
              </label>
              <PlayerPickerModal
                value={editTxForm.playerId || ''}
                onChange={(id) => setEditTxForm({ ...editTxForm, playerId: id || null })}
                label={t('fund.label_player', 'Cầu thủ')}
                placeholder={t('fund.placeholder_related_member', '-- Không chỉ định thành viên --')}
              />
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('fund.label_note', 'Ghi chú')}
              </label>
              <input 
                type="text" 
                value={editTxForm.note}
                onChange={e => setEditTxForm({...editTxForm, note: e.target.value})}
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium"
                placeholder={t('fund.placeholder_tx_note', 'Ghi chú chi tiết khoản thu/chi...')}
              />
            </div>

            {/* Nút Xóa & Lưu */}
            <div className="pt-2 flex items-center gap-2.5 sm:gap-3">
              <button 
                type="button"
                onClick={() => setShowDeleteTxConfirm(true)}
                className="px-3.5 sm:px-4 py-3 bg-rose-500/10 border-2 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500 font-display uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs font-bold whitespace-nowrap shrink-0 active:scale-95"
                title={t('fund.btn_delete_tx', 'Xóa giao dịch')}
              >
                <Trash2 size={16} className="shrink-0" />
                <span>{t('fund.btn_delete_tx', 'XÓA GIAO DỊCH')}</span>
              </button>
              <button 
                type="submit" 
                className="flex-1 hallmark-btn flex items-center justify-center py-3 text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap active:scale-95"
              >
                {t('fund.btn_save_changes', 'LƯU THAY ĐỔI')}
              </button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Modal: Xác Nhận Xóa Giao Dịch */}
      <BottomSheet
        isOpen={showDeleteTxConfirm && editingTx !== null}
        onClose={() => setShowDeleteTxConfirm(false)}
        variant="danger"
        title={
          <span className="flex items-center gap-2 text-rose-600">
            <Trash2 size={22} /> {t('fund.modal_delete_tx_title', 'XÁC NHẬN XÓA GIAO DỊCH')}
          </span>
        }
      >
        <div className="space-y-4">
          <p className="text-text-main text-sm leading-relaxed">
            {t('fund.confirm_delete_tx_prompt', 'Bạn có chắc chắn muốn xóa giao dịch')} <span className="font-bold text-primary">{editingTx && getCategoryLabel(editingTx.category, editingTx.type)} ({editingTx && formatCurrency(editingTx.amount)})</span>?
          </p>
          <p className="text-xs text-text-muted italic">
            {t('fund.confirm_delete_tx_note', 'Hành động này sẽ cập nhật lại Số dư Quỹ đội và không thể hoàn tác.')}
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteTxConfirm(false)}
              className="flex-1 bg-surface text-text-muted font-display uppercase tracking-wider py-3 border-2 border-border-main hover:bg-surface-2 transition-colors cursor-pointer text-xs font-bold"
            >
              {t('fund.btn_cancel', 'HỦY BỎ')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (editingTx) {
                  deleteTransaction(editingTx.id);
                  setShowDeleteTxConfirm(false);
                  setEditingTx(null);
                }
              }}
              className="flex-1 bg-rose-600 text-white font-display uppercase tracking-wider py-3 border-2 border-rose-700 hover:bg-rose-700 transition-colors cursor-pointer text-xs font-bold"
            >
              {t('fund.btn_confirm_delete', 'XÁC NHẬN XÓA')}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
