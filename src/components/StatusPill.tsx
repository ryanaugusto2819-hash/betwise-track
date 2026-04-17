import { cn } from "@/lib/utils";

const variants = {
  ativo: "bg-profit/15 text-profit border-profit/30",
  pausado: "bg-warning/15 text-warning border-warning/30",
  bloqueado: "bg-loss/15 text-loss border-loss/30",
  pendente: "bg-warning/15 text-warning border-warning/30",
  aprovado: "bg-info/15 text-info border-info/30",
  pago: "bg-profit/15 text-profit border-profit/30",
  recusado: "bg-loss/15 text-loss border-loss/30",
  feito: "bg-profit/15 text-profit border-profit/30",
  erro: "bg-loss/15 text-loss border-loss/30",
  CPA: "bg-primary/15 text-primary border-primary/30",
  RevShare: "bg-info/15 text-info border-info/30",
  Hibrido: "bg-accent/15 text-accent border-accent/30",
  lead: "bg-info/15 text-info border-info/30",
  proprio: "bg-warning/15 text-warning border-warning/30",
  default: "bg-surface-3 text-muted-foreground border-border",
} as const;

interface StatusPillProps {
  status: string;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const v = (variants as any)[status] ?? variants.default;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        v,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
