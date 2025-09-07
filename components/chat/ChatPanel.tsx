import React, { useState, useCallback, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import saveAs from 'file-saver';
import { Message, KnowledgeItem, MessageSender, UserProfile } from '../../types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { generateResponse, summarizeText, summarizeChatHistory } from '../../services/geminiService';
import ConfirmationModal from '../common/ConfirmationModal';
import { useToast } from '../../contexts/ToastContext';

interface ChatPanelProps {
  messages: Message[];
  setMessages: (updater: React.SetStateAction<Message[]>) => void;
  knowledgeBase: KnowledgeItem[];
  addNote: (content: string) => void;
  userProfile: UserProfile;
  clearKnowledgeBase: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  sessionTitle?: string;
}


const ChatPanel: React.FC<ChatPanelProps> = ({ messages, setMessages, knowledgeBase, addNote, userProfile, clearKnowledgeBase, isLoading, setIsLoading, sessionTitle }) => {
  const [modalContent, setModalContent] = useState<{ title: string, options: { label: string, action: () => void, isDestructive?: boolean }[] } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const addUserMessage = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: MessageSender.USER,
      text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMessage]);
  };

  const addBotMessage = (text: string) => {
    const botMessage: Message = {
      id: Date.now().toString(),
      sender: MessageSender.BOT,
      text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    addUserMessage(text);
    setIsLoading(true);

    const botThinkingMessageId = (Date.now() + 1).toString();
    const thinkingMessage: Message = {
      id: botThinkingMessageId,
      sender: MessageSender.BOT,
      text: '',
      isThinking: true,
    };
    setMessages(prev => [...prev, thinkingMessage]);
    
    const { fullText, sources, error } = await generateResponse(text, knowledgeBase, userProfile, sessionTitle || 'محادثة عامة');
    
    // Remove thinking message
    setMessages(prev => prev.filter(m => m.id !== botThinkingMessageId));
    
    const botMessageId = (Date.now() + 2).toString();
    const commonBotMessageProps = {
        id: botMessageId,
        sender: MessageSender.BOT,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    if (error) {
        const errorMessage: Message = { ...commonBotMessageProps, text: error, isError: true };
        setMessages(prev => [...prev, errorMessage]);
    } else {
        const botMessage: Message = { ...commonBotMessageProps, text: fullText, sources };
        setMessages(prev => [...prev, botMessage]);
    }
    
    setIsLoading(false);
  }, [isLoading, knowledgeBase, setMessages, userProfile, setIsLoading, sessionTitle]);

  const handleSummarizeChat = useCallback(async () => {
    if (isLoading || messages.length === 0) return;
    setIsLoading(true);
    clearKnowledgeBase(); // Clear context before summarizing

    const botThinkingMessageId = (Date.now() + 1).toString();
    const thinkingMessage: Message = {
      id: botThinkingMessageId,
      sender: MessageSender.BOT,
      text: 'جاري تلخيص المحادثة...',
      isThinking: true,
    };
    setMessages(prev => [...prev, thinkingMessage]);

    const history = messages
      .filter(msg => !msg.isThinking)
      .map(msg => `${msg.sender === MessageSender.USER ? 'المستخدم' : 'ذاكربوت'}: ${msg.text}`)
      .join('\n');
      
    const summary = await summarizeChatHistory(history);

    setMessages(prev => prev.filter(m => m.id !== botThinkingMessageId));
    
    const summaryMessage: Message = {
      id: Date.now().toString(),
      sender: MessageSender.BOT,
      text: `ملخص المحادثة:\n${summary}`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, summaryMessage]);

    setIsLoading(false);
  }, [messages, isLoading, setMessages, clearKnowledgeBase, setIsLoading]);


  const handleSummarize = useCallback(async (messageId: string) => {
    const messageToSummarize = messages.find(m => m.id === messageId);
    if (!messageToSummarize) return;

    setIsLoading(true);
    const summary = await summarizeText(messageToSummarize.text);
    const summaryMessage: Message = {
      id: Date.now().toString(),
      sender: MessageSender.BOT,
      text: `ملخص: ${summary}`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, summaryMessage]);
    setIsLoading(false);
  }, [messages, setMessages, setIsLoading]);

  const handleTakeNote = useCallback((messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const botMessage = messages[messageIndex];
    // Find the last user message before this bot message
    let userMessage: Message | null = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].sender === MessageSender.USER) {
            userMessage = messages[i];
            break;
        }
    }
    
    const noteContent = userMessage
        ? `سؤالي: ${userMessage.text}\n\nالرد: ${botMessage.text}`
        : botMessage.text;

    addNote(noteContent);
    // The toast is now handled globally in MainChatPage via the addNote callback
    
  }, [messages, addNote]);

  const formatChatForExport = (includeQuestions: boolean): string => {
    return messages
      .filter(msg => !msg.isThinking && (includeQuestions || msg.sender === MessageSender.BOT))
      .map(msg => {
          const prefix = msg.sender === MessageSender.USER ? 'أنا' : 'ذاكربوت';
          return `${prefix}: ${msg.text}`;
      })
      .join('\n\n');
  };

  const downloadAsPDF = (includeQuestions: boolean) => {
    const content = formatChatForExport(includeQuestions);
    const doc = new jsPDF();
    doc.text("محادثتي مع ذاكربوت", 20, 10);
    const lines = doc.splitTextToSize(content, 170);
    doc.text(lines, 20, 20);
    doc.save("chat-history.pdf");
  };

  const downloadAsWord = (includeQuestions: boolean) => {
    const content = messages
      .filter(msg => !msg.isThinking && (includeQuestions || msg.sender === MessageSender.BOT))
      .map(msg => 
        new Paragraph({
          children: [
            new TextRun({
              text: msg.sender === MessageSender.USER ? 'أنا: ' : 'ذاكربوت: ',
              bold: true,
            }),
            new TextRun(msg.text)
          ],
        })
      );
      
    const doc = new Document({ sections: [{ children: content }] });
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, "chat-history.docx");
    });
  };
  
  const downloadAsTxt = (includeQuestions: boolean) => {
    const content = formatChatForExport(includeQuestions);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, "ذاكربوت-محادثة.txt");
  };

  const handleDownloadChat = useCallback(() => {
     setModalContent({
        title: 'تنزيل المحادثة',
        options: [
            {
                label: 'المحادثة كاملة (PDF)',
                action: () => {
                    downloadAsPDF(true);
                    setModalContent(null);
                }
            },
            {
                label: 'الردود فقط (PDF)',
                action: () => {
                    downloadAsPDF(false);
                    setModalContent(null);
                }
            },
            {
                label: 'المحادثة كاملة (Word)',
                action: () => {
                    downloadAsWord(true);
                    setModalContent(null);
                }
            },
             {
                label: 'الردود فقط (Word)',
                action: () => {
                    downloadAsWord(false);
                    setModalContent(null);
                }
            }
        ]
    });
  }, [messages]);
  
  const firstBotMessageIndex = messages.findIndex(msg => msg.sender === MessageSender.BOT && !msg.isThinking);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {modalContent && <ConfirmationModal {...modalContent} onCancel={() => setModalContent(null)} />}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={msg.id} className={`flex w-full ${msg.sender === MessageSender.USER ? 'justify-start' : 'justify-end'}`}>
                <ChatMessage 
                  message={msg}
                  onSummarize={handleSummarize}
                  onTakeNote={handleTakeNote}
                  isFirstBotMessage={index === firstBotMessageIndex}
                  userProfile={userProfile}
                />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <ChatInput 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading} 
        onDownloadChat={handleDownloadChat}
        onSummarizeChat={handleSummarizeChat}
        userProfile={userProfile}
      />
    </div>
  );
};

export default ChatPanel;