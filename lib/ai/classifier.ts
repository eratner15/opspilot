// Problem classification system for maintenance issues
import { Classification } from './claude-agent';

export async function classifyProblem(transcript: string): Promise<Classification> {
  // Simulate API processing time
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const lowerTranscript = transcript.toLowerCase();
  
  // Emergency keywords
  const emergencyKeywords = ['flood', 'gas', 'fire', 'sparks', 'electrical smell', 'sewage'];
  const highKeywords = ['no heat', 'no hot water', 'only toilet', 'broken lock'];
  const mediumKeywords = ['leak', 'drip', 'broken', 'not working'];
  
  // Determine urgency
  let urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY' = 'LOW';
  let category: Classification['category'] = 'general';
  let requiredSkills: string[] = ['general'];
  let keyWords: string[] = [];
  
  if (emergencyKeywords.some(keyword => lowerTranscript.includes(keyword))) {
    urgency = 'EMERGENCY';
  } else if (highKeywords.some(keyword => lowerTranscript.includes(keyword))) {
    urgency = 'HIGH';
  } else if (mediumKeywords.some(keyword => lowerTranscript.includes(keyword))) {
    urgency = 'MEDIUM';
  }
  
  // Categorize issue
  if (lowerTranscript.includes('toilet') || lowerTranscript.includes('sink') || 
      lowerTranscript.includes('pipe') || lowerTranscript.includes('flood') ||
      lowerTranscript.includes('leak')) {
    category = 'plumbing';
    requiredSkills = ['plumbing'];
    keyWords = ['water', 'pipe', 'leak'];
  } else if (lowerTranscript.includes('electrical') || lowerTranscript.includes('outlet') ||
             lowerTranscript.includes('light') || lowerTranscript.includes('power')) {
    category = 'electrical';
    requiredSkills = ['electrical'];
    keyWords = ['power', 'electrical', 'outlet'];
  } else if (lowerTranscript.includes('heat') || lowerTranscript.includes('ac') ||
             lowerTranscript.includes('air') || lowerTranscript.includes('temperature')) {
    category = 'hvac';
    requiredSkills = ['hvac'];
    keyWords = ['temperature', 'air', 'hvac'];
  } else if (lowerTranscript.includes('appliance') || lowerTranscript.includes('fridge') ||
             lowerTranscript.includes('stove') || lowerTranscript.includes('washer')) {
    category = 'appliance';
    requiredSkills = ['appliance'];
    keyWords = ['appliance', 'repair'];
  }
  
  // Estimate costs based on category and urgency
  const costRanges = {
    plumbing: { LOW: [50, 150], MEDIUM: [100, 300], HIGH: [200, 500], EMERGENCY: [300, 1000] },
    electrical: { LOW: [75, 200], MEDIUM: [150, 350], HIGH: [250, 600], EMERGENCY: [400, 1200] },
    hvac: { LOW: [100, 250], MEDIUM: [200, 400], HIGH: [300, 700], EMERGENCY: [500, 1500] },
    appliance: { LOW: [50, 150], MEDIUM: [100, 250], HIGH: [150, 400], EMERGENCY: [200, 600] },
    general: { LOW: [50, 100], MEDIUM: [75, 200], HIGH: [100, 300], EMERGENCY: [150, 500] },
    security: { LOW: [100, 200], MEDIUM: [150, 300], HIGH: [200, 500], EMERGENCY: [300, 800] }
  };
  
  const [min, max] = costRanges[category][urgency];
  
  return {
    category,
    urgency,
    confidence: 0.85,
    keyWords,
    estimatedCost: { min, max },
    requiredSkills,
    timeEstimate: urgency === 'EMERGENCY' ? 1 : urgency === 'HIGH' ? 2 : 3,
    description: `${urgency} ${category} issue requiring attention`,
    safetyRisk: urgency === 'EMERGENCY',
    propertyDamage: urgency === 'EMERGENCY' || urgency === 'HIGH',
    tenantVulnerability: 'none',
    followUpRequired: urgency === 'EMERGENCY' || urgency === 'HIGH',
    preventiveMaintenance: []
  };
}