
import React from 'react';

interface HomePageProps {
  onNavigateToAuth: (mode: 'login' | 'register') => void;
}

// Icons for the features section
const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 1-9-9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a3 3 0 0 1 3 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a3 3 0 0 0-3 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12V9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9a3 3 0 0 0-3-3 3 3 0 0 0-3 3" />
    </svg>
  );


const LimitlessKnowledgeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);

const VoiceAssistantIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
    </svg>
);

const HomePage: React.FC<HomePageProps> = ({ onNavigateToAuth }) => {
  const customAnimationStyle = `
      @keyframes subtle-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      .animate-subtle-float {
        animation: subtle-float 6s ease-in-out infinite;
      }
    `;

  return (
    <div className="bg-gray-900 text-white min-h-screen overflow-x-hidden relative">
      <style>{customAnimationStyle}</style>
      
       {/* Background Image & Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=2098&auto=format&fit=crop')" }}
      ></div>
      <div className="absolute inset-0 z-0 bg-black/50"></div>
      
      <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
         <h1 onClick={() => window.location.href = '/'} className="text-2xl font-bold cursor-pointer">
              <span className="text-teal-400">ذاكر</span>
              <span className="text-sky-400">بوت</span>
        </h1>
        <button onClick={() => onNavigateToAuth('login')} className="px-5 py-2 text-sm font-semibold bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors">
            تسجيل الدخول
        </button>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="text-center pt-16 pb-24 px-4">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-100" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                أطلق العنان لقدراتك الدراسية
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-300" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                رفيقك الدراسي الذكي الذي يتكيف معك خطوة بخطوة، ويحول أصعب المواد إلى رحلة ممتعة.
            </p>
            <button 
                onClick={() => onNavigateToAuth('register')}
                className="mt-10 px-8 py-4 text-lg font-bold text-gray-900 bg-gradient-to-r from-teal-300 to-sky-400 rounded-full hover:scale-105 transform transition-all duration-300 shadow-2xl shadow-teal-500/20"
              >
                ابدأ رحلتك التعليمية الآن
            </button>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-gray-900/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h3 className="text-3xl font-bold">مُصمَم خصيصاً لنجاحك</h3>
                    <p className="mt-3 text-lg text-gray-400">كل ما تحتاجه في منصة واحدة ذكية.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    <div className="flex flex-col items-center">
                        <div className="p-4 bg-teal-900/50 border border-teal-500/30 rounded-2xl inline-block">
                            <BrainIcon />
                        </div>
                        <h4 className="mt-4 text-xl font-semibold">تعلم مُخصص</h4>
                        <p className="mt-2 text-gray-400">
                           يُحلل ذاكربوت أسلوب تعلُمك وسماتك الشخصية لتقديم شروحات ومصادر تناسبك تماماً.
                        </p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="p-4 bg-indigo-900/50 border border-indigo-500/30 rounded-2xl inline-block">
                           <LimitlessKnowledgeIcon />
                        </div>
                        <h4 className="mt-4 text-xl font-semibold">معرفة بلا حدود</h4>
                        <p className="mt-2 text-gray-400">
                            اجمع موادك الدراسية، أضف روابط وفيديوهات وملفات، ودع ذاكربوت يبحث لك عن أحدث المصادر الموثوقة.
                        </p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="p-4 bg-sky-900/50 border border-sky-500/30 rounded-2xl inline-block">
                            <VoiceAssistantIcon />
                        </div>
                        <h4 className="mt-4 text-xl font-semibold">مساعد صوتي ذكي</h4>
                        <p className="mt-2 text-gray-400">
                           تحدث مباشرة مع "الأستاذ راشد - مُعلمُك الذكي" للحصول على إجابات فورية وشروحات صوتية تفاعلية لموادك الدراسية.
                        </p>
                    </div>
                </div>
            </div>
        </section>
        
        {/* Testimonial Section */}
        <section className="py-24 px-4">
            <div className="max-w-3xl mx-auto text-center">
                <div className="animate-subtle-float">
                    <img src="/anime-student.svg" alt="صورة طالب أنمي مبتسم" className="w-20 h-20 mx-auto rounded-full object-cover" />
                </div>
                <blockquote className="mt-8">
                    <p className="text-xl font-medium text-gray-200">
                       "ذاكربوت غيّر طريقتي في المذاكرة، كل المواد بقت سهلة وواضحة أكتر، ميزة المساعد الصوتي كمان إنه مُتفاعل معايا حاسس إني بكلم مدرس بجد!"
                    </p>
                </blockquote>
                <cite className="mt-4 block font-semibold text-gray-400 not-italic">
                    أحمد - طالب في المرحلة الثانوية
                </cite>
            </div>
        </section>
        
      </main>
      
      <footer className="relative z-10 text-center py-8 text-gray-500 bg-gray-900/50">
          <p>ذاكربوت. كل الحقوق محفوظة &copy; {new Date().getFullYear()}.</p>
      </footer>
    </div>
  );
};

export default HomePage;
