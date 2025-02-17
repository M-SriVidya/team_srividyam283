//src/components/ActionItems.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface Props {
  items: string[];
}

export function ActionItems({ items }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-semibold">Action Items</h2>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <div className="min-w-4 h-4 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}