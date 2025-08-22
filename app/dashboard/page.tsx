'use client';

import { useState, useEffect } from 'react';
import { mockPrisma, getMockData } from '@/lib/db/mock-db';

interface Call {
  id: string;
  phoneNumber: string;
  duration: number;
  transcript?: string;
  urgency?: string;
  createdAt: Date;
}

interface Ticket {
  id: string;
  title: string;
  category: string;
  urgency: string;
  status: string;
  assignedTo?: string;
  createdAt: Date;
  call?: Call;
}

interface Technician {
  id: string;
  name: string;
  skills: string[];
  available: boolean;
  rating: number;
  responseTime: number;
}

export default function Dashboard() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    avgResponseTime: 0,
    emergencyRate: 0,
    resolutionRate: 0
  });

  // Refresh data every 2 seconds
  useEffect(() => {
    const loadData = () => {
      const data = getMockData();
      setCalls(data.calls.slice(-5).reverse());
      setTickets(data.tickets.slice(-10).reverse());
      setTechnicians(data.technicians);
      
      // Calculate stats
      const totalCalls = data.calls.length;
      const emergencyCalls = data.calls.filter(c => c.urgency === 'EMERGENCY').length;
      const completedTickets = data.tickets.filter(t => t.status === 'COMPLETED').length;
      
      setStats({
        totalCalls,
        avgResponseTime: 3.2,
        emergencyRate: totalCalls > 0 ? (emergencyCalls / totalCalls) * 100 : 0,
        resolutionRate: data.tickets.length > 0 ? (completedTickets / data.tickets.length) * 100 : 0
      });
    };

    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'EMERGENCY': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-blue-100 text-blue-800';
      case 'DISPATCHED': return 'bg-purple-100 text-purple-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">OpsPilot Emergency Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Calls</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCalls}</p>
            <p className="text-sm text-green-600">Active MVP</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Avg Response</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.avgResponseTime}min</p>
            <p className="text-sm text-green-600">-0.8min</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Emergency Rate</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.emergencyRate.toFixed(0)}%</p>
            <p className="text-sm text-red-600">+3%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Resolution Rate</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.resolutionRate.toFixed(0)}%</p>
            <p className="text-sm text-green-600">+2%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Calls */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Recent Calls</h2>
            </div>
            <div className="p-6">
              {calls.length === 0 ? (
                <p className="text-gray-500">No calls yet. Use the simulator to test!</p>
              ) : (
                <div className="space-y-4">
                  {calls.map(call => (
                    <div key={call.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{call.phoneNumber}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {call.transcript || 'No transcript yet'}
                          </p>
                        </div>
                        {call.urgency && (
                          <span className={`px-2 py-1 text-xs rounded ${getUrgencyColor(call.urgency)}`}>
                            {call.urgency}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(call.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Tickets */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Active Tickets</h2>
            </div>
            <div className="p-6">
              {tickets.length === 0 ? (
                <p className="text-gray-500">No tickets yet. Calls will create tickets automatically.</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {tickets.map(ticket => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{ticket.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded ${getUrgencyColor(ticket.urgency)}`}>
                          {ticket.urgency}
                        </span>
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                          {ticket.category}
                        </span>
                      </div>
                      {ticket.assignedTo && (
                        <p className="text-xs text-gray-600">
                          Assigned to: {technicians.find(t => t.id === ticket.assignedTo)?.name || 'Unknown'}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(ticket.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Technician Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Technician Status</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {technicians.map(tech => (
                <div key={tech.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{tech.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded ${
                      tech.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {tech.available ? 'Available' : 'Busy'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Skills: {tech.skills.join(', ')}</p>
                    <p>Response: {tech.responseTime} min</p>
                    <p>Rating: ⭐ {tech.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}