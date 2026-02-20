"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Zap, Building2, HardHat, LayoutDashboard, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { Toaster } from "sonner";

// ─── Step definitions ─────────────────────────────────────────────────────────

const steps = [
  { id: 1, title: "Welcome", icon: Zap, description: "You're all set to transform your operations" },
  { id: 2, title: "Your Business", icon: Building2, description: "Tell us about your company" },
  { id: 3, title: "First Technician", icon: HardHat, description: "Add your first tech to get dispatching" },
  { id: 4, title: "Ready!", icon: LayoutDashboard, description: "You're ready to launch" },
];

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-8 text-center">
      <div className="mx-auto w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
        <Zap className="w-10 h-10 text-white" />
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-bold">Welcome to OpsPilot</h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Your AI-powered operations platform. Let&apos;s get you set up in under 2 minutes.
        </p>
      </div>
      <div className="grid gap-3 text-left max-w-sm mx-auto">
        {[
          { icon: "📞", text: "AI answers every call 24/7" },
          { icon: "🛠️", text: "Jobs auto-created from calls" },
          { icon: "📱", text: "Techs dispatched via SMS" },
          { icon: "💳", text: "Quotes signed & invoices paid online" },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-3 text-sm">
            <span className="text-xl">{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
      <Button size="lg" onClick={onNext} className="w-full max-w-sm">
        Get Started
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Step 2: Business Setup ───────────────────────────────────────────────────

const orgSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  phone: z.string().min(10, "Valid phone number required"),
});
type OrgForm = z.infer<typeof orgSchema>;

function BusinessStep({ onNext }: { onNext: () => void }) {
  const { data: org } = api.settings.getOrg.useQuery();
  const updateMutation = api.settings.updateOrg.useMutation({
    onSuccess: () => {
      toast.success("Business info saved!");
      onNext();
    },
    onError: (err) => toast.error(err.message),
  });

  const form = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    values: org ? { name: org.name, phone: org.phone ?? "" } : undefined,
  });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Your Business</h2>
        <p className="text-muted-foreground">This appears on quotes, invoices, and customer emails.</p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) =>
            updateMutation.mutate({
              name: data.name,
              phone: data.phone,
              timezone: "America/New_York",
            })
          )}
          className="space-y-4"
        >
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
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Phone *</FormLabel>
                <FormControl>
                  <Input placeholder="8135550100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save & Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={onNext}
          >
            Skip for now
          </Button>
        </form>
      </Form>
    </div>
  );
}

// ─── Step 3: First Technician ─────────────────────────────────────────────────

const techSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  phone: z.string().min(10, "Valid phone required"),
});
type TechForm = z.infer<typeof techSchema>;

function TechnicianStep({ onNext }: { onNext: () => void }) {
  const createMutation = api.technicians.create.useMutation({
    onSuccess: () => {
      toast.success("Technician added!");
      onNext();
    },
    onError: (err) => toast.error(err.message),
  });

  const form = useForm<TechForm>({
    resolver: zodResolver(techSchema),
    defaultValues: { firstName: "", lastName: "", phone: "" },
  });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Add Your First Tech</h2>
        <p className="text-muted-foreground">
          When a call comes in, OpsPilot will SMS your tech with job details.
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) =>
            createMutation.mutate({
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone,
              type: "EMPLOYEE",
              skillsJson: JSON.stringify(["HVAC"]),
              status: "ACTIVE",
            })
          )}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Carlos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Mendez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Phone *</FormLabel>
                <FormControl>
                  <Input placeholder="8135550201" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Technician"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={onNext}
          >
            Skip for now
          </Button>
        </form>
      </Form>
    </div>
  );
}

// ─── Step 4: Ready ────────────────────────────────────────────────────────────

function ReadyStep({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="space-y-8 text-center">
      <div className="mx-auto w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
        <CheckCircle2 className="w-10 h-10 text-white" />
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-bold">You&apos;re Ready!</h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          OpsPilot is configured and ready to handle your first call.
        </p>
      </div>
      <div className="grid gap-3 text-left max-w-sm mx-auto">
        {[
          "Dashboard shows real-time KPIs",
          "Jobs → create and track service calls",
          "Customers → your full contact list",
          "Settings → configure Twilio & Stripe",
        ].map((item) => (
          <div key={item} className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <Button size="lg" onClick={onFinish} className="w-full max-w-sm">
        <LayoutDashboard className="mr-2 h-5 w-5" />
        Go to Dashboard
      </Button>
    </div>
  );
}

// ─── Main Onboarding Page ─────────────────────────────────────────────────────

function OnboardingContent() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, steps.length));
  const handleFinish = () => {
    localStorage.setItem("opspilot_onboarded", "true");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-8 mx-1 transition-colors",
                      isCompleted ? "bg-green-500" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step label */}
        <p className="text-center text-sm text-muted-foreground">
          Step {currentStep} of {steps.length} — {steps[currentStep - 1]?.description}
        </p>

        {/* Step content */}
        <Card className="shadow-lg">
          <CardContent className="pt-8 pb-8 px-6 sm:px-8">
            {currentStep === 1 && <WelcomeStep onNext={goNext} />}
            {currentStep === 2 && <BusinessStep onNext={goNext} />}
            {currentStep === 3 && <TechnicianStep onNext={goNext} />}
            {currentStep === 4 && <ReadyStep onFinish={handleFinish} />}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          OpsPilot — AI Operations Platform for Trades Businesses
        </p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <TRPCProvider>
      <OnboardingContent />
      <Toaster position="bottom-right" richColors />
    </TRPCProvider>
  );
}
