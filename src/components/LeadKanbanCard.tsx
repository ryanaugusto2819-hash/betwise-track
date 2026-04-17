import { GripVertical, Phone, TrendingUp, TrendingDown, ArrowDownToLine, Trophy, Tag as TagIcon, Calendar, Loader2, Plus } from "lucide-react";
import { brl, dt, initials, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lead, Casa, Deposito, CpaRow, Custo, PipelineStage } from "@/hooks/useCpaData";
import { STAGES, stageById } from "@/lib/stages";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDraggable } from "@dnd-kit/core";
import { QuickDepositoDialog } from "@/components/QuickDepositoDialog";
import { EditDepositoPopover } from "@/components/EditDepositoPopover";
import { EditCasaPopover } from "@/components/EditCasaPopover";
import { useCasas } from "@/hooks/useCpaData";

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
  depositosByCasa: { casaId: string; casaNome: string; total: number; deps: Deposito[] }[];
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

    const byCasaMap = new Map<string, Deposito[]>();
    lDeps.forEach((d) => {
      if (!byCasaMap.has(d.casa_id)) byCasaMap.set(d.casa_id, []);
      byCasaMap.get(d.casa_id)!.push(d);
    });
    lCpa.forEach((c) => { if (!byCasaMap.has(c.casa_id)) byCasaMap.set(c.casa_id, []); });

    const depositosByCasa = Array.from(byCasaMap.entries())
      .map(([casaId, deps]) => ({
        casaId,
        casaNome: casaMap.get(casaId)?.nome ?? "Casa removida",
        total: deps.reduce((s, d) => s + d.valor, 0),
        deps: deps.sort((a, b) => new Date(a.data_deposito).getTime() - new Date(b.data_deposito).getTime()),
      }))
      .sort((a, b) => b.total - a.total);

    const casasUsadas = depositosByCasa.map((c) => ({ id: c.casaId, nome: c.casaNome }));

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
      depositosByCasa,
      ultimoDeposito: lDeps.length > 0
        ? lDeps.reduce((max, d) => (new Date(d.data_deposito) > new Date(max) ? d.data_deposito : max), lDeps[0].data_deposito)
        : null,
      cpaCount,
    };
  });
}

interface Props {
  data: LeadKanbanData;
  onOpen: () => void;
}

