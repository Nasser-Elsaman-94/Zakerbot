
import React, { useState } from 'react';
import { UserProfile } from '../../types';

interface SubjectSelectionModalProps {
  userProfile: UserProfile;
  onSubjectSelect: (subject: string) => void;
  onClose: () => void;
}

const getSubjectsForStage = (stage: string): string[] => {
  switch (stage) {
    case 'المرحلة الإبتدائية':
      return ["اللغة العربية", "الرياضيات", "العلوم", "الدراسات الاجتماعية", "اللغة الإنجليزية", "التربية الدينية"];
    case 'المرحلة الإعدادية':
      return ["اللغة العربية", "الرياضيات", "العلوم", "الدراسات الاجتماعية", "اللغة الإنجليزية", "الحاسب الآلي", "التربية الفنية"];
    case 'المرحلة الثانوية':
      // This could be further refined by branch (scientific, literary) if that data is collected in the future
      return ["اللغة العربية", "اللغة الإنجليزية", "اللغة الفرنسية", "اللغة الألمانية", "اللغة الإيطالية", "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "الجيولوجيا", "التاريخ", "الجغرافيا", "الفلسفة والمنطق", "علم النفس والاجتماع"];
    default:
      return [];
  }
};

const SubjectSelectionModal: React.FC<SubjectSelectionModalProps> = ({ userProfile, onSubjectSelect, onClose }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const subjects = getSubjectsForStage(userProfile.stage);

  const handleSubmit = () => {
    if (selectedSubject) {
      onSubjectSelect(selectedSubject);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg text-center transform transition-all">
        <button
          onClick={onClose}
          className="absolute top-3 left-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="إغلاق"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          مرحباً بك يا {userProfile.name}!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">ما هي المادة التي تود التركيز عليها اليوم؟</p>

        <div className="max-h-60 overflow-y-auto pr-2 space-y-3 my-4">
          {subjects.map((subject) => (
            <label
              key={subject}
              className={`block w-full text-right p-4 rounded-lg cursor-pointer transition-all border-2 ${
                selectedSubject === subject
                  ? 'bg-blue-600 border-blue-700 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <input
                type="radio"
                name="subject"
                value={subject}
                checked={selectedSubject === subject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="hidden"
              />
              <span className="font-semibold">{subject}</span>
            </label>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedSubject}
          className="w-full mt-6 px-6 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
        >
          ابدأ المذاكرة
        </button>
      </div>
    </div>
  );
};

export default SubjectSelectionModal;