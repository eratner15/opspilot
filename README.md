# OpsPilot AI - Emergency Maintenance System MVP

AI-powered emergency repair intake system that answers calls 24/7, classifies problems, and automatically dispatches technicians.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   cd opspilot-intake
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open the app:**
   - Home: http://localhost:3000
   - Dashboard: http://localhost:3000/dashboard
   - Simulator: http://localhost:3000/simulator

## 🎮 Testing the MVP

This MVP runs entirely with mock data - no external APIs needed!

### Using the Simulator:
1. Go to http://localhost:3000/simulator
2. Click any pre-built scenario (Flooding, No Heat, etc.)
3. Watch the AI process the call and create tickets
4. Check the Dashboard to see dispatched technicians

### Test API Endpoint:
```bash
curl http://localhost:3000/api/test
```

## 🏗️ Architecture

### Core Components:
- **Claude AI Agent** (`lib/ai/claude-agent.ts`): Handles natural conversations
- **Smart Classifier** (`lib/ai/classifier.ts`): Categorizes issues and urgency
- **Dispatcher** (`lib/ai/dispatcher.ts`): Matches and notifies technicians
- **Mock Database** (`lib/db/mock-db.ts`): In-memory data for testing

### Key Features:
- ✅ Natural language processing for maintenance calls
- ✅ Emergency detection and prioritization
- ✅ Skill-based technician matching
- ✅ Real-time dashboard monitoring
- ✅ SMS notification simulation

## 📊 Mock Data

The system includes:
- 3 pre-configured technicians with different skills
- Automatic call classification
- Simulated SMS notifications
- Real-time updates every 2 seconds

## 🔧 Making it Production-Ready

To deploy this system:

1. **Set up external services:**
   - Anthropic API key for Claude
   - Twilio account for voice/SMS
   - PostgreSQL database
   - AppFolio API access

2. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Set up database:**
   ```bash
   npm run db:push
   npm run db:generate
   ```

4. **Deploy to Vercel:**
   ```bash
   vercel deploy
   ```

## 💰 Cost Breakdown

Monthly operating costs (estimated):
- Claude API: $30
- Twilio Voice: $40
- Whisper Transcription: $5
- Database: $20
- Hosting: $20
- **Total: ~$115/month**

## 🎯 Performance Targets

- **Call Answer Rate**: 100% (vs 30% human)
- **Classification Accuracy**: >95%
- **Emergency Response**: <90 seconds
- **Cost per Incident**: <$8 (vs $150 human)

## 🛠️ Development

### Project Structure:
```
opspilot-intake/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Monitoring dashboard
│   └── simulator/         # Call simulator
├── lib/                   # Core logic
│   ├── ai/               # AI agents
│   ├── db/               # Database/mock
│   └── integrations/     # External services
└── prisma/               # Database schema
```

### Key Commands:
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run linter
```

## 📈 Next Steps

1. **Integrate real APIs** (Twilio, Anthropic, etc.)
2. **Add multi-tenant support**
3. **Implement voice recording storage**
4. **Add predictive maintenance AI**
5. **Build technician mobile app**

## 🤝 Contributing

This is an MVP demonstration. For production deployment or contributions, please ensure you have proper API access and follow security best practices.

---

Built with ❤️ using Next.js, TypeScript, and Claude AI