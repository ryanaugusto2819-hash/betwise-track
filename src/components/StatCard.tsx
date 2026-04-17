import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus, type LucideIcon } from "lucide-react";

type Tone = "default" | "profit" | "loss" | "warning" | "info";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  delta?: number; // percent
  icon?: LucideIcon;
  tone?: Tone;
  className?: string;
}

const toneRing: Record<Tone, string> = {
  default: "before:bg-muted-foreground/40",
  profit: "before:bg-profit",
  loss: "before:bg-loss",
  warning: "before:bg-warning",
  info: "before:bg-info",
};

const toneIconBg: Record<Tone, string> = {
  default: "bg-surface-3 text-foreground",
  profit: "bg-profit/15 text-profit",
  loss: "bg-loss/15 text-loss",
  warning: "bg-warning/15 text-warning",
  info: "bg-info/15 text-info",
};

export function StatCard({ label, value, hint, delta, icon: Icon, tone = "default", className }: StatCardProps) {
  const deltaPositive = (delta ?? 0) > 0;
  const deltaNeutral = !delta || delta === 0;
  const DeltaIcon = deltaNeutral ? Minus : deltaPositive ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "glass-card relative overflow-hidden p-5",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:content-['']",
        toneRing[tone],
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
          <div className={cn("stat-value", tone === "profit" && "text-profit", tone === "loss" && "text-loss")}>{value}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
        {Icon && (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", toneIconBg[tone])}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
        )}
      </div>
      {delta !== undefined && (
        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular",
            deltaNeutral && "bg-surface-3 text-muted-foreground",
            !deltaNeutral && deltaPositive && "bg-profit/15 text-profit",
            !deltaNeutral && !deltaPositive && "bg-loss/15 text-loss"
          )}
        >
          <DeltaIcon className="h-3 w-3" />
          {delta > 0 ? "+" : ""}
          {delta.toFixed(1)}%
        </div>
      )}
    </div>
  );
}
