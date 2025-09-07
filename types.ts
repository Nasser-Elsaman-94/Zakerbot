export interface UserProfile {
  name: string;
  birthDate: string;
  governorate: string;
  stage: string;
  schoolName: string;
  class: string;
  hobbies: string;
  age: number;
  gender: 'Male' | 'Female';
  semester: string;
  learningDifficulty: string[];
  personalityTraits?: PersonalityTraits;
  preferredVoice?: string;
  profileImageUrl?: string;
}

export interface PersonalityTraits {
  agreeableness: number;
  conscientiousness: number;
  extraversion: number;

  neuroticism: number;
  openness: number;
}

export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
}

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp?: string;
  isThinking?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  sources?: { web: { uri: string; title: string; } }[];
  isError?: boolean;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
}

export enum KnowledgeItemType {
  FILE = 'file',
  URL = 'url',
  IMAGE = 'image',
}

export interface KnowledgeItem {
  id:string;
  type: KnowledgeItemType;
  title: string;
  content?: string; // Text content for files
  url?: string; // URL for web resources
  dataUrl?: string; // Base64 data URL for images
  mimeType?: string; // Mime type for images
}

export interface Note {
  id: string;
  content: string;
  timestamp: string;
}