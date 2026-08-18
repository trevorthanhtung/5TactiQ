import { useState } from 'react';
import { ArrowLeft, Landmark, Shirt, MapPin, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Operations() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'finance' | 'jersey' | 'field'>('finance');

  return (
    <div className="p-4 flex flex-col max-w-5xl mx-auto w-full">
      <Link to="/menu" className="flex items-center gap-2 font-bold text-text-muted hover:text-primary mb-6 transition-colors">
        <ArrowLeft size={20} /> {t('operations.back_menu', 'Về Menu')}
      </Link>
      
      <h1 className="text-4xl @sm:text-5xl font-display uppercase text-primary leading-none mb-6">{t('operations.title', 'Vận hành')}</h1>

      <div className="flex border-b-2 border-border-main mb-6 flex-wrap shrink-0">
        <button 
          onClick={() => setActiveTab('finance')}
          className={`flex items-center gap-2 px-4 py-3 text-lg font-display uppercase tracking-widest transition-colors border-b-4 -mb-[2px] ${activeTab === 'finance' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-text-muted'}`}
        >
          <Landmark size={20} /> {t('operations.tab_finance', 'Quỹ Đội')}
        </button>
        <button 
          onClick={() => setActiveTab('jersey')}
          className={`flex items-center gap-2 px-4 py-3 text-lg font-display uppercase tracking-widest transition-colors border-b-4 -mb-[2px] ${activeTab === 'jersey' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-text-muted'}`}
        >
          <Shirt size={20} /> {t('operations.tab_jersey', 'Áo đấu')}
        </button>
        <button 
          onClick={() => setActiveTab('field')}
          className={`flex items-center gap-2 px-4 py-3 text-lg font-display uppercase tracking-widest transition-colors border-b-4 -mb-[2px] ${activeTab === 'field' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-text-muted'}`}
        >
          <MapPin size={20} /> {t('operations.tab_field', 'Sân bãi')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {activeTab === 'finance' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="hallmark-card bg-primary text-white p-6 text-center border-primary">
               <div className="text-sm font-bold uppercase tracking-widest text-accent mb-2">{t('operations.current_balance', 'Số dư quỹ hiện tại')}</div>
               <div className="text-5xl @sm:text-7xl font-display">2.500.000đ</div>
               <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
                 <button className="bg-accent text-primary px-6 py-2 font-display uppercase tracking-widest hover:bg-surface transition-colors">
                   {t('operations.add_tx_btn', '+ Thêm thu/chi')}
                 </button>
                 <Link to="/fee-splitter" className="bg-surface text-primary border border-surface/20 px-6 py-2 font-display uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-2">
                   <Calculator size={18} /> {t('fee_splitter.title', 'Chia tiền sân')}
                 </Link>
               </div>
            </div>

            
            <h3 className="font-display text-2xl uppercase text-primary pt-4">{t('operations.recent_history', 'Lịch sử gần đây')}</h3>
            <div className="space-y-0 border-t-2 border-border-main">
               <div className="flex justify-between items-center py-4 border-b-2 border-primary/10">
                 <div>
                   <div className="font-bold text-primary">Thu quỹ tháng 8</div>
                   <div className="text-xs font-bold uppercase tracking-widest text-slate-400">10/08/2026</div>
                 </div>
                 <div className="text-2xl font-display text-green-600">+ 1.000.000đ</div>
               </div>
               <div className="flex justify-between items-center py-4 border-b-2 border-primary/10">
                 <div>
                   <div className="font-bold text-primary">Tiền sân trận FC Tào Phớ</div>
                   <div className="text-xs font-bold uppercase tracking-widest text-slate-400">05/08/2026</div>
                 </div>
                 <div className="text-2xl font-display text-red-500">- 450.000đ</div>
               </div>
               <div className="flex justify-between items-center py-4 border-b-2 border-primary/10">
                 <div>
                   <div className="font-bold text-primary">Mua bóng mới (2 quả)</div>
                   <div className="text-xs font-bold uppercase tracking-widest text-slate-400">01/08/2026</div>
                 </div>
                 <div className="text-2xl font-display text-red-500">- 1.200.000đ</div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'jersey' && (
          <div className="grid grid-cols-2 @sm:grid-cols-3 @md:grid-cols-4 gap-4 max-w-4xl mx-auto">
             <div className="hallmark-card bg-slate-900 text-white p-4 flex flex-col items-center justify-center border-slate-700 aspect-square">
               <div className="text-5xl font-display mb-2 text-secondary">01</div>
               <div className="text-sm font-bold uppercase tracking-widest">Văn Lâm</div>
             </div>
             <div className="hallmark-card bg-slate-900 text-white p-4 flex flex-col items-center justify-center border-slate-700 aspect-square">
               <div className="text-5xl font-display mb-2 text-secondary">05</div>
               <div className="text-sm font-bold uppercase tracking-widest">Ngọc Hải</div>
             </div>
             <div className="hallmark-card bg-slate-900 text-white p-4 flex flex-col items-center justify-center border-slate-700 aspect-square">
               <div className="text-5xl font-display mb-2 text-secondary">10</div>
               <div className="text-sm font-bold uppercase tracking-widest">Công Phượng</div>
             </div>
             <div className="hallmark-card bg-surface p-4 flex flex-col items-center justify-center border-dashed border-2 border-slate-300 text-slate-400 aspect-square hover:bg-slate-50 cursor-pointer transition-colors">
               <div className="text-4xl font-display mb-2">{t('operations.empty_kit', 'Trống')}</div>
               <div className="text-xs font-bold uppercase tracking-widest">{t('operations.add_kit', '+ Cấp áo mới')}</div>
             </div>
          </div>
        )}

        {activeTab === 'field' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="hallmark-card p-5">
              <h3 className="font-display text-2xl uppercase text-primary mb-1">Sân Bách Khoa</h3>
              <div className="text-sm font-medium text-text-muted mb-4">Trần Đại Nghĩa, Hai Bà Trưng</div>
              <div className="flex gap-4 border-t-2 border-primary/10 pt-4">
                 <div>
                   <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('operations.time_slot', 'Khung giờ')}</div>
                   <div className="font-bold text-primary mt-1">19:00 - 20:30 (Thứ 3)</div>
                 </div>
                 <div>
                   <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('operations.price', 'Giá tiền')}</div>
                   <div className="font-bold text-primary mt-1">450K / trận</div>
                 </div>
              </div>
            </div>
            
            <button className="hallmark-btn-outline w-full border-dashed text-text-muted border-slate-400 hover:bg-slate-200 hover:text-slate-700 hover:border-slate-400">
               {t('operations.add_venue_btn', '+ Thêm sân quen')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
