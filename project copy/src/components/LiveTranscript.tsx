//src/components/LiveTranscript.tsx
import React from 'react';
import { ScrollText } from 'lucide-react';
import type { TranscriptSegment } from '../types';

interface Props {
  segments: TranscriptSegment[];
}

export function LiveTranscript({ segments }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center gap-2 mb-4">
        <ScrollText className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold">Live Transcript</h2>
      </div>
      <div className="h-[400px] overflow-y-auto space-y-4">
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`flex gap-2 ${
              segment.speaker === 'agent' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                segment.speaker === 'agent'
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {segment.speaker === 'agent' ? 'Agent' : 'Customer'}
              </div>
              <p>{segment.text}</p>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(segment.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}