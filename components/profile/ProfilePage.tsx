import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '../../types';

// Data from registration form, kept consistent for editing
const governorates = [
  'القاهرة', 'الإسكندرية', 'الجيزة', 'القليبوبية', 'بورسعيد', 'السويس', 'الإسماعيلية',
  'كفر الشيخ', 'الغربية', 'المنوفية', 'البحيرة', 'الشرقية', 'الدقهلية',
  'دمياط', 'أسيوط', 'سوهاج', 'قنا', 'أسوان', 'الأقصر', 'المنيا', 'بني سويف',
  'الفيوم', 'البحر الأحمر', 'الوادي الجديد', 'مطروح', 'شمال سيناء', 'جنوب سيناء'
];
const stages = ['المرحلة الإبتدائية', 'المرحلة الإعدادية', 'المرحلة الثانوية'];

const getSchoolsByStage = (stage: string) => {
  const baseSchools = ['مدرسة أ', 'مدرسة ب', 'مدرسة ج', 'مدرسة د', 'مدرسة هـ', 'مدرسة و', 'مدرسة ز', 'مدرسة ح', 'مدرسة ط', 'مدرسة ي'];
  switch (stage) {
    case 'المرحلة الإبتدائية':
      return [...baseSchools, 'مدرسة السلام الإبتدائية', 'مدرسة المستقبل الإبتدائية'];
    case 'المرحلة الإعدادية':
      return [...baseSchools, 'مدرسة المستقبل الإعدادية بنين', 'مدرسة المستقبل الإعدادية بنات'];
    case 'المرحلة الثانوية':
      return [...baseSchools, 'مدرسة السلام الثانوية', 'مدرسة العاشر من رمضان'];
    default:
      return [];
  }
};

const getClassesByStage = (stage: string) => {
  switch (stage) {
    case 'المرحلة الإبتدائية': 
      return ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'];
    case 'المرحلة الإعدادية': 
      return ['الصف الأول', 'الصف الثاني', 'الصف الثالث'];
    case 'المرحلة الثانوية': 
      return ['الصف الأول', 'الصف الثاني', 'الصف الثالث'];
    default: 
      return [];
  }
};

const learningDifficulties = ['لا يوجد', 'كفيف', 'توحد', 'تأخر الكلام', 'سرعة التشتت وقلة التركيز', 'متلازمة داون'];

const ttsVoices = [
  { name: 'Orus', label: 'صوت رجل ١ (راشد)' },
  { name: 'Alya', label: 'صوت رجل ٢ (كريم)' },
];


