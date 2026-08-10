import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useMatchStore } from '../store/useMatchStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Users, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HomeSkeleton } from '../components/ui/HomeSkeleton';
import { compareVietnameseNames } from '../utils/sortUtils';

export default function Home() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Artificial delay to show the Skeleton loading state (simulate native app DB parse)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const { players } = usePlayerStore();
  const { matches } = useMatchStore();
  const { settings } = useSettingsStore();

  const activeOrUpcomingMatch = matches.find(m => m.status === 'live') || matches.find(m => m.status === 'upcoming');

  // Calculate top scorers from finished matches
  const finishedMatches = matches.filter(m => m.status === 'finished');
  const goalCounts: Record<string, number> = {};
  
  finishedMatches.forEach(m => {
    if (m.matchType !== 'internal') {
      m.stats?.forEach(s => {
        if (s.goals > 0) {
          goalCounts[s.playerId] = (goalCounts[s.playerId] || 0) + s.goals;
        }
      });
    }
  });

  const topScorers = players
    .map(p => ({ ...p, goals: goalCounts[p.id] || 0 }))
    .sort((a, b) => {
      const diff = b.goals - a.goals;
      if (diff !== 0) return diff;
      return compareVietnameseNames(a.name, b.name);
    })
    .slice(0, 3);

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 flex flex-col min-h-full max-w-5xl mx-auto w-full pb-8">
      
      {/* Editorial Header */}
      <header className="mb-8 pt-4">
        <h1 className="text-4xl @md:text-6xl font-display font-bold text-primary leading-none uppercase tracking-tighter">
          {t('home.title')}<br/>
          <span className="text-secondary">{settings.teamName || '5TactiQ'}</span>
        </h1>
        <div className="hallmark-divider"></div>

      </header>

      {/* Bento Grid using Container Queries (@) */}
      <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4">
        
        {/* Next Match Card */}
        <div className="hallmark-card p-5 col-span-1 @md:col-span-2 @xl:col-span-2 flex flex-col justify-between">
          {activeOrUpcomingMatch ? (
            <>
              <div className="flex justify-between items-start mb-6">
                <h2 className="font-display text-2xl uppercase tracking-widest text-secondary flex items-center gap-2">
                  {activeOrUpcomingMatch.status === 'live' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  )}
                  <span>
                    {(() => {
                      if (activeOrUpcomingMatch.status === 'live') return t('home.match_live');
                      const today = new Date().toISOString().split('T')[0];
                      if (activeOrUpcomingMatch.date > today) return t('home.match_upcoming');
                      if (activeOrUpcomingMatch.date === today) return t('home.match_today');
                      return t('home.match_overdue');
                    })()}
                  </span>
                </h2>
                <div className="text-text-muted font-medium mt-1">
                  {activeOrUpcomingMatch.date?.split('-').reverse().join('/')}
                </div>
              </div>
              <div className="flex flex-col @md:flex-row @md:items-end justify-between gap-4">
                <div>
                  <div className="text-3xl @md:text-5xl font-bold font-display uppercase leading-none mb-1 text-primary">
                    {activeOrUpcomingMatch.matchType === 'internal' ? t('home.internal_match') : `vs ${activeOrUpcomingMatch.opponent || ''}`}
                  </div>
                  <div className="text-text-muted font-medium mt-2">
                    {activeOrUpcomingMatch.time} - {activeOrUpcomingMatch.location || t('home.no_location')}
                  </div>
                </div>
                <Link to={`/matchday?id=${activeOrUpcomingMatch.id}`} className="bg-secondary text-white font-display uppercase tracking-widest px-4 py-3 @md:py-2 hover:bg-surface hover:text-secondary transition-colors text-center shrink-0 mt-2 @md:mt-0 w-full @md:w-auto">
                  {t('home.go_to_match')}
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-6 h-full">
              <h2 className="font-display text-2xl uppercase tracking-widest text-primary mb-2">{t('home.no_match_title')}</h2>
              <p className="text-sm font-medium text-text-muted mb-6 max-w-sm">
                {t('home.no_match_desc')}
              </p>
              <Link to="/matchday" className="bg-secondary text-white font-display uppercase tracking-widest px-6 py-2.5 hover:bg-surface hover:text-secondary transition-colors text-center shrink-0">
                {t('home.create_match')}
              </Link>
            </div>
          )}
        </div>

        {/* Roster Summary */}
        <div className="hallmark-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-xl uppercase tracking-widest text-primary">{t('home.roster_title')}</h2>
              <Users className="text-secondary" />
            </div>
            <div className="text-5xl font-display text-primary">{players.length}</div>
            <div className="text-sm text-text-muted font-medium">{t('home.players_ready')}</div>
          </div>
          <Link to="/roster" className="mt-6 flex items-center justify-between text-secondary font-bold group">
            <span>{t('home.manage_team')}</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Quick Tactics */}
        <div className="hallmark-card p-5 @md:col-span-1 @xl:col-span-1">
           <h2 className="font-display text-xl uppercase tracking-widest text-primary mb-4">{t('home.tactics_title')}</h2>
           <p className="text-sm text-text-muted mb-6">{t('home.tactics_desc')}</p>
           <Link to="/tactics" className="hallmark-btn w-full flex justify-center">
             {t('home.open_tactics')}
           </Link>
        </div>

        {/* Stats Snippet */}
        <div className="hallmark-card p-5 @md:col-span-2 @xl:col-span-2 bg-surface-2 border-border-main shadow-lg">
           <div className="flex justify-between items-center mb-4">
             <h2 className="font-display text-xl uppercase tracking-widest text-primary">{t('home.top_scorers')}</h2>
             <Link to="/stats" className="text-xs text-text-muted hover:text-secondary uppercase font-bold tracking-widest transition-colors">
               {t('home.see_all')} &rarr;
             </Link>
           </div>
           <div className="space-y-3">
             {topScorers.map((p, i) => (
               <div key={p.id} className="flex justify-between items-center border-b border-border-main pb-2">
                 <div className="flex items-center gap-3">
                   <span className="font-display text-xl text-secondary w-4">{i + 1}</span>
                   <span className="font-medium uppercase text-text-main">{p.name}</span>
                 </div>
                 <span className="font-display text-2xl text-text-main">{p.goals} <span className="text-sm text-text-muted">{t('home.goals')}</span></span>
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}
