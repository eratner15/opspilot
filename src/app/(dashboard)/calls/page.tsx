'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc/client';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Phone, Search } from 'lucide-react';
import Link from 'next/link';
import { formatPhone, formatDateTime } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';

type CallRow = {
  id: string;
  fromPhone: string;
  status: string;
  duration: number | null;
  createdAt: string;
  customer: { id: string; firstName: string; lastName: string; phone: string } | null;
};

const CALL_STATUSES = ['INCOMING', 'ANSWERED', 'MISSED', 'VOICEMAIL'] as const;

const columns: ColumnDef<CallRow>[] = [
  {
    accessorKey: 'fromPhone',
    header: 'Caller',
    cell: ({ row }) => {
      const call = row.original;
      return (
        <div>
          <Link href={`/calls/${call.id}`} className="font-medium hover:underline text-sm">
            {call.customer
              ? `${call.customer.firstName} ${call.customer.lastName}`
              : formatPhone(call.fromPhone)}
          </Link>
          {call.customer && (
            <p className="text-xs text-muted-foreground">{formatPhone(call.fromPhone)}</p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'duration',
    header: 'Duration',
    cell: ({ row }) => {
      const d = row.original.duration;
      if (!d) return <span className="text-muted-foreground text-sm">—</span>;
      const m = Math.floor(d / 60);
      const s = d % 60;
      return <span className="text-sm">{m}:{s.toString().padStart(2, '0')}</span>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Link href={`/calls/${row.original.id}`} className="text-sm text-primary hover:underline">
        View
      </Link>
    ),
  },
];

export default function CallsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = api.calls.list.useQuery({
    search: search || undefined,
    status: statusFilter !== 'all' ? (statusFilter as (typeof CALL_STATUSES)[number]) : undefined,
    take: 100,
    skip: 0,
  });

  const items = (data?.items ?? []) as CallRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Call Log"
        description="AI-handled inbound calls and service requests"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {CALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Phone}
          title="No calls yet"
          description="Calls will appear here once your AI phone system is configured."
        />
      ) : (
        <DataTable columns={columns} data={items} />
      )}
    </div>
  );
}