interface ProfilePageProps {
  userProfile: UserProfile;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ userProfile, onProfileUpdate, onBack }) => {
  const [formData, setFormData] = useState<Omit<UserProfile, 'age'>>({ 
    ...userProfile,
    preferredVoice: userProfile.preferredVoice || 'Orus',
    profileImageUrl: userProfile.profileImageUrl,
  });
  const [age, setAge] = useState<number>(userProfile.age);
  const [errors, setErrors] = useState<Partial<Omit<UserProfile, 'age'>>>({});
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (formData.birthDate) {
      const today = new Date();
      const birthDateObj = new Date(formData.birthDate);
      let calculatedAge = today.getFullYear() - birthDateObj.getFullYear();
      const m = today.getMonth() - birthDateObj.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
    }
  }, [formData.birthDate]);

  const handleInputChange = useCallback((field: keyof Omit<UserProfile, 'age' | 'personalityTraits' | 'learningDifficulty'>, value: string) => {
    setFormData(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'stage') {
        newState.class = '';
        newState.schoolName = '';
      }
      return newState;
    });
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, profileImageUrl: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleLearningDifficultyChange = (difficulty: string) => {
    setFormData(prev => {
        const currentDifficulties = prev.learningDifficulty.filter(d => d !== 'لا يوجد');
        let newDifficulties: string[];

        if (difficulty === 'لا يوجد') {
            newDifficulties = ['لا يوجد'];
        } else {
            if (currentDifficulties.includes(difficulty)) {
                newDifficulties = currentDifficulties.filter(d => d !== difficulty);
            } else {
                newDifficulties = [...currentDifficulties, difficulty];
            }
            if (newDifficulties.length === 0) {
                newDifficulties = ['لا يوجد'];
            }
        }
        return { ...prev, learningDifficulty: newDifficulties };
    });
  };

  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {};
    if (!formData.name.trim()) newErrors.name = 'الاسم الكامل مطلوب.';
    if (!formData.birthDate) newErrors.birthDate = 'تاريخ الميلاد مطلوب.';
    else if (age < 0) newErrors.birthDate = 'لا يمكن أن يكون تاريخ الميلاد في المستقبل.';
    if (!formData.governorate) newErrors.governorate = 'المحافظة مطلوبة.';
    if (!formData.stage) newErrors.stage = 'المرحلة التعليمية مطلوبة.';
    if (!formData.schoolName) newErrors.schoolName = 'اسم المدرسة مطلوب.';
    if (!formData.class) newErrors.class = 'الصف مطلوب.';
    if (!formData.hobbies.trim()) newErrors.hobbies = 'الهوايات والاهتمامات مطلوبة.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onProfileUpdate({ ...formData, age });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  }, [formData, age, onProfileUpdate]);

  return (
    <div className="flex justify-center items-start p-4 sm:p-6 md:p-8 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <button onClick={onBack} className="px-4 py-2 text-sm font-medium text-white bg-gray-500 rounded-lg hover:bg-gray-600 transition-colors">
            العودة للدردشة
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">تعديل ملفك الشخصي</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 text-right">
          <div className="flex flex-col items-center gap-4">
            {formData.profileImageUrl ? (
              <img
                src={formData.profileImageUrl}
                alt="صورة الملف الشخصي"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600 shadow-md"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center border-4 border-gray-300 dark:border-gray-500 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/png, image/jpeg, image/gif"
            />
            <button
              type="button"
              onClick={triggerFileInput}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              تغيير الصورة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الاسم الكامل:</label>
              <input id="name" type="text" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required className="mt-1 w-full px-4 py-2 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الجنس:</label>
              <select id="gender" value={formData.gender} onChange={e => handleInputChange('gender', e.target.value)} required className="mt-1 w-full px-4 py-2 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Male">ذكر</option>
                <option value="Female">أنثى</option>
              </select>
            </div>
            <div>
              <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ الميلاد:</label>
              <input id="birthdate" type="date" value={formData.birthDate} onChange={e => handleInputChange('birthDate', e.target.value)} required className="mt-1 w-full px-4 py-2 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">العمر:</label>
              <p className="mt-1 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700/50 rounded-md h-10 flex items-center text-gray-500 dark:text-gray-400">{age >= 0 ? age : 'تاريخ غير صالح'}</p>
            </div>
            <div>
              <label htmlFor="governorate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">المحافظة:</label>
              <select id="governorate" value={formData.governorate} onChange={e => handleInputChange('governorate', e.target.value)} required className="mt-1 w-full px-4 py-2 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">اختر المحافظة:</option>
                {governorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}
              </select>
              {errors.governorate && <p className="text-red-500 text-sm mt-1">{errors.governorate}</p>}
            </div>
            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">المرحلة التعليمية:</label>
              <select id="stage" value={formData.stage} onChange={e => handleInputChange('stage', e.target.value)} required className="mt-1 w-full px-4 py-2 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">اختر المرحلة:</option>
                {stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.stage && <p className="text-red-500 text-sm mt-1">{errors.stage}</p>}
            </div>
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم المدرسة:</label>
              <select id="schoolName" value={formData.schoolName} onChange={e => handleInputChange('schoolName', e.target.value)} required disabled={!formData.stage} className="mt-1 w-full px-4 py-2 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-700/50 disabled:cursor-not-allowed">
                 <option value="">{formData.stage ? 'اختر المدرسة:' : 'اختر المرحلة أولاً'}</option>
                {getSchoolsByStage(formData.stage).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.schoolName && <p className="text-red-500 text-sm mt-1">{errors.schoolName}</p>}
            </div>
             <div>
              <label htmlFor="class" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الصف:</label>
              <select id="class" value={formData.class} onChange={e => handleInputChange('class', e.target.value)} required disabled={!formData.stage} className="mt-1 w-full px-4 py-2 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-700/50 disabled:cursor-not-allowed">
                <option value="">{formData.stage ? 'اختر الصف:' : 'اختر المرحلة أولاً'}</option>
                {getClassesByStage(formData.stage).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.class && <p className="text-red-500 text-sm mt-1">{errors.class}</p>}
            </div>
             <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الفصل الدراسي:</label>
              <select id="semester" value={formData.semester} onChange={e => handleInputChange('semester', e.target.value)} required className="mt-1 w-full px-4 py-2 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
                  <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
              </select>
            </div>
            <div>
                <label htmlFor="preferredVoice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الصوت المفضل للمساعد:</label>
                <select
                    id="preferredVoice"
                    value={formData.preferredVoice || 'Orus'}
                    onChange={e => handleInputChange('preferredVoice', e.target.value)}
                    className="mt-1 w-full px-4 py-2 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {ttsVoices.map(voice => (
                        <option key={voice.name} value={voice.name}>
                            {voice.label}
                        </option>
                    ))}
                </select>
            </div>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">صعوبات التعلم:</label>
               <div className="mt-2 p-3 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                {learningDifficulties.map(ld => (
                  <label key={ld} className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.learningDifficulty.includes(ld)}
                      onChange={() => handleLearningDifficultyChange(ld)}
                      className="form-checkbox h-4 w-4 text-blue-600 bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-800 dark:text-gray-200">{ld}</span>
                  </label>
                ))}
              </div>
            </div>
          <div>
            <label htmlFor="hobbies" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الهوايات والاهتمامات:</label>
            <textarea id="hobbies" value={formData.hobbies} onChange={e => handleInputChange('hobbies', e.target.value)} required rows={4} className="mt-1 w-full px-4 py-2 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="أخبرنا عن هواياتك، اهتماماتك، أو ما تود أن تتعلمه." />
            {errors.hobbies && <p className="text-red-500 text-sm mt-1">{errors.hobbies}</p>}
          </div>
          <div className="pt-6 flex justify-end items-center gap-4 border-t border-gray-200 dark:border-gray-700">
             {isSaved && <p className="text-green-600 dark:text-green-400 animate-pulse">تم حفظ الملف الشخصي بنجاح!</p>}
             <button type="submit" className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                حفظ التغييرات
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;