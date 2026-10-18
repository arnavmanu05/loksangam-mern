import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LightboxProvider } from './components/LightboxModal';
import Navbar from './components/Navbar';
import BackToTop from './components/BackToTop';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MemoryDetailPage from './pages/MemoryDetailPage';
import EventsPage from './pages/EventsPage';
import PublicProfilePage from './pages/PublicProfilePage';
import CreatePostPage from './pages/CreatePostPage';
import CreateEventPage from './pages/CreateEventPage';

function AppLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <>
      {!isAuthPage && <Navbar />}
      <div className={isAuthPage ? '' : 'container'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/event/create" element={<CreateEventPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/memory/:id" element={<MemoryDetailPage />} />
          <Route path="/profile/:username" element={<PublicProfilePage />} />
        </Routes>
      </div>
      {!isAuthPage && <BackToTop />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <LightboxProvider>
          <AppLayout />
        </LightboxProvider>
      </AuthProvider>
    </Router>
  );
}
