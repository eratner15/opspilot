// Mock Claude AI conversation agent for MVP testing
// This simulates Claude API behavior without actual API calls

export interface Classification {
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'general' | 'security';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  confidence: number;
  keyWords: string[];
  estimatedCost: { min: number; max: number };
  requiredSkills: string[];
  timeEstimate: number;
  description: string;
  safetyRisk: boolean;
  propertyDamage: boolean;
  tenantVulnerability: 'none' | 'elderly' | 'disabled' | 'children';
  followUpRequired: boolean;
  preventiveMaintenance: string[];
}

export interface ConversationResult {
  response: string;
  classification: Classification;
  nextAction: 'continue' | 'dispatch' | 'escalate';
  confidence: number;
  followUpQuestions?: string[];
}

export class ClaudeConversationAgent {
  // Mock responses based on common scenarios
  private mockScenarios: Record<string, ConversationResult> = {
    'flooding': {
      response: "I understand there's flooding at your property. This is an emergency situation. I'm dispatching help immediately. Can you please turn off the water main if it's safe to do so? A technician will be there within 30 minutes.",
      classification: {
        category: 'plumbing',
        urgency: 'EMERGENCY',
        confidence: 0.98,
        keyWords: ['flood', 'water', 'emergency'],
        estimatedCost: { min: 200, max: 800 },
        requiredSkills: ['plumbing', 'water_damage'],
        timeEstimate: 3,
        description: 'Major flooding requiring immediate attention',
        safetyRisk: true,
        propertyDamage: true,
        tenantVulnerability: 'none',
        followUpRequired: true,
        preventiveMaintenance: ['Regular pipe inspection', 'Install water sensors']
      },
      nextAction: 'dispatch',
      confidence: 0.98
    },
    'no heat': {
      response: "I understand you have no heat. Given the current temperature, this is an urgent issue. Let me get a technician to you right away. In the meantime, do you have any space heaters you can use safely?",
      classification: {
        category: 'hvac',
        urgency: 'HIGH',
        confidence: 0.95,
        keyWords: ['heat', 'cold', 'hvac'],
        estimatedCost: { min: 150, max: 500 },
        requiredSkills: ['hvac'],
        timeEstimate: 2,
        description: 'No heat in cold weather',
        safetyRisk: true,
        propertyDamage: false,
        tenantVulnerability: 'none',
        followUpRequired: true,
        preventiveMaintenance: ['Annual HVAC inspection']
      },
      nextAction: 'dispatch',
      confidence: 0.95
    },
    'electrical': {
      response: "Electrical issues can be dangerous. For your safety, please avoid using that outlet or circuit. Don't touch any exposed wires. I'm sending an electrician immediately. They'll be there within the hour.",
      classification: {
        category: 'electrical',
        urgency: 'EMERGENCY',
        confidence: 0.97,
        keyWords: ['electrical', 'sparks', 'outlet'],
        estimatedCost: { min: 100, max: 400 },
        requiredSkills: ['electrical'],
        timeEstimate: 2,
        description: 'Electrical safety hazard',
        safetyRisk: true,
        propertyDamage: true,
        tenantVulnerability: 'none',
        followUpRequired: true,
        preventiveMaintenance: ['Electrical system inspection']
      },
      nextAction: 'dispatch',
      confidence: 0.97
    },
    'toilet': {
      response: "I understand your toilet is having issues. Is this your only bathroom? And is water overflowing onto the floor?",
      classification: {
        category: 'plumbing',
        urgency: 'MEDIUM',
        confidence: 0.85,
        keyWords: ['toilet', 'bathroom', 'plumbing'],
        estimatedCost: { min: 75, max: 250 },
        requiredSkills: ['plumbing'],
        timeEstimate: 1.5,
        description: 'Toilet malfunction',
        safetyRisk: false,
        propertyDamage: false,
        tenantVulnerability: 'none',
        followUpRequired: false,
        preventiveMaintenance: ['Regular toilet maintenance']
      },
      nextAction: 'continue',
      confidence: 0.85,
      followUpQuestions: ["Is this your only bathroom?", "Is water overflowing?"]
    },
    'default': {
      response: "I understand you're having a maintenance issue. Can you tell me more about what's happening? Is there any immediate danger or water damage?",
      classification: {
        category: 'general',
        urgency: 'MEDIUM',
        confidence: 0.70,
        keyWords: ['maintenance', 'repair'],
        estimatedCost: { min: 50, max: 200 },
        requiredSkills: ['general'],
        timeEstimate: 2,
        description: 'General maintenance issue',
        safetyRisk: false,
        propertyDamage: false,
        tenantVulnerability: 'none',
        followUpRequired: false,
        preventiveMaintenance: []
      },
      nextAction: 'continue',
      confidence: 0.70,
      followUpQuestions: ["Can you describe the problem in more detail?", "Is there any immediate danger?"]
    }
  };

  async handleTenantCall(
    transcript: string, 
    callContext: any
  ): Promise<ConversationResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simple keyword matching for MVP
    const lowerTranscript = transcript.toLowerCase();
    
    if (lowerTranscript.includes('flood') || lowerTranscript.includes('water everywhere')) {
      return this.mockScenarios['flooding'];
    } else if (lowerTranscript.includes('no heat') || lowerTranscript.includes('freezing')) {
      return this.mockScenarios['no heat'];
    } else if (lowerTranscript.includes('electrical') || lowerTranscript.includes('sparks')) {
      return this.mockScenarios['electrical'];
    } else if (lowerTranscript.includes('toilet')) {
      return this.mockScenarios['toilet'];
    }
    
    return this.mockScenarios['default'];
  }

  async generateVoiceResponse(text: string, urgency: 'normal' | 'emergency' = 'normal'): Promise<string> {
    // For MVP, just return the text that would be converted to speech
    return text;
  }
  
  // Helper method to analyze follow-up responses
  async processFollowUp(
    originalTranscript: string,
    followUpResponse: string,
    previousClassification: Classification
  ): Promise<ConversationResult> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const lowerResponse = followUpResponse.toLowerCase();
    
    // Upgrade urgency based on follow-up
    if (lowerResponse.includes('only bathroom') || lowerResponse.includes('overflowing')) {
      return {
        response: "I understand this is urgent. I'm dispatching a plumber immediately. They'll be there within 45 minutes. Please turn off the water valve behind the toilet if you can.",
        classification: {
          ...previousClassification,
          urgency: 'HIGH',
          description: 'Toilet overflow in only bathroom - urgent',
          propertyDamage: true
        },
        nextAction: 'dispatch',
        confidence: 0.95
      };
    }
    
    // Default follow-up handling
    return {
      response: "Thank you for that information. I'll create a maintenance request and a technician will contact you within 2 hours.",
      classification: previousClassification,
      nextAction: 'dispatch',
      confidence: 0.85
    };
  }
}