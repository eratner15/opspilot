'use client';

import { useState } from 'react';

const scenarios = [
  {
    name: 'Flooding Emergency',
    phoneNumber: '+1234567890',
    transcript: 'Help! My apartment is flooding! Water is everywhere and it\'s coming from the ceiling!',
    category: 'plumbing',
    urgency: 'EMERGENCY'
  },
  {
    name: 'No Heat in Winter',
    phoneNumber: '+1234567891',
    transcript: 'Our heat stopped working and it\'s freezing outside. We have small children.',
    category: 'hvac',
    urgency: 'HIGH'
  },
  {
    name: 'Electrical Sparks',
    phoneNumber: '+1234567892',
    transcript: 'I see sparks coming from the outlet in my kitchen! I\'m scared to touch anything.',
    category: 'electrical',
    urgency: 'EMERGENCY'
  },
  {
    name: 'Toilet Not Working',
    phoneNumber: '+1234567893',
    transcript: 'My toilet won\'t flush and it\'s our only bathroom.',
    category: 'plumbing',
    urgency: 'HIGH'
  },
  {
    name: 'Broken Window Lock',
    phoneNumber: '+1234567894',
    transcript: 'The lock on my bedroom window is broken and won\'t close properly.',
    category: 'security',
    urgency: 'MEDIUM'
  }
];

export default function Simulator() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [customTranscript, setCustomTranscript] = useState('');

  const simulateCall = async (scenario: any) => {
    setLoading(true);
    
    try {
      // Simulate initial call
      const callResponse = await fetch('/api/voice/answer', {
        method: 'POST',
        body: new FormData()
      });
      
      // Simulate speech input
      const formData = new FormData();
      formData.append('From', scenario.phoneNumber);
      formData.append('CallSid', `sim-${Date.now()}`);
      formData.append('SpeechResult', scenario.transcript);
      
      const processResponse = await fetch('/api/voice/answer', {
        method: 'POST',
        body: formData
      });
      
      const result = await processResponse.text();
      
      setResults(prev => [{
        scenario: scenario.name,
        phoneNumber: scenario.phoneNumber,
        transcript: scenario.transcript,
        response: result,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev]);
      
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const simulateCustomCall = async () => {
    if (!customTranscript.trim()) return;
    
    await simulateCall({
      name: 'Custom Scenario',
      phoneNumber: '+1999999999',
      transcript: customTranscript,
      category: 'general',
      urgency: 'MEDIUM'
    });
    
    setCustomTranscript('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">OpsPilot Call Simulator</h1>
        
        {/* Scenario Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((scenario, index) => (
              <button
                key={index}
                onClick={() => simulateCall(scenario)}
                disabled={loading}
                className="p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-left"
              >
                <h3 className="font-medium">{scenario.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{scenario.transcript}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    scenario.urgency === 'EMERGENCY' ? 'bg-red-500 text-white' :
                    scenario.urgency === 'HIGH' ? 'bg-orange-500 text-white' :
                    'bg-yellow-500 text-black'
                  }`}>
                    {scenario.urgency}
                  </span>
                  <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                    {scenario.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Scenario */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Custom Scenario</h2>
          <div className="space-y-4">
            <textarea
              value={customTranscript}
              onChange={(e) => setCustomTranscript(e.target.value)}
              placeholder="Enter your maintenance issue description..."
              className="w-full p-3 border rounded-lg h-24 resize-none"
            />
            <button
              onClick={simulateCustomCall}
              disabled={loading || !customTranscript.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Simulate Call'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Call History</h2>
          {results.length === 0 ? (
            <p className="text-gray-500">No calls simulated yet. Try a scenario above!</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{result.scenario}</h4>
                    <span className="text-xs text-gray-500">{result.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Caller:</strong> {result.phoneNumber}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Said:</strong> "{result.transcript}"
                  </p>
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                    <strong>System Response:</strong>
                    <pre className="whitespace-pre-wrap">{result.response.substring(0, 200)}...</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
          <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
            <li>Click any scenario button to simulate an incoming call</li>
            <li>The AI will process the call and classify the issue</li>
            <li>Check the Dashboard to see tickets and dispatch status</li>
            <li>Try custom scenarios to test edge cases</li>
          </ol>
        </div>
      </div>
    </div>
  );
}