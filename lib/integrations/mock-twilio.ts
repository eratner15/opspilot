// Mock Twilio implementation for MVP testing
// Simulates voice calls and SMS without actual Twilio API

export interface MockCall {
  sid: string;
  from: string;
  to: string;
  status: 'ringing' | 'in-progress' | 'completed' | 'failed';
  duration?: number;
  transcript?: string;
}

export interface MockSMS {
  sid: string;
  to: string;
  from: string;
  body: string;
  status: 'sent' | 'delivered' | 'failed';
  sentAt: Date;
}

class MockTwilioClient {
  private calls: Map<string, MockCall> = new Map();
  private messages: MockSMS[] = [];
  
  // Simulate incoming call
  async simulateIncomingCall(phoneNumber: string): Promise<MockCall> {
    const callSid = `CA${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const call: MockCall = {
      sid: callSid,
      from: phoneNumber,
      to: '+1800PROPERTY',
      status: 'ringing'
    };
    
    this.calls.set(callSid, call);
    console.log(`📞 Incoming call from ${phoneNumber} (SID: ${callSid})`);
    
    return call;
  }
  
  // Simulate call answer
  async answerCall(callSid: string): Promise<void> {
    const call = this.calls.get(callSid);
    if (call) {
      call.status = 'in-progress';
      console.log(`✅ Call ${callSid} answered`);
    }
  }
  
  // Simulate speech input
  async simulateSpeechInput(callSid: string, speech: string): Promise<void> {
    const call = this.calls.get(callSid);
    if (call) {
      call.transcript = speech;
      console.log(`🎤 Caller said: "${speech}"`);
    }
  }
  
  // Send SMS (mock)
  async sendSMS(to: string, body: string, from: string = '+1800PROPERTY'): Promise<MockSMS> {
    const message: MockSMS = {
      sid: `SM${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      to,
      from,
      body,
      status: 'sent',
      sentAt: new Date()
    };
    
    this.messages.push(message);
    console.log(`📱 SMS sent to ${to}: "${body}"`);
    
    // Simulate delivery after 2 seconds
    setTimeout(() => {
      message.status = 'delivered';
      console.log(`✅ SMS delivered to ${to}`);
    }, 2000);
    
    return message;
  }
  
  // Get call details
  getCall(callSid: string): MockCall | undefined {
    return this.calls.get(callSid);
  }
  
  // Get all messages
  getMessages(): MockSMS[] {
    return this.messages;
  }
  
  // End call
  async endCall(callSid: string, duration: number): Promise<void> {
    const call = this.calls.get(callSid);
    if (call) {
      call.status = 'completed';
      call.duration = duration;
      console.log(`📞 Call ${callSid} ended (duration: ${duration}s)`);
    }
  }
}

// Mock TwiML Response builder
export class MockVoiceResponse {
  private actions: any[] = [];
  
  say(text: string, options?: any): this {
    this.actions.push({
      type: 'say',
      text,
      voice: options?.voice || 'Polly.Joanna',
      language: options?.language || 'en-US'
    });
    return this;
  }
  
  gather(options: any): MockGather {
    const gather = new MockGather(options);
    this.actions.push({
      type: 'gather',
      options,
      gather
    });
    return gather;
  }
  
  dial(number: string): this {
    this.actions.push({
      type: 'dial',
      number
    });
    return this;
  }
  
  hangup(): this {
    this.actions.push({
      type: 'hangup'
    });
    return this;
  }
  
  redirect(url: string): this {
    this.actions.push({
      type: 'redirect',
      url
    });
    return this;
  }
  
  pause(options: { length: number }): this {
    this.actions.push({
      type: 'pause',
      length: options.length
    });
    return this;
  }
  
  toString(): string {
    // Return mock XML response
    return `<Response>${JSON.stringify(this.actions)}</Response>`;
  }
  
  getActions(): any[] {
    return this.actions;
  }
}

class MockGather {
  constructor(private options: any) {}
  
  say(text: string): this {
    console.log(`🤖 Gathering input after saying: "${text}"`);
    return this;
  }
}

// Export singleton instance
export const mockTwilio = new MockTwilioClient();

// Helper to simulate SMS delivery
export async function sendSMS(to: string, message: string): Promise<void> {
  await mockTwilio.sendSMS(to, message);
}

// Helper to format phone numbers
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as US phone number
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  return phone; // Return as-is if not US format
}