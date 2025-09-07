import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Message, MessageSender, UserProfile } from '../../types';
import { generateSpeechFromText } from '../../services/geminiService';

// Initialize AudioContext once at the module level for performance.
let audioContext: AudioContext | null = null;
if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new Ctx();
}

// --- WAV Conversion Utility ---
const pcmToWav = (pcmData: ArrayBuffer, sampleRate: number): ArrayBuffer => {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.byteLength;
    const fileSize = 44 + dataSize;
    
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // RIFF header
    view.setUint8(0, 'R'.charCodeAt(0)); view.setUint8(1, 'I'.charCodeAt(0));
    view.setUint8(2, 'F'.charCodeAt(0)); view.setUint8(3, 'F'.charCodeAt(0));
    view.setUint32(4, fileSize - 8, true); // little-endian
    view.setUint8(8, 'W'.charCodeAt(0)); view.setUint8(9, 'A'.charCodeAt(0));
    view.setUint8(10, 'V'.charCodeAt(0)); view.setUint8(11, 'E'.charCodeAt(0));

    // fmt chunk
    view.setUint8(12, 'f'.charCodeAt(0)); view.setUint8(13, 'm'.charCodeAt(0));
    view.setUint8(14, 't'.charCodeAt(0)); view.setUint8(15, ' '.charCodeAt(0));
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // Audio format (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    view.setUint8(36, 'd'.charCodeAt(0)); view.setUint8(37, 'a'.charCodeAt(0));
    view.setUint8(38, 't'.charCodeAt(0)); view.setUint8(39, 'a'.charCodeAt(0));
    view.setUint32(40, dataSize, true);

    // Copy PCM data
    const pcmBytes = new Uint8Array(pcmData);
    new Uint8Array(buffer, 44).set(pcmBytes);

    return buffer;
};


