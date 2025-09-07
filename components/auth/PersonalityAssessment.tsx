import React, { useState, useCallback } from 'react';
import { PersonalityTraits } from '../../types';
import { analyzePersonalityHuggingFace } from '../../services/huggingfaceService';
import RadarChart from '../common/RadarChart';

interface PersonalityAssessmentProps {
  userName: string;
  onComplete: (traits: PersonalityTraits) => void;
}

const questions = [
  { text: "أحب المشاركة في الحفلات والأنشطة الطلابية.", id: 1 },
  { text: "أتعاطف مع مشاعر الآخرين.", id: 2 },
  { text: "أقوم بإنجاز الأعمال المطلوبة مني على الفور.", id: 3 },
  { text: "لدي تقلبات مزاجية متكررة.", id: 4 },
  { text: "لدي خيالاً قوياً.", id: 5 },
  { text: "لا أتحدث كثيرا.", id: 6 },
  { text: "لست مهتمًا بمشاكل الآخرين ولا معاناتهم.", id: 7 },
  { text: "كثيراً ما أنسى إعادة الأشياء إلى مكانها الصحيح.", id: 8 },
  { text: "أميل إلى الراحة والإسترخاء في معظم الأوقات.", id: 9 },
  { text: "لست مهتمًا بالأفكار النظرية أو غير الملموسة.", id: 10 },
  { text: "في الحفلات أحب التحدث مع عدد كبير ومتنوع من الأشخاص.", id: 11 },
  { text: "أشعر بمشاعر الآخرين.", id: 12 },
  { text: "أحب النظام والترتيب.", id: 13 },
  { text: "أغضب وأحزن بسهولة.", id: 14 },
  { text: "أجد صعوبة في فهم الأفكار النظرية / غير الملموسة.", id: 15 },
  { text: " أحب البقاء بعيداً عن الأنظار خلال المواقف الاجتماعية.", id: 16 },
  { text: "لست مهتمًا بالآخرين.", id: 17 },
  { text: "أميل إلى بعثرة الأشياء وجعلها فوضوية.", id: 18 },
  { text: "نادراً ما أشعر بالكآبة والحزن.", id: 19 },
  { text: "ليس لدي خيالاً قوياً.", id: 20 }
];

const options = ["أعارض بشدة", "أعارض", "محايد", "أوافق", "أوافق بشدة"];

const PersonalityAssessment: React.FC<PersonalityAssessmentProps> = ({ userName, onComplete }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PersonalityTraits | null>(null);
  const [validationErrors, setValidationErrors] = useState<Set<number>>(new Set());
  const [apiToken, setApiToken] = useState<string>("");

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    if (validationErrors.has(questionId)) {
        setValidationErrors(prevErrors => {
            const newErrors = new Set(prevErrors);
            newErrors.delete(questionId);
            return newErrors;
        });
    }
  };

  const handleSubmit = useCallback(async () => {
    const unansweredIds = questions
        .map(q => q.id)
        .filter(id => !answers[id]);

    if (unansweredIds.length > 0) {
      setError("الرجاء الإجابة على جميع الأسئلة العشرين قبل الإرسال.");
      setValidationErrors(new Set(unansweredIds));
      return;
    }
    setError(null);
    setValidationErrors(new Set());
    setIsLoading(true);
    
    if (!apiToken) {
      setError("يرجى إدخال رمز API الخاص بـ Hugging Face.");
      setIsLoading(false);
      return;
    }
    try {
      const formattedAnswers = questions.map(q => ({
        question: q.text,
        answer: answers[q.id]
      }));
      const traits = await analyzePersonalityHuggingFace(formattedAnswers, apiToken);
      setResults(traits);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير معروف.");
    } finally {
      setIsLoading(false);
    }
  }, [answers, apiToken]);

  if (results) {
    return (
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">ملف شخصيتك</h2>
        <p className="mt-2 text-gray-200">
          بناءً على إجاباتك، إليك لمحة عن سمات شخصيتك.
        </p>
        <div className="my-8 flex justify-center">
           <RadarChart data={results} />
        </div>
        <p className="text-sm text-gray-300 mb-6">يساعدنا هذا التقييم على تخصيص تجربتك التعليمية. يمكنك الآن المتابعة إلى التطبيق الرئيسي.</p>
        <button
            onClick={() => onComplete(results)}
            className="w-full max-w-xs mx-auto px-4 py-3 font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
        >
            المتابعة إلى الدردشة
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <label className="block text-white font-semibold mb-2">رمز API الخاص بـ Hugging Face:</label>
        <input
          type="text"
          value={apiToken}
          onChange={e => setApiToken(e.target.value)}
          className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="أدخل رمز API هنا"
        />
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-center">الخطوة الأخيرة، {userName}!</h2>
      <p className="mt-2 text-gray-200 text-center">
        أكمل هذا التقييم الشخصي القصير لتخصيص تجربتك.
      </p>

      <div className="mt-8 space-y-6 max-h-[60vh] overflow-y-auto pe-4">
        {questions.map((q, index) => (
          <div 
            key={q.id} 
            className={`p-4 bg-white/10 rounded-lg transition-all ${validationErrors.has(q.id) ? 'border-2 border-red-400' : 'border-2 border-transparent'}`}
          >
            <p className="font-medium text-white">{index + 1}. {q.text}</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-3">
              {options.map(opt => (
                <label key={opt} className="flex items-center space-x-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name={`question_${q.id}`}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => handleAnswerChange(q.id, opt)}
                    className="form-radio h-4 w-4 text-teal-500 bg-gray-800 border-gray-600 focus:ring-teal-500"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
             {validationErrors.has(q.id) && <p className="text-red-300 text-xs mt-2 text-center">الإجابة على هذا السؤال مطلوبة.</p>}
          </div>
        ))}
      </div>
      
      {error && !validationErrors.size && <p className="text-red-300 text-center mt-4">{error}</p>}
      {validationErrors.size > 0 && <p className="text-red-300 text-center mt-4">الرجاء الإجابة على الأسئلة المحددة أعلاه.</p>}
      
      <div className="mt-8">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full px-4 py-3 font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-teal-400/50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جاري التحليل...' : 'إرسال ورؤية ملفي الشخصي'}
        </button>
      </div>
    </div>
  );
};

export default PersonalityAssessment;