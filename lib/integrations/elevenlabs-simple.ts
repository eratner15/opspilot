// Simplified ElevenLabs integration using fetch API
// This avoids SDK compatibility issues and works reliably

export class ElevenLabsService {
  private apiKey: string;
  private voiceId: string;
  
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY!;
    this.voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Bella voice
  }

  async generateSpeech(text: string, urgency: 'normal' | 'emergency' = 'normal'): Promise<Buffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      // Adjust voice settings based on urgency
      const voiceSettings = urgency === 'emergency' 
        ? {
            stability: 0.85,     // More stable for clarity
            similarity_boost: 0.8,
            style: 0.3,          // Slightly more expressive
            use_speaker_boost: true
          }
        : {
            stability: 0.75,
            similarity_boost: 0.75,
            style: 0.2,
            use_speaker_boost: true
          };

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: this.addEmergencyTone(text, urgency),
          model_id: 'eleven_multilingual_v2',
          voice_settings: voiceSettings
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      return audioBuffer;

    } catch (error) {
      console.error('ElevenLabs API error:', error);
      throw new Error('Voice synthesis failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async generateEmergencyResponse(text: string): Promise<Buffer> {
    return this.generateSpeech(text, 'emergency');
  }

  private addEmergencyTone(text: string, urgency: 'normal' | 'emergency'): string {
    if (urgency === 'emergency') {
      // Add emphasis for emergency situations
      return text
        .replace(/emergency/gi, 'EMERGENCY')
        .replace(/immediately/gi, 'IMMEDIATELY')
        .replace(/urgent/gi, 'URGENT');
    }
    return text;
  }

  async listAvailableVoices() {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices.map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description
      }));
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      return [];
    }
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      await this.listAvailableVoices();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Convert text to speech for Twilio (returns base64)
  async generateForTwilio(text: string, urgency: 'normal' | 'emergency' = 'normal'): Promise<string> {
    try {
      const audioBuffer = await this.generateSpeech(text, urgency);
      const base64Audio = audioBuffer.toString('base64');
      return `data:audio/mp3;base64,${base64Audio}`;
    } catch (error) {
      console.error('Twilio audio generation failed:', error);
      // Fallback to text (Twilio will use built-in TTS)
      return text;
    }
  }
}