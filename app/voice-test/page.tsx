'use client';

import { useState } from 'react';

export default function VoiceTest() {
  const [text, setText] = useState('Thank you for calling your property maintenance emergency line. I can help you right away.');
  const [urgency, setUrgency] = useState<'normal' | 'emergency'>('normal');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<any[]>([]);

  const testSamples = [
    {
      name: 'Emergency Greeting',
      text: 'Thank you for calling your property maintenance emergency line. I can help you right away. Please describe what\'s happening.',
      urgency: 'normal' as const
    },
    {
      name: 'Flooding Emergency',
      text: 'I understand there\'s flooding at your property. This is an emergency situation. I\'m dispatching help immediately.',
      urgency: 'emergency' as const
    },
    {
      name: 'Technician Dispatched',
      text: 'Great news! John Smith has been dispatched and will arrive by 3:30 PM. You\'ll receive a text message with their contact information.',
      urgency: 'normal' as const
    },
    {
      name: 'Escalation',
      text: 'I\'m having trouble processing your request. Let me transfer you to our emergency backup line immediately.',
      urgency: 'emergency' as const
    }
  ];

  const synthesizeVoice = async () => {
    setLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, urgency }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Synthesis failed');
      }

      if (data.audio) {
        setAudioUrl(data.audio);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadVoices = async () => {
    try {
      const response = await fetch('/api/voice/synthesize');
      const data = await response.json();
      
      if (response.ok) {
        setVoices(data.voices || []);
      }
    } catch (err) {
      console.error('Failed to load voices:', err);
    }
  };

  const useSample = (sample: typeof testSamples[0]) => {
    setText(sample.text);
    setUrgency(sample.urgency);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">ElevenLabs Voice Testing</h1>
        
        {/* Configuration Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              <span>ElevenLabs API: {process.env.ELEVENLABS_API_KEY ? 'Configured' : 'Not configured'}</span>
            </div>
            <p className="text-sm text-gray-600">
              Add your ElevenLabs API key to .env.local to test voice synthesis
            </p>
          </div>
          
          <button
            onClick={loadVoices}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Load Available Voices
          </button>
          
          {voices.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Available Voices:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {voices.slice(0, 6).map((voice) => (
                  <div key={voice.id} className="p-2 border rounded">
                    <div className="font-medium">{voice.name}</div>
                    <div className="text-gray-500">{voice.category}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Samples */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Test Samples</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {testSamples.map((sample, index) => (
              <button
                key={index}
                onClick={() => useSample(sample)}
                className="p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium">{sample.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{sample.text.substring(0, 80)}...</p>
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    sample.urgency === 'emergency' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {sample.urgency}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Voice Synthesis Testing */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Voice Synthesis Test</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text to Synthesize
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-3 border rounded-lg h-24 resize-none"
                placeholder="Enter text to convert to speech..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as 'normal' | 'emergency')}
                className="border rounded-lg px-3 py-2"
              >
                <option value="normal">Normal</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <button
              onClick={synthesizeVoice}
              disabled={loading || !text.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Synthesizing...' : 'Generate Voice'}
            </button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
                {error.includes('not configured') && (
                  <p className="text-sm text-red-600 mt-2">
                    Add ELEVENLABS_API_KEY to your .env.local file to enable voice synthesis.
                  </p>
                )}
              </div>
            )}

            {audioUrl && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Voice Generated Successfully!</h3>
                <audio controls className="w-full" src={audioUrl}>
                  Your browser does not support the audio element.
                </audio>
                <p className="text-sm text-green-700 mt-2">
                  This is how the AI voice agent would sound to tenants calling for emergency maintenance.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Integration Notes */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Integration Notes:</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>ElevenLabs provides high-quality, natural voice synthesis</li>
            <li>Emergency mode uses more stable settings for clarity</li>
            <li>Voice can be customized by changing ELEVENLABS_VOICE_ID</li>
            <li>In production, audio would be streamed directly to phone calls</li>
          </ul>
        </div>
      </div>
    </div>
  );
}