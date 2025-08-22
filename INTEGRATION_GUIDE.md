# OpsPilot Integration Guide

## 🎉 ElevenLabs Integration Complete!

### Current Status:
- ✅ **ElevenLabs Voice Synthesis** - Ready to test with your API key
- ⏳ **Mock AI/Database** - Functional but simulated
- ⏳ **Twilio Voice/SMS** - Ready for integration
- ⏳ **Real Database** - Ready for setup

## 🚀 Quick Start with ElevenLabs

1. **Add your API key to `.env.local`:**
   ```bash
   cp .env.local.example .env.local
   ```
   
2. **Edit `.env.local`:**
   ```
   ELEVENLABS_API_KEY=your_api_key_here
   ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL  # Bella voice (optional)
   ```

3. **Test voice synthesis:**
   - Go to http://localhost:3001/voice-test
   - Try the sample emergency scenarios
   - Generate realistic AI voice responses

## 🔧 Next Priority Integrations

### 1. **Anthropic Claude API** (High Priority)
**Why:** Replace mock AI with real conversational intelligence

**Setup:**
```bash
# Add to .env.local
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Benefits:**
- Real natural language understanding
- Context-aware emergency detection
- Follow-up question generation
- Improved classification accuracy

**Integration points:**
- `lib/ai/claude-agent.ts` - Replace mock with real API calls
- `app/api/voice/answer/route.ts` - Use real Claude responses

---

### 2. **Twilio Voice & SMS** (High Priority)
**Why:** Handle real phone calls and text notifications

**Setup:**
```bash
# Add to .env.local
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

**Benefits:**
- Actual phone call handling
- Real SMS notifications to technicians
- Voice recording and transcription
- Phone number lookup for tenant data

**Integration points:**
- `lib/integrations/mock-twilio.ts` - Replace with real Twilio SDK
- Webhook endpoints for call handling
- SMS dispatch to technicians

---

### 3. **PostgreSQL Database** (Medium Priority)
**Why:** Persistent data storage and reporting

**Setup:**
```bash
# Set up database
npm run db:push
npm run db:generate

# Add to .env.local
DATABASE_URL=postgresql://user:pass@localhost:5432/opspilot
```

**Benefits:**
- Persistent call and ticket history
- Analytics and reporting
- Multi-tenant support
- Technician management

**Migration steps:**
- Replace `lib/db/mock-db.ts` with real Prisma client
- Update all database calls to use Prisma

---

### 4. **Real-time WebSockets** (Medium Priority)
**Why:** Live dashboard updates

**Implementation:**
- WebSocket server for live updates
- Real-time call status changes
- Live technician availability
- Dashboard notifications

---

### 5. **Call Recording & Storage** (Medium Priority)
**Why:** Quality assurance and training

**Features:**
- Store call recordings in cloud storage
- Transcript analysis
- AI performance monitoring
- Compliance recording

## 📋 Complete Integration Checklist

### **High Priority (Core Functionality)**
- [ ] **ElevenLabs Voice** ✅ DONE - Test at `/voice-test`
- [ ] **Anthropic Claude API** - Real AI conversations
- [ ] **Twilio Voice/SMS** - Actual phone system
- [ ] **PostgreSQL Database** - Persistent storage

### **Medium Priority (Enhanced Features)**
- [ ] **Real-time WebSockets** - Live dashboard
- [ ] **Call Recording** - Audio storage
- [ ] **Tenant Lookup** - Phone number to property mapping
- [ ] **OpenAI Whisper** - Speech transcription

### **Low Priority (Advanced Features)**
- [ ] **Admin Panel** - Technician management
- [ ] **Email Notifications** - Backup alerts
- [ ] **Analytics Dashboard** - Performance metrics
- [ ] **Multi-tenant Support** - Multiple property companies

## 🎯 Recommended Implementation Order

### **Week 1: Core AI & Voice**
1. Add your ElevenLabs API key (5 minutes)
2. Integrate Anthropic Claude API (2 hours)
3. Test end-to-end AI conversations (1 hour)

### **Week 2: Phone System**
1. Set up Twilio account and phone number (30 minutes)
2. Configure webhooks and voice calls (4 hours)
3. Test real phone call flow (2 hours)

### **Week 3: Database & Persistence**
1. Set up PostgreSQL database (1 hour)
2. Migrate from mock to real database (3 hours)
3. Add analytics and reporting (2 hours)

### **Week 4: Production Polish**
1. Add real-time features (3 hours)
2. Implement call recording (2 hours)
3. Deploy to production environment (2 hours)

## 💰 Cost Estimation with Real APIs

### **Monthly Operating Costs:**
- **ElevenLabs:** $5-15 (voice synthesis)
- **Anthropic Claude:** $20-50 (conversations)
- **Twilio:** $30-100 (calls + SMS)
- **Database:** $20 (managed PostgreSQL)
- **Storage:** $10 (call recordings)
- **Hosting:** $20 (Vercel Pro)

**Total: $105-215/month** for full production system

## 🧪 Testing Strategy

### **With ElevenLabs (Now Available):**
1. Test voice quality for different scenarios
2. Compare emergency vs normal tone
3. Verify audio format compatibility

### **After Claude Integration:**
1. Test conversation flow accuracy
2. Validate emergency detection
3. Check follow-up question logic

### **After Twilio Integration:**
1. End-to-end phone call testing
2. SMS delivery verification
3. Webhook reliability testing

## 🔧 Quick Start Commands

```bash
# Install new dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Test current features
npm run dev

# Access testing pages
# http://localhost:3001/voice-test    - ElevenLabs testing
# http://localhost:3001/simulator    - Call simulation
# http://localhost:3001/dashboard    - System monitoring
```

## 🚨 Production Readiness

The system becomes production-ready after integrating:
1. **Claude API** (real AI)
2. **Twilio** (real phone calls)
3. **PostgreSQL** (persistent data)

With these three integrations, you'll have a fully functional emergency maintenance system that can handle real tenant calls 24/7.