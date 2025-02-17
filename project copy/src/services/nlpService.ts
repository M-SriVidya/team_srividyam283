//src/services/nlpService.ts
import { Pinecone } from '@pinecone-database/pinecone';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { CallData } from '../types';

// Fix for Pinecone in browser environment
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).process = {
    env: { DEBUG: undefined },
    version: ''
  };
}

// Sentiment analysis patterns
const SENTIMENT_PATTERNS = {
  positive: {
    high: ['excellent', 'amazing', 'outstanding', 'perfect', 'delighted'],
    medium: ['happy', 'good', 'satisfied', 'pleased', 'thank you'],
    low: ['okay', 'fine', 'alright', 'not bad']
  },
  negative: {
    high: ['terrible', 'awful', 'furious', 'outraged', 'unacceptable'],
    medium: ['unhappy', 'frustrated', 'disappointed', 'annoyed'],
    low: ['concerned', 'uncertain', 'confused', 'unsure']
  },
  modifiers: {
    intensifiers: ['very', 'extremely', 'really', 'absolutely', 'completely'],
    diminishers: ['somewhat', 'kind of', 'slightly', 'a bit', 'rather']
  }
};

export class NLPService {
  private pinecone: Pinecone;
  private supabase;
  private genAI: GoogleGenerativeAI;
  private model;

