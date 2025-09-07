import { GoogleGenAI, GroundingChunk, Part, Type, Modality, GenerateContentResponse } from "@google/genai";
import { KnowledgeItem, KnowledgeItemType, UserProfile, PersonalityTraits } from '../types';

const apiKey = import.meta.env.VITE_API_KEY;
if (!apiKey) {
  throw new Error("VITE_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

const dataUrlToGeminiPart = (dataUrl: string, mimeType: string): Part => {
  return {
    inlineData: {
      mimeType,
      data: dataUrl.split(',')[1] // Remove the "data:mime/type;base64," prefix
    }
  };
};

const getPersonalityInstructions = (traits: PersonalityTraits | undefined): string => {
    if (!traits) return "No personality data available.";
    let instructions = "You MUST adapt your tone and style based on the student's personality traits below:\n";
    if (traits.extraversion > 60) instructions += "- High Extraversion: Be more energetic, interactive, and engaging. Ask follow-up questions.\n";
    if (traits.conscientiousness > 60) instructions += "- High Conscientiousness: Be more structured, calm, organized, and detailed in your explanations.\n";
    if (traits.agreeableness > 60) instructions += "- High Agreeableness: Use a friendly, collaborative, and encouraging tone. Use phrases like 'Let's figure this out together'.\n";
    if (traits.openness > 60) instructions += "- High Openness: Be enthusiastic and introduce novel ideas and connections related to the topic.\n";
    if (traits.neuroticism > 60) instructions += "- High Neuroticism: This is a strict requirement. Be extremely gentle, patient, reassuring, and supportive. Avoid criticism and provide positive reinforcement.\n";
    return instructions;
};

const getLearningDifficultyInstructions = (difficulties: string[]): string => {
    if (!difficulties || difficulties.length === 0 || (difficulties.length === 1 && difficulties[0] === 'لا يوجد')) {
        return "The student has no registered learning difficulties.";
    }
    let instructions = "CRITICAL: The student has the following learning difficulties. You MUST adapt your teaching method accordingly:\n";
    if (difficulties.includes('سرعة التشتت وقلة التركيز')) {
        instructions += "- For 'distraction and lack of focus': Keep explanations concise, break down complex topics into smaller parts, and repeat key information to ensure comprehension.\n";
    }
    if (difficulties.includes('كفيف')) {
        instructions += "- For 'blindness': Be highly descriptive. When referencing images or visual materials from the knowledge base, describe them in detail.\n";
    }
    if (difficulties.includes('متلازمة داون') || difficulties.includes('توحد') || difficulties.includes('تأخر الكلام')) {
        instructions += "- For 'Down syndrome', 'autism', or 'speech delay': Use simple, clear language. Be patient, use repetition, and maintain a very encouraging and positive tone.\n";
    }
    return instructions;
};

const buildSystemInstruction = (userProfile: UserProfile, sessionTitle: string, knowledgeBase: KnowledgeItem[]) => {
    const firstName = userProfile.name.split(' ')[0];
    const personalityTraits = getPersonalityInstructions(userProfile.personalityTraits);
    const learningDifficulties = getLearningDifficultyInstructions(userProfile.learningDifficulty);

    let stageLanguage: string;
    switch (userProfile.stage) {
        case 'المرحلة الإبتدائية':
            stageLanguage = "لغة بسيطة ومشجعة: يجب أن تتحدث بلهجة مصرية رسمية، ولكن بأسلوب بسيط ومشجع وواضح يناسب طالباً في المرحلة الابتدائية. قم بتبسيط المصطلحات المعقدة واستخدم التعزيز الإيجابي.";
            break;
        case 'المرحلة الإعدادية':
            stageLanguage = "لغة واضحة وداعمة: يجب أن تتحدث بلهجة مصرية رسمية تناسب طالباً في المرحلة الإعدادية. يمكنك استخدام مصطلحات أكثر تحديداً، ولكن اشرحها دائماً بوضوح. حافظ على نبرة داعمة وأكاديمية.";
            break;
        case 'المرحلة الثانوية':
            stageLanguage = "لغة أكاديمية ودقيقة: يجب أن تتحدث بلهجة مصرية رسمية وأكاديمية تناسب طالباً في المرحلة الثانوية. استخدم المصطلحات العلمية والأدبية الدقيقة حسب المادة. يجب أن تكون النبرة احترافية.";
            break;
        default:
            stageLanguage = "يجب أن تكتب فقط بلهجة عربية مصرية رسمية.";
            break;
    }

    let languageInstructions = stageLanguage;
    const foreignLanguages = ["اللغة الإنجليزية", "اللغة الفرنسية", "اللغة الألمانية", "اللغة الإيطالية"];
    if (sessionTitle && foreignLanguages.includes(sessionTitle)) {
        languageInstructions += `
        نظراً لأن المادة هي لغة أجنبية (${sessionTitle}):
        1. للمرحلتين الابتدائية والإعدادية، يجب عليك شرح معنى أي مصطلح أجنبي باللغة العربية.
        2. للمرحلة الثانوية، يمكنك استخدام المزيد من المصطلحات الأجنبية، ولكن تأكد من أن الطالب يفهمها.
        `;
    }

    const knowledgeBaseInstructions = knowledgeBase.length > 0
        ? "The knowledge base contains materials. Your primary role is to explain and discuss the content found ONLY within this knowledge base."
        : "The knowledge base is currently empty. Your first task is to ask the student to add files (like PDFs) or web links so you can start studying with them.";

    return `
**Core Identity:**
You are 'الأستاذ راشد' (Professor Rashid), an intelligent, professional, and formal AI teaching assistant.
Your entire response MUST be in Arabic (Egyptian dialect) unless the subject is a foreign language.
Avoid slang or informalities like (معلم, باشا, غالي, طيب) completely.

**Session Goal:**
Your goal is to help a student study the subject of **'${sessionTitle}'**.

**Student Profile Adaptation (Strict Requirement):**
${personalityTraits}
${learningDifficulties}

**Language Rules (CRITICAL - Based on Student's Stage):**
${languageInstructions}

**Knowledge Base and Topic Rules (CRITICAL):**
1.  **KNOWLEDGE BASE IS PRIMARY:** Your answers MUST be based **exclusively** on the provided knowledge base. Do not use your general knowledge unless the user explicitly asks you to ("ابحث خارج المصادر") or something like that.
2.  **IF EMPTY:** ${knowledgeBaseInstructions}
3.  **IF INFO NOT FOUND:** If a user's question cannot be answered from the knowledge base, state clearly: "هذه المعلومة غير موجودة في المصادر المتاحة حالياً." (This information is not available in the current resources). Then, you can ask if they want you to search using your general knowledge via Google Search.
4.  **STAY ON TOPIC:** If the user asks about a topic or subject unrelated to **'${sessionTitle}'** or the knowledge base content, you MUST NOT answer it. Instead, give them an advice ('نصيحة') to stay focused. For example: "نصيحة يا ${firstName}, من الأفضل أن نركز على مادة ${sessionTitle} الآن حتى لا نتشتت. يمكننا مناقشة مواضيع أخرى في جلسة جديدة." (A piece of advice, ${firstName}, it's better to focus on ${sessionTitle} now so we don't get distracted. We can discuss other topics in a new session.)
5.  **IF USER INSISTS:** If they insist on asking about another subject, politely tell them: "للسؤال في مادة مختلفة، يمكنك إنهاء هذه المحادثة وبدء محادثة جديدة مع اختيار المادة التي تريدها." (To ask about a different subject, you can end this conversation and start a new one, selecting the subject you want).
`;
};

const buildContents = (prompt: string, knowledgeBase: KnowledgeItem[]) => {
    const textKnowledgeItems = knowledgeBase.filter(item => item.type !== KnowledgeItemType.IMAGE);
    const imageKnowledgeItems = knowledgeBase.filter(item => item.type === KnowledgeItemType.IMAGE);
    
    const knowledgeBaseText = textKnowledgeItems
      .map(item => `
--- START ${item.type.toUpperCase()}: ${item.title} ---
${item.type === 'url' ? `URL: ${item.url}` : ''}
${item.content || 'Content not available for this item.'}
--- END ${item.type.toUpperCase()}: ${item.title} ---
`)
      .join('\n\n');

    const textPart = {
      text: `قاعدة المعرفة النصية الحالية:
${knowledgeBaseText}

سؤال المستخدم: "${prompt}"`
    };

    const imageParts: Part[] = imageKnowledgeItems
      .map(item => {
        if (item.dataUrl && item.mimeType) {
          return dataUrlToGeminiPart(item.dataUrl, item.mimeType);
        }
        return null;
      })
      .filter((part): part is Part => part !== null);

    return { parts: [textPart, ...imageParts] };
};

// For text generation, use the standard flash model
export const generateResponse = async (
  prompt: string,
  knowledgeBase: KnowledgeItem[],
  userProfile: UserProfile,
  sessionTitle: string,
): Promise<{ fullText: string; sources: any[] | undefined; error?: string }> => {
  try {
    const systemInstruction = buildSystemInstruction(userProfile, sessionTitle, knowledgeBase);
    const contents = buildContents(prompt, knowledgeBase);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        tools: [{googleSearch: {}}],
      },
    });

    const fullText = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return { fullText, sources, error: undefined };

  } catch (e: any) {
    const errorMessage = "عذراً، حدث خطأ أثناء محاولة الرد.";
    console.error("Failed to generate response:", e);
    return { fullText: '', sources: undefined, error: errorMessage };
  }
};


