import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import saveAs from 'file-saver';
import { Note } from '../../types';

interface NotesSidebarProps {
  isVisible: boolean;
  notes: Note[];
  onClose: () => void;
  onRemoveNote: (id: string) => void;
}

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const NotesSidebar: React.FC<NotesSidebarProps> = ({ isVisible, notes, onClose, onRemoveNote }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotes = notes.filter(note => 
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadAsPDF = () => {
    const doc = new jsPDF();
    doc.text("ملاحظاتي", 20, 10);
    // Export ALL notes
    notes.forEach((note, index) => {
      const yPos = 20 + (index * 10);
      doc.text(`${index + 1}. ${note.content}`, 20, yPos);
    });
    doc.save("notes.pdf");
  };

  const downloadAsWord = () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: "ملاحظاتي", bold: true, size: 28 })],
          }),
          // Export ALL notes
          ...notes.flatMap(note => [
            new Paragraph({
              children: [new TextRun(note.content)],
              style: "ListParagraph"
            }),
            new Paragraph({
              children: [new TextRun({text: `(حُفظت في: ${note.timestamp})`, size: 16, italics: true})],
            }),
             new Paragraph({ text: "" }),
          ]),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, "notes.docx");
    });
  };

  const downloadAsTxt = () => {
    // Export ALL notes
    const content = notes.map(note => `[${note.timestamp}]\n${note.content}`).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, "ذاكربوت-ملاحظات.txt");
  };

  return (
    <aside className={`bg-yellow-50 dark:bg-gray-800 border-e border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${isVisible ? 'w-96' : 'w-0 hidden'}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">الملاحظات</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white text-2xl leading-none">&times;</button>
      </div>

       <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث في ملاحظاتك..."
            className="w-full ps-10 pe-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <SearchIcon />
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {notes.length > 0 ? (
            filteredNotes.length > 0 ? (
                filteredNotes.map(note => (
                  <div key={note.id} className="relative p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm group">
                    <button 
                      onClick={() => onRemoveNote(note.id)}
                      className="absolute top-2 left-2 p-1 text-gray-400 bg-white dark:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-opacity"
                      title="حذف الملاحظة"
                    >
                        <DeleteIcon />
                    </button>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{note.content}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{note.timestamp}</p>
                  </div>
                ))
            ) : (
                <p className="text-center text-gray-500 mt-4">لا توجد ملاحظات تطابق بحثك.</p>
            )
        ) : <p className="text-center text-gray-500">لا توجد ملاحظات بعد.</p>}
      </div>
      {notes.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-2">سيتم تنزيل جميع الملاحظات ({notes.length}).</p>
            <button onClick={downloadAsTxt} className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">تنزيل كـ TXT</button>
            <button onClick={downloadAsPDF} className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">تنزيل كـ PDF</button>
            <button onClick={downloadAsWord} className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">تنزيل كـ Word</button>
          </div>
      )}
    </aside>
  );
};

export default NotesSidebar;