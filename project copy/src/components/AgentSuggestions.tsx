//src/components/AgentSuggestions.tsx
import React, { useEffect, useState } from 'react';
import { MessageSquare, AlertTriangle, ThumbsUp, Loader } from 'lucide-react';
import type { CallData, Suggestion } from '../types';
import { NLPService } from '../services/nlpService';

interface Props {
  callData: CallData;
  latestTranscript: string;
}

interface Suggestion {
  text: string;
  type: 'response' | 'action' | 'escalation';
  priority: 'high' | 'medium' | 'low';
}

export function AgentSuggestions({ callData, latestTranscript }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nlpService = new NLPService();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const fetchSuggestions = async () => {
      if (!latestTranscript.trim()) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const newSuggestions = await nlpService.generateSuggestions(
          latestTranscript,
          callData.sentiment
        );
        setSuggestions(newSuggestions);
      } catch (err) {
        setError('Failed to generate suggestions. Please try again.');
        console.error('Error fetching suggestions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the API calls to avoid too many requests
    clearTimeout(timeoutId);
    timeoutId = setTimeout(fetchSuggestions, 500);

    return () => clearTimeout(timeoutId);
  }, [latestTranscript, callData.sentiment]);

//   const generateSuggestions = (text: string) => {
//     const newSuggestions: Suggestion[] = [];
//     const lowerText = text.toLowerCase();

//     // Common patterns to match in customer speech
//     const patterns = {
//       greeting: /\b(hi|hello|hey|good\s*morning|good\s*afternoon|good\s*evening)\b/i,
//       problem: /\b(issue|problem|broken|doesn't work|not working|error|fail|failed|wrong)\b/i,
//       billing: /\b(bill|payment|charge|refund|cost|price|expensive)\b/i,
//       account: /\b(account|login|password|username|sign in|access)\b/i,
//       urgency: /\b(urgent|asap|emergency|immediately|right now)\b/i,
//       complaint: /\b(unhappy|disappointed|frustrated|angry|upset|ridiculous)\b/i,
//       gratitude: /\b(thank|thanks|appreciate|grateful)\b/i,
//       question: /\b(how|what|when|where|why|can you|could you)\b/i
//     };

//     // Add greeting response if it's the start of conversation
//     if (patterns.greeting.test(lowerText)) {
//       newSuggestions.push({
//         text: "Hello! Thank you for reaching out. How may I assist you today?",
//         type: 'response',
//         priority: 'medium'
//       });
//     }

//     // Handle problems/issues
//     if (patterns.problem.test(lowerText)) {
//       newSuggestions.push({
//         text: "I understand you're experiencing an issue. Could you please provide more specific details about what's happening?",
//         type: 'response',
//         priority: 'high'
//       });
//     }

//     // Handle billing queries
//     if (patterns.billing.test(lowerText)) {
//       newSuggestions.push({
//         text: "I'll help you with your billing concern. Could you please verify your account number for me?",
//         type: 'action',
//         priority: 'high'
//       });
//       newSuggestions.push({
//         text: "Let me check your recent billing history to better assist you.",
//         type: 'response',
//         priority: 'medium'
//       });
//     }

//     // Handle account-related issues
//     if (patterns.account.test(lowerText)) {
//       newSuggestions.push({
//         text: "For account security, I'll need to verify some information. Could you please confirm your registered email address?",
//         type: 'action',
//         priority: 'high'
//       });
//     }

//     // Handle urgent requests
//     if (patterns.urgency.test(lowerText)) {
//       newSuggestions.push({
//         text: "I understand this is urgent. I'll prioritize your request and handle it immediately.",
//         type: 'response',
//         priority: 'high'
//       });
//       newSuggestions.push({
//         text: "Would you like me to escalate this to our urgent response team?",
//         type: 'escalation',
//         priority: 'high'
//       });
//     }

//     // Handle complaints
//     if (patterns.complaint.test(lowerText)) {
//       newSuggestions.push({
//         text: "I sincerely apologize for any frustration this has caused. Let me resolve this for you right away.",
//         type: 'response',
//         priority: 'high'
//       });
//     }

//     // React to negative sentiment
//     if (callData.sentiment.label === 'negative') {
//       newSuggestions.push({
//         text: "I understand your concern and I'm here to help. Let's work together to find a solution.",
//         type: 'response',
//         priority: 'high'
//       });
//     }

//     // Handle gratitude
//     if (patterns.gratitude.test(lowerText)) {
//       newSuggestions.push({
//         text: "You're welcome! Is there anything else I can help you with today?",
//         type: 'response',
//         priority: 'low'
//       });
//     }

//     // Handle questions
//     if (patterns.question.test(lowerText)) {
//       newSuggestions.push({
//         text: "I'll be happy to help you with that. Let me gather the relevant information.",
//         type: 'response',
//         priority: 'medium'
//       });
//     }

//     // Add default response if no patterns match
//     if (newSuggestions.length === 0 && text.length > 0) {
//       newSuggestions.push({
//         text: "Could you please provide more details about your request so I can better assist you?",
//         type: 'response',
//         priority: 'medium'
//       });
//     }

//     setSuggestions(newSuggestions);
//   };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'response':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'action':
        return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case 'escalation':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-semibold mb-4">Suggested Responses</h3>
      
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-600">Generating suggestions...</span>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {!isLoading && suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`p-3 border-l-4 rounded cursor-pointer hover:bg-gray-50 transition-colors ${getPriorityColor(suggestion.priority)}`}
            onClick={() => {
              navigator.clipboard.writeText(suggestion.text);
            }}
          >
            <div className="flex items-start gap-2">
              {getTypeIcon(suggestion.type)}
              <div>
                <div className="text-sm font-medium">{suggestion.text}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)} • 
                  {suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1)} Priority
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {!isLoading && suggestions.length === 0 && !error && (
          <div className="text-gray-500 text-sm">
            No suggestions available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}