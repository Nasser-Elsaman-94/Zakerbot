import { PersonalityTraits } from '../types';

export const analyzePersonalityHuggingFace = async (
  answers: { question: string, answer: string }[]
): Promise<PersonalityTraits> => {
  const formattedAnswers = answers.map((a, index) => `${index + 1}. السؤال: "${a.question}"
   الإجابة: ${a.answer}`).join('\n');

  const prompt = `أنت محلل نفسي خبير. مهمتك هي تحليل الإجابات العشرين التالية من تقييم الشخصية المصغر (Mini-IPIP) وتحديد سمات الشخصية الخمس الكبرى للمستخدم: الانفتاح، والضمير، والانبساط، والقبول، والعصابية.\n\nإليك الأسئلة وإجابات المستخدم:\n${formattedAnswers}\n\nبعض الأسئلة يتم تسجيلها بشكل عكسي. يجب أن تأخذ هذا في الاعتبار في تحليلك. الأسئلة ذات التسجيل العكسي هي: 6، 7، 8، 9، 10، 15، 16، 17، 18، 19، 20. بالنسبة لهذه الأسئلة، تشير إجابة "أعارض بشدة" إلى مستوى أعلى من السمة، وتشير إجابة "أوافق بشدة" إلى مستوى أدنى.\n\nبناءً على جميع الإجابات العشرين، قدم درجة مئوية (من 0 إلى 100) لكل من السمات الخمس. يجب أن يكون ردك بتنسيق JSON ويلتزم بشكل صارم بالمخطط المقدم.`;

  const response = await fetch('https://api-inference.huggingface.co/models/Nasserelsaman/microsoft-finetuned-personality', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer "HUGGINGFACE_API_TOKEN"',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: prompt })
  });

  if (!response.ok) {
    throw new Error('فشل الاتصال بـ Hugging Face API');
  }

  const result = await response.json();
  // Assuming the model returns the JSON directly in result[0].generated_text
  const jsonText = result[0]?.generated_text || result.generated_text || result;
  const traits = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;

  // Basic validation
  if (typeof traits.openness !== 'number') {
    throw new Error('الاستجابة غير صالحة من نموذج Hugging Face');
  }
  return traits;
};

