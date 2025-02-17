//src/store/callStore.ts
import { create } from 'zustand';
import type { CallData, TranscriptSegment } from '../types';
import { SpeechToTextService } from '../services/speechToText';
import { NLPService } from '../services/nlpService';

interface CallState {
  isCallActive: boolean;
  currentCall: CallData | null;
  transcript: TranscriptSegment[];
  speechToText: SpeechToTextService | null;
  nlpService: NLPService | null;
  startCall: () => Promise<void>;
  endCall: () => void;
  addTranscriptSegment: (segment: TranscriptSegment) => void;
  updateCallData: (data: Partial<CallData>) => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  isCallActive: false,
  currentCall: null,
  transcript: [],
  speechToText: null,
  nlpService: null,

  startCall: async () => {
    const nlpService = new NLPService();
    await nlpService.initialize();

    const speechToText = new SpeechToTextService(
      import.meta.env.VITE_WEBSOCKET_URL,
      async (text) => {
        const segment: TranscriptSegment = {
          text,
          speaker: 'customer',
          timestamp: new Date()
        };
        get().addTranscriptSegment(segment);
        
        const analysis = await nlpService.analyzeText(text);
        get().updateCallData(analysis);
      }
    );

    await speechToText.startRecording();

    set({
      isCallActive: true,
      speechToText,
      nlpService,
      currentCall: {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        transcript: '',
        intent: '',
        sentiment: { score: 0, label: 'neutral', confidence: 0, urgency: 'low' },
        entities: [],
        actionItems: [],
        topics: []
      }
    });
  },

  endCall: () => {
    const { speechToText } = get();
    if (speechToText) {
      speechToText.stopRecording();
      speechToText.disconnect();
    }
    set({ isCallActive: false, speechToText: null });
  },

  addTranscriptSegment: (segment) => {
    set((state) => ({
      transcript: [...state.transcript, segment]
    }));
  },

  updateCallData: (data) => {
    set((state) => ({
      currentCall: state.currentCall ? { ...state.currentCall, ...data } : null
    }));
  }
}));