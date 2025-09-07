
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../../types';

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

interface RegistrationFormProps {
  onRegister: (profile: Omit<UserProfile, 'personalityTraits'>) => void;
  onStepChange: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onRegister, onStepChange }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    governorate: '',
    gender: '',
    stage: '',
    schoolName: '',
    class: '',
    semester: 'الفصل الدراسي الأول',
    hobbies: '',
    learningDifficulty: ['لا يوجد'],
  });
  const [age, setAge] = useState<number | null>(null);
  // Corrected the type of the errors state to ensure all error messages are strings.
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});

  // Effect to calculate age from birthDate
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
    } else {
      setAge(null);
    }
  }, [formData.birthDate]);

  // Effect to automatically suggest educational stage based on age
  useEffect(() => {
    if (age !== null && age >= 5 && age <= 20) {
      let suggestedStage = '';
      if (age <= 12) {
        suggestedStage = 'المرحلة الإبتدائية';
      } else if (age <= 15) {
        suggestedStage = 'المرحلة الإعدادية';
      } else { // 16 to 20
        suggestedStage = 'المرحلة الثانوية';
      }
      
      setFormData(prev => {
        // Only update if stage is different to prevent re-renders and clearing dependent fields unnecessarily.
        if (prev.stage !== suggestedStage) {
          return {
            ...prev,
            stage: suggestedStage,
            class: '', // Reset class and school when stage changes
            schoolName: '',
          };
        }
        return prev;
      });
    }
  }, [age]);
  
  const handleInputChange = useCallback((field: keyof Omit<typeof formData, 'learningDifficulty'>, value: string) => {
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
    if (errors.learningDifficulty) {
      setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.learningDifficulty;
          return newErrors;
      });
    }
  };


  const validateStep = () => {
    // Corrected the type of newErrors to match the state.
    const newErrors: Partial<Record<keyof typeof formData, string>> = {};
    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = 'الاسم الكامل مطلوب.';
      if (!formData.birthDate) {
        newErrors.birthDate = 'تاريخ الميلاد مطلوب.';
      } else if (age !== null && (age < 5 || age > 20)) {
        newErrors.birthDate = 'يجب أن يتراوح عمر الطالب بين 5 و 20 سنة.';
      }
      if (!formData.governorate) newErrors.governorate = 'المحافظة مطلوبة.';
      if (!formData.gender) newErrors.gender = 'الجنس مطلوب.';
    }
    if (currentStep === 2) {
      if (!formData.stage) newErrors.stage = 'المرحلة التعليمية مطلوبة.';
      if (!formData.schoolName) newErrors.schoolName = 'اسم المدرسة مطلوب.';
      if (!formData.class) newErrors.class = 'الصف مطلوب.';
      if (!formData.semester) newErrors.semester = 'الفصل الدراسي مطلوب.';
    }
    if (currentStep === 3) {
      if (!formData.hobbies.trim()) newErrors.hobbies = 'الهوايات والاهتمامات مطلوبة.';
      if (!formData.learningDifficulty || formData.learningDifficulty.length === 0) newErrors.learningDifficulty = 'يرجى تحديد صعوبات التعلم.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
      onStepChange();
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
    onStepChange();
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    if (age === null || age < 5 || age > 20) {
      setErrors(prev => ({...prev, birthDate: 'يجب أن يتراوح عمر الطالب بين 5 و 20 سنة.'}));
      return;
    }
    onRegister({ ...formData, age, gender: formData.gender as 'Male' | 'Female' });
  }, [formData, age, onRegister]);

  const steps = [
    { id: 1, title: 'المعلومات الشخصية' },
    { id: 2, title: 'التعليم' },
    { id: 3, title: 'الاهتمامات' }
  ];

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold tracking-tight">إنشاء حساب جديد</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">انضم إلى مجتمعنا التعليمي وابدأ رحلتك.</p>

      {/* Progress Bar */}
      <div className="mt-8">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${currentStep >= step.id ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <p className={`mt-1 text-xs transition-colors ${currentStep >= step.id ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{step.title}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 transition-colors ${currentStep > index + 1 ? 'bg-teal-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      <form className="mt-8 space-y-4 text-right" onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <>
            <div>
              <label htmlFor="name" className="block text-sm font-medium">الاسم الكامل:</label>
              <input id="name" type="text" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required className="w-full mt-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
             <div>
              <label htmlFor="gender" className="block text-sm font-medium">الجنس:</label>
              <select id="gender" value={formData.gender} onChange={e => handleInputChange('gender', e.target.value)} required className="w-full mt-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">اختر الجنس:</option>
                <option value="Male">ذكر</option>
                <option value="Female">أنثى</option>
              </select>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
            </div>
            <div>
              <label htmlFor="birthdate" className="block text-sm font-medium">تاريخ الميلاد:</label>
              <input id="birthdate" type="date" value={formData.birthDate} onChange={e => handleInputChange('birthDate', e.target.value)} required className="w-full mt-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
               {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">العمر:</label>
              <p className="w-full mt-1 px-4 py-2 bg-gray-200 dark:bg-gray-700/50 rounded-md h-10 flex items-center">{age !== null ? age : 'يُحسب تلقائياً'}</p>
            </div>
            <div>
              <label htmlFor="governorate" className="block text-sm font-medium">المحافظة:</label>
              <select id="governorate" value={formData.governorate} onChange={e => handleInputChange('governorate', e.target.value)} required className="w-full mt-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">اختر المحافظة:</option>
                {governorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}
              </select>
              {errors.governorate && <p className="text-red-500 text-sm mt-1">{errors.governorate}</p>}
            </div>
          </>
        )}
        
        {currentStep === 2 && (
          <>
            <div>
              <label htmlFor="stage" className="block text-sm font-medium">المرحلة التعليمية:</label>
              <select id="stage" value={formData.stage} onChange={e => handleInputChange('stage', e.target.value)} required className="w-full mt-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">اختر المرحلة:</option>
                {stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
               {errors.stage && <p className="text-red-500 text-sm mt-1">{errors.stage}</p>}
            </div>
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium">اسم المدرسة:</label>
              <select id="schoolName" value={formData.schoolName} onChange={e => handleInputChange('schoolName', e.target.value)} required disabled={!formData.stage} className="w-full mt-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-200 dark:disabled:bg-gray-600/50 disabled:cursor-not-allowed">
                <option value="">{formData.stage ? 'اختر المدرسة:' : 'اختر المرحلة أولاً'}</option>
                {getSchoolsByStage(formData.stage).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.schoolName && <p className="text-red-500 text-sm mt-1">{errors.schoolName}</p>}
            </div>
             <div>
              <label htmlFor="class" className="block text-sm font-medium">الصف:</label>
              <select id="class" value={formData.class} onChange={e => handleInputChange('class', e.target.value)} required disabled={!formData.stage} className="w-full mt-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-200 dark:disabled:bg-gray-600/50 disabled:cursor-not-allowed">
                <option value="">{formData.stage ? 'اختر الصف:' : 'اختر المرحلة أولاً'}</option>
                {getClassesByStage(formData.stage).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.class && <p className="text-red-500 text-sm mt-1">{errors.class}</p>}
            </div>
            <div>
              <label htmlFor="semester" className="block text-sm font-medium">الفصل الدراسي:</label>
              <select id="semester" value={formData.semester} onChange={e => handleInputChange('semester', e.target.value)} required className="w-full mt-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
                  <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
              </select>
              {errors.semester && <p className="text-red-500 text-sm mt-1">{errors.semester}</p>}
            </div>
          </>
        )}
        
        {currentStep === 3 && (
          <>
            <div>
              <label htmlFor="hobbies" className="block text-sm font-medium">الهوايات والاهتمامات:</label>
              <textarea id="hobbies" value={formData.hobbies} onChange={e => handleInputChange('hobbies', e.target.value)} required rows={5} className="w-full mt-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="أخبرنا عن هواياتك، اهتماماتك، أو ما تود أن تتعلمه."/>
               {errors.hobbies && <p className="text-red-500 text-sm mt-1">{errors.hobbies}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">صعوبات التعلم (يمكنك اختيار أكثر من واحد):</label>
               <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg space-y-2">
                {learningDifficulties.map(ld => (
                  <label key={ld} className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.learningDifficulty.includes(ld)}
                      onChange={() => handleLearningDifficultyChange(ld)}
                      className="form-checkbox h-4 w-4 text-teal-500 bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-500 rounded focus:ring-teal-500"
                    />
                    <span className="text-gray-800 dark:text-gray-200">{ld}</span>
                  </label>
                ))}
              </div>
              {errors.learningDifficulty && <p className="text-red-500 text-sm mt-1">{errors.learningDifficulty}</p>}
            </div>
          </>
        )}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <button type="button" onClick={handlePrev} disabled={currentStep === 1} className="px-6 py-2 font-semibold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            السابق
          </button>
          
          {currentStep < 3 ? (
            <button type="button" onClick={handleNext} className="px-6 py-2 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-colors">
              التالي
            </button>
          ) : (
            <button type="submit" className="px-6 py-2 font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors">
              إكمال التسجيل
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;
