// Mock database for MVP testing without actual PostgreSQL
// This simulates Prisma client behavior for testing

interface MockCall {
  id: string;
  phoneNumber: string;
  duration: number;
  transcript?: string;
  audioUrl?: string;
  classification?: any;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  propertyId?: string;
  unitNumber?: string;
  createdAt: Date;
}

interface MockTicket {
  id: string;
  callId: string;
  title: string;
  description: string;
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: 'CREATED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  propertyId: string;
  unitNumber: string;
  tenantPhone: string;
  assignedTo?: string;
  appfolioId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockTechnician {
  id: string;
  name: string;
  phone: string;
  email?: string;
  skills: string[];
  available: boolean;
  location: string;
  rating: number;
  responseTime: number;
  hourlyRate: number;
  emergencyRate: number;
  maxJobs: number;
  workingHours: any;
  companyId: string;
}

// In-memory storage
const mockData = {
  calls: [] as MockCall[],
  tickets: [] as MockTicket[],
  technicians: [
    {
      id: '1',
      name: 'John Smith',
      phone: '+1234567890',
      email: 'john@example.com',
      skills: ['plumbing', 'general'],
      available: true,
      location: 'Zone A',
      rating: 4.8,
      responseTime: 25,
      hourlyRate: 85,
      emergencyRate: 125,
      maxJobs: 3,
      workingHours: { mon: { start: '08:00', end: '17:00' } },
      companyId: 'company-1'
    },
    {
      id: '2',
      name: 'Maria Garcia',
      phone: '+1234567891',
      email: 'maria@example.com',
      skills: ['electrical', 'hvac'],
      available: true,
      location: 'Zone B',
      rating: 4.9,
      responseTime: 30,
      hourlyRate: 95,
      emergencyRate: 140,
      maxJobs: 3,
      workingHours: { mon: { start: '07:00', end: '16:00' } },
      companyId: 'company-1'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      phone: '+1234567892',
      email: 'mike@example.com',
      skills: ['plumbing', 'hvac', 'appliance'],
      available: false,
      location: 'Zone A',
      rating: 4.7,
      responseTime: 20,
      hourlyRate: 90,
      emergencyRate: 135,
      maxJobs: 2,
      workingHours: { mon: { start: '09:00', end: '18:00' } },
      companyId: 'company-1'
    }
  ] as MockTechnician[],
  companies: [
    {
      id: 'company-1',
      name: 'PropertyCare Pro',
      twilioNumber: '+1800PROPERTY',
      appfolioKey: 'mock-key',
      settings: { emergencyResponseTime: 60 }
    }
  ],
  properties: [
    {
      id: 'prop-1',
      companyId: 'company-1',
      address: '123 Main St, City',
      vipStatus: false
    },
    {
      id: 'prop-2',
      companyId: 'company-1',
      address: '456 Oak Ave, City',
      vipStatus: true
    }
  ],
  notifications: [] as any[]
};

// Mock Prisma client
export const mockPrisma = {
  call: {
    create: async (data: any) => {
      const newCall: MockCall = {
        id: `call-${Date.now()}`,
        ...data.data,
        createdAt: new Date()
      };
      mockData.calls.push(newCall);
      return newCall;
    },
    findUnique: async ({ where }: any) => {
      return mockData.calls.find(c => c.id === where.id);
    },
    update: async ({ where, data }: any) => {
      const index = mockData.calls.findIndex(c => c.id === where.id);
      if (index !== -1) {
        mockData.calls[index] = { ...mockData.calls[index], ...data };
        return mockData.calls[index];
      }
      return null;
    },
    findMany: async () => mockData.calls
  },
  
  ticket: {
    create: async (data: any) => {
      const newTicket: MockTicket = {
        id: `ticket-${Date.now()}`,
        ...data.data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockData.tickets.push(newTicket);
      return newTicket;
    },
    findUnique: async ({ where, include }: any) => {
      const ticket = mockData.tickets.find(t => t.id === where.id);
      if (ticket && include?.call) {
        const call = mockData.calls.find(c => c.id === ticket.callId);
        return { ...ticket, call };
      }
      return ticket;
    },
    update: async ({ where, data }: any) => {
      const index = mockData.tickets.findIndex(t => t.id === where.id);
      if (index !== -1) {
        mockData.tickets[index] = { 
          ...mockData.tickets[index], 
          ...data,
          updatedAt: new Date()
        };
        return mockData.tickets[index];
      }
      return null;
    },
    findMany: async ({ orderBy }: any) => {
      const tickets = [...mockData.tickets];
      if (orderBy) {
        tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      return tickets;
    }
  },
  
  technician: {
    findMany: async ({ where, orderBy }: any) => {
      let techs = [...mockData.technicians];
      
      if (where?.available !== undefined) {
        techs = techs.filter(t => t.available === where.available);
      }
      
      if (where?.skills?.hasSome) {
        techs = techs.filter(t => 
          t.skills.some(skill => where.skills.hasSome.includes(skill))
        );
      }
      
      if (orderBy) {
        techs.sort((a, b) => {
          if (orderBy[0]?.rating === 'desc') return b.rating - a.rating;
          if (orderBy[1]?.responseTime === 'asc') return a.responseTime - b.responseTime;
          return 0;
        });
      }
      
      return techs;
    },
    findUnique: async ({ where }: any) => {
      return mockData.technicians.find(t => t.id === where.id);
    }
  },
  
  notification: {
    create: async (data: any) => {
      const newNotification = {
        id: `notif-${Date.now()}`,
        ...data.data,
        createdAt: new Date()
      };
      mockData.notifications.push(newNotification);
      return newNotification;
    }
  }
};

// Export mock data for testing
export const getMockData = () => mockData;