export function LeadKanbanCard({ data, onOpen }: Props) {
  const { lead, totalDep, totalCpaPago, totalCpaAprovado, totalCpaPendente, investido, lucro, roi, depositosByCasa, ultimoDeposito, cpaCount } = data;
  const positivo = lucro >= 0;
  const [savingStage, setSavingStage] = useState(false);
  const [depDialog, setDepDialog] = useState<{ open: boolean; casaId?: string; numero: number }>({ open: false, numero: 1 });
  const qc = useQueryClient();
  const { data: allCasas = [] } = useCasas();
  const stageMeta = stageById(lead.pipeline_stage);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  async function changeStage(s: PipelineStage) {
    setSavingStage(true);
    const { error } = await supabase.from("leads").update({ pipeline_stage: s }).eq("id", lead.id);
    setSavingStage(false);
    if (error) return toast.error(error.message);
    toast.success(`Movido para ${stageById(s).label}`);
    qc.invalidateQueries({ queryKey: ["leads"] });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border bg-card text-left transition-shadow",
        "hover:border-primary/40 hover:shadow-glow",
        positivo ? "border-border" : "border-loss/30",
        isDragging && "opacity-50 shadow-glow"
      )}
    >
      <div className={cn("h-1 w-full", positivo ? "bg-gradient-profit" : "bg-gradient-loss")} />

      <div className="space-y-3 p-3">
        {/* Header com drag handle */}
        <div className="flex items-start gap-2">
          <button
            ref={undefined}
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab touch-none rounded p-0.5 text-muted-foreground opacity-50 transition-opacity hover:bg-surface-2 hover:opacity-100 active:cursor-grabbing"
            aria-label="Arrastar"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            onClick={onOpen}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold transition-transform hover:scale-105",
              positivo ? "bg-gradient-profit text-primary-foreground" : "bg-gradient-loss text-loss-foreground"
            )}
            aria-label="Abrir detalhes"
          >
            {initials(lead.nome)}
          </button>
          <button onClick={onOpen} className="min-w-0 flex-1 text-left">
            <div className="truncate text-sm font-semibold leading-tight">{lead.nome}</div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Phone className="h-2.5 w-2.5" />
              <span className="truncate font-mono">{lead.telefone}</span>
            </div>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "shrink-0 rounded-md border border-border bg-surface-2 px-1.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors hover:bg-surface-3",
                  stageMeta.text
                )}
                aria-label="Mudar etapa"
                onClick={(e) => e.stopPropagation()}
              >
                {savingStage ? <Loader2 className="h-3 w-3 animate-spin" /> : stageMeta.short}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {STAGES.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => changeStage(s.id)}
                  className={cn("gap-2 font-mono text-xs", s.id === lead.pipeline_stage && "bg-surface-2")}
                >
                  <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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

        {/* Depósitos por casa — SEMPRE VISÍVEL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Depósitos por casa</div>
            <button
              onClick={() => setDepDialog({ open: true, numero: 1 })}
              className="flex items-center gap-1 rounded font-mono text-[9px] uppercase tracking-wider text-primary transition-opacity hover:opacity-70"
              title="Adicionar depósito"
            >
              <Plus className="h-2.5 w-2.5" /> Casa
            </button>
          </div>
          {depositosByCasa.length === 0 ? (
            <button
              onClick={() => setDepDialog({ open: true, numero: 1 })}
              className="w-full rounded-md border border-dashed border-primary/40 bg-primary/5 py-2 text-center font-mono text-[10px] font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary/10"
            >
              + Adicionar casa/depósito
            </button>
          ) : (
            depositosByCasa.map((c) => (
              <div key={c.casaId} className="rounded-md border border-border/40 bg-surface-2/30 p-2">
                <div className="flex items-center justify-between border-b border-border/30 pb-1">
                  <span className="truncate text-[11px] font-semibold">{c.casaNome}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold tabular">{brl(c.total)}</span>
                    <button
                      onClick={() => setDepDialog({ open: true, casaId: c.casaId, numero: c.deps.length + 1 })}
                      className="flex h-4 w-4 items-center justify-center rounded bg-primary/15 text-primary transition-colors hover:bg-primary/30"
                      title={`Adicionar depósito em ${c.casaNome}`}
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
                {c.deps.length === 0 ? (
                  <div className="pt-1 text-center font-mono text-[10px] text-muted-foreground">Sem depósitos</div>
                ) : (
                  <ul className="mt-1 space-y-0.5">
                    {c.deps.map((d, i) => (
                      <li key={d.id} className="flex items-center justify-between font-mono text-[10px]">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className={cn(
                            "inline-flex h-3.5 w-3.5 items-center justify-center rounded text-[8px] font-bold",
                            d.origem === "proprio" ? "bg-warning/20 text-warning" : "bg-info/20 text-info"
                          )}>
                            {i + 1}
                          </span>
                          <Calendar className="h-2.5 w-2.5" />
                          {dt(d.data_deposito)}
                        </span>
                        <span className="tabular font-semibold">{brl(d.valor)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
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

        {lead.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lead.tags.slice(0, 3).map((t) => (
              <span key={t} className="inline-flex items-center gap-0.5 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                <TagIcon className="h-2 w-2" />{t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1 font-mono">
            <Calendar className="h-2.5 w-2.5" /> Últ. {dt(ultimoDeposito)}
          </span>
          <button
            onClick={onOpen}
            className="font-mono uppercase tracking-wider text-primary transition-colors hover:text-primary/80"
          >
            Detalhes →
          </button>
        </div>
      </div>

      <QuickDepositoDialog
        open={depDialog.open}
        onOpenChange={(o) => setDepDialog((s) => ({ ...s, open: o }))}
        leadId={lead.id}
        leadNome={lead.nome}
        defaultCasaId={depDialog.casaId}
        suggestedNumero={depDialog.numero}
      />
    </div>
  );
}
