//src/types/index.ts
export interface CallData {
  id: string;
  timestamp: Date;
  transcript: string;
  intent: string;
  sentiment: SentimentAnalysis;
  entities: {
    type: string;
    value: string;
    confidence: number;
  }[];
  actionItems: string[];
  topics: string[];
}

export interface SentimentAnalysis {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  urgency: 'low' | 'medium' | 'high';
}

// Rest of the types remain the same
export interface TranscriptSegment {
  text: string;
  speaker: 'agent' | 'customer';
  timestamp: Date;
}

export interface AnalyticsData {
  sentimentTrend: Array<{ time: Date; score: number }>;
  topIntents: Array<{ intent: string; count: number }>;
  commonTopics: Array<{ topic: string; frequency: number }>;
}

export interface Suggestion {
  text: string;
  type: 'response' | 'action' | 'escalation';
  priority: 'high' | 'medium' | 'low';
}