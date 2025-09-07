import React, { useCallback, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { KnowledgeItem, KnowledgeItemType } from '../../types';
import { fetchUrlTitle, fetchVideoTranscript } from '../../services/geminiService';

// Set worker source for pdf.js
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.js',
  import.meta.url,
).toString();

interface KnowledgeBaseProps {
  knowledgeItems: KnowledgeItem[];
  onAddItem: (item: Omit<KnowledgeItem, 'id'>) => void;
  onRemoveItem: (id: string) => void;
  isVisible: boolean;
}

const DocumentTextIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const PhotographIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const LinkIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);

const VideoCameraIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const RemoveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const PlusCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ knowledgeItems, onAddItem, onRemoveItem, isVisible }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingMessage, setParsingMessage] = useState('');
  const [url, setUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParsingMessage(`جاري معالجة ${file.name}...`);
    const titleToUse = customTitle.trim() || file.name;

    try {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onAddItem({
                    type: KnowledgeItemType.IMAGE,
                    title: titleToUse,
                    dataUrl: e.target?.result as string,
                    mimeType: file.type,
                });
                setCustomTitle('');
                setIsParsing(false);
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map(item => (item as any).str).join(' ');
                }
                onAddItem({ type: KnowledgeItemType.FILE, title: titleToUse, content: fullText });
                setCustomTitle('');
                setIsParsing(false);
            };
            reader.readAsArrayBuffer(file);
        } else if (file.name.endsWith('.docx')) {
             const reader = new FileReader();
             reader.onload = async (e) => {
                 const arrayBuffer = e.target?.result as ArrayBuffer;
                 const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                 onAddItem({ type: KnowledgeItemType.FILE, title: titleToUse, content: result.value });
                 setCustomTitle('');
                 setIsParsing(false);
             };
             reader.readAsArrayBuffer(file);
        } else { // Plain text (.txt, .md, etc.)
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                onAddItem({ type: KnowledgeItemType.FILE, title: titleToUse, content });
                setCustomTitle('');
                setIsParsing(false);
            };
            reader.readAsText(file);
        }
    } catch (error) {
        console.error("Error parsing file:", error);
        setParsingMessage(`خطأ في معالجة ${file.name}`);
        setTimeout(() => setIsParsing(false), 3000);
    } finally {
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
}, [onAddItem, customTitle]);

  const handleAddUrl = useCallback(async () => {
    if (!url.trim()) return;
    const trimmedUrl = url.trim();

    setIsParsing(true);
    
    const isVideoUrl = trimmedUrl.toLowerCase().includes('youtube.com') || trimmedUrl.toLowerCase().includes('youtu.be');
    const isPdfUrl = trimmedUrl.toLowerCase().endsWith('.pdf');

    if (isVideoUrl) {
        setParsingMessage(`جاري تحليل محتوى الفيديو...`);
        try {
            const titleToUse = customTitle.trim() || await fetchUrlTitle(trimmedUrl);
            const transcript = await fetchVideoTranscript(trimmedUrl);
            onAddItem({
                type: KnowledgeItemType.URL,
                title: `(فيديو) ${titleToUse}`,
                url: trimmedUrl,
                content: transcript
            });
            setUrl('');
            setCustomTitle('');
        } catch (error) {
            console.error("Error processing video URL:", error);
            onAddItem({ type: KnowledgeItemType.URL, title: `(فشل تحليل الفيديو) ${customTitle.trim() || trimmedUrl}`, url: trimmedUrl, content: `Reference URL: ${trimmedUrl}` });
            setUrl('');
            setCustomTitle('');
        } finally {
            setIsParsing(false);
        }
    } else if (isPdfUrl) {
        const pdfName = new URL(trimmedUrl).pathname.split('/').pop() || trimmedUrl;
        setParsingMessage(`جاري جلب وتحليل ${pdfName}...`);
        const titleToUse = customTitle.trim() || pdfName;
        try {
            const response = await fetch(trimmedUrl);
            if (!response.ok) throw new Error(`فشل جلب الملف: ${response.statusText}`);
            
            const arrayBuffer = await response.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map((item: any) => item.str).join(' ');
            }
            onAddItem({ type: KnowledgeItemType.FILE, title: titleToUse, content: fullText, url: trimmedUrl });
            setUrl('');
            setCustomTitle('');
        } catch (error) {
            console.error("Error fetching or parsing PDF from URL:", error);
            onAddItem({ type: KnowledgeItemType.URL, title: `(فشل التحليل) ${titleToUse}`, url: trimmedUrl, content: `Reference URL: ${trimmedUrl}` });
            setUrl('');
            setCustomTitle('');
        } finally {
            setIsParsing(false);
        }
    } else { // Generic URL
        setParsingMessage(`جاري جلب عنوان الرابط...`);
        try {
            const fetchedTitle = customTitle.trim() || await fetchUrlTitle(trimmedUrl);
            onAddItem({
                type: KnowledgeItemType.URL,
                title: fetchedTitle,
                url: trimmedUrl,
                content: `Reference URL: ${trimmedUrl}`
            });
            setUrl('');
            setCustomTitle('');
        } catch (error) {
            console.error("Failed to fetch title, falling back to hostname:", error);
            try {
                const fallbackTitle = customTitle.trim() || new URL(trimmedUrl).hostname;
                onAddItem({
                    type: KnowledgeItemType.URL,
                    title: fallbackTitle,
                    url: trimmedUrl,
                    content: `Reference URL: ${trimmedUrl}`
                });
                setUrl('');
                setCustomTitle('');
            } catch (finalError) {
                 console.error("The provided URL is invalid:", trimmedUrl, finalError);
            }
        } finally {
            setIsParsing(false);
        }
    }
}, [url, onAddItem, customTitle]);


  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getIconForItem = (item: KnowledgeItem) => {
      const iconClass = "h-6 w-6 text-gray-400 dark:text-gray-500 flex-shrink-0";
      if (item.type === KnowledgeItemType.IMAGE) return <PhotographIcon className={`${iconClass} text-purple-500`} />;
      if (item.title.startsWith('(فيديو)')) return <VideoCameraIcon className={`${iconClass} text-red-500`} />;
      if (item.type === KnowledgeItemType.URL) return <LinkIcon className={`${iconClass} text-green-500`} />;
      if (item.title.endsWith('.pdf')) return <DocumentTextIcon className={`${iconClass} text-red-500`} />;
      if (item.title.endsWith('.docx')) return <DocumentTextIcon className={`${iconClass} text-blue-500`} />;
      return <DocumentTextIcon className={iconClass} />;
  }

  return (
    <aside className={`bg-slate-50 dark:bg-slate-900 border-s border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${isVisible ? 'w-80' : 'w-0 hidden'}`}>
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 text-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">قاعدة المعرفة</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {knowledgeItems.map(item => (
          <div key={item.id} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-between gap-2">
            <div className="flex items-center min-w-0">
                {getIconForItem(item)}
                <div className="ms-3 min-w-0">
                  {item.url ? (
                       <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block" title={item.url}>
                          {item.title}
                       </a>
                  ) : (
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate block" title={item.title}>
                        {item.title}
                      </span>
                  )}
                </div>
            </div>
             <button onClick={() => onRemoveItem(item.id)} className="p-1 text-gray-400 hover:text-red-500 rounded-full flex-shrink-0" title={`إزالة ${item.title}`}>
                <RemoveIcon />
            </button>
          </div>
        ))}
        {knowledgeItems.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <p>قاعدة المعرفة فارغة.</p>
                <p className="text-sm">قم بإضافة المستندات أو الروابط.</p>
            </div>
        )}
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
         <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".txt,.md,.pdf,.docx,.png,.jpg,.jpeg,.svg"
          disabled={isParsing}
        />
        <div className="space-y-3">
            <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="اسم مخصص (اختياري)"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isParsing}
            />
            <div className="flex items-center space-x-2 flex-row-reverse">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl(); }}
                    placeholder="إضافة رابط ويب"
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isParsing}
                />
                 <button
                    onClick={handleAddUrl}
                    className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                    disabled={isParsing || !url.trim()}
                    title="إضافة رابط"
                >
                    <PlusCircleIcon />
                </button>
            </div>
            <button
              onClick={handleUploadClick}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-wait"
              disabled={isParsing}
            >
              {isParsing ? parsingMessage : 'إضافة مستند أو صورة'}
            </button>
        </div>
      </div>
    </aside>
  );
};

export default KnowledgeBase;