interface ChatMessageProps {
  message: Message;
  onSummarize: (messageId: string) => void;
  onTakeNote: (messageId: string) => void;
  isFirstBotMessage: boolean;
  userProfile: UserProfile;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSummarize, onTakeNote, isFirstBotMessage, userProfile }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const isUser = message.sender === MessageSender.USER;
  const isError = message.isError ?? false;
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Cleanup function to stop any ongoing audio when the component unmounts.
    return () => {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(0); } catch (e) {}
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
    };
  }, []);
  
  const handleListen = useCallback(async () => {
    if (isPlaying && sourceNodeRef.current) {
      sourceNodeRef.current.stop(0); // onended will fire and clean up state.
      return;
    }

    if (isBuffering || !message.text) return;
    if (!audioContext) {
      alert('Web Audio API is not supported in your browser.');
      return;
    }

    setIsBuffering(true);
    try {
      const audioBase64 = await generateSpeechFromText(message.text, userProfile.preferredVoice);
      if (!audioBase64) {
        throw new Error("Failed to generate audio from text.");
      }
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Decode base64 and wrap in a WAV header for robust playback
      const binaryString = window.atob(audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const pcmBuffer = bytes.buffer;
      const wavBuffer = pcmToWav(pcmBuffer, 24000); // TTS model outputs at 24kHz

      // Use the standard decodeAudioData API
      const audioBuffer = await audioContext.decodeAudioData(wavBuffer);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = (_event) => {
        setIsPlaying(false);
        sourceNodeRef.current = null;
      };

      source.start(0);
      sourceNodeRef.current = source;
      setIsPlaying(true);

    } catch (err) {
      console.error("Text-to-Speech Error:", err);
      alert("عذراً، حدث خطأ أثناء توليد الصوت.");
    } finally {
      setIsBuffering(false);
    }
  }, [isPlaying, isBuffering, message.text, userProfile.preferredVoice]);
  
  const ThinkingIndicator = () => (
    <div className="flex items-center gap-3">
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className="fill-current text-gray-500 dark:text-gray-400"
        >
            <circle cx="4" cy="12" r="3">
                <animate
                    id="spinner_qFRN"
                    begin="0;spinner_OcgL.end-0.25s"
                    attributeName="cy"
                    calcMode="spline"
                    dur="0.6s"
                    values="12;6;12"
                    keySplines=".36,.61,.3,.98;.36,.61,.3,.98"
                ></animate>
            </circle>
            <circle cx="12" cy="12" r="3">
                <animate
                    id="spinner_f2Vi"
                    begin="spinner_qFRN.begin+0.1s"
                    attributeName="cy"
                    calcMode="spline"
                    dur="0.6s"
                    values="12;6;12"
                    keySplines=".36,.61,.3,.98;.36,.61,.3,.98"
                ></animate>
            </circle>
            <circle cx="20" cy="12" r="3">
                <animate
                    id="spinner_OcgL"
                    begin="spinner_f2Vi.begin+0.1s"
                    attributeName="cy"
                    calcMode="spline"
                    dur="0.6s"
                    values="12;6;12"
                    keySplines=".36,.61,.3,.98;.36,.61,.3,.98"
                ></animate>
            </circle>
        </svg>
      <span className="text-sm text-gray-500 dark:text-gray-400">{message.text || 'يفكر...'}</span>
    </div>
  );
  
  const ListenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );

  const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h6" />
    </svg>
  );
  
  const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12,2A2,2 0 0,0 10,4H14A2,2 0 0,0 12,2M16,6V5A1,1 0 0,0 15,4H9A1,1 0 0,0 8,5V6H4A2,2 0 0,0 2,8V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V8A2,2 0 0,0 20,6H16M6,10V12H9V10H6M15,10V12H18V10H15M6,14V16H9V14H6M15,14V16H18V14H15Z" />
    </svg>
  );

  const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const SummarizeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  );

  const NoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
  
  const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500 dark:text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const containerClasses = `max-w-xl p-4 rounded-lg shadow-md ${
    isError
      ? 'bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700'
      : isUser
      ? 'bg-blue-100 dark:bg-blue-900'
      : 'bg-gray-100 dark:bg-gray-700'
  }`;
  
  const showActions = !isUser && !message.isThinking && message.text && !isError && !isFirstBotMessage;

  return (
    <div className={`flex items-start gap-3 ${!isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-blue-500' : 'bg-green-500'}`}>
        {isUser ? <UserIcon /> : <BotIcon />}
      </div>
      <div className={`flex flex-col w-full max-w-xl ${isUser ? 'items-start' : 'items-end'}`}>
        <div className={containerClasses}>
          {message.isThinking ? (
              <ThinkingIndicator />
          ) : isError ? (
              <div className="flex items-center">
                  <ErrorIcon />
                  <p className="text-red-800 dark:text-red-200">{message.text}</p>
              </div>
          ) : (
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{message.text}</p>
          )}
          
          {message.sources && message.sources.length > 0 && !isError && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">المصادر:</h4>
              <ul className="list-decimal list-inside space-y-1 text-sm">
                {message.sources.map((source, index) => (
                  <li key={index} className="truncate">
                    <a 
                      href={source.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      title={source.web.uri}
                    >
                      {source.web.title || source.web.uri}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {message.action && !isUser && !message.isThinking && !isError && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <button 
                onClick={message.action.onClick}
                className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                {message.action.label}
              </button>
            </div>
          )}

          {showActions && (
            <div className="flex items-center justify-around mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
              <button onClick={() => onSummarize(message.id)} title="تلخيص" className="text-gray-500 hover:text-blue-500">
                <SummarizeIcon />
              </button>
              <button onClick={() => onTakeNote(message.id)} title="تدوين ملاحظة" className="text-gray-500 hover:text-yellow-500">
                <NoteIcon />
              </button>
              <button onClick={handleListen} title={isPlaying ? "إيقاف" : "استماع"} className="text-gray-500 hover:text-green-500 w-5 h-5 flex items-center justify-center disabled:cursor-not-allowed" disabled={isBuffering}>
                {isBuffering 
                  ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> 
                  : isPlaying ? <StopIcon /> : <ListenIcon />}
              </button>
            </div>
          )}
        </div>
        {message.timestamp && !message.isThinking && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {message.timestamp}
            </p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;