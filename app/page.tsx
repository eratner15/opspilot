import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            OpsPilot AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-Powered Emergency Maintenance System
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            MVP System Active
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">The Problem We Solve</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-2">❌ Current Reality</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Toilet breaks at 2am - no one answers</li>
                <li>• Tenants stranded with emergencies</li>
                <li>• Property managers miss 70% of after-hours calls</li>
                <li>• Manual dispatch takes 45+ minutes</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-2">✅ OpsPilot Solution</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• AI answers instantly 24/7</li>
                <li>• Claude classifies emergencies in seconds</li>
                <li>• Auto-dispatch to best technician</li>
                <li>• SMS updates to all parties</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Voice Agent</h3>
            <p className="text-gray-600">Claude-powered conversations that understand context and emotion</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Classification</h3>
            <p className="text-gray-600">95%+ accuracy in categorizing urgency and required skills</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Dispatch</h3>
            <p className="text-gray-600">Best technician matched and notified in under 90 seconds</p>
          </div>
        </div>

        {/* Demo Access */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Try the MVP Demo</h2>
          <p className="text-lg mb-8">Experience how AI transforms emergency maintenance response</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/simulator"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              🎮 Call Simulator
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition"
            >
              📊 Live Dashboard
            </Link>
            <Link
              href="/voice-test"
              className="px-8 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-400 transition"
            >
              🎤 Voice Test
            </Link>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Powered By</h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <span className="px-3 py-1 bg-white rounded-full shadow">Claude AI</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">Next.js 14</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">TypeScript</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">Twilio Voice</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">PostgreSQL</span>
          </div>
        </div>

        {/* Success Metrics */}
        <div className="mt-16 bg-gray-900 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">Expected Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-400">100%</p>
              <p className="text-sm">Call Answer Rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-400">&lt; 90s</p>
              <p className="text-sm">Emergency Response</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-yellow-400">$8</p>
              <p className="text-sm">Cost per Incident</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">95%+</p>
              <p className="text-sm">AI Accuracy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}