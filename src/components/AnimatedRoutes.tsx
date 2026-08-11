import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageWrapper } from './ui/PageWrapper';
import { SuspenseLoader } from './ui/SuspenseLoader';
import Layout from './Layout';
import { useAuthStore } from '../store/useAuthStore';

import Auth from '../pages/Auth';
import Home from '../pages/Home';
import Roster from '../pages/Roster';
import Tactics from '../pages/Tactics';
import PlayerProfile from '../pages/PlayerProfile';
import Stats from '../pages/Stats';
import Matchday from '../pages/Matchday';
import Operations from '../pages/Operations';
import Menu from '../pages/Menu';
import More from '../pages/More';
import HeadToHead from '../pages/HeadToHead';
import Fitness from '../pages/Fitness';
import Venues from '../pages/Venues';
import DataSync from '../pages/DataSync';
import TierRanking from '../pages/TierRanking';
import ResetPassword from '../pages/ResetPassword';

export const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const isTactics = location.pathname.startsWith('/tactics');
  const isResetPassword = location.pathname === '/reset-password' || window.location.hash.includes('reset-password') || window.location.hash.includes('type=recovery') || window.location.hash.includes('error_code');
  const { session, isGuest, isLoading } = useAuthStore();

  if (isLoading) {
    return <SuspenseLoader />;
  }

  if (isResetPassword) {
    return <ResetPassword />;
  }

  if (!session && !isGuest) {
    return <Auth />;
  }

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<SuspenseLoader />}>
        <Routes location={location} key={isTactics ? 'tactics' : 'main'}>
          <Route path="/" element={<PageWrapper><Layout /></PageWrapper>}>
            <Route index element={<Home />} />
            <Route path="roster" element={<Roster />} />
            <Route path="roster/:id" element={<PlayerProfile />} />
            <Route path="matchday" element={<Matchday />} />
            <Route path="menu" element={<Menu />} />
            <Route path="stats" element={<Stats />} />
            <Route path="operations" element={<Operations />} />
            <Route path="more" element={<More />} />
            <Route path="head-to-head" element={<HeadToHead />} />
            <Route path="fitness" element={<Fitness />} />
            <Route path="venues" element={<Venues />} />
            <Route path="sync" element={<DataSync />} />
            <Route path="tier-ranking" element={<TierRanking />} />
          </Route>
          <Route path="/tactics" element={<PageWrapper><Tactics /></PageWrapper>} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};
