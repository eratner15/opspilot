"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Users,
  CreditCard,
  Plug,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Zap,
} from "lucide-react";

// ─── Org Profile Tab ──────────────────────────────────────────────────────────

const orgSchema = z.object({
  name: z.string().min(1, "Name required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  timezone: z.string().optional(),
});
type OrgForm = z.infer<typeof orgSchema>;

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Phoenix", label: "Arizona (MT, no DST)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
];

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  DISPATCHER: "Dispatcher",
  TECHNICIAN: "Technician",
};

function OrgProfileTab() {
  const { data: org, isLoading, refetch } = api.settings.getOrg.useQuery();
  const updateMutation = api.settings.updateOrg.useMutation({
    onSuccess: () => {
      toast.success("Organization updated");
      void refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const form = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    values: org
      ? {
          name: org.name,
          phone: org.phone ?? "",
          email: org.email ?? "",
          address: org.address ?? "",
          city: org.city ?? "",
          state: org.state ?? "",
          zip: org.zip ?? "",
          timezone: org.timezone ?? "America/New_York",
        }
      : undefined,
  });

  if (isLoading) return <LoadingSkeleton variant="card" />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>Update your company name, contact info, and address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Comfort Pro HVAC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="8135550100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="info@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="1234 Business Blvd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Tampa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="FL" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP</FormLabel>
                    <FormControl>
                      <Input placeholder="33601" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────

function TeamTab() {
  const { data: team, isLoading, refetch } = api.settings.getTeam.useQuery();
  const updateRoleMutation = api.settings.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      void refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <LoadingSkeleton variant="table" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          Manage your team&apos;s roles. Only owners can promote or demote members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Change Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(team ?? []).map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.firstName} {member.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{member.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={member.role === "OWNER" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {ROLE_LABELS[member.role] ?? member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.role !== "OWNER" && (
                      <Select
                        value={member.role}
                        onValueChange={(role) =>
                          updateRoleMutation.mutate({
                            userId: member.id,
                            role: role as "OWNER" | "ADMIN" | "DISPATCHER" | "TECHNICIAN",
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="DISPATCHER">Dispatcher</SelectItem>
                          <SelectItem value="TECHNICIAN">Technician</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(team ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No team members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Billing Tab ──────────────────────────────────────────────────────────────

function BillingTab() {
  const { data: org, isLoading } = api.settings.getOrg.useQuery();

  if (isLoading) return <LoadingSkeleton variant="card" />;

  const planLabels: Record<string, string> = {
    TRIAL: "Trial (Free)",
    STARTER: "Starter — $199/mo",
    PRO: "Pro — $349/mo",
    ENTERPRISE: "Enterprise",
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    PAST_DUE: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your subscription and billing details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-medium text-lg">{planLabels[org?.plan ?? "TRIAL"] ?? org?.plan}</p>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[org?.planStatus ?? "ACTIVE"] ?? "bg-gray-100 text-gray-800"
                }`}
              >
                {org?.planStatus ?? "ACTIVE"}
              </span>
            </div>
            <Button variant="outline" disabled>
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Billing
            </Button>
          </div>
          {org?.stripeCustomerId && (
            <p className="text-xs text-muted-foreground">
              Stripe ID: {org.stripeCustomerId}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Included Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "AI-powered call answering",
              "Automatic job creation",
              "SMS dispatch to technicians",
              "Customer quote & e-signature",
              "Online invoice payments",
              "QuickBooks sync",
              "Analytics & reporting",
              "Weekly AI digest email",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                {feature}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Integrations Tab ─────────────────────────────────────────────────────────

type IntegrationStatus = "connected" | "not_configured" | "optional";

function IntegrationCard({
  name,
  description,
  status,
  icon: Icon,
  detail,
}: {
  name: string;
  description: string;
  status: IntegrationStatus;
  icon: React.ElementType;
  detail?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2 shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">{name}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
              {detail && <p className="text-xs text-muted-foreground font-mono">{detail}</p>}
            </div>
          </div>
          <div className="ml-10 sm:ml-0 shrink-0">
            {status === "connected" ? (
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">Connected</span>
              </div>
            ) : status === "optional" ? (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <XCircle className="h-4 w-4" />
                <span className="text-xs">Optional</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-600">
                <XCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Not configured</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IntegrationsTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Configure API keys in your Cloudflare Worker environment variables.
            All secrets are stored securely — never in code.
          </CardDescription>
        </CardHeader>
      </Card>

      <IntegrationCard
        name="Twilio Voice & SMS"
        description="AI-powered call answering and SMS dispatch to technicians."
        status="connected"
        icon={Phone}
        detail="TWILIO_ACCOUNT_SID · TWILIO_AUTH_TOKEN · TWILIO_PHONE_NUMBER"
      />
      <IntegrationCard
        name="Stripe Payments"
        description="Accept online payments for invoices via Stripe Checkout."
        status="connected"
        icon={CreditCard}
        detail="STRIPE_SECRET_KEY · STRIPE_WEBHOOK_SECRET · NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
      />
      <IntegrationCard
        name="Anthropic Claude AI"
        description="Powers call transcription, job classification, and quote suggestions."
        status="connected"
        icon={Zap}
        detail="ANTHROPIC_API_KEY"
      />
      <IntegrationCard
        name="Resend Email"
        description="Transactional emails for quotes, invoices, and weekly digests."
        status="optional"
        icon={Mail}
        detail="RESEND_API_KEY (optional — emails are mocked if absent)"
      />
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("org");

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your organization and preferences" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="org" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organization</span>
            <span className="sm:hidden">Org</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
            <span className="sm:hidden">APIs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="org" className="mt-6">
          <OrgProfileTab />
        </TabsContent>
        <TabsContent value="team" className="mt-6">
          <TeamTab />
        </TabsContent>
        <TabsContent value="billing" className="mt-6">
          <BillingTab />
        </TabsContent>
        <TabsContent value="integrations" className="mt-6">
          <IntegrationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
