//src/App.tsx
import React, { useEffect } from 'react';
import { Mic, Phone } from 'lucide-react';
import { LiveTranscript } from './components/LiveTranscript';
import { RealTimeAnalytics } from './components/RealTimeAnalytics';
import { ActionItems } from './components/ActionItems';
import { AgentSuggestions } from './components/AgentSuggestions';
import { useCallStore } from './store/callStore';

function App() {
  const { 
    isCallActive, 
    currentCall, 
    transcript, 
    startCall, 
    endCall 
  } = useCallStore();

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (isCallActive) {
        endCall();
      }
    };
  }, []);

  if (!currentCall) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <button
          onClick={startCall}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Start New Call
        </button>
      </div>
    );
  }

  const latestTranscript = transcript.length > 0 ? transcript[transcript.length - 1].text : '';

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">AI Call Assistant</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isCallActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm font-medium text-gray-600">
                  {isCallActive ? 'Call Active' : 'Call Ended'}
                </span>
              </div>
              {isCallActive && (
                <button
                  onClick={endCall}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  End Call
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <LiveTranscript segments={transcript} />
            <ActionItems items={currentCall.actionItems} />
          </div>
          
          {/* Right Column */}
          <div className="space-y-8">
            <RealTimeAnalytics callData={currentCall} />
            <AgentSuggestions 
              callData={currentCall}
              latestTranscript={latestTranscript}
            />
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Call Details</h2>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Call ID: {currentCall.id}
                </p>
                <p className="text-sm text-gray-600">
                  Started: {currentCall.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;