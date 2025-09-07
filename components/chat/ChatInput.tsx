import React, { useState, useCallback } from 'react';
import VoiceMode from './VoiceMode';
import { UserProfile } from '../../types';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onDownloadChat: () => void;
  onSummarizeChat: () => void;
  userProfile: UserProfile;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const MicrophoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const SummarizeChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h7" />
    </svg>
);

const ChatInput: React.FC<ChatInputProps> = ({ 
    onSendMessage, 
    isLoading, 
    onDownloadChat, 
    onSummarizeChat,
    userProfile,
}) => {
  const [text, setText] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const handleSubmit = useCallback(() => {
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  }, [text, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <div className="p-4 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 gap-x-2">
          
           <button
            onClick={handleSubmit}
            disabled={isLoading || !text.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'يُفكر...' : 'إرسال'}
          </button>
           <button
            onClick={onDownloadChat}
            className="p-2 text-gray-500 hover:text-blue-500 transition-colors rounded-full"
            title="تنزيل المحادثة"
            disabled={isLoading}
          >
            <DownloadIcon />
          </button>
          <button
            onClick={onSummarizeChat}
            className="p-2 text-gray-500 hover:text-green-500 transition-colors rounded-full"
            title="تلخيص المحادثة"
            disabled={isLoading}
          >
            <SummarizeChatIcon />
          </button>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 px-4 py-2 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none resize-none"
            rows={1}
            disabled={isLoading}
          />
            <button
            onClick={() => setIsVoiceMode(true)}
            className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-full"
            disabled={isLoading}
             title="الوضع الصوتي"
          >
            <MicrophoneIcon />
          </button>

        </div>
      </div>
      {isVoiceMode && (
        <VoiceMode 
          onClose={() => setIsVoiceMode(false)}
          userProfile={userProfile}
        />
      )}
    </>
  );
};

export default ChatInput;