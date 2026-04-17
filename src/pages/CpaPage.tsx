import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useCasas, useCpaStatus, useLeads, usePaineis, type CpaRow } from "@/hooks/useCpaData";
import { brl, dt } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function CpaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const qc = useQueryClient();
  const { data: leads = [] } = useLeads();
  const { data: casas = [] } = useCasas();
  const { data: paineis = [] } = usePaineis();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (open) setForm({ lead_id: "", casa_id: "", painel_id: "", valor_cpa: "", status: "pendente" });
  }, [open]);

  async function save() {
    if (!form.lead_id || !form.casa_id || !form.valor_cpa) return toast.error("Lead, casa e valor obrigatórios");
    const { error } = await supabase.from("cpa_status").insert({
      lead_id: form.lead_id,
      casa_id: form.casa_id,
      painel_id: form.painel_id || null,
      valor_cpa: Number(form.valor_cpa),
      status: form.status,
      data_aprovacao: form.status === "aprovado" || form.status === "pago" ? new Date().toISOString() : null,
      data_pagamento: form.status === "pago" ? new Date().toISOString() : null,
    });
    if (error) return toast.error(error.message);
    toast.success("CPA registrado");
    qc.invalidateQueries({ queryKey: ["cpa_status"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo registro de CPA</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Lead *</Label>
              <Select value={form.lead_id ?? ""} onValueChange={(v) => setForm({ ...form, lead_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Casa *</Label>
              <Select value={form.casa_id ?? ""} onValueChange={(v) => {
                const casa = casas.find((c) => c.id === v);
                setForm({ ...form, casa_id: v, valor_cpa: form.valor_cpa || casa?.valor_cpa || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{casas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Painel</Label>
              <Select value={form.painel_id ?? ""} onValueChange={(v) => setForm({ ...form, painel_id: v })}>
                <SelectTrigger><SelectValue placeholder="Opcional..." /></SelectTrigger>
                <SelectContent>{paineis.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Valor CPA (R$) *</Label><Input type="number" step="0.01" value={form.valor_cpa ?? ""} onChange={(e) => setForm({ ...form, valor_cpa: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status ?? "pendente"} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="recusado">Recusado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CpaPage() {
  const { data: cpa = [] } = useCpaStatus();
  const { data: leads = [] } = useLeads();
  const { data: casas = [] } = useCasas();
  const { data: paineis = [] } = usePaineis();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const leadName = (id: string) => leads.find((l) => l.id === id)?.nome ?? "—";
  const casaName = (id: string) => casas.find((c) => c.id === id)?.nome ?? "—";
  const painelName = (id: string | null) => paineis.find((p) => p.id === id)?.nome ?? "—";

  async function updateStatus(c: CpaRow, status: string) {
    const patch: any = { status };
    if (status === "aprovado" && !c.data_aprovacao) patch.data_aprovacao = new Date().toISOString();
    if (status === "pago") {
      if (!c.data_aprovacao) patch.data_aprovacao = new Date().toISOString();
      if (!c.data_pagamento) patch.data_pagamento = new Date().toISOString();
    }
    const { error } = await supabase.from("cpa_status").update(patch).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["cpa_status"] });
  }

  async function del(c: CpaRow) {
    if (!confirm("Excluir registro CPA?")) return;
    await supabase.from("cpa_status").delete().eq("id", c.id);
    qc.invalidateQueries({ queryKey: ["cpa_status"] });
  }

  const filtered = cpa.filter((c) => statusFilter === "all" || c.status === statusFilter);
  const total = filtered.reduce((s, c) => s + c.valor_cpa, 0);

  return (
    <>
      <PageHeader title="CPA Status" subtitle={`${filtered.length} registros · ${brl(total)}`}>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-surface border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="recusado">Recusado</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Novo CPA</Button>
      </PageHeader>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/50 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Casa</th>
                <th className="px-4 py-3">Painel</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3">Aprovado</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Sem registros.</td></tr>}
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-surface-2/40">
                  <td className="px-4 py-2.5 font-medium">{leadName(c.lead_id)}</td>
                  <td className="px-4 py-2.5">{casaName(c.casa_id)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{painelName(c.painel_id)}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular text-profit">{brl(c.valor_cpa)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground tabular">{dt(c.data_aprovacao)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground tabular">{dt(c.data_pagamento)}</td>
                  <td className="px-4 py-2.5">
                    <Select value={c.status} onValueChange={(v) => updateStatus(c, v)}>
                      <SelectTrigger className="h-7 w-[120px] border-0 bg-transparent p-0 [&>svg]:hidden">
                        <StatusPill status={c.status} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="recusado">Recusado</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2.5 text-right"><button onClick={() => del(c)}><Trash2 className="h-3.5 w-3.5 text-loss" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CpaDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
