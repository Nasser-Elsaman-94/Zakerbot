import React, { useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { UserProfile } from '../../types';

// This global type declaration is necessary to inform TypeScript about the custom element
// and its properties, preventing type errors when using it in JSX.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gdm-live-audio': React.DetailedHTMLProps<React.HTMLAttributes<GdmLiveAudio>, GdmLiveAudio> & {
        'profile-image-url'?: string;
      };
    }
  }
}

interface VoiceModeProps {
  onClose: () => void;
  userProfile: UserProfile;
}

const VoiceMode: React.FC<VoiceModeProps> = ({ onClose, userProfile }) => {
  const ref = useRef<GdmLiveAudio>(null);

  useEffect(() => {
    const handleClose = () => onClose();
    const element = ref.current;
    element?.addEventListener('close', handleClose);
    return () => {
      element?.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  return React.createElement('gdm-live-audio', {
    ref,
    'profile-image-url': userProfile.profileImageUrl,
  });
};

// --- Start of inlined utility functions ---
/**
 * Decodes a base64 string into an ArrayBuffer.
 */
const decode = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Converts a Float32Array of PCM data into a base64-encoded string of 16-bit PCM data.
 */
const createBlob = (pcmData: Float32Array): string => {
  const dataView = new DataView(new ArrayBuffer(pcmData.length * 2));
  for (let i = 0; i < pcmData.length; i++) {
    const s = Math.max(-1, Math.min(1, pcmData[i]));
    dataView.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true); // Little-endian
  }
  let binary = '';
  const bytes = new Uint8Array(dataView.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};
// --- End of inlined utility functions ---

export const AGENT_INSTRUCTION = 
"You are a helpful voice AI teacher that speaks Arabic only (Egyptian Dialect), if user asks some english words like terms as example (AI, Artificial Intelligence, ML, Machine Leaarning, DL, Deep Learning, Data Analysis, Big Data Analytics), you will use those data during speaking and you can use them, or mix like (The word in English and the meaning in arabic (Artificial Intelligence أو الذكاء الإصطناعي), Your answers must be in details and long answers, don't try to minimize/ shorten your response)";

export const SESSION_INSTRUCTION = 
"Greet the user with (Alsalamo Alikum) and present yourself as that your name is Master. Rashid, and I'm teacher and offer your assistance to help user in understanding anythin in during his study in Arabic Language (Egyptian Materials) only, When user need to end the discussion you will End your discussion with only one of the words (Fe Amana Ellah) or say (Fe Hefz Ellah) and say (Alsalamo Alikum).";


@customElement('gdm-live-audio')
export class GdmLiveAudio extends LitElement {
  @state() isRecording = false;
  @state() isSpeaking = false;
  @state() status = 'اضغط على الزر لبدء التحدث.';
  @state() error = '';
  @property({ type: String, attribute: 'profile-image-url' }) profileImageUrl?: string;

  private client: GoogleGenAI;
  private session: any;
  private inputAudioContext: AudioContext;
  private outputAudioContext: AudioContext;
  
  @state() inputNode: GainNode;
  @state() outputNode: GainNode;
  
  private nextStartTime = 0;
  private mediaStream: MediaStream;
  private sourceNode: MediaStreamAudioSourceNode;
  private scriptProcessorNode: ScriptProcessorNode;
  private sources = new Set<AudioBufferSourceNode>();

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      height: 100%;
      position: relative;
      background: radial-gradient(ellipse at center, #1e3a8a 0%, #111827 70%);
      padding: 4vh 2vw;
      box-sizing: border-box;
      color: white;
      font-family: sans-serif;
    }
    .close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 20;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 0.2);
      color: white;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      cursor: pointer;
      font-size: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      padding-bottom: 4px;
      transition: background-color 0.2s;
    }
    .close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    .teacher-avatar {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: radial-gradient(ellipse at center, #38bdf8 0%, #0ea5e9 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      border: 4px solid rgba(255, 255, 255, 0.1);
      text-align: center;
    }
    .teacher-avatar p {
        margin: 0;
        font-weight: bold;
        text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    }
    #status {
      text-align: center;
      padding: 0 10px;
      min-height: 40px; /* Reserve space */
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.2);
      border-radius: 12px;
      padding: 10px 20px;
      backdrop-filter: blur(5px);
    }
    .student-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
    }
    .student-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 3px solid #34d399;
        object-fit: cover;
        box-shadow: 0 0 15px rgba(52, 211, 153, 0.5);
        transition: transform 0.5s ease;
    }
    .controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 300px;
    }
    .control-btn {
        outline: none;
        border: none;
        color: white;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }
    .control-btn:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    .control-btn:active {
        transform: scale(0.95);
    }
    #recordButton {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background-color: #ef4444; /* red-500 */
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
    }
    #recordButton.recording {
        background-color: #3b82f6; /* blue-500 */
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
    }
    #recordButton svg {
        width: 36px;
        height: 36px;
    }
    #resetButton {
        width: 50px;
        height: 50px;
        border-radius: 50%;
    }
    #resetButton svg {
        width: 28px;
        height: 28px;
        fill: #fff;
    }
    #resetButton[disabled] {
      opacity: 0;
      pointer-events: none;
    }
  `;

  constructor() {
    super();
    this.initClient();
  }

  connectedCallback() {
    super.connectedCallback();
    this.initAudioContexts();
    this.initSession();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopRecording();
    this.session?.close();
    this.inputAudioContext?.close().catch(console.error);
    this.outputAudioContext?.close().catch(console.error);
  }
  
  private initAudioContexts() {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    this.inputAudioContext = new AudioContext({ sampleRate: 16000 });
    this.outputAudioContext = new AudioContext({ sampleRate: 24000 });
    this.inputNode = this.inputAudioContext.createGain();
    this.outputNode = this.outputAudioContext.createGain();
    this.outputNode.connect(this.outputAudioContext.destination);
    this.nextStartTime = 0;
  }

  private initClient() {
    if (!process.env.API_KEY) {
      this.updateError("API_KEY environment variable not set");
      return;
    }
    this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private async initSession() {
    if (!this.client) return;
    const model = 'gemini-2.5-flash-preview-native-audio-dialog';
    const systemInstruction = `${SESSION_INSTRUCTION}\n${AGENT_INSTRUCTION}`;

    try {
      this.session = await this.client.live.connect({
        model,
        callbacks: {
          onopen: () => this.updateStatus('الاتصال مفتوح.'),
          onmessage: (message: LiveServerMessage) => this.handleLiveMessage(message),
          onerror: (e: ErrorEvent) => this.updateError(e.message),
          onclose: (e: CloseEvent) => this.updateStatus(`انتهى الاتصال: ${e.reason}`),
        },
        config: {
          systemInstruction,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Orus' } },
          },
        },
      });
    } catch (e) {
      console.error(e);
      this.updateError(e instanceof Error ? e.message : 'فشل في بدء الجلسة.');
    }
  }

  private handleLiveMessage(message: LiveServerMessage) {
    const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData;
    if (audio) {
      const rawBuffer = decode(audio.data);
      const pcmData = new Int16Array(rawBuffer);
      const audioBuffer = this.outputAudioContext.createBuffer(1, pcmData.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768.0;
      }
      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputNode);
      source.onended = () => {
        this.sources.delete(source);
        if (this.sources.size === 0) {
            this.isSpeaking = false;
        }
      };
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);
      this.isSpeaking = true;
    }
    if (message.serverContent?.interrupted) {
      for (const source of this.sources) {
        source.stop();
      }
      this.sources.clear();
      this.nextStartTime = 0;
      this.isSpeaking = false;
    }
  }

  private updateStatus(msg: string) {
    this.status = msg;
    this.error = '';
  }

  private updateError(msg: string) {
    this.error = msg;
    this.status = '';
  }

  private async startRecording() {
    if (this.isRecording) return;
    if (this.inputAudioContext.state === 'suspended') {
      await this.inputAudioContext.resume();
    }
    this.updateStatus('جاري طلب الوصول إلى الميكروفون...');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.updateStatus('تم منح الوصول إلى الميكروفون.');
      this.sourceNode = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 4096;
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(bufferSize, 1, 1);

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording || !this.session) return;
        const pcmData = audioProcessingEvent.inputBuffer.getChannelData(0);
        
        this.session.sendRealtimeInput({
          audio: {
            data: createBlob(pcmData),
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      };

      this.sourceNode.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination);
      this.isRecording = true;
      this.updateStatus('🔴 جاري التسجيل...');
    } catch (err) {
      console.error('Error starting recording:', err);
      this.updateError(err instanceof Error ? err.message : 'خطأ غير معروف في التسجيل.');
      this.stopRecording();
    }
  }

  private stopRecording() {
    if (!this.isRecording && !this.mediaStream) return;
    this.updateStatus('جاري إيقاف التسجيل...');
    this.isRecording = false;
    
    this.scriptProcessorNode?.disconnect();
    this.sourceNode?.disconnect();
    this.scriptProcessorNode = null;
    this.sourceNode = null;

    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.mediaStream = null;
    this.updateStatus('توقف الإدخال الصوتي. اضغط لبدء التحدث.');
  }

  private reset() {
    this.session?.close();
    this.initSession();
    this.updateStatus('تم إعادة تعيين الجلسة.');
  }

  private handleClose() {
    this.dispatchEvent(new CustomEvent('close'));
  }

  render() {
    const teacherAvatarClasses = {
      'teacher-avatar': true,
      'animate-glowing-orb': true,
      'animate-speaking-pulse': this.isSpeaking,
    };
    const studentAvatarClasses = {
      'student-avatar': true,
      'animate-speaking-pulse': this.isRecording,
    };
    const recordButtonClasses = {
      'control-btn': true,
      'recording': this.isRecording,
    }

    return html`
      <button class="close-btn" @click=${this.handleClose} title="إغلاق الوضع الصوتي">&times;</button>
      
      <div class=${classMap(teacherAvatarClasses)}>
        <p>الأستاذ راشد</p>
        <p class="text-sm opacity-80">${this.isSpeaking ? 'يتحدث...' : 'يستمع'}</p>
      </div>

      <div id="status">
        ${this.error ? html`<span style="color: #f87171;">${this.error}</span>` : this.status}
      </div>

      <div class="student-section">
        <img 
            src=${this.profileImageUrl || "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=2080&auto=format&fit=crop"} 
            alt="صورة الطالب" 
            class=${classMap(studentAvatarClasses)}
        />
        <div class="controls">
            <button id="resetButton" class="control-btn" @click=${this.reset} ?disabled=${this.isRecording} title="إعادة تعيين الجلسة">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" /></svg>
            </button>
            <button id="recordButton" class=${classMap(recordButtonClasses)} @click=${this.isRecording ? this.stopRecording : this.startRecording}>
                ${this.isRecording
                  ? html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M9,9V15H15V9H9Z" /></svg>`
                  : html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A3,3 0 0,1 15,5V12A3,3 0 0,1 12,15A3,3 0 0,1 9,12V5A3,3 0 0,1 12,2M19,12C19,15.31 16.31,18 13,18V22H11V18C7.69,18 5,15.31 5,12H7A5,5 0 0,0 12,17A5,5 0 0,0 17,12H19Z" /></svg>`}
            </button>
            <div style="width: 50px;"></div>
        </div>
      </div>
    `;
  }
}

export default VoiceMode;
