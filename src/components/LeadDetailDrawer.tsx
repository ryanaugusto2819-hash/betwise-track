import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { type Lead, type PipelineStage, useCasas, useCpaStatus, useCustos, useDepositos, usePaineis } from "@/hooks/useCpaData";
import { brl, dt, dtTime, initials } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Edit, Phone, Trash2, Calendar } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { STAGES, stageById } from "@/lib/stages";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LeadDetailDrawer({ lead, onClose, onEdit }: { lead: Lead | null; onClose: () => void; onEdit: (l: Lead) => void }) {
  const { data: depositos = [] } = useDepositos();
  const { data: cpa = [] } = useCpaStatus();
  const { data: casas = [] } = useCasas();
  const { data: paineis = [] } = usePaineis();
  const { data: custos = [] } = useCustos();
  const qc = useQueryClient();

  const data = useMemo(() => {
    if (!lead) return null;
    const lDeps = depositos.filter((d) => d.lead_id === lead.id);
    const lCpa = cpa.filter((c) => c.lead_id === lead.id);
    const lCustos = custos.filter((c) => c.lead_id === lead.id);
    const totalDep = lDeps.reduce((s, d) => s + d.valor, 0);
    const totalCpa = lCpa.filter((c) => c.status === "pago" || c.status === "aprovado").reduce((s, c) => s + c.valor_cpa, 0);
    const totalCustos = lCustos.reduce((s, c) => s + c.valor, 0);
    const investido = lDeps.filter((d) => d.origem === "proprio").reduce((s, d) => s + d.valor, 0) + totalCustos;
    const lucro = totalCpa - investido;
    const roi = investido > 0 ? (lucro / investido) * 100 : 0;
    const casaName = (id: string) => casas.find((c) => c.id === id)?.nome ?? "—";
    const painelName = (id: string | null) => paineis.find((p) => p.id === id)?.nome ?? "—";

    const byCasaMap = new Map<string, typeof lDeps>();
    lDeps.forEach((d) => {
      if (!byCasaMap.has(d.casa_id)) byCasaMap.set(d.casa_id, []);
      byCasaMap.get(d.casa_id)!.push(d);
    });
    lCpa.forEach((c) => { if (!byCasaMap.has(c.casa_id)) byCasaMap.set(c.casa_id, []); });
    const depsByCasa = Array.from(byCasaMap.entries())
      .map(([casaId, deps]) => ({
        casaId,
        casaNome: casaName(casaId),
        total: deps.reduce((s, d) => s + d.valor, 0),
        deps: deps.sort((a, b) => new Date(a.data_deposito).getTime() - new Date(b.data_deposito).getTime()),
      }))
      .sort((a, b) => b.total - a.total);

    const timeline = [
      ...lDeps.map((d) => ({ kind: "Depósito", date: d.data_deposito, label: `${brl(d.valor)} em ${casaName(d.casa_id)}`, tone: "loss" as const })),
      ...lCpa.map((c) => ({ kind: `CPA ${c.status}`, date: c.data_pagamento ?? c.data_aprovacao ?? lead.data_criacao, label: `${brl(c.valor_cpa)} em ${casaName(c.casa_id)}`, tone: "profit" as const })),
      ...lCustos.map((c) => ({ kind: `Custo: ${c.tipo}`, date: c.data, label: brl(c.valor), tone: "warning" as const })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { lDeps, lCpa, lCustos, totalDep, totalCpa, lucro, roi, casaName, painelName, timeline, depsByCasa };
  }, [lead, depositos, cpa, custos, casas, paineis]);

  if (!lead || !data) return null;

  async function handleDelete() {
    if (!confirm(`Excluir lead ${lead.nome}? Todos os depósitos e CPA relacionados serão removidos.`)) return;
    const { error } = await supabase.from("leads").delete().eq("id", lead.id);
    if (error) return toast.error(error.message);
    toast.success("Lead excluído");
    qc.invalidateQueries();
    onClose();
  }

  async function changeStage(s: PipelineStage) {
    const { error } = await supabase.from("leads").update({ pipeline_stage: s }).eq("id", lead.id);
    if (error) return toast.error(error.message);
    toast.success("Etapa atualizada");
    qc.invalidateQueries({ queryKey: ["leads"] });
  }

  const stageMeta = stageById(lead.pipeline_stage);

  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-profit font-mono text-base font-bold text-primary-foreground">
              {initials(lead.nome)}
            </div>
            <div className="flex-1">
              <SheetTitle className="text-left text-xl">{lead.nome}</SheetTitle>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />{lead.telefone}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusPill status={lead.status} />
                {lead.origem && <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">· {lead.origem}</span>}
              </div>
              <div className="mt-3">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Etapa do pipeline</div>
                <Select value={lead.pipeline_stage} onValueChange={(v) => changeStage(v as PipelineStage)}>
                  <SelectTrigger className="h-9 bg-surface-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", stageMeta.dot)} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                          {s.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Depositado</div>
            <div className="mt-1 font-mono text-lg font-bold tabular">{brl(data.totalDep)}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">CPA Recebido</div>
            <div className="mt-1 font-mono text-lg font-bold tabular text-profit">{brl(data.totalCpa)}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Lucro</div>
            <div className={cn("mt-1 font-mono text-lg font-bold tabular", data.lucro >= 0 ? "text-profit" : "text-loss")}>{brl(data.lucro)}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">ROI</div>
            <div className={cn("mt-1 font-mono text-lg font-bold tabular", data.roi >= 0 ? "text-profit" : "text-loss")}>{data.roi.toFixed(1)}%</div>
          </div>
        </div>

        {lead.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {lead.tags.map((t) => (
              <span key={t} className="rounded-md bg-accent/15 px-2 py-1 text-xs font-medium text-accent">{t}</span>
            ))}
          </div>
        )}

        {lead.observacoes && (
          <div className="mt-4 rounded-lg border border-border bg-surface-2 p-3 text-sm">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Observações</div>
            {lead.observacoes}
          </div>
        )}

        <div className="mt-6">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">CPA por casa</div>
          <div className="space-y-1.5">
            {data.lCpa.length === 0 && <div className="text-sm text-muted-foreground">Nenhum CPA registrado.</div>}
            {data.lCpa.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{data.casaName(c.casa_id)}</div>
                  <div className="text-xs text-muted-foreground">{data.painelName(c.painel_id)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono tabular text-profit">{brl(c.valor_cpa)}</span>
                  <StatusPill status={c.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Linha do tempo</div>
          <div className="space-y-2">
            {data.timeline.length === 0 && <div className="text-sm text-muted-foreground">Sem eventos.</div>}
            {data.timeline.map((e, i) => (
              <div key={i} className="flex items-start gap-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm">
                <div className={cn("mt-1.5 h-2 w-2 rounded-full", e.tone === "profit" && "bg-profit", e.tone === "loss" && "bg-loss", e.tone === "warning" && "bg-warning")} />
                <div className="flex-1">
                  <div className="font-medium">{e.kind}</div>
                  <div className="text-xs text-muted-foreground">{e.label}</div>
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">{dtTime(e.date)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button onClick={() => onEdit(lead)} className="flex-1 gap-2"><Edit className="h-4 w-4" />Editar</Button>
          <Button variant="destructive" onClick={handleDelete} className="gap-2"><Trash2 className="h-4 w-4" />Excluir</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
