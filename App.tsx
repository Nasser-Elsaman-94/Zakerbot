
import React, { useState, useCallback, useEffect } from 'react';
import { UserProfile } from './types';
import AuthPage from './components/auth/AuthPage';
import { MainChatPage } from './components/MainChatPage';
import HomePage from './components/pages/HomePage';
import { ToastProvider } from './contexts/ToastContext';

type View = 'home' | 'auth' | 'chat';
type AuthMode = 'login' | 'register';

const App: React.FC = () => {
  // Lazily initialize state from localStorage once to avoid reading on every render.
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const storedProfile = localStorage.getItem('userProfile');
      return storedProfile ? JSON.parse(storedProfile) : null;
    } catch (error) {
      console.error("Failed to parse user profile from localStorage", error);
      localStorage.removeItem('userProfile'); // Clear invalid item
      return null;
    }
  });

  // The view state depends on the initial user profile.
  const [currentView, setCurrentView] = useState<View>(userProfile ? 'chat' : 'home');
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Effect to synchronize the userProfile state TO localStorage whenever it changes.
  // This centralizes the logic for saving/removing the profile, making it more robust.
  useEffect(() => {
    try {
      if (userProfile) {
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
      } else {
        localStorage.removeItem('userProfile');
      }
    } catch (error) {
      console.error("Failed to save user profile to localStorage", error);
    }
  }, [userProfile]);

  // Handlers now manage state and navigation. The useEffect hook handles persistence automatically.
  const handleLogin = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.removeItem('lastUserName'); // Clear any previous user's name
    setCurrentView('chat');
  }, []);

  const handleLogout = useCallback(() => {
    if (userProfile) {
      localStorage.setItem('lastUserName', userProfile.name);
    }
    setUserProfile(null);
    setCurrentView('home');
  }, [userProfile]);

  const handleProfileUpdate = useCallback((updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  }, []);

  const navigateToAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setCurrentView('auth');
  };

  const navigateToHome = useCallback(() => {
    setCurrentView('home');
  }, []);

  const renderCurrentView = () => {
    if (currentView === 'home') {
      return <HomePage onNavigateToAuth={navigateToAuth} />;
    }
    if (currentView === 'auth') {
      return <AuthPage onLogin={handleLogin} initialMode={authMode} onBackToHome={() => setCurrentView('home')} />;
    }
    if (currentView === 'chat' && userProfile) {
      return <MainChatPage userProfile={userProfile} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} onNavigateHome={navigateToHome} />;
    }
    // Fallback to home page for safety
    return <HomePage onNavigateToAuth={navigateToAuth} />;
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
        {renderCurrentView()}
      </div>
    </ToastProvider>
  );
};

export default App;