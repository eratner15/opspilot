// Smart technician dispatch system
import { mockPrisma } from '../db/mock-db';
import { sendSMS } from '../integrations/mock-twilio';
import { Classification } from './claude-agent';

export interface DispatchResult {
  success: boolean;
  technician?: any;
  message: string;
  eta?: Date;
}

export async function dispatchTechnician(ticketId: string): Promise<DispatchResult> {
  try {
    // Get ticket details
    const ticket = await mockPrisma.ticket.findUnique({
      where: { id: ticketId },
      include: { call: true }
    });

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket not found'
      };
    }

    // Get classification from call data
    const classification = (ticket as any).call.classification as Classification;
    const requiredSkills = classification.requiredSkills || [classification.category];

    // Find available technicians with required skills
    const availableTechs = await mockPrisma.technician.findMany({
      where: {
        available: true,
        skills: {
          hasSome: requiredSkills
        }
      },
      orderBy: [
        { rating: 'desc' },
        { responseTime: 'asc' }
      ]
    });

    if (availableTechs.length === 0) {
      // Try to find any available technician for emergencies
      if (ticket.urgency === 'EMERGENCY') {
        const anyTech = await mockPrisma.technician.findMany({
          where: { available: true },
          orderBy: { responseTime: 'asc' }
        });
        
        if (anyTech.length > 0) {
          availableTechs.push(anyTech[0]);
        } else {
          return {
            success: false,
            message: 'No technicians available for emergency dispatch'
          };
        }
      } else {
        return {
          success: false,
          message: `No technicians available with skills: ${requiredSkills.join(', ')}`
        };
      }
    }

    // Select best technician
    const selectedTech = selectBestTechnician(availableTechs, ticket);
    
    // Assign technician to ticket
    await mockPrisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedTo: selectedTech.id,
        status: 'DISPATCHED'
      }
    });

    // Send notifications
    await sendTechnicianNotification(selectedTech, ticket);
    await sendTenantNotification(ticket, selectedTech);

    // Calculate ETA
    const eta = new Date(Date.now() + selectedTech.responseTime * 60000);

    return {
      success: true,
      technician: selectedTech,
      message: `Technician ${selectedTech.name} dispatched successfully`,
      eta
    };

  } catch (error) {
    console.error('Dispatch error:', error);
    return {
      success: false,
      message: 'Failed to dispatch technician'
    };
  }
}

function selectBestTechnician(technicians: any[], ticket: any): any {
  // Score each technician
  const scored = technicians.map(tech => {
    let score = 0;
    
    // Rating weight (0-5 points)
    score += tech.rating;
    
    // Response time weight (faster is better)
    score += (60 - tech.responseTime) / 12; // Max 5 points for <10min response
    
    // Skill match bonus
    const classification = (ticket as any).call.classification as Classification;
    const matchedSkills = tech.skills.filter((skill: string) => 
      classification.requiredSkills.includes(skill)
    );
    score += matchedSkills.length * 2;
    
    // Emergency bonus for faster response
    if (ticket.urgency === 'EMERGENCY' && tech.responseTime <= 20) {
      score += 3;
    }
    
    // Cost consideration (lower is better for non-emergency)
    if (ticket.urgency !== 'EMERGENCY') {
      const avgRate = (tech.hourlyRate + tech.emergencyRate) / 2;
      score -= avgRate / 50; // Small penalty for higher rates
    }
    
    return { tech, score };
  });
  
  // Sort by score and return best
  scored.sort((a, b) => b.score - a.score);
  return scored[0].tech;
}

async function sendTechnicianNotification(tech: any, ticket: any): Promise<void> {
  const urgencyEmoji: Record<string, string> = {
    EMERGENCY: '🚨',
    HIGH: '⚠️',
    MEDIUM: '🔧',
    LOW: '📝'
  };
  
  const message = `${urgencyEmoji[ticket.urgency] || '🔧'} ${ticket.urgency} DISPATCH
Issue: ${ticket.title}
Location: ${ticket.propertyId} Unit ${ticket.unitNumber}
Tenant: ${ticket.tenantPhone}
Description: ${ticket.description}
Est. Time: ${(ticket.call.classification as Classification).timeEstimate}h
Reply YES to accept or NO to decline`;

  await sendSMS(tech.phone, message);
  
  // Log notification
  await mockPrisma.notification.create({
    data: {
      ticketId: ticket.id,
      type: 'sms',
      recipient: tech.phone,
      message,
      status: 'sent'
    }
  });
}

async function sendTenantNotification(ticket: any, tech: any): Promise<void> {
  const eta = new Date(Date.now() + tech.responseTime * 60000);
  
  const message = `Your maintenance request has been received and assigned to ${tech.name}. 
They will arrive between ${eta.toLocaleTimeString()} and ${new Date(eta.getTime() + 30*60000).toLocaleTimeString()}.
They will call you at ${ticket.tenantPhone} when they're on the way.
Reference #: ${ticket.id.slice(-6).toUpperCase()}`;

  await sendSMS(ticket.tenantPhone, message);
  
  // Log notification
  await mockPrisma.notification.create({
    data: {
      ticketId: ticket.id,
      type: 'sms',
      recipient: ticket.tenantPhone,
      message,
      status: 'sent'
    }
  });
}

// Helper function to check escalation rules
export async function checkEscalation(ticket: any): Promise<boolean> {
  const timeSinceCreation = Date.now() - new Date(ticket.createdAt).getTime();
  const fifteenMinutes = 15 * 60 * 1000;
  
  const escalationRules = [
    // No response to emergency in 15 minutes
    ticket.urgency === 'EMERGENCY' && 
    ticket.status === 'CREATED' &&
    timeSinceCreation > fifteenMinutes,
    
    // VIP property with any unassigned ticket
    ticket.property?.vipStatus === true && 
    ticket.status === 'CREATED',
    
    // Safety risk not addressed quickly
    ((ticket as any).call.classification as Classification)?.safetyRisk === true &&
    ticket.status === 'CREATED' &&
    timeSinceCreation > 10 * 60 * 1000,
    
    // Multiple failed dispatch attempts
    ticket.notifications?.filter((n: any) => 
      n.type === 'sms' && n.status === 'failed'
    ).length > 2
  ];
  
  return escalationRules.some(rule => rule);
}

// Batch dispatch for multiple tickets
export async function batchDispatch(ticketIds: string[]): Promise<DispatchResult[]> {
  const results = await Promise.all(
    ticketIds.map(id => dispatchTechnician(id))
  );
  
  return results;
}