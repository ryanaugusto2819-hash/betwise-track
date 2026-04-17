import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Phone, X, Tag as TagIcon } from "lucide-react";
import { useCasas, useCpaStatus, useCustos, useDepositos, useLeads, type Lead } from "@/hooks/useCpaData";
import { brl, dt, initials } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { LeadDialog } from "@/components/LeadDialog";
import { LeadDetailDrawer } from "@/components/LeadDetailDrawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function LeadsPage() {
  const { data: leads = [] } = useLeads();
  const { data: depositos = [] } = useDepositos();
  const { data: cpa = [] } = useCpaStatus();
  const { data: casas = [] } = useCasas();
  const { data: custos = [] } = useCustos();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [casaFilter, setCasaFilter] = useState<string>("all");

  const enriched = useMemo(() => {
    return leads.map((l) => {
      const lDeps = depositos.filter((d) => d.lead_id === l.id);
      const lCpa = cpa.filter((c) => c.lead_id === l.id);
      const lCustos = custos.filter((c) => c.lead_id === l.id);
      const totalDep = lDeps.reduce((s, d) => s + d.valor, 0);
      const totalCpa = lCpa.filter((c) => c.status === "pago" || c.status === "aprovado").reduce((s, c) => s + c.valor_cpa, 0);
      const totalCustos = lCustos.reduce((s, c) => s + c.valor, 0);
      const investido = lDeps.filter((d) => d.origem === "proprio").reduce((s, d) => s + d.valor, 0) + totalCustos;
      const lucro = totalCpa - investido;
      const casasIds = new Set(lDeps.map((d) => d.casa_id).concat(lCpa.map((c) => c.casa_id)));
      const ultimo = lDeps[0]?.data_deposito ?? null;
      return { ...l, totalDep, totalCpa, lucro, casasCount: casasIds.size, ultimo };
    });
  }, [leads, depositos, cpa, custos]);

  const filtered = enriched.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (casaFilter !== "all") {
      const inCasa = depositos.some((d) => d.lead_id === l.id && d.casa_id === casaFilter) || cpa.some((c) => c.lead_id === l.id && c.casa_id === casaFilter);
      if (!inCasa) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      if (!l.nome.toLowerCase().includes(s) && !l.telefone.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <>
      <PageHeader title="Leads" subtitle={`${filtered.length} de ${leads.length} leads`}>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Novo Lead
        </Button>
      </PageHeader>

      <div className="glass-card mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone…" className="border-0 bg-surface-2 pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-surface-2 border-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="pausado">Pausado</SelectItem>
              <SelectItem value="bloqueado">Bloqueado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={casaFilter} onValueChange={setCasaFilter}>
            <SelectTrigger className="w-[160px] bg-surface-2 border-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas casas</SelectItem>
              {casas.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || statusFilter !== "all" || casaFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); setCasaFilter("all"); }}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/50 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Casas</th>
                <th className="px-4 py-3 text-right">Depositado</th>
                <th className="px-4 py-3 text-right">CPA Gerado</th>
                <th className="px-4 py-3 text-right">Lucro</th>
                <th className="px-4 py-3">Último Dep.</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    Nenhum lead encontrado. Clique em "Novo Lead" para começar.
                  </td>
                </tr>
              )}
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setDrawerLead(l)}
                  className="cursor-pointer border-b border-border/50 transition-colors hover:bg-surface-2/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-profit font-mono text-xs font-bold text-primary-foreground">
                        {initials(l.nome)}
                      </div>
                      <div>
                        <div className="font-semibold">{l.nome}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {l.telefone}
                        </div>
                        {l.tags?.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {l.tags.map((t) => (
                              <span key={t} className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                                <TagIcon className="h-2.5 w-2.5" />{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono tabular">{l.casasCount}</td>
                  <td className="px-4 py-3 text-right font-mono tabular">{brl(l.totalDep)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular text-profit">{brl(l.totalCpa)}</td>
                  <td className={cn("px-4 py-3 text-right font-mono tabular font-semibold", l.lucro >= 0 ? "text-profit" : "text-loss")}>
                    {brl(l.lucro)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular">{dt(l.ultimo)}</td>
                  <td className="px-4 py-3"><StatusPill status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <LeadDialog open={open} onOpenChange={setOpen} lead={editing} />
      <LeadDetailDrawer lead={drawerLead} onClose={() => setDrawerLead(null)} onEdit={(l) => { setEditing(l); setDrawerLead(null); setOpen(true); }} />
    </>
  );
}
