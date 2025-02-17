//src/components/RealTimeAnalytics.tsx
import React from 'react';
import { BarChart3, Brain, AlertCircle, AlertTriangle } from 'lucide-react';
import type { CallData } from '../types';

interface Props {
  callData: CallData;
}

export function RealTimeAnalytics({ callData }: Props) {
  const sentimentColor = 
    callData.sentiment.label === 'positive' ? 'text-green-500' :
    callData.sentiment.label === 'negative' ? 'text-red-500' : 'text-yellow-500';
  const urgencyColor =
    callData.sentiment.urgency === 'high' ? 'text-red-500' :
    callData.sentiment.urgency === 'medium' ? 'text-yellow-500' : 'text-green-500';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold">Intent Recognition</h3>
        </div>
        <div className="text-lg font-medium">{callData.intent}</div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold">Sentiment Analysis</h3>
        </div>
        <div className={`text-lg font-medium ${sentimentColor}`}>
          {callData.sentiment.label.charAt(0).toUpperCase() + 
           callData.sentiment.label.slice(1)}
        </div>
        <div className="text-sm text-gray-500">
          Score: {callData.sentiment.score.toFixed(2)}
          <br />
          Confidence: {(callData.sentiment.confidence * 100).toFixed(0)}%
        </div>
      </div>

      {callData.sentiment.urgency && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold">Urgency Level</h3>
          </div>
          <div className={`text-lg font-medium ${urgencyColor}`}>
            {callData.sentiment.urgency.charAt(0).toUpperCase() + 
             callData.sentiment.urgency.slice(1)}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Key Topics</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {callData.topics.map((topic, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}