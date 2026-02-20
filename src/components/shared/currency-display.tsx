import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  cents: number;
  className?: string;
  showSign?: boolean;
}

export function CurrencyDisplay({ cents, className, showSign }: CurrencyDisplayProps) {
  const formatted = formatCurrency(cents);
  return (
    <span className={cn("tabular-nums", className)}>
      {showSign && cents > 0 ? `+${formatted}` : formatted}
    </span>
  );
}
