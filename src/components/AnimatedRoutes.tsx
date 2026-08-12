import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageWrapper } from './ui/PageWrapper';
import { SuspenseLoader } from './ui/SuspenseLoader';
import Layout from './Layout';
import { useAuthStore } from '../store/useAuthStore';
import { isInstalledApp } from '../utils/platform';

import Auth from '../pages/Auth';
import LandingPage from '../pages/LandingPage';
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
import FeeSplitter from '../pages/FeeSplitter';

export const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const isTactics = location.pathname.startsWith('/tactics');
  const isResetPassword = location.pathname === '/reset-password' || window.location.hash.includes('reset-password') || window.location.hash.includes('type=recovery') || window.location.hash.includes('error_code');
  const isAuthRoute = location.pathname === '/auth' || window.location.hash.includes('/auth') || window.location.hash.includes('auth');
  const { session, isGuest, isLoading } = useAuthStore();

  if (isLoading) {
    return <SuspenseLoader />;
  }

  const isInstalled = isInstalledApp();
  const isWebLanding = !session && !isGuest && !isInstalled && !isAuthRoute;

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<SuspenseLoader />}>
        <Routes location={location} key={isTactics ? 'tactics' : 'main'}>
          {/* Reset Password Route */}
          {isResetPassword && <Route path="*" element={<ResetPassword />} />}

          {/* Web visitors seeing Landing Page by default */}
          {isWebLanding && <Route path="*" element={<LandingPage />} />}

          {/* Installed App users (unauthenticated) seeing Auth by default */}
          {!session && !isGuest && isInstalled && <Route path="*" element={<Auth />} />}

          {/* Main App Layout (for logged-in or guest users) */}
          {(session || isGuest) && (
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
              <Route path="fee-splitter" element={<FeeSplitter />} />
            </Route>
          )}

          {/* Explicit routes accessible anytime */}
          <Route path="/landing" element={<LandingPage />} />

          <Route path="/auth" element={<Auth />} />
          <Route path="/tactics" element={<PageWrapper><Tactics /></PageWrapper>} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};
