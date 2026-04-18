import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, X } from "lucide-react";
import { useCadastros, useCasas, useCpaStatus, useCustos, useDepositos, useLeads, type Lead, type PipelineStage } from "@/hooks/useCpaData";
import { brl } from "@/lib/format";
import { LeadDialog } from "@/components/LeadDialog";
import { LeadDetailDrawer } from "@/components/LeadDetailDrawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildLeadData, LeadKanbanCard } from "@/components/LeadKanbanCard";
import { cn } from "@/lib/utils";
import { STAGES } from "@/lib/stages";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function DroppableColumn({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && "bg-primary/5 ring-2 ring-primary/40")}
    >
      {children}
    </div>
  );
}

export default function KanbanPage() {
  const { data: leads = [] } = useLeads();
  const { data: depositos = [] } = useDepositos();
  const { data: cpa = [] } = useCpaStatus();
  const { data: casas = [] } = useCasas();
  const { data: custos = [] } = useCustos();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [casaFilter, setCasaFilter] = useState<string>("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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

  const activeData = activeId ? allData.find((d) => d.lead.id === activeId) : null;

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const leadId = String(active.id);
    const newStage = String(over.id) as PipelineStage;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.pipeline_stage === newStage) return;
    if (!STAGES.find((s) => s.id === newStage)) return;

    const { error } = await supabase.from("leads").update({ pipeline_stage: newStage }).eq("id", leadId);
    if (error) return toast.error(error.message);
    toast.success(`Movido para ${STAGES.find((s) => s.id === newStage)?.label}`);
    qc.invalidateQueries({ queryKey: ["leads"] });
  }

  return (
    <>
      <PageHeader
        title="Pipeline de Leads"
        subtitle={`${filtered.length} leads · Lucro líquido ${brl(totals.lucro)} · CPA recebido ${brl(totals.cpa)} · Arraste os cards entre colunas`}
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

      <DndContext
        sensors={sensors}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
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

                  <DroppableColumn
                    id={stage.id}
                    className="flex-1 space-y-2 rounded-b-xl border border-t-0 border-border bg-surface/30 p-2 min-h-[400px] transition-all"
                  >
                    {items.length === 0 && (
                      <div className="flex h-32 items-center justify-center text-center text-[11px] text-muted-foreground">
                        Solte um lead aqui
                      </div>
                    )}
                    {items.map((d) => (
                      <LeadKanbanCard key={d.lead.id} data={d} onOpen={() => setDrawerLead(d.lead)} />
                    ))}
                  </DroppableColumn>
                </div>
              );
            })}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeData ? (
            <div className="w-[284px] rotate-2 opacity-90">
              <LeadKanbanCard data={activeData} onOpen={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <LeadDialog open={open} onOpenChange={setOpen} lead={editing} />
      <LeadDetailDrawer
        lead={drawerLead}
        onClose={() => setDrawerLead(null)}
        onEdit={(l) => { setEditing(l); setDrawerLead(null); setOpen(true); }}
      />
    </>
  );
}
