// Voice synthesis API endpoint using ElevenLabs
import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsService } from '@/lib/integrations/elevenlabs-simple';

export async function POST(req: NextRequest) {
  try {
    const { text, urgency = 'normal' } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Check if ElevenLabs API key is configured
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ 
        error: 'ElevenLabs API key not configured',
        fallback: text 
      }, { status: 503 });
    }

    const elevenlabs = new ElevenLabsService();
    const audioBuffer = await elevenlabs.generateSpeech(text, urgency);
    
    // Return audio as base64 for testing
    const base64Audio = audioBuffer.toString('base64');
    
    return NextResponse.json({
      success: true,
      audio: `data:audio/mp3;base64,${base64Audio}`,
      text,
      urgency,
      size: audioBuffer.length
    });

  } catch (error) {
    console.error('Voice synthesis error:', error);
    return NextResponse.json({ 
      error: 'Voice synthesis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Test endpoint to list available voices
export async function GET() {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ 
        error: 'ElevenLabs API key not configured' 
      }, { status: 503 });
    }

    const elevenlabs = new ElevenLabsService();
    const voices = await elevenlabs.listAvailableVoices();
    
    return NextResponse.json({
      voices,
      currentVoice: process.env.ELEVENLABS_VOICE_ID || 'default'
    });

  } catch (error) {
    console.error('Voice list error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch voices' 
    }, { status: 500 });
  }
}