// For streaming text generation in voice mode
export const generateResponseStream = async (
  prompt: string,
  knowledgeBase: KnowledgeItem[],
  userProfile: UserProfile,
  sessionTitle: string,
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    const systemInstruction = buildSystemInstruction(userProfile, sessionTitle, knowledgeBase);
    const contents = buildContents(prompt, knowledgeBase);

    // Using generateContentStream for a "live" response
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        // To prioritize low-latency for voice, disable thinking time.
        thinkingConfig: { thinkingBudget: 0 },
        // Tools like googleSearch are omitted here to prioritize low-latency text streaming
      },
    });

    return responseStream;
};

export const searchEducationalResources = async (profile: UserProfile, subject: string): Promise<KnowledgeItem[]> => {
  try {
    const prompt = `ابحث عن مصادر تعليمية **عالية الجودة ومتنوعة** عبر الإنترنت.
البحث مخصص لطالب في '${profile.stage}'، '${profile.class}'، خلال '${profile.semester}'، ويدرس مادة '${subject}'.
**متطلبات البحث:**
1.  **الأولوية القصوى:** ابحث في **موقع وزارة التربية والتعليم المصرية (https://moe.gov.eg/ar/elearningenterypage/e-learning/)** عن **كتاب الوزارة الرسمي** أو المناهج الدراسية للمادة والصف المحددين. يجب أن يكون هذا هو المصدر الأول إذا وجد.
2.  **نوعية المصادر:** بعد كتاب الوزارة، ركز على المقالات التعليمية، الأوراق الأكاديمية، الشروحات الجامعية، الفيديوهات التعليمية، والدروس التفاعلية.
3.  **المواقع الموثوقة:** أعط الأولوية للمنصات التعليمية المعروفة والمواقع الأكاديمية والجامعية (التي تنتهي بـ .edu أو .ac)، والمواقع الحكومية والمنظمات العلمية. قم بتضمين مصادر مصرية موثوقة مثل **بنك المعرفة المصري (EKB)** إن وجدت.
4.  **تجنب بشكل صارم:** أي نتائج من مواقع التواصل الاجتماعي (فيسبوك، تويتر، انستغرام، تيك توك، لينكدإن)، المنتديات، المدونات الشخصية، المواقع الإخبارية العامة، أو المقالات غير الأكاديمية.
5.  **اللغة:** يجب أن تكون النتائج باللغة العربية بشكل أساسي، ما لم تكن المادة تتطلب اللغة الإنجليزية.
6.  **الفيديوهات:** بالنسبة لفيديوهات يوتيوب، ابحث عن قنوات تعليمية موثوقة وقدم العنوان الكامل للفيديو.`;

    const response = await ai.models.generateContent({
       model: "gemini-2.5-flash",
       contents: prompt,
       config: {
         tools: [{googleSearch: {}}],
       },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (!groundingChunks) {
      console.log("No grounding chunks found in the response.");
      return [];
    }
    
    const blockedKeywords = [
        'wikipedia', 'facebook', 'twitter', 'instagram', 'tiktok', 'linkedin', 
        'news', 'article', 'magazine', 'journal', 'forum', 'blog', 'community', // English
        'ويكيبيديا', 'فيسبوك', 'تويتر', 'انستغرام', 'تيك توك', 'لينكد إن', // Arabic Social
        'أخبار', 'خبر', 'جريدة', 'صحيفة', 'مجلة', 'مقالة', // Arabic news-related
        'منتديات', 'منتدى', 'مدونة', 'مجتمع' // Arabic forums/blogs
    ];
    
    const resources: KnowledgeItem[] = (groundingChunks as any[])
      .filter(chunk => chunk.web && chunk.web.uri && chunk.web.title)
      .map((chunk: any): KnowledgeItem | null => {
        const { uri, title } = chunk.web;
        try {
            const lowerCaseUri = uri.toLowerCase();
            const lowerCaseTitle = title.toLowerCase();

            // Filter out blocked keywords
            if (blockedKeywords.some(keyword => lowerCaseUri.includes(keyword) || lowerCaseTitle.includes(keyword))) {
                return null;
            }

            // The new prompt is broader, so we no longer restrict to just YouTube and PDF.
            // Any valid URL that passes the keyword block is now allowed.
            const isPdf = lowerCaseUri.endsWith('.pdf');

            return {
              id: `resource-${uri}`,
              type: isPdf ? KnowledgeItemType.FILE : KnowledgeItemType.URL,
              title: title || new URL(uri).hostname,
              url: uri,
              content: `Reference URL: ${uri}`,
            };
        } catch(e) {
            // Invalid URL, skip it
            return null;
        }
      })
      .filter((item): item is KnowledgeItem => item !== null);

    // Remove duplicates based on URL
    const uniqueResources = Array.from(new Map(resources.map(item => [item.url, item])).values());
    
    return uniqueResources;

  } catch (error) {
    console.error("Error searching for educational resources:", error);
    return []; // Return an empty array on error
  }
};


export const summarizeText = async (textToSummarize: string): Promise<string> => {
   try {
    const promptText = `الرجاء تلخيص النص التالي بشكل موجز باللغة العربية:\n\n"${textToSummarize}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // CORRECT MODEL for text summarization
      contents: promptText,
    });

    const summary = response.text;
    return summary || "عذراً، لم أتمكن من تلخيص النص.";
  } catch(error) {
     console.error("Error summarizing text:", error);
     return "عذراً، لم أتمكن من تلخيص النص.";
  }
};

export const summarizeChatHistory = async (history: string): Promise<string> => {
   try {
    const promptText = `لخص المحادثة التالية بشكل موجز باللغة العربية، مع التركيز على الأسئلة الرئيسية والإجابات والنقاط الرئيسية التي تمت مناقشتها:\n\n---\n\n${history}\n\n---\n\nالملخص:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
    });

    const summary = response.text;
    return summary || "عذراً، لم أتمكن من تلخيص المحادثة.";
  } catch(error) {
     console.error("Error summarizing chat:", error);
     return "عذراً، لم أتمكن من تلخيص المحادثة.";
  }
};

export const analyzePersonality = async (
  answers: { question: string, answer: string }[]
): Promise<PersonalityTraits> => {
  const formattedAnswers = answers.map((a, index) => `${index + 1}. السؤال: "${a.question}"\n   الإجابة: ${a.answer}`).join('\n');
  
  const systemInstruction = `أنت محلل نفسي خبير. مهمتك هي تحليل الإجابات العشرين التالية من تقييم الشخصية المصغر (Mini-IPIP) وتحديد سمات الشخصية الخمس الكبرى للمستخدم: الانفتاح، والضمير، والانبساط، والقبول، والعصابية.

إليك الأسئلة وإجابات المستخدم:
${formattedAnswers}

بعض الأسئلة يتم تسجيلها بشكل عكسي. يجب أن تأخذ هذا في الاعتبار في تحليلك. الأسئلة ذات التسجيل العكسي هي: 6، 7، 8، 9، 10، 15، 16، 17، 18، 19، 20. بالنسبة لهذه الأسئلة، تشير إجابة "أعارض بشدة" إلى مستوى أعلى من السمة، وتشير إجابة "أوافق بشدة" إلى مستوى أدنى.

بناءً على جميع الإجابات العشرين، قدم درجة مئوية (من 0 إلى 100) لكل من السمات الخمس. يجب أن يكون ردك بتنسيق JSON ويلتزم بشكل صارم بالمخطط المقدم.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "الرجاء تحليل إجابات تقييم الشخصية المقدمة.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            openness: { type: Type.NUMBER, description: "Score for Openness trait (0-100)" },
            conscientiousness: { type: Type.NUMBER, description: "Score for Conscientiousness trait (0-100)" },
            extraversion: { type: Type.NUMBER, description: "Score for Extraversion trait (0-100)" },
            agreeableness: { type: Type.NUMBER, description: "Score for Agreeableness trait (0-100)" },
            neuroticism: { type: Type.NUMBER, description: "Score for Neuroticism trait (0-100)" },
          },
          required: ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"],
        },
      },
    });

    // The `.text` property should be used to get the text response.
    const jsonText = response.text;
    const traits = JSON.parse(jsonText);

    // Basic validation
    if (typeof traits.openness !== 'number') {
      throw new Error("Invalid response format from API");
    }

    return traits;

  } catch (error) {
    console.error("Error analyzing personality:", error);
    // Return a default error object or re-throw
    throw new Error("عذراً، لم أتمكن من تحليل تقييم الشخصية.");
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const audioPart = {
      inlineData: {
        mimeType,
        data: base64Audio,
      },
    };
    
    const textPart = {
      text: "Transcribe the following audio recording in Arabic. The recording is from a student in Egypt.",
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [audioPart, textPart] },
    });
    
    const transcribedText = response.text;
    if (!transcribedText || transcribedText.trim().length === 0) {
        throw new Error("Audio transcription returned an empty result.");
    }
    return transcribedText;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    // Provide a more user-friendly error message
    throw new Error("عذراً، لم أتمكن من فهم ما قلته. هل يمكنك المحاولة مرة أخرى بصوت أوضح؟");
  }
};

export const generateSpeechFromText = async (textToSpeak: string, voiceName?: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: textToSpeak,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || 'Orus' } },
        },
      },
    });
    
    const audioPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData?.mimeType?.startsWith('audio/'));

    if (audioPart?.inlineData) {
      return audioPart.inlineData.data; // Base64 encoded audio
    }
    
    console.warn("TTS response did not contain audio data.", response);
    return null;
  } catch (error) {
    console.error("Error generating speech from text:", error);
    return null;
  }
};

export const fetchUrlTitle = async (url: string): Promise<string> => {
  // Return early for invalid or non-http URLs to avoid API errors
  if (!url || !url.startsWith('http')) {
    try {
      return new URL(url).hostname;
    } catch {
      return url; // fallback to original string if URL is malformed
    }
  }

  try {
    const prompt = `What is the title of the web page at the following URL? Respond with only the page title and nothing else. URL: ${url}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        // Disable thinking for this simple, low-latency task.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const title = response.text.trim();
    // A simple heuristic to remove potential "Title: " prefixes or other conversational text from the model
    if (title.toLowerCase().startsWith('title:')) {
        return title.substring(6).trim();
    }
    // Return title if it's not empty, otherwise fallback to hostname
    return title || new URL(url).hostname;

  } catch (error) {
    console.error(`Error fetching title for URL ${url}:`, error);
    try {
      // Fallback to hostname on error
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }
};

export const fetchVideoTranscript = async (url: string): Promise<string> => {
  if (!url || !(url.includes('youtube.com') || url.includes('youtu.be'))) {
    return `Reference URL: ${url}`; // Fallback for non-video or invalid URLs
  }

  try {
    const prompt = `Provide a detailed, comprehensive summary of the educational content from the video at the following URL. Extract all key concepts, explanations, and important information as if you were creating a text-based lesson from the video. Respond in Arabic. URL: ${url}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    const transcript = response.text.trim();
    if (transcript) {
      return transcript;
    } else {
      // If the model returns an empty string, maybe it couldn't access it.
      return `لم أتمكن من استخلاص نص من الفيديو. رابط مرجعي: ${url}`;
    }

  } catch (error) {
    console.error(`Error fetching transcript for URL ${url}:`, error);
    // Fallback on error
    return `فشل استخلاص النص من الفيديو. رابط مرجعي: ${url}`;
  }
};