  constructor() {
    // Initialize Pinecone with correct configuration
    this.pinecone = new Pinecone({
      apiKey: import.meta.env.VITE_PINECONE_API_KEY
  });

    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async initialize() {
    return Promise.resolve();
  }

  async generateSuggestions(transcript: string, sentiment: SentimentAnalysis): Promise<Suggestion[]> {
    try {
      // Simplified prompt that explicitly requests plain text only
      const prompt = `
        You are a call center AI assistant. Based on this customer conversation, provide 3-4 natural, professional response suggestions.
        DO NOT include any formatting, numbers, or JSON. Just provide plain text responses, one per line.
        
        Consider the following:
        - Customer sentiment: ${sentiment.label}
        - Urgency level: ${sentiment.urgency}
        
        Conversation transcript: "${transcript}"
        
        Provide only the response texts, nothing else.
      `;
  
      const result = await this.model.generateContent(prompt);
      const response = await result.response.text();
      
      // Clean up the responses
      const suggestions = response
        .split('\n')
        .map(line => line.trim())
        .filter(line => 
          line.length > 0 && 
          !line.startsWith('```') && 
          !line.includes('type:') &&
          !line.includes('Suggestion') &&
          !line.startsWith('{') &&
          !line.startsWith('}') &&
          !line.startsWith('*') &&
          !line.startsWith('-')
        )
        .map(text => ({
          text: text.replace(/["{}]/g, '').trim(),
          type: this.inferSuggestionType(text),
          priority: this.inferPriority(sentiment)
        }))
        .slice(0, 4);
  
      return suggestions.length > 0 ? suggestions : this.getFallbackSuggestions(sentiment);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return this.getFallbackSuggestions(sentiment);
    }
  }

  private inferSuggestionType(suggestion: string): 'response' | 'action' | 'escalation' {
    const lowerSuggestion = suggestion.toLowerCase();
    if (lowerSuggestion.includes('escalate') || lowerSuggestion.includes('supervisor')) {
      return 'escalation';
    }
    if (lowerSuggestion.includes('let me') || lowerSuggestion.includes('i will') || 
        lowerSuggestion.includes('please provide')) {
      return 'action';
    }
    return 'response';
  }

  private inferPriority(text: string, sentiment: SentimentAnalysis): 'high' | 'medium' | 'low' {
    if (sentiment.urgency === 'high') return 'high';
    if (sentiment.label === 'negative') return 'medium';
    return 'low';
  }

  private getFallbackSuggestions(sentiment: SentimentAnalysis): Suggestion[] {
    const urgency = sentiment.urgency;
    return [
      {
        text: "I understand your concern. Could you please provide more details about your situation?",
        type: 'response',
        priority: urgency
      },
      {
        text: "Let me look into this for you right away.",
        type: 'action',
        priority: urgency
      },
      {
        text: sentiment.label === 'negative' ? 
          "I apologize for any inconvenience. I'll make sure this gets resolved for you." :
          "I'll be happy to help you with that.",
        type: 'response',
        priority: urgency
      }
    ];
  }
  private analyzeSentiment(text: string): SentimentAnalysis {
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    let intensity = 1;
    let emotionalPoints = 0;
    
    // Analyze each word in the text
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Check for modifiers before the current word
      if (i > 0) {
        if (SENTIMENT_PATTERNS.modifiers.intensifiers.includes(words[i - 1])) {
          intensity = 1.5;
        } else if (SENTIMENT_PATTERNS.modifiers.diminishers.includes(words[i - 1])) {
          intensity = 0.5;
        }
      }

      // Score the word based on its sentiment category
      for (const [strength, terms] of Object.entries(SENTIMENT_PATTERNS.positive)) {
        if (terms.includes(word)) {
          const baseScore = strength === 'high' ? 0.3 : strength === 'medium' ? 0.2 : 0.1;
          score += baseScore * intensity;
          emotionalPoints++;
        }
      }

      for (const [strength, terms] of Object.entries(SENTIMENT_PATTERNS.negative)) {
        if (terms.includes(word)) {
          const baseScore = strength === 'high' ? -0.3 : strength === 'medium' ? -0.2 : -0.1;
          score += baseScore * intensity;
          emotionalPoints++;
        }
      }

      // Reset intensity for next word
      intensity = 1;
    }

    // Normalize score based on emotional content
    const normalizedScore = emotionalPoints > 0 
      ? score / Math.sqrt(emotionalPoints)
      : 0;
    
    // Clamp score between -1 and 1
    const finalScore = Math.max(-1, Math.min(1, normalizedScore));

    // Determine confidence based on emotional points
    const confidence = Math.min(1, emotionalPoints / 5);

    // Determine urgency based on negative sentiment and specific urgent terms
    const urgentTerms = ['immediately', 'urgent', 'asap', 'emergency', 'critical'];
    const hasUrgentTerms = urgentTerms.some(term => text.toLowerCase().includes(term));
    const urgency = hasUrgentTerms || (finalScore < -0.5 && confidence > 0.6) ? 'high' : 
                   finalScore < -0.3 && confidence > 0.4 ? 'medium' : 'low';

    return {
      score: finalScore,
      label: finalScore > 0.1 ? 'positive' : 
             finalScore < -0.1 ? 'negative' : 'neutral',
      confidence,
      urgency
    };
  }

  async analyzeText(text: string): Promise<Partial<CallData>> {
    try {
      // First attempt Gemini analysis
      const prompt = `Analyze this customer service conversation text and provide:
        - Sentiment (include emotional intensity and specific emotional indicators)
        - Customer urgency level
        - Intent classification
        - Key topics
        - Action items
        Text: "${text}"`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response.text();
      
      // Combine Gemini analysis with our local sentiment analysis
      const localSentiment = this.analyzeSentiment(text);
      
      return {
        ...this.performLocalAnalysis(text),
        sentiment: localSentiment
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.performLocalAnalysis(text);
    }
  }

  private performLocalAnalysis(text: string): Partial<CallData> {
    const lowerText = text.toLowerCase();
    
    // Enhanced sentiment analysis with more sophisticated patterns
    const positivePatterns = [
      'thank', 'good', 'great', 'excellent', 'happy',
      'appreciate', 'helpful', 'satisfied', 'perfect', 'awesome'
    ];
    const negativePatterns = [
      'bad', 'issue', 'problem', 'unhappy', 'wrong',
      'frustrated', 'disappointing', 'poor', 'terrible', 'awful'
    ];
    
    const sentimentScore = positivePatterns.reduce((score, word) => 
      lowerText.includes(word) ? score + 0.2 : score, 0) +
      negativePatterns.reduce((score, word) => 
      lowerText.includes(word) ? score - 0.2 : score, 0);

    const sentiment = {
      score: Math.max(-1, Math.min(1, sentimentScore)),
      label: sentimentScore > 0.1 ? 'positive' : 
             sentimentScore < -0.1 ? 'negative' : 'neutral'
    } as const;

    // Enhanced intent recognition
    let intent = 'general_inquiry';
    const intentPatterns = {
      'support_request': ['help', 'support', 'assist', 'issue', 'problem'],
      'purchase_intent': ['buy', 'purchase', 'order', 'interested in', 'price'],
      'complaint': ['complaint', 'unhappy', 'dissatisfied', 'refund', 'wrong'],
      'information_request': ['how to', 'what is', 'tell me about', 'explain']
    };

    for (const [intentType, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        intent = intentType;
        break;
      }
    }

    // Extract potential action items
    const actionItems = this.extractActionItems(text);

    // Identify topics
    const topics = this.identifyTopics(text);

    return {
      intent,
      sentiment,
      entities: [],
      topics,
      actionItems
    };
  }

  private extractActionItems(text: string): string[] {
    const actionItems: string[] = [];
    const sentences = text.split(/[.!?]+/).map(s => s.trim());
    
    const actionPhrases = [
      'need to', 'should', 'will', 'must', 'have to',
      'going to', 'plan to', 'follow up', 'schedule', 'call back'
    ];

    for (const sentence of sentences) {
      if (actionPhrases.some(phrase => sentence.toLowerCase().includes(phrase))) {
        actionItems.push(sentence);
      }
    }

    return actionItems;
  }

  private identifyTopics(text: string): string[] {
    const topics = new Set<string>();
    const lowerText = text.toLowerCase();

    const topicPatterns = {
      'billing': ['payment', 'bill', 'charge', 'cost', 'price'],
      'technical_support': ['error', 'bug', 'issue', 'broken', 'not working'],
      'account_management': ['account', 'login', 'password', 'access', 'profile'],
      'product_inquiry': ['product', 'service', 'feature', 'work', 'function'],
      'feedback': ['suggest', 'feedback', 'improve', 'better', 'enhancement']
    };

    for (const [topic, patterns] of Object.entries(topicPatterns)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        topics.add(topic);
      }
    }

    return Array.from(topics);
  }

  async getRelevantKnowledge(query: string) {
    try {
      const index = this.pinecone.Index('knowledge-base');
      
      // For now, return empty results until we set up embeddings
      return [];
    } catch (error) {
      console.error('Error retrieving knowledge:', error);
      return [];
    }
  }
}