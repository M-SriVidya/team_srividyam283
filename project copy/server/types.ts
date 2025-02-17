// server/types.ts
export interface AudioData {
    audio: Blob;
    sessionId: string;
  }
  
  export interface TranscriptionResult {
    text: string;
    sessionId: string;
  }
  
  export interface AnalyticsUpdate {
    intent?: string;
    sentiment?: {
      score: number;
      label: 'positive' | 'negative' | 'neutral';
    };
    topics?: string[];
    entities?: Array<{
      type: string;
      value: string;
      confidence: number;
    }>;
    actionItems?: string[];
  }