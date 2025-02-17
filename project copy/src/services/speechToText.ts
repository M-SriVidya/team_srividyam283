//src/services/speechToText.ts
import { io, Socket } from 'socket.io-client';

export class SpeechToTextService {
  private socket: Socket;
  private recognition: SpeechRecognition;
  private onTranscriptCallback: (text: string) => void;
  private isRecording: boolean = false;

  constructor(serverUrl: string, onTranscript: (text: string) => void) {
    this.socket = io(serverUrl);
    this.onTranscriptCallback = onTranscript;

    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.setupRecognition();
  }

  private setupRecognition() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      if (this.isRecording) {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          const text = result[0].transcript;
          this.onTranscriptCallback(text);
          
          // Emit to socket for server-side processing if needed
          this.socket.emit('transcription', {
            text,
            sessionId: crypto.randomUUID()
          });
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };
  }

  async startRecording() {
    try {
      this.isRecording = true;
      this.recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      throw error;
    }
  }

  stopRecording() {
    this.isRecording = false;
    this.recognition.stop();
  }

  disconnect() {
    this.stopRecording();
    this.socket.disconnect();
  }
}

// Add these types to vite-env.d.ts
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}