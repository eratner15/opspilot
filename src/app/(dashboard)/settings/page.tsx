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
  Copy,
  Check,
  ExternalLink,
  Search,
  Loader2,
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
  const billingMutation = api.settings.createBillingPortalSession.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (err) => toast.error(err.message),
  });
  const upgradeMutation = api.settings.createSubscriptionCheckout.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (err) => toast.error(err.message),
  });

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

  const isTrial = !org?.plan || org.plan === "TRIAL";

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
            <div className="flex flex-col gap-2 sm:flex-row">
              {isTrial && (
                <Button
                  onClick={() => upgradeMutation.mutate()}
                  disabled={upgradeMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {upgradeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Upgrade to Starter — $199/mo
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </>
                  )}
                </Button>
              )}
              {!isTrial && (
                <Button
                  variant="outline"
                  onClick={() => billingMutation.mutate()}
                  disabled={billingMutation.isPending || !org?.stripeCustomerId}
                  title={!org?.stripeCustomerId ? "No Stripe customer on file" : undefined}
                >
                  {billingMutation.isPending ? (
                    "Redirecting..."
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Manage Billing
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          {org?.stripeCustomerId && (
            <p className="text-xs text-muted-foreground">
              Stripe ID: {org.stripeCustomerId}
            </p>
          )}
          {!org?.stripeCustomerId && !isTrial && (
            <p className="text-xs text-muted-foreground">
              No Stripe customer on file. Contact support to activate billing.
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-7 px-2 text-xs gap-1"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function WebhookUrl({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <code className="text-xs bg-muted rounded px-2 py-1 flex-1 break-all font-mono">{url}</code>
      <CopyButton text={url} />
    </div>
  );
}

const twilioPhoneSchema = z.object({
  twilioPhone: z
    .string()
    .regex(/^\+1\d{10}$/, "Format: +1XXXXXXXXXX")
    .or(z.literal("")),
});
type TwilioPhoneForm = z.infer<typeof twilioPhoneSchema>;

function TwilioPhoneField({ currentPhone, orgName }: { currentPhone?: string | null; orgName: string }) {
  const { refetch } = api.settings.getOrg.useQuery();
  const updateMutation = api.settings.updateOrg.useMutation({
    onSuccess: () => {
      toast.success("AI phone number updated");
      void refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const form = useForm<TwilioPhoneForm>({
    resolver: zodResolver(twilioPhoneSchema),
    values: { twilioPhone: currentPhone ?? "" },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          updateMutation.mutate({ name: orgName, twilioPhone: data.twilioPhone })
        )}
        className="mt-3 flex items-end gap-2"
      >
        <FormField
          control={form.control}
          name="twilioPhone"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="text-xs">AI Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+18135550199" className="h-8 text-sm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm" className="h-8" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}

// ─── Unit 3: Twilio Number Picker ─────────────────────────────────────────────

type TwilioNumber = {
  friendlyName: string;
  phoneNumber: string;
  locality: string;
  region: string;
};

function TwilioNumberPicker({ onNumberPurchased }: { onNumberPurchased: (phone: string) => void }) {
  const [areaCode, setAreaCode] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [purchasingNumber, setPurchasingNumber] = useState<string | null>(null);

  const { data: numbers, isFetching } = api.settings.searchTwilioNumbers.useQuery(
    { areaCode },
    { enabled: searchEnabled && areaCode.length === 3 }
  );

  const purchaseMutation = api.settings.purchaseTwilioNumber.useMutation({
    onSuccess: ({ phoneNumber }) => {
      toast.success(`AI number ${phoneNumber} activated. Webhook configured automatically.`);
      onNumberPurchased(phoneNumber);
      setPurchasingNumber(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setPurchasingNumber(null);
    },
  });

  const handleSearch = () => {
    if (areaCode.length === 3) {
      setSearchEnabled(true);
    }
  };

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Get an AI Phone Number</p>
      <div className="flex items-end gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Area Code</label>
          <Input
            placeholder="813"
            maxLength={3}
            value={areaCode}
            onChange={(e) => {
              setAreaCode(e.target.value.replace(/\D/g, ""));
              setSearchEnabled(false);
            }}
            className="h-8 w-24 text-sm"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={handleSearch}
          disabled={areaCode.length !== 3 || isFetching}
        >
          {isFetching ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Search className="h-3 w-3" />
          )}
          <span className="ml-1">Search</span>
        </Button>
      </div>

      {searchEnabled && numbers && numbers.length === 0 && !isFetching && (
        <p className="text-xs text-muted-foreground">No numbers available for area code {areaCode}. Try another.</p>
      )}

      {numbers && numbers.length > 0 && (
        <div className="space-y-1.5">
          {numbers.map((n: TwilioNumber) => (
            <div
              key={n.phoneNumber}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div>
                <span className="font-mono font-medium">{n.friendlyName}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {n.locality}, {n.region}
                </span>
              </div>
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={purchasingNumber !== null}
                onClick={() => {
                  setPurchasingNumber(n.phoneNumber);
                  purchaseMutation.mutate({ phoneNumber: n.phoneNumber });
                }}
              >
                {purchasingNumber === n.phoneNumber ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Get This Number"
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Unit 2: Voice Test Panel ──────────────────────────────────────────────────

type TestStep = { name: string; passed: boolean; detail: string };

function VoiceTestPanel({ twilioConnected, twilioPhone }: { twilioConnected: boolean; twilioPhone?: string | null }) {
  const [testResult, setTestResult] = useState<{ success: boolean; steps: TestStep[] } | null>(null);

  const testMutation = api.settings.testVoiceWebhook.useMutation({
    onSuccess: (result) => setTestResult(result),
    onError: (err) => toast.error(err.message),
  });

  const canTest = twilioConnected && !!twilioPhone;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          disabled={!canTest || testMutation.isPending}
          onClick={() => {
            setTestResult(null);
            testMutation.mutate();
          }}
          title={!canTest ? "Requires Twilio connected + AI phone number set" : undefined}
        >
          {testMutation.isPending ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Running test...
            </>
          ) : (
            "Run Voice Test"
          )}
        </Button>
        {!canTest && (
          <span className="text-xs text-muted-foreground">
            Requires Twilio connected + AI phone set
          </span>
        )}
      </div>

      {testResult && (
        <div className="rounded-md border bg-muted/30 p-3 space-y-2">
          <p className={`text-xs font-semibold ${testResult.success ? "text-green-700" : "text-red-700"}`}>
            {testResult.success
              ? "Test passed — your AI phone is working!"
              : `Test failed — see steps below`}
          </p>
          <div className="space-y-1">
            {testResult.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {step.passed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500 mt-0.5" />
                )}
                <span>
                  <span className="font-medium">{step.name}:</span>{" "}
                  <span className="text-muted-foreground">{step.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IntegrationsTab() {
  const { data: org, refetch: refetchOrg } = api.settings.getOrg.useQuery();
  const { data: status, isLoading } = api.settings.getIntegrationStatus.useQuery();
  const [showNumberPicker, setShowNumberPicker] = useState(false);

  if (isLoading) return <LoadingSkeleton variant="card" />;

  const isConnected = (flag: boolean | undefined) => !!flag;
  const twilioConnected = isConnected(status?.twilio);
  const hasPhone = !!org?.twilioPhone;

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

      {/* Twilio */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-muted p-2 shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Twilio Voice & SMS</p>
                <p className="text-sm text-muted-foreground">
                  AI-powered call answering and SMS dispatch to technicians.
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  TWILIO_ACCOUNT_SID · TWILIO_AUTH_TOKEN · TWILIO_PHONE_NUMBER
                </p>
              </div>
            </div>
            <StatusBadge connected={isConnected(status?.twilio)} />
          </div>
          <div className="ml-11 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Voice Webhook URL</p>
              <WebhookUrl url="https://smb.cafecito-ai.com/api/webhooks/twilio/voice" />
            </div>

            {/* Manual phone field */}
            <TwilioPhoneField currentPhone={org?.twilioPhone} orgName={org?.name ?? ""} />

            {/* Number picker — show when Twilio connected and no phone yet, or user clicks Change */}
            {twilioConnected && (!hasPhone || showNumberPicker) && (
              <TwilioNumberPicker
                onNumberPurchased={(phone) => {
                  void refetchOrg();
                  setShowNumberPicker(false);
                  toast.success(`AI number ${phone} activated!`);
                }}
              />
            )}
            {twilioConnected && hasPhone && !showNumberPicker && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setShowNumberPicker(true)}
              >
                Change Number
              </Button>
            )}

            {/* Voice test */}
            <VoiceTestPanel
              twilioConnected={twilioConnected}
              twilioPhone={org?.twilioPhone}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stripe */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-muted p-2 shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Stripe Payments</p>
                <p className="text-sm text-muted-foreground">
                  Accept online payments for invoices via Stripe Checkout.
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  STRIPE_SECRET_KEY · STRIPE_WEBHOOK_SECRET · NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                </p>
              </div>
            </div>
            <StatusBadge connected={isConnected(status?.stripe)} />
          </div>
          <div className="ml-11">
            <p className="text-xs text-muted-foreground font-medium">Stripe Webhook URL</p>
            <WebhookUrl url="https://smb.cafecito-ai.com/api/webhooks/stripe" />
          </div>
        </CardContent>
      </Card>

      {/* Anthropic */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-muted p-2 shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Anthropic Claude AI</p>
                <p className="text-sm text-muted-foreground">
                  Powers call transcription, job classification, and quote suggestions.
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-1">ANTHROPIC_API_KEY</p>
              </div>
            </div>
            <StatusBadge connected={isConnected(status?.anthropic)} />
          </div>
        </CardContent>
      </Card>

      {/* Resend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-muted p-2 shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Resend Email</p>
                <p className="text-sm text-muted-foreground">
                  Transactional emails for quotes, invoices, and weekly digests.
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  RESEND_API_KEY (optional — emails are mocked if absent)
                </p>
              </div>
            </div>
            {status?.resend ? (
              <StatusBadge connected={true} />
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                <XCircle className="h-4 w-4" />
                <span className="text-xs">Optional</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <div className="flex items-center gap-1.5 text-green-600 shrink-0">
      <CheckCircle2 className="h-4 w-4" />
      <span className="text-xs font-medium">Connected</span>
    </div>
  ) : (
    <div className="flex items-center gap-1.5 text-amber-600 shrink-0">
      <XCircle className="h-4 w-4" />
      <span className="text-xs font-medium">Not configured</span>
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
