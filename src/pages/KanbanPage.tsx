import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, X } from "lucide-react";
import { useCasas, useCpaStatus, useCustos, useDepositos, useLeads, type Lead, type PipelineStage } from "@/hooks/useCpaData";
import { brl } from "@/lib/format";
import { LeadDialog } from "@/components/LeadDialog";
import { LeadDetailDrawer } from "@/components/LeadDetailDrawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildLeadData, LeadKanbanCard } from "@/components/LeadKanbanCard";
import { cn } from "@/lib/utils";
import { STAGES } from "@/lib/stages";

export default function KanbanPage() {
  const { data: leads = [] } = useLeads();
  const { data: depositos = [] } = useDepositos();
  const { data: cpa = [] } = useCpaStatus();
  const { data: casas = [] } = useCasas();
  const { data: custos = [] } = useCustos();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [casaFilter, setCasaFilter] = useState<string>("all");

  const allData = useMemo(
    () => buildLeadData(leads, depositos, cpa, custos, casas),
    [leads, depositos, cpa, custos, casas]
  );

  const filtered = useMemo(() => {
    return allData.filter((d) => {
      if (casaFilter !== "all" && !d.casas.some((c) => c.id === casaFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!d.lead.nome.toLowerCase().includes(s) && !d.lead.telefone.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [allData, casaFilter, search]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((s) => [s.id, [] as typeof filtered])) as Record<PipelineStage, typeof filtered>;
    filtered.forEach((d) => {
      const stage = (d.lead.pipeline_stage ?? "cadastro_pendente") as PipelineStage;
      (map[stage] ?? map.cadastro_pendente).push(d);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => b.lucro - a.lucro));
    return map;
  }, [filtered]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, d) => {
        acc.lucro += d.lucro;
        acc.investido += d.investido;
        acc.cpa += d.totalCpaPago + d.totalCpaAprovado;
        return acc;
      },
      { lucro: 0, investido: 0, cpa: 0 }
    );
  }, [filtered]);

  return (
    <>
      <PageHeader
        title="Pipeline de Leads"
        subtitle={`${filtered.length} leads · Lucro líquido ${brl(totals.lucro)} · CPA recebido ${brl(totals.cpa)}`}
      >
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Lead
        </Button>
      </PageHeader>

      <div className="glass-card mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone…" className="border-0 bg-surface-2 pl-9" />
        </div>
        <Select value={casaFilter} onValueChange={setCasaFilter}>
          <SelectTrigger className="w-[180px] bg-surface-2 border-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as casas</SelectItem>
            {casas.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || casaFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setCasaFilter("all"); }}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="-mx-4 overflow-x-auto pb-4 md:-mx-6 lg:-mx-8">
        <div className="flex gap-3 px-4 md:px-6 lg:px-8" style={{ minWidth: "min-content" }}>
          {STAGES.map((stage) => {
            const items = grouped[stage.id];
            const stageTotal = items.reduce((s, d) => s + d.lucro, 0);
            return (
              <div key={stage.id} className="flex w-[300px] shrink-0 flex-col">
                <div className="relative overflow-hidden rounded-t-xl border border-b-0 border-border bg-card p-3">
                  <div className={cn("absolute inset-0 -z-10 bg-gradient-to-b opacity-60", stage.accent)} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full animate-pulse-glow", stage.dot)} />
                      <h3 className="font-mono text-xs font-bold uppercase tracking-wider">{stage.label}</h3>
                    </div>
                    <span className="rounded-full bg-surface-3 px-2 py-0.5 font-mono text-[11px] font-semibold tabular">
                      {items.length}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{stage.description}</span>
                    <span className={cn("font-mono font-semibold tabular", stageTotal >= 0 ? "text-profit" : "text-loss")}>
                      {brl(stageTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-2 rounded-b-xl border border-t-0 border-border bg-surface/30 p-2 min-h-[400px]">
                  {items.length === 0 && (
                    <div className="flex h-32 items-center justify-center text-center text-[11px] text-muted-foreground">
                      Nenhum lead nesta etapa
                    </div>
                  )}
                  {items.map((d) => (
                    <LeadKanbanCard key={d.lead.id} data={d} onOpen={() => setDrawerLead(d.lead)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <LeadDialog open={open} onOpenChange={setOpen} lead={editing} />
      <LeadDetailDrawer
        lead={drawerLead}
        onClose={() => setDrawerLead(null)}
        onEdit={(l) => { setEditing(l); setDrawerLead(null); setOpen(true); }}
      />
    </>
  );
}
