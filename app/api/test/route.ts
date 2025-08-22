import { NextResponse } from 'next/server';
import { ClaudeConversationAgent } from '@/lib/ai/claude-agent';
import { mockPrisma, getMockData } from '@/lib/db/mock-db';

export async function GET() {
  try {
    // Test Claude agent
    const agent = new ClaudeConversationAgent();
    const result = await agent.handleTenantCall(
      "My apartment is flooding! Water is coming from the ceiling!", 
      { phoneNumber: '+1234567890', callSid: 'test-123' }
    );
    
    // Get current data
    const data = getMockData();
    
    return NextResponse.json({
      status: 'OK',
      message: 'OpsPilot MVP is running!',
      test: {
        claudeResponse: result.response,
        classification: result.classification,
        nextAction: result.nextAction
      },
      stats: {
        technicians: data.technicians.length,
        calls: data.calls.length,
        tickets: data.tickets.length
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}