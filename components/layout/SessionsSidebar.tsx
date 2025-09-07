import React, { useState, useRef, useEffect } from 'react';
import { Session } from '../../types';

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const DotsVerticalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
);

interface SessionsSidebarProps {
  isVisible: boolean;
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onClose: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
}

const SessionItem: React.FC<{
    session: Session;
    isActive: boolean;
    onSelect: () => void;
    onRename: (id: string, title: string) => void;
    onDelete: (id: string) => void;
}> = ({ session, isActive, onSelect, onRename, onDelete }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [title, setTitle] = useState(session.title);
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    useEffect(() => {
        if (isRenaming) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isRenaming]);

    const handleRename = () => {
        setIsMenuOpen(false);
        setIsRenaming(true);
    };
    
    const handleRenameSubmit = () => {
        if (title.trim()) {
            onRename(session.id, title.trim());
        } else {
            setTitle(session.title); // revert if empty
        }
        setIsRenaming(false);
    };

    const handleDelete = () => {
        setIsMenuOpen(false);
        onDelete(session.id);
    };

    return (
        <div
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group ${
                isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
            {isRenaming ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                    className="w-full bg-transparent border-b border-gray-400 focus:outline-none"
                />
            ) : (
                <span onClick={onSelect} className="truncate flex-1">{session.title}</span>
            )}

            {!isRenaming && (
                 <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(prev => !prev)}
                        className={`p-1 rounded-full ${isActive ? 'hover:bg-blue-500' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'} opacity-0 group-hover:opacity-100 transition-opacity`}
                    >
                        <DotsVerticalIcon />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute left-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg z-10">
                            <button onClick={handleRename} className="block w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">إعادة تسمية</button>
                            <button onClick={handleDelete} className="block w-full text-right px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">حذف</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const SessionsSidebar: React.FC<SessionsSidebarProps> = ({
  isVisible,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onClose,
  onRenameSession,
  onDeleteSession
}) => {
    return (
        <aside className={`bg-gray-100 dark:bg-gray-900 border-e border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${isVisible ? 'w-80' : 'w-0 hidden'}`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">المحادثات</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="p-4">
                <button
                    onClick={onNewSession}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon />
                    محادثة جديدة
                </button>
            </div>
            <div className="flex-1 p-4 pt-0 overflow-y-auto space-y-2">
                {sessions.map(session => (
                    <SessionItem
                        key={session.id}
                        session={session}
                        isActive={session.id === activeSessionId}
                        onSelect={() => onSelectSession(session.id)}
                        onRename={onRenameSession}
                        onDelete={onDeleteSession}
                    />
                ))}
            </div>
        </aside>
    );
};

export default SessionsSidebar;
