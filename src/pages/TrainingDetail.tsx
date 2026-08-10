import { useTrainingStore } from '../store/useTrainingStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { ArrowLeft, Check, X, Clock, UserMinus } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function TrainingDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { sessions, updateAttendance, updateSession } = useTrainingStore();
  const { players } = usePlayerStore();

  const session = sessions.find(s => s.id === id);

  if (!session) {
    return <div className="p-4 text-center">{t('training_detail.not_found', 'Không tìm thấy buổi tập.')}</div>;
  }

  const presentCount = Object.values(session.attendance).filter(status => status === 'present' || status === 'late').length;
  const totalPlayers = players.length;
  const attendanceRate = totalPlayers > 0 ? Math.round((presentCount / totalPlayers) * 100) : 0;

  const handleStatusChange = (playerId: string, status: 'present' | 'absent' | 'late' | 'excused' | 'pending') => {
    updateAttendance(session.id, playerId, status);
  };

  const getStatusButton = (playerId: string, type: 'present' | 'absent' | 'late' | 'excused') => {
    const currentStatus = session.attendance[playerId] || 'pending';
    const isSelected = currentStatus === type;

    let icon, label, colorClass, baseClass;
    
    switch (type) {
      case 'present':
        icon = <Check size={14} />;
        label = t('training_detail.present', 'Có mặt');
        colorClass = 'bg-emerald-600 text-white border-emerald-700';
        baseClass = 'text-emerald-700 hover:bg-emerald-50 border-emerald-200 bg-surface';
        break;
      case 'absent':
        icon = <X size={14} />;
        label = t('training_detail.absent', 'Vắng');
        colorClass = 'bg-rose-600 text-white border-rose-700';
        baseClass = 'text-rose-700 hover:bg-rose-50 border-rose-200 bg-surface';
        break;
      case 'late':
        icon = <Clock size={14} />;
        label = t('training_detail.late', 'Trễ');
        colorClass = 'bg-amber-500 text-white border-amber-600';
        baseClass = 'text-amber-700 hover:bg-amber-50 border-amber-200 bg-surface';
        break;
      case 'excused':
        icon = <UserMinus size={14} />;
        label = t('training_detail.excused', 'Xin phép');
        colorClass = 'bg-slate-600 text-white border-slate-700';
        baseClass = 'text-text-muted hover:bg-slate-50 border-border-main bg-surface';
        break;
    }

    return (
      <button
        onClick={() => handleStatusChange(playerId, isSelected ? 'pending' : type)}
        className={`flex-1 flex flex-col items-center justify-center p-1.5 border rounded-sm transition-all ${isSelected ? colorClass : baseClass}`}
      >
        {icon}
        <span className="text-[9px] uppercase font-bold tracking-widest mt-1">{label}</span>
      </button>
    );
  };

  return (
    <div className="p-4 flex flex-col min-h-full max-w-5xl mx-auto w-full pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 @sm:gap-3 mb-6 pt-2">
        <div className="flex items-center gap-2 @sm:gap-3">
          <button 
            onClick={() => navigate('/training')}
            className="p-2 text-primary hover:bg-primary/10 border-2 border-primary/30 hover:border-primary transition-all shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl @md:text-4xl font-display uppercase text-primary leading-none">{t('training_detail.title', 'Chi tiết điểm danh')}</h1>
            <p className="text-sm text-text-muted font-medium mt-1">{t('training_detail.date_prefix', 'Ngày:')} {session.date.split('-').reverse().join('/')}</p>
          </div>
        </div>
        <button
          onClick={() => updateSession(session.id, { status: session.status === 'upcoming' ? 'finished' : 'upcoming' })}
          className={`px-4 py-2 font-display uppercase tracking-widest text-xs font-bold text-white transition-colors ${session.status === 'upcoming' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-800'}`}
        >
          {session.status === 'upcoming' ? t('training_detail.end_session_btn', 'Kết thúc buổi tập') : t('training_detail.reopen_session_btn', 'Mở lại buổi tập')}
        </button>
      </div>

      <div className="hallmark-divider mb-6"></div>

      {/* Stats */}
      <div className="bg-surface border-2 border-border-main p-4 flex items-center justify-between mb-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-border-main flex items-center justify-center relative">
            <svg className="w-full h-full absolute inset-0 -rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" className="stroke-slate-100" strokeWidth="8" />
              <circle cx="32" cy="32" r="28" fill="none" className="stroke-primary" strokeWidth="8" strokeDasharray={`${attendanceRate * 1.75} 200`} strokeLinecap="round" />
            </svg>
            <span className="font-display font-bold text-primary text-xl relative">{attendanceRate}%</span>
          </div>
          <div>
            <div className="text-sm text-text-muted uppercase tracking-widest font-bold">{t('training_detail.attendance_rate', 'Tỷ lệ có mặt')}</div>
            <div className="font-display text-xl text-primary">{presentCount} / {totalPlayers} {t('training_detail.attendance_count', 'quân số')}</div>
          </div>
        </div>
      </div>

      {/* Roster List */}
      <div className="space-y-2">
        {players.map(player => (
          <div key={player.id} className="bg-surface border-2 border-border-main p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3">
              {player.photo_url ? (
                <img src={player.photo_url} alt={player.name} className="w-10 h-10 object-cover rounded-full border-2 border-border-main" />
              ) : (
                <div className="w-10 h-10 bg-primary/10 rounded-full border-2 border-border-main flex items-center justify-center">
                  <span className="font-display font-bold text-primary text-sm">{player.name.substring(0, 2).toUpperCase()}</span>
                </div>
              )}
              <div>
                <h3 className="font-display font-bold text-primary uppercase leading-tight">{player.name}</h3>
                <div className="text-xs text-text-muted font-medium">#{player.jersey_number || '--'} • {player.positions.join(', ')}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {getStatusButton(player.id, 'present')}
              {getStatusButton(player.id, 'absent')}
              {getStatusButton(player.id, 'late')}
              {getStatusButton(player.id, 'excused')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
