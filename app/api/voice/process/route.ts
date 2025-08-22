// Process speech input from ongoing calls
import { NextRequest, NextResponse } from 'next/server';
import { MockVoiceResponse } from '@/lib/integrations/mock-twilio';
import { ClaudeConversationAgent } from '@/lib/ai/claude-agent';
import { mockPrisma } from '@/lib/db/mock-db';
import { dispatchTechnician } from '@/lib/ai/dispatcher';

export async function POST(req: NextRequest) {
  try {
    const callSid = req.nextUrl.searchParams.get('callSid')!;
    const formData = await req.formData();
    const speechResult = formData.get('SpeechResult') as string;
    
    if (!speechResult) {
      // No speech detected
      const twiml = new MockVoiceResponse();
      twiml.say('I didn\'t hear anything. Please describe your maintenance issue.');
      twiml.redirect(`/api/voice/answer?callSid=${callSid}`);
      
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      });
    }
    
    // Get call details
    const call = await mockPrisma.call.findUnique({ where: { id: callSid } });
    if (!call) {
      throw new Error('Call not found');
    }
    
    // Process with Claude
    const agent = new ClaudeConversationAgent();
    const result = await agent.handleTenantCall(speechResult, {
      phoneNumber: call.phoneNumber,
      callSid,
      previousTranscript: call.transcript
    });
    
    // Update call record
    await mockPrisma.call.update({
      where: { id: callSid },
      data: {
        transcript: call.transcript ? `${call.transcript}\nTenant: ${speechResult}` : speechResult,
        classification: result.classification as any,
        urgency: result.classification.urgency
      }
    });
    
    const twiml = new MockVoiceResponse();
    
    // AI response
    twiml.say(result.response, { voice: 'Polly.Joanna', language: 'en-US' });
    
    // Handle next action
    if (result.nextAction === 'dispatch') {
      // Create ticket
      const ticket = await mockPrisma.ticket.create({
        data: {
          callId: callSid,
          title: `${result.classification.urgency}: ${result.classification.description}`,
          description: result.classification.description,
          category: result.classification.category,
          urgency: result.classification.urgency,
          propertyId: 'PROP-001',
          unitNumber: '101',
          tenantPhone: call.phoneNumber
        }
      });
      
      // Dispatch technician
      const dispatchResult = await dispatchTechnician(ticket.id);
      
      if (dispatchResult.success) {
        twiml.say(
          `Great news! ${dispatchResult.technician.name} has been dispatched and will arrive by ${dispatchResult.eta?.toLocaleTimeString()}. You'll receive a text message shortly with their contact information.`,
          { voice: 'Polly.Joanna', language: 'en-US' }
        );
      } else {
        twiml.say(
          'I\'ve created your maintenance request. A technician will be assigned shortly and you\'ll receive a text message with updates.',
          { voice: 'Polly.Joanna', language: 'en-US' }
        );
      }
      
      twiml.say('Is there anything else I can help you with today?');
      twiml.pause({ length: 2 });
      twiml.say('Thank you for calling. Goodbye!');
      twiml.hangup();
      
    } else if (result.nextAction === 'continue' && result.followUpQuestions && result.followUpQuestions.length > 0) {
      // Continue conversation
      const gather = twiml.gather({
        input: ['speech'],
        timeout: 10,
        action: `/api/voice/process?callSid=${callSid}`,
        speechModel: 'phone_call'
      });
      
    } else if (result.nextAction === 'escalate') {
      // Transfer to human
      twiml.say('Let me transfer you to a property manager who can better assist you.');
      twiml.dial('+1800MANAGER');
    }
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
    
  } catch (error) {
    console.error('Process error:', error);
    
    const errorTwiml = new MockVoiceResponse();
    errorTwiml.say('I\'m having trouble understanding. Let me transfer you to someone who can help.');
    errorTwiml.dial('+1800BACKUP');
    
    return new NextResponse(errorTwiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}