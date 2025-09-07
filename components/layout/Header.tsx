

import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../../types';

interface HeaderProps {
  userProfile: UserProfile;
  onLogout: () => void;
  onNavigateToProfile: () => void;
  onNavigateToChat: () => void;
  onNavigateHome: () => void;
  onToggleKnowledgeBase: () => void;
  onToggleNotes: () => void;
  onToggleSessions: () => void;
  isKnowledgeBaseActive: boolean;
  isNotesActive: boolean;
  isSessionsActive: boolean;
  isLoading: boolean;
}

const BookOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const DocumentTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const ChatAlt2Icon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V10a2 2 0 012-2h8z" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({
  userProfile,
  onLogout,
  onNavigateToProfile,
  onNavigateToChat,
  onNavigateHome,
  onToggleKnowledgeBase,
  onToggleNotes,
  onToggleSessions,
  isKnowledgeBaseActive,
  isNotesActive,
  isSessionsActive,
  isLoading,
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

  return (
    <header className="relative flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10 shadow-sm">
      <div className="flex items-center gap-x-2 sm:gap-x-4">
        <button
          onClick={onToggleSessions}
          aria-label="عرض أو إخفاء المحادثات"
          className={`p-2 rounded-full transition-colors ${isSessionsActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <ChatAlt2Icon />
        </button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 hidden sm:block"></div>
        <button
          onClick={onToggleKnowledgeBase}
           aria-label="عرض أو إخفاء قاعدة المعرفة"
          className={`p-2 rounded-full transition-colors ${isKnowledgeBaseActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <BookOpenIcon />
        </button>
        <button
          onClick={onToggleNotes}
          aria-label="عرض أو إخفاء الملاحظات"
          className={`p-2 rounded-full transition-colors ${isNotesActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <DocumentTextIcon />
        </button>
      </div>
      
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
          {isLoading && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
          <button
            onClick={onNavigateHome}
            aria-label="العودة إلى الصفحة الرئيسية"
            className="text-xl font-bold"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              ذاكربوت
            </span>
          </button>
      </div>

      <div className="relative" ref={menuRef}>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-x-2 text-right">
            <div className="hidden sm:block">
              <p className="font-semibold text-sm text-gray-800 dark:text-white">{userProfile.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{userProfile.stage}</p>
            </div>
            {userProfile.profileImageUrl ? (
                <img src={userProfile.profileImageUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
            ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(userProfile.name)}
                </div>
            )}
        </button>
        {isMenuOpen && (
          <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-20 border dark:border-gray-600">
            <button onClick={() => { onNavigateToProfile(); setIsMenuOpen(false); }} className="block w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">الملف الشخصي</button>
            <button onClick={() => { onNavigateToChat(); setIsMenuOpen(false); }} className="block w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">العودة للدردشة</button>
            <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
            <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="block w-full text-right px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600">تسجيل الخروج</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;