
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, PersonalityTraits } from '../../types';
import RegistrationForm from './RegistrationForm';
import PersonalityAssessment from './PersonalityAssessment';

interface AuthPageProps {
  onLogin: (profile: UserProfile) => void;
  initialMode: 'login' | 'register';
  onBackToHome: () => void;
}

type RegistrationData = Omit<UserProfile, 'age' | 'personalityTraits'> & { age: number };

const inspirationalQuotes = [
    { quote: "الاستثمار في المعرفة يحقق أفضل الفوائد.", author: "بنجامين فرانكلين" },
    { quote: "التعليم هو أقوى سلاح يمكنك استخدامه لتغيير العالم.", author: "نيلسون مانديلا" },
    { quote: "الشيء الجميل في التعلم هو أن لا أحد يستطيع أن يأخذه منك.", author: "بي. بي. كينج" },
    { quote: "التعليم ليس استعداداً للحياة؛ التعليم هو الحياة ذاتها.", author: "جون ديوي"},
];

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, initialMode, onBackToHome }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(initialMode === 'register');
  const [registrationStep, setRegistrationStep] = useState<'form' | 'assessment'>('form');
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [quote, setQuote] = useState(inspirationalQuotes[0]);

  useEffect(() => {
    setIsRegisterMode(initialMode === 'register');
    setRegistrationStep('form');
  }, [initialMode]);

  const handleStepChange = useCallback(() => {
    setQuote(q => {
        const currentIndex = inspirationalQuotes.findIndex(iq => iq.quote === q.quote);
        const nextIndex = (currentIndex + 1) % inspirationalQuotes.length;
        return inspirationalQuotes[nextIndex];
    });
  }, []);


  const handleRegistrationSubmit = (data: RegistrationData) => {
    setRegistrationData(data);
    setRegistrationStep('assessment');
  };
  
  const handleAssessmentComplete = (traits: PersonalityTraits) => {
    if (registrationData) {
      const finalProfile: UserProfile = {
        ...registrationData,
        personalityTraits: traits,
      };
      onLogin(finalProfile);
    }
  };
  
  const isAssessmentStep = isRegisterMode && registrationStep === 'assessment';

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Inspirational Side - Hidden during assessment step */}
      <div 
        className={`hidden w-1/2 flex-col justify-between p-12 bg-cover bg-center text-white relative transition-all duration-500 ${isAssessmentStep ? 'lg:hidden' : 'lg:flex'}`}
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
        <div className="relative z-10">
            <h1 onClick={onBackToHome} className="text-3xl font-bold cursor-pointer">
              <span className="text-teal-400">ذاكر</span>
              <span className="text-sky-400">بوت</span>
            </h1>
        </div>
        <div className="relative z-10">
            <p className="text-2xl font-semibold leading-relaxed">"{quote.quote}"</p>
            <p className="mt-4 text-lg text-gray-300">- {quote.author}</p>
        </div>
      </div>

      {/* Form Side - Full width during assessment step */}
      <div className={`w-full flex items-center justify-center p-6 sm:p-12 transition-all duration-500 ${isAssessmentStep ? 'lg:w-full bg-cover bg-center' : 'lg:w-1/2 bg-white dark:bg-gray-800'}`}
           style={isAssessmentStep ? { backgroundImage: "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop')" } : {}}
      >
        <div className={`w-full ${isAssessmentStep ? 'max-w-2xl bg-slate-900/70 backdrop-blur-sm p-8 rounded-2xl' : 'max-w-md'} relative transition-all duration-500`}>
          
          <button 
              onClick={onBackToHome}
              className={`lg:hidden absolute top-0 -mt-6 right-0 px-3 py-2 text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors z-10 flex items-center gap-2 ${isAssessmentStep ? 'hidden' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className='hidden sm:inline'>الرئيسية</span>
          </button>

           {isRegisterMode ? (
              <>
                {registrationStep === 'form' ? (
                  <div className="text-gray-900 dark:text-white">
                    <RegistrationForm onRegister={handleRegistrationSubmit} onStepChange={handleStepChange} />
                    <div className="text-center mt-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        لديك حساب بالفعل؟{' '}
                        <button onClick={() => setIsRegisterMode(false)} className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                            تسجيل الدخول
                        </button>
                      </p>
                    </div>
                  </div>
                ) : (
                  registrationData && (
                     <div className="text-white">
                        <PersonalityAssessment 
                            userName={registrationData.name} 
                            onComplete={handleAssessmentComplete} 
                        />
                     </div>
                  )
                )}
              </>
            ) : (
              <div className="text-center max-w-md mx-auto text-gray-900 dark:text-white">
                <h2 className="text-3xl font-bold tracking-tight">مرحباً بعودتك!</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">سجل الدخول للمتابعة إلى مساعدك التعليمي.</p>
                <div className="mt-8 space-y-6 text-right">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium">البريد الإلكتروني</label>
                        <input id="email" type="email" placeholder="you@example.com" className="w-full mt-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="password">كلمة المرور</label>
                        <input id="password" type="password" placeholder="••••••••" className="w-full mt-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                  <button 
                    onClick={() => onLogin({ 
                      name: 'مستخدم تجريبي', age: 17, birthDate: '2007-01-01', governorate: 'القاهرة',
                      stage: 'المرحلة الثانوية', schoolName: 'مدرسة السلام الثانوية', class: 'الصف الثالث',
                      hobbies: 'القراءة والذكاء الاصطناعي', gender: 'Male', semester: 'الفصل الدراسي الأول',
                      learningDifficulty: ['لا يوجد'],
                    })}
                    className="w-full px-4 py-3 font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    تسجيل الدخول (تجريبي)
                  </button>
                </div>
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        ليس لديك حساب؟{' '}
                        <button onClick={() => setIsRegisterMode(true)} className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                            إنشاء حساب جديد
                        </button>
                    </p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
