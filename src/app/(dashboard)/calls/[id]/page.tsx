'use client';

import { use } from 'react';
import { api } from '@/lib/trpc/client';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, User, Clock, Brain, Briefcase, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { formatPhone, formatDateTime } from '@/lib/utils';

interface Props {
  params: Promise<{ id: string }>;
}

interface AIAnalysis {
  intent?: string;
  serviceCategory?: string;
  urgency?: string;
  summary?: string;
  suggestedJobTitle?: string;
  confidence?: number;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    confidence >= 0.8
      ? 'bg-green-100 text-green-800'
      : confidence >= 0.5
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {pct}% confidence
    </span>
  );
}

export default function CallDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data, isLoading } = api.calls.getById.useQuery(id);

  if (isLoading) return <LoadingSkeleton />;

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Call Not Found" description="" />
        <p className="text-muted-foreground">This call does not exist or you do not have access.</p>
      </div>
    );
  }

  const { call, job } = data;

  let analysis: AIAnalysis | null = null;
  try {
    if (call.aiAnalysisJson) analysis = JSON.parse(call.aiAnalysisJson) as AIAnalysis;
  } catch { /* invalid JSON */ }

  const formatDuration = (secs: number | null) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Call — ${formatPhone(call.fromPhone)}`}
        description={formatDateTime(call.createdAt)}
      >
        <StatusBadge status={call.status} />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4" /> Call Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">From</span>
              <span>{formatPhone(call.fromPhone)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To</span>
              <span>{formatPhone(call.toPhone)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={call.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatDuration(call.duration)}
              </span>
            </div>
            {call.twilioCallSid && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Call SID</span>
                <span className="font-mono text-xs">{call.twilioCallSid.slice(-8)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Caller Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" /> Caller
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {call.customer ? (
              <div className="space-y-3">
                <div>
                  <Link
                    href={`/customers/${call.customer.id}`}
                    className="font-medium hover:underline"
                  >
                    {call.customer.firstName} {call.customer.lastName}
                  </Link>
                  <p className="text-muted-foreground">{formatPhone(call.customer.phone)}</p>
                </div>
                {call.customer.email && (
                  <p className="text-muted-foreground">{call.customer.email}</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Unknown caller</p>
            )}
          </CardContent>
        </Card>

        {/* Linked Job */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4" /> Linked Job
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {job ? (
              <div className="space-y-2">
                <Link
                  href={`/jobs/${job.id}`}
                  className="font-medium hover:underline block"
                >
                  {job.jobNumber} — {job.title}
                </Link>
                <StatusBadge status={job.status} />
              </div>
            ) : (
              <p className="text-muted-foreground">No job created from this call yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4" /> AI Analysis
              {analysis.confidence !== undefined && (
                <ConfidenceBadge confidence={analysis.confidence} />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {analysis.intent && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Intent</p>
                  <Badge variant="outline" className="mt-1">{analysis.intent}</Badge>
                </div>
              )}
              {analysis.serviceCategory && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Category</p>
                  <Badge variant="outline" className="mt-1">{analysis.serviceCategory}</Badge>
                </div>
              )}
              {analysis.urgency && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Urgency</p>
                  <Badge
                    variant={analysis.urgency === 'EMERGENCY' ? 'destructive' : 'outline'}
                    className="mt-1"
                  >
                    {analysis.urgency === 'EMERGENCY' && (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {analysis.urgency}
                  </Badge>
                </div>
              )}
              {analysis.suggestedJobTitle && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Suggested Title</p>
                  <p className="text-sm mt-1">{analysis.suggestedJobTitle}</p>
                </div>
              )}
            </div>
            {analysis.summary && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Summary</p>
                <p className="text-sm bg-muted/50 rounded p-3">{analysis.summary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      {call.transcript && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Call Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded p-4 font-mono">
              {call.transcript}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
