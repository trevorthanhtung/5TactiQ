import { useState } from 'react';
import { useTrainingStore } from '../store/useTrainingStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { ArrowLeft, Plus, CalendarClock, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { CustomTimePicker } from '../components/CustomTimePicker';
import { useHardwareBack } from '../hooks/useHardwareBack';
import { BottomSheet } from '../components/ui/BottomSheet';

export default function Training() {
  const { sessions, addSession } = useTrainingStore();
  const { players } = usePlayerStore();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useHardwareBack(showCreateModal, () => setShowCreateModal(false));

  const [newSession, setNewSession] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    venue: '',
    note: ''
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addSession({
      ...newSession,
      status: 'upcoming'
    });
    setShowCreateModal(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}/${m}/${y}`;
  };

  const upcomingSessions = sessions.filter(s => s.status === 'upcoming');
  const finishedSessions = sessions.filter(s => s.status === 'finished');

  const SessionCard = ({ session }: { session: any }) => {
    const presentCount = Object.values(session.attendance).filter(status => status === 'present' || status === 'late').length;
    const totalPlayers = players.length;

    return (
      <div
        onClick={() => navigate(`/training/${session.id}`)}
        className="hallmark-card p-0 overflow-hidden cursor-pointer group hover:shadow-lg transition-all border-2 border-border-main"
      >
        <div className={`h-1.5 ${session.status === 'upcoming' ? 'bg-primary' : 'bg-slate-400'}`} />
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-display uppercase tracking-widest font-bold text-slate-400">
              Buổi tập
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-display uppercase font-bold ${session.status === 'upcoming' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-surface text-text-muted border border-border-main'}`}>
              {session.status === 'upcoming' ? 'SẮP TỚI' : 'ĐÃ KẾT THÚC'}
            </span>
          </div>

          <h3 className="font-display text-xl uppercase text-primary leading-tight mb-3 group-hover:text-secondary transition-colors">
            {formatDate(session.date)}
          </h3>

          <div className="space-y-1.5 text-xs text-text-muted font-medium mb-4">
            <div className="flex items-center gap-1.5">
              <CalendarClock size={13} className="text-secondary shrink-0" />
              <span>{session.time}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-secondary shrink-0" />
              <span className="truncate">{session.venue || 'Chưa rõ sân'}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-2 border-t-2 border-primary/10 flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-xs text-text-muted font-bold uppercase tracking-widest">
              <Users size={14} className="text-primary" />
              Điểm danh
            </div>
            <span className="text-sm font-display font-bold text-primary">
              {presentCount} <span className="text-slate-400 text-xs">/ {totalPlayers}</span>
            </span>
          </div>
        </div>
      </div>
    );
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
            <h1 className="text-2xl @md:text-4xl font-display uppercase text-primary leading-none">Lịch tập luyện</h1>
            <p className="text-sm text-text-muted font-medium mt-1">Lên lịch & điểm danh quân số</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 font-display uppercase tracking-widest text-secondary hover:text-primary transition-colors"
        >
          <Plus size={20} /> <span className="hidden @xl:inline">Tạo buổi tập</span>
        </button>
      </div>

      <div className="hallmark-divider mb-6"></div>

      {upcomingSessions.length === 0 && finishedSessions.length === 0 ? (
        <div className="hallmark-card p-8 text-center bg-surface border-2 border-border-main shadow-xl mt-4 max-w-md mx-auto w-full">
          <CalendarClock size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-2xl font-display text-text-muted uppercase mb-2">Chưa có buổi tập</h2>
          <p className="text-sm font-medium text-slate-400 mb-6">
            Lên lịch tập luyện ngay để đội bóng duy trì phong độ nhé!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="hallmark-btn w-full py-3.5 text-lg font-bold bg-primary text-white flex items-center justify-center gap-2"
          >
            <Plus size={20} /> <span>TẠO BUỔI TẬP</span>
          </button>
        </div>
      ) : (
        <>
          {upcomingSessions.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-sm uppercase tracking-widest text-primary mb-4 font-bold">
                Sắp tới ({upcomingSessions.length})
              </h2>
              <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4">
                {upcomingSessions.map(s => <SessionCard key={s.id} session={s} />)}
              </div>
            </div>
          )}

          {finishedSessions.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-sm uppercase tracking-widest text-slate-400 mb-4 font-bold">
                Đã kết thúc ({finishedSessions.length})
              </h2>
              <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4">
                {finishedSessions.map(s => <SessionCard key={s.id} session={s} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Tạo buổi tập */}
      <BottomSheet
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={
          <span className="flex items-center gap-2">
            <Plus size={24} /> Tạo buổi tập
          </span>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4 pr-1">
          <div className="grid grid-cols-2 gap-4">
            <CustomDatePicker
              value={newSession.date}
              onChange={d => setNewSession({ ...newSession, date: d })}
            />
            <CustomTimePicker
              value={newSession.time}
              onChange={t => setNewSession({ ...newSession, time: t })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">Sân bóng</label>
            <input
              type="text"
              required
              value={newSession.venue}
              onChange={e => setNewSession({ ...newSession, venue: e.target.value })}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-primary"
              placeholder="Nhập tên sân bóng..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">Ghi chú</label>
            <textarea
              value={newSession.note}
              onChange={e => setNewSession({ ...newSession, note: e.target.value })}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium min-h-[80px]"
              placeholder="Nội dung/giáo án buổi tập..."
            />
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full bg-secondary text-white font-display uppercase tracking-wider py-3 border-2 border-secondary hover:bg-[#d05c21] transition-colors active:scale-95">
              TẠO BUỔI TẬP
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
