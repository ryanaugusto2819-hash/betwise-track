import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useCasas, useDepositos, useLeads, type Deposito } from "@/hooks/useCpaData";
import { brl, dt } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function DepositoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const qc = useQueryClient();
  const { data: leads = [] } = useLeads();
  const { data: casas = [] } = useCasas();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (open) setForm({ lead_id: "", casa_id: "", valor: "", numero_deposito: 1, origem: "lead", observacao: "", data_deposito: new Date().toISOString().slice(0, 10) });
  }, [open]);

  async function save() {
    if (!form.lead_id || !form.casa_id || !form.valor) return toast.error("Preencha lead, casa e valor");
    const { error } = await supabase.from("depositos").insert({
      lead_id: form.lead_id,
      casa_id: form.casa_id,
      valor: Number(form.valor),
      numero_deposito: Number(form.numero_deposito) || 1,
      origem: form.origem,
      observacao: form.observacao || null,
      data_deposito: new Date(form.data_deposito).toISOString(),
    });
    if (error) return toast.error(error.message);
    toast.success("Depósito registrado");
    qc.invalidateQueries({ queryKey: ["depositos"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo depósito</DialogTitle></DialogHeader>
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
              <Select value={form.casa_id ?? ""} onValueChange={(v) => setForm({ ...form, casa_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{casas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={form.valor ?? ""} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Nº depósito</Label><Input type="number" min="1" value={form.numero_deposito ?? 1} onChange={(e) => setForm({ ...form, numero_deposito: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={form.data_deposito ?? ""} onChange={(e) => setForm({ ...form, data_deposito: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Origem</Label>
            <Select value={form.origem ?? "lead"} onValueChange={(v) => setForm({ ...form, origem: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="proprio">Próprio investimento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Observação</Label><Textarea rows={2} value={form.observacao ?? ""} onChange={(e) => setForm({ ...form, observacao: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DepositosPage() {
  const { data: depositos = [] } = useDepositos();
  const { data: leads = [] } = useLeads();
  const { data: casas = [] } = useCasas();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const leadName = (id: string) => leads.find((l) => l.id === id)?.nome ?? "—";
  const casaName = (id: string) => casas.find((c) => c.id === id)?.nome ?? "—";

  async function del(d: Deposito) {
    if (!confirm("Excluir depósito?")) return;
    const { error } = await supabase.from("depositos").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["depositos"] });
  }

  const total = depositos.reduce((s, d) => s + d.valor, 0);

  return (
    <>
      <PageHeader title="Depósitos" subtitle={`${depositos.length} registros · ${brl(total)} no total`}>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Novo Depósito</Button>
      </PageHeader>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/50 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Casa</th>
                <th className="px-4 py-3">Nº</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {depositos.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Nenhum depósito.</td></tr>}
              {depositos.map((d) => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-surface-2/40">
                  <td className="px-4 py-2.5 font-mono text-xs tabular text-muted-foreground">{dt(d.data_deposito)}</td>
                  <td className="px-4 py-2.5">{leadName(d.lead_id)}</td>
                  <td className="px-4 py-2.5">{casaName(d.casa_id)}</td>
                  <td className="px-4 py-2.5 font-mono tabular">#{d.numero_deposito}</td>
                  <td className="px-4 py-2.5"><StatusPill status={d.origem} /></td>
                  <td className="px-4 py-2.5 text-right font-mono tabular font-semibold">{brl(d.valor)}</td>
                  <td className="px-4 py-2.5 text-right"><button onClick={() => del(d)}><Trash2 className="h-3.5 w-3.5 text-loss" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DepositoDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
