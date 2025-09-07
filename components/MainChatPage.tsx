
import React, { useState, useCallback, useEffect } from 'react';
import { UserProfile, KnowledgeItem, Message, Note, MessageSender, Session } from '../types';
import KnowledgeBase from './layout/KnowledgeBase';
import ChatPanel from './chat/ChatPanel';
import NotesSidebar from './layout/NotesSidebar';
import Header from './layout/Header';
import ProfilePage from './profile/ProfilePage';
import { searchEducationalResources } from '../services/geminiService';
import SubjectSelectionModal from './common/SubjectSelectionModal';
import SessionsSidebar from './layout/SessionsSidebar';
import ConfirmationModal from './common/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';

// --- MainChatPage Component ---
interface MainChatPageProps {
  userProfile: UserProfile;
  onLogout: () => void;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
  onNavigateHome: () => void;
}

export const MainChatPage: React.FC<MainChatPageProps> = ({ userProfile, onLogout, onProfileUpdate, onNavigateHome }) => {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  
  const [isNotesSidebarVisible, setNotesSidebarVisible] = useState(false);
  const [isKnowledgeBaseVisible, setKnowledgeBaseVisible] = useState(true);
  const [isSessionsSidebarVisible, setSessionsSidebarVisible] = useState(false);

  const [currentView, setCurrentView] = useState<'chat' | 'profile'>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const { addToast } = useToast();


  // Load notes and sessions from localStorage on initial mount
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem('notes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
      const savedSessions = localStorage.getItem('sessions');
      if (savedSessions) {
          const parsedSessions = JSON.parse(savedSessions);
          if (parsedSessions.length > 0) {
              setSessions(parsedSessions);
              setActiveSessionId(parsedSessions[0]?.id || null);
              return; // Exit if we loaded sessions
          }
      }
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        localStorage.removeItem('notes');
        localStorage.removeItem('sessions');
    }
    // If no sessions loaded, create a new one
    handleNewSession(true);
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    try {
        localStorage.setItem('notes', JSON.stringify(notes));
    } catch (error) {
        console.error("Failed to save notes to localStorage", error);
    }
  }, [notes]);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
      try {
          if (sessions.length > 0) {
            localStorage.setItem('sessions', JSON.stringify(sessions));
          } else {
            localStorage.removeItem('sessions');
          }
      } catch (error) {
          console.error("Failed to save sessions to localStorage", error);
      }
  }, [sessions]);

  // Auto-save all sessions to `localStorage` every minute as a safety net.
  // This complements the save-on-change mechanism to prevent data loss from accidental tab closures or app crashes.
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      try {
        if (sessions.length > 0) {
          localStorage.setItem('sessions', JSON.stringify(sessions));
        }
      } catch (error)
{
        console.error("Failed to auto-save sessions to localStorage", error);
      }
    }, 60000); // 1 minute

    return () => clearInterval(autoSaveInterval);
  }, [sessions]);


  const handleNewSession = (promptForSubject = true) => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: 'محادثة جديدة',
      messages: [],
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setKnowledgeBase([]); // Clear knowledge base for new session
    if (promptForSubject) {
      setShowSubjectModal(true);
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setSessionsSidebarVisible(false);
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const handleDeleteSessionRequest = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
        setSessionToDelete(session);
    }
  };
  
  const confirmDeleteSession = () => {
    if (!sessionToDelete) return;

    const newSessions = sessions.filter(s => s.id !== sessionToDelete.id);
    setSessions(newSessions);

    if (activeSessionId === sessionToDelete.id) {
        if (newSessions.length > 0) {
            setActiveSessionId(newSessions[0].id);
        } else {
            handleNewSession(false);
        }
    }
    setSessionToDelete(null);
  };
  
  const activeSession = sessions.find(s => s.id === activeSessionId);

  const updateActiveSessionMessages = (updater: React.SetStateAction<Message[]>) => {
    setSessions(prevSessions =>
      prevSessions.map(session => {
        if (session.id === activeSessionId) {
          const newMessages = typeof updater === 'function' ? updater(session.messages) : updater;
          
          let newTitle = session.title;
          if (session.title === 'محادثة جديدة' && !showSubjectModal) {
            const firstUserMessage = newMessages.find(m => m.sender === MessageSender.USER && m.text.trim() !== '');
            if (firstUserMessage) {
              newTitle = firstUserMessage.text.substring(0, 35) + (firstUserMessage.text.length > 35 ? '...' : '');
            }
          }
          return { ...session, messages: newMessages, title: newTitle };
        }
        return session;
      })
    );
  };

  const fetchAndSetResources = useCallback(async (subject: string) => {
      const searchStartMessage: Message = {
        id: `bot-search-start-${Date.now()}`,
        sender: MessageSender.BOT,
        text: `أقوم بالبحث عن مصادر تعليمية لمادة ${subject}. قد يستغرق هذا بعض الوقت...`,
        isThinking: true,
      };
      
      updateActiveSessionMessages(prev => [searchStartMessage, ...prev.filter(m => !m.id.startsWith('bot-search-fail'))]);
      
      const resources = await searchEducationalResources(userProfile, subject);
      
      updateActiveSessionMessages(prev => prev.filter(m => !m.id.startsWith('bot-search-start')));

      if (resources.length > 0) {
        setKnowledgeBase(prev => {
          const existingUrls = new Set(prev.map(item => item.url));
          const newUniqueResources = resources.filter(item => item.url && !existingUrls.has(item.url));
          return [...prev, ...newUniqueResources];
        });

        const searchEndMessage: Message = {
          id: `bot-search-end-${Date.now()}`,
          sender: MessageSender.BOT,
          text: `لقد أضفت ${resources.length} من المصادر التعليمية إلى قاعدة المعرفة الخاصة بك للبدء. لا تتردد في تحميل مستنداتك الخاصة أيضًا!`,
        };
        updateActiveSessionMessages(prev => [searchEndMessage, ...prev]);
      } else {
         const noResultsMessage: Message = {
          id: `bot-search-fail-${Date.now()}`,
          sender: MessageSender.BOT,
          text: "لم أتمكن من العثور على مصادر تلقائية لهذه المادة في الوقت الحالي. لا يزال بإمكانك إضافة المستندات والروابط الخاصة بك إلى قاعدة المعرفة!",
          action: {
            label: 'إعادة البحث عن مصادر',
            onClick: () => fetchAndSetResources(subject),
          }
        };
        updateActiveSessionMessages(prev => [noResultsMessage, ...prev]);
      }
  }, [userProfile, activeSessionId]);

  const handleSubjectSelect = useCallback((subject: string) => {
    setShowSubjectModal(false);
    
    const baseName = subject;
    const titles = new Set(sessions.map(s => s.title));
    let newTitle = baseName;
    if (titles.has(newTitle)) {
        let counter = 2;
        while (titles.has(`${baseName} (${counter})`)) {
            counter++;
        }
        newTitle = `${baseName} (${counter})`;
    }

    setSessions(prevSessions =>
        prevSessions.map(session =>
            session.id === activeSessionId ? { ...session, title: newTitle } : session
        )
    );

    fetchAndSetResources(subject);
  }, [fetchAndSetResources, sessions, activeSessionId]);

  const addKnowledgeItem = useCallback((item: Omit<KnowledgeItem, 'id'>) => {
    setKnowledgeBase(prev => [{ ...item, id: Date.now().toString() }, ...prev]);
  }, []);

  const removeKnowledgeItem = useCallback((idToRemove: string) => {
    setKnowledgeBase(prev => prev.filter(item => item.id !== idToRemove));
  }, []);

  const addNote = useCallback((content: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      content,
      timestamp: new Date().toLocaleString('ar-EG'),
    };
    setNotes(prev => [newNote, ...prev]);
    addToast('تم حفظ الملاحظة بنجاح!', 'success');
    setNotesSidebarVisible(true);
  }, [addToast]);

  const removeNote = useCallback((idToRemove: string) => {
    setNotes(prev => prev.filter(note => note.id !== idToRemove));
  }, []);
  
  const toggleNotesSidebar = useCallback(() => setNotesSidebarVisible(prev => !prev), []);
  const toggleKnowledgeBase = useCallback(() => setKnowledgeBaseVisible(prev => !prev), []);
  const toggleSessionsSidebar = useCallback(() => setSessionsSidebarVisible(prev => !prev), []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-gray-800">
      
      {showSubjectModal && userProfile && (
        <SubjectSelectionModal 
          userProfile={userProfile}
          onSubjectSelect={handleSubjectSelect}
          onClose={() => setShowSubjectModal(false)}
        />
      )}
      
      {sessionToDelete && (
         <ConfirmationModal
            title={`هل أنت متأكد أنك تريد حذف محادثة "${sessionToDelete.title}"؟`}
            options={[{ label: 'نعم، قم بالحذف', action: confirmDeleteSession, isDestructive: true }]}
            onCancel={() => setSessionToDelete(null)}
          />
      )}

      <SessionsSidebar 
        isVisible={isSessionsSidebarVisible}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onClose={toggleSessionsSidebar}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSessionRequest}
      />

      <KnowledgeBase 
        isVisible={isKnowledgeBaseVisible}
        knowledgeItems={knowledgeBase} 
        onAddItem={addKnowledgeItem}
        onRemoveItem={removeKnowledgeItem} 
      />

      <div className="flex flex-col flex-1 min-w-0">
        <Header 
          userProfile={userProfile} 
          onLogout={onLogout} 
          onNavigateToProfile={() => setCurrentView('profile')}
          onNavigateToChat={() => setCurrentView('chat')}
          onNavigateHome={onNavigateHome}
          onToggleKnowledgeBase={toggleKnowledgeBase}
          onToggleNotes={toggleNotesSidebar}
          onToggleSessions={toggleSessionsSidebar}
          isKnowledgeBaseActive={isKnowledgeBaseVisible}
          isNotesActive={isNotesSidebarVisible}
          isSessionsActive={isSessionsSidebarVisible}
          isLoading={isLoading}
        />
        <main className="flex-1 overflow-auto">
          {currentView === 'chat' ? (
            <ChatPanel 
              key={activeSessionId} // Add key to reset state when session changes
              messages={activeSession?.messages || []} 
              setMessages={updateActiveSessionMessages} 
              knowledgeBase={knowledgeBase} 
              addNote={addNote}
              userProfile={userProfile}
              clearKnowledgeBase={() => setKnowledgeBase([])}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              sessionTitle={activeSession?.title}
            />
          ) : (
            <ProfilePage
              userProfile={userProfile}
              onProfileUpdate={onProfileUpdate}
              onBack={() => setCurrentView('chat')}
            />
          )}
        </main>
      </div>
      
       <NotesSidebar 
        isVisible={isNotesSidebarVisible} 
        notes={notes}
        onClose={toggleNotesSidebar}
        onRemoveNote={removeNote}
      />
    </div>
  );
};
