"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";

const schema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  address: z.string().optional(),
  serviceType: z.string().min(1, "Please select a service"),
  description: z.string().min(5, "Please describe what you need"),
  preferredDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  orgId: string;
}

const SERVICE_TYPES = [
  { value: "HVAC", label: "HVAC — Heating & Cooling" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "ROOFING", label: "Roofing" },
  { value: "OTHER", label: "Other / General Service" },
];

export function BookForm({ orgId }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [jobNumber, setJobNumber] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const res = await fetch("/api/public/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, orgId }),
      });
      const json = (await res.json()) as { success?: boolean; jobNumber?: string; error?: string };
      if (!res.ok) {
        setServerError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setJobNumber(json.jobNumber ?? null);
      setSubmitted(true);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900">Request Received!</h2>
        {jobNumber && (
          <p className="mt-1 font-mono text-sm text-zinc-500">Reference: {jobNumber}</p>
        )}
        <p className="mt-3 text-sm text-zinc-600">
          We&apos;ll call or text you shortly to confirm your appointment. Thank you!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-5">
        {/* Name row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              First Name *
            </label>
            <input
              {...register("firstName")}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Jane"
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Last Name *
            </label>
            <input
              {...register("lastName")}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Smith"
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Phone *
            </label>
            <input
              {...register("phone")}
              type="tel"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="(813) 555-0100"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="jane@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Service Address
          </label>
          <input
            {...register("address")}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="123 Main St, Tampa, FL 33601"
          />
        </div>

        {/* Service type */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Service Type *
          </label>
          <select
            {...register("serviceType")}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select a service...</option>
            {SERVICE_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {errors.serviceType && (
            <p className="mt-1 text-xs text-red-600">{errors.serviceType.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Describe the Problem *
          </label>
          <textarea
            {...register("description")}
            rows={3}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="AC stopped working overnight, making a loud clicking noise..."
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Preferred date */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Preferred Date (optional)
          </label>
          <input
            {...register("preferredDate")}
            type="date"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {serverError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Request Service"
          )}
        </button>
      </form>
    </div>
  );
}
