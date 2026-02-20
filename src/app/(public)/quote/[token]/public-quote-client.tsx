"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, PenLine, RotateCcw } from "lucide-react";

interface Props {
  quoteId: string;
  publicToken: string;
  quoteNumber: string;
  orgName: string;
  orgPhone?: string;
}

type Step = "initial" | "signing" | "submitted";

export function PublicQuoteClient({ quoteId, publicToken, quoteNumber, orgName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<Step>("initial");
  const [action, setAction] = useState<"accept" | "decline" | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    lastPos.current = getPos(e, canvas);
  }, []);

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      e.preventDefault();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pos = getPos(e, canvas);
      if (!lastPos.current) return;

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#18181b";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      lastPos.current = pos;
    },
    [isDrawing]
  );

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  const handleDecline = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/quote/${publicToken}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline", quoteId }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to decline quote");
      }
      setStep("submitted");
      setAction("decline");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!hasDrawn) {
      setError("Please sign above before accepting.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const canvas = canvasRef.current;
      const signatureData = canvas ? canvas.toDataURL("image/png") : undefined;

      const res = await fetch(`/api/public/quote/${publicToken}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", quoteId, signatureData }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to accept quote");
      }
      setStep("submitted");
      setAction("accept");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (step === "submitted") {
    return (
      <div className="border-t border-zinc-100 px-6 py-8 text-center">
        {action === "accept" ? (
          <>
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold text-zinc-900">Quote Accepted!</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Thank you! We&apos;ll be in touch to schedule your service.
            </p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto mb-3 h-12 w-12 text-zinc-400" />
            <h3 className="text-lg font-semibold text-zinc-900">Quote Declined</h3>
            <p className="mt-1 text-sm text-zinc-500">
              No problem. Contact {orgName} if you have questions.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-100 px-6 py-6">
      {step === "initial" && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-zinc-700">
            Review the quote above and choose to accept or decline.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => setStep("signing")}
            >
              <PenLine className="mr-2 h-4 w-4" />
              Accept Quote — Sign Below
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDecline}
              disabled={loading}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Decline
            </Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}

      {step === "signing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-700">
              Sign below to accept quote {quoteNumber}:
            </p>
            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700"
            >
              <RotateCcw className="h-3 w-3" />
              Clear
            </button>
          </div>
          <div className="relative rounded-lg border-2 border-dashed border-zinc-300 bg-white">
            <canvas
              ref={canvasRef}
              width={560}
              height={160}
              className="w-full touch-none rounded-lg"
              style={{ cursor: "crosshair" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            {!hasDrawn && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-zinc-300">Sign here</p>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                clearCanvas();
                setStep("initial");
                setError(null);
              }}
            >
              Back
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleAccept}
              disabled={loading || !hasDrawn}
            >
              {loading ? "Submitting..." : "Submit & Accept Quote"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
