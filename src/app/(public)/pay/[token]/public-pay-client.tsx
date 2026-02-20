"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, CreditCard, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  invoiceId: string;
  publicToken: string;
  invoiceNumber: string;
  balanceDueCents: number;
  customerEmail: string;
  hasStripeKeys: boolean;
}

type State = "idle" | "loading" | "paid" | "error";

export function PublicPayClient({
  publicToken,
  invoiceNumber,
  balanceDueCents,
  hasStripeKeys,
}: Props) {
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStripeCheckout = async () => {
    setState("loading");
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/public/pay/${publicToken}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create checkout session");
      }
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setState("error");
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleSimulatePayment = async () => {
    setState("loading");
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/public/pay/${publicToken}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to simulate payment");
      }
      setState("paid");
    } catch (err) {
      setState("error");
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (state === "paid") {
    return (
      <div className="border-t border-zinc-100 px-6 py-8 text-center">
        <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
        <h3 className="text-lg font-semibold text-zinc-900">Payment Successful!</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Thank you! Invoice {invoiceNumber} has been paid.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-100 px-6 py-6">
      <div className="space-y-4">
        <div className="rounded-lg bg-zinc-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-600">Amount due</span>
            <span className="text-xl font-bold text-zinc-900">
              {formatCurrency(balanceDueCents)}
            </span>
          </div>
        </div>

        {errorMessage && (
          <p className="text-sm text-red-500">{errorMessage}</p>
        )}

        {hasStripeKeys ? (
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            size="lg"
            onClick={handleStripeCheckout}
            disabled={state === "loading"}
          >
            {state === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to payment...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay {formatCurrency(balanceDueCents)} Securely
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <strong>Demo mode:</strong> Stripe payments are not configured. Use the button below to
              simulate a successful payment.
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={handleSimulatePayment}
              disabled={state === "loading"}
            >
              {state === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Simulate Payment ({formatCurrency(balanceDueCents)})
                </>
              )}
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-zinc-400">
          {hasStripeKeys
            ? "Secured by Stripe. Your payment info is encrypted."
            : "This is a demo. No real payment will be processed."}
        </p>
      </div>
    </div>
  );
}
