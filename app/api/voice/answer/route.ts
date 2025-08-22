// Voice call answer endpoint - handles incoming calls
import { NextRequest, NextResponse } from 'next/server';
import { MockVoiceResponse } from '@/lib/integrations/mock-twilio';
import { ClaudeConversationAgent } from '@/lib/ai/claude-agent';
import { mockPrisma } from '@/lib/db/mock-db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get('From') as string || '+1234567890';
    const callSid = formData.get('CallSid') as string || `mock-${Date.now()}`;
    const speechResult = formData.get('SpeechResult') as string;
    
    console.log('📞 Incoming call:', { from, callSid, speechResult });
    
    const twiml = new MockVoiceResponse();
    
    // Create or update call record
    let call = await mockPrisma.call.findUnique({ where: { id: callSid } });
    
    if (!call) {
      // New call - create record and greet
      call = await mockPrisma.call.create({
        data: {
          id: callSid,
          phoneNumber: from,
          duration: 0
        }
      });
      
      twiml.say(
        'Thank you for calling your property maintenance emergency line. I can help you right away. Please describe what\'s happening.',
        { voice: 'Polly.Joanna', language: 'en-US' }
      );
      
      // Set up speech gathering
      const gather = twiml.gather({
        input: ['speech'],
        timeout: 10,
        speechTimeout: 'auto',
        action: `/api/voice/process?callSid=${callSid}`,
        speechModel: 'phone_call'
      });
      
    } else if (speechResult) {
      // Process speech with Claude
      const agent = new ClaudeConversationAgent();
      
      const result = await agent.handleTenantCall(speechResult, {
        phoneNumber: from,
        callSid,
        timestamp: new Date()
      });
      
      // Update call with classification
      await mockPrisma.call.update({
        where: { id: callSid },
        data: {
          transcript: speechResult,
          classification: result.classification as any,
          urgency: result.classification.urgency
        }
      });
      
      // Respond to tenant
      twiml.say(result.response, { voice: 'Polly.Joanna', language: 'en-US' });
      
      // Handle next action
      if (result.nextAction === 'dispatch') {
        // Create ticket and dispatch
        await createTicketAndDispatch(callSid, result.classification, from);
        
        twiml.say(
          'I\'ve dispatched a technician who will arrive shortly. You\'ll receive a text message with their contact information. Thank you for calling.',
          { voice: 'Polly.Joanna', language: 'en-US' }
        );
        twiml.hangup();
        
      } else if (result.nextAction === 'continue' && result.followUpQuestions && result.followUpQuestions.length > 0) {
        // Ask follow-up question
        twiml.say(result.followUpQuestions[0], { voice: 'Polly.Joanna', language: 'en-US' });
        
        const gather = twiml.gather({
          input: ['speech'],
          timeout: 10,
          action: `/api/voice/followup?callSid=${callSid}`,
          speechModel: 'phone_call'
        });
      }
    }
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
    
  } catch (error) {
    console.error('Voice handler error:', error);
    
    // Error response
    const errorTwiml = new MockVoiceResponse();
    errorTwiml.say(
      'I apologize, but I\'m having trouble processing your request. Let me transfer you to our backup line.',
      { voice: 'Polly.Joanna', language: 'en-US' }
    );
    errorTwiml.dial('+1800BACKUP');
    
    return new NextResponse(errorTwiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}

async function createTicketAndDispatch(callId: string, classification: any, phoneNumber: string) {
  const { dispatchTechnician } = await import('@/lib/ai/dispatcher');
  
  // Create ticket
  const ticket = await mockPrisma.ticket.create({
    data: {
      callId,
      title: `${classification.urgency}: ${classification.description}`,
      description: classification.description,
      category: classification.category,
      urgency: classification.urgency,
      propertyId: 'PROP-001', // Would lookup from phone number in production
      unitNumber: '101',
      tenantPhone: phoneNumber
    }
  });
  
  // Dispatch technician
  await dispatchTechnician(ticket.id);
}