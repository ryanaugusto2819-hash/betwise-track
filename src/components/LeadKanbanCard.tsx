import { Phone, TrendingUp, TrendingDown, ArrowDownToLine, Trophy, Tag as TagIcon, Calendar } from "lucide-react";
import { brl, dt, initials, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lead, Casa, Deposito, CpaRow, Custo } from "@/hooks/useCpaData";

export type LeadKanbanData = {
  lead: Lead;
  totalDep: number;
  totalDepProprio: number;
  totalCpaPago: number;
  totalCpaAprovado: number;
  totalCpaPendente: number;
  totalCustos: number;
  investido: number;
  lucro: number;
  roi: number;
  casas: { id: string; nome: string }[];
  ultimoDeposito: string | null;
  cpaCount: { pendente: number; aprovado: number; pago: number; recusado: number };
};

export function buildLeadData(
  leads: Lead[],
  depositos: Deposito[],
  cpa: CpaRow[],
  custos: Custo[],
  casas: Casa[]
): LeadKanbanData[] {
  const casaMap = new Map(casas.map((c) => [c.id, c]));
  return leads.map((lead) => {
    const lDeps = depositos.filter((d) => d.lead_id === lead.id);
    const lCpa = cpa.filter((c) => c.lead_id === lead.id);
    const lCustos = custos.filter((c) => c.lead_id === lead.id);

    const totalDep = lDeps.reduce((s, d) => s + d.valor, 0);
    const totalDepProprio = lDeps.filter((d) => d.origem === "proprio").reduce((s, d) => s + d.valor, 0);
    const totalCustos = lCustos.reduce((s, c) => s + c.valor, 0);
    const totalCpaPago = lCpa.filter((c) => c.status === "pago").reduce((s, c) => s + c.valor_cpa, 0);
    const totalCpaAprovado = lCpa.filter((c) => c.status === "aprovado").reduce((s, c) => s + c.valor_cpa, 0);
    const totalCpaPendente = lCpa.filter((c) => c.status === "pendente").reduce((s, c) => s + c.valor_cpa, 0);
    const investido = totalDepProprio + totalCustos;
    const recebido = totalCpaPago + totalCpaAprovado;
    const lucro = recebido - investido;
    const roi = investido > 0 ? (lucro / investido) * 100 : 0;

    const casaIds = new Set<string>();
    lDeps.forEach((d) => casaIds.add(d.casa_id));
    lCpa.forEach((c) => casaIds.add(c.casa_id));
    const casasUsadas = Array.from(casaIds)
      .map((id) => ({ id, nome: casaMap.get(id)?.nome ?? "?" }))
      .filter((c) => c.nome !== "?");

    const cpaCount = {
      pendente: lCpa.filter((c) => c.status === "pendente").length,
      aprovado: lCpa.filter((c) => c.status === "aprovado").length,
      pago: lCpa.filter((c) => c.status === "pago").length,
      recusado: lCpa.filter((c) => c.status === "recusado").length,
    };

    return {
      lead,
      totalDep,
      totalDepProprio,
      totalCpaPago,
      totalCpaAprovado,
      totalCpaPendente,
      totalCustos,
      investido,
      lucro,
      roi,
      casas: casasUsadas,
      ultimoDeposito: lDeps[0]?.data_deposito ?? null,
      cpaCount,
    };
  });
}

interface Props {
  data: LeadKanbanData;
  onClick: () => void;
}

export function LeadKanbanCard({ data, onClick }: Props) {
  const { lead, totalDep, totalCpaPago, totalCpaAprovado, totalCpaPendente, investido, lucro, roi, casas, ultimoDeposito, cpaCount } = data;
  const positivo = lucro >= 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border bg-card text-left transition-all",
        "hover:border-primary/40 hover:shadow-glow",
        positivo ? "border-border" : "border-loss/30"
      )}
    >
      {/* Top accent bar */}
      <div
        className={cn(
          "h-1 w-full",
          positivo ? "bg-gradient-profit" : "bg-gradient-loss"
        )}
      />

      <div className="space-y-3 p-3">
        {/* Header */}
        <div className="flex items-start gap-2.5">
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold",
            positivo ? "bg-gradient-profit text-primary-foreground" : "bg-gradient-loss text-loss-foreground"
          )}>
            {initials(lead.nome)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold leading-tight">{lead.nome}</div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Phone className="h-2.5 w-2.5" />
              <span className="truncate font-mono">{lead.telefone}</span>
            </div>
          </div>
        </div>

        {/* Lucro destaque */}
        <div className="rounded-lg border border-border/60 bg-surface-2/60 p-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Lucro</span>
            <div className={cn("flex items-center gap-1 font-mono text-[10px] font-semibold tabular", positivo ? "text-profit" : "text-loss")}>
              {positivo ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              ROI {pct(roi, 0)}
            </div>
          </div>
          <div className={cn("mt-0.5 font-mono text-lg font-bold tabular leading-none", positivo ? "text-profit" : "text-loss")}>
            {brl(lucro)}
          </div>
        </div>

        {/* Grid mini stats */}
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="rounded-md bg-surface-2/40 px-2 py-1.5">
            <div className="flex items-center gap-1 text-muted-foreground">
              <ArrowDownToLine className="h-2.5 w-2.5" />
              <span className="font-mono text-[9px] uppercase">Depósitos</span>
            </div>
            <div className="font-mono font-semibold tabular">{brl(totalDep)}</div>
          </div>
          <div className="rounded-md bg-surface-2/40 px-2 py-1.5">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Trophy className="h-2.5 w-2.5" />
              <span className="font-mono text-[9px] uppercase">Investido</span>
            </div>
            <div className="font-mono font-semibold tabular">{brl(investido)}</div>
          </div>
        </div>

        {/* CPA breakdown */}
        <div className="space-y-1">
          <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">CPA</div>
          <div className="flex flex-wrap gap-1">
            {cpaCount.pago > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-profit/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-profit">
                <span className="h-1 w-1 rounded-full bg-profit" />{cpaCount.pago} pago · {brl(totalCpaPago)}
              </span>
            )}
            {cpaCount.aprovado > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-info/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-info">
                <span className="h-1 w-1 rounded-full bg-info" />{cpaCount.aprovado} aprov · {brl(totalCpaAprovado)}
              </span>
            )}
            {cpaCount.pendente > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-warning">
                <span className="h-1 w-1 rounded-full bg-warning" />{cpaCount.pendente} pend · {brl(totalCpaPendente)}
              </span>
            )}
            {cpaCount.recusado > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-loss/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-loss">
                <span className="h-1 w-1 rounded-full bg-loss" />{cpaCount.recusado} rec
              </span>
            )}
            {cpaCount.pago + cpaCount.aprovado + cpaCount.pendente + cpaCount.recusado === 0 && (
              <span className="font-mono text-[10px] text-muted-foreground">—</span>
            )}
          </div>
        </div>

        {/* Casas */}
        {casas.length > 0 && (
          <div className="space-y-1">
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{casas.length} casa{casas.length > 1 ? "s" : ""}</div>
            <div className="flex flex-wrap gap-1">
              {casas.slice(0, 4).map((c) => (
                <span key={c.id} className="inline-flex items-center rounded-md border border-border bg-surface-3 px-1.5 py-0.5 font-mono text-[10px]">
                  {c.nome}
                </span>
              ))}
              {casas.length > 4 && (
                <span className="font-mono text-[10px] text-muted-foreground">+{casas.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {lead.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lead.tags.slice(0, 3).map((t) => (
              <span key={t} className="inline-flex items-center gap-0.5 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                <TagIcon className="h-2 w-2" />{t}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1 font-mono">
            <Calendar className="h-2.5 w-2.5" /> Últ. {dt(ultimoDeposito)}
          </span>
          <span className="font-mono uppercase">{lead.status}</span>
        </div>
      </div>
    </button>
  );
}
