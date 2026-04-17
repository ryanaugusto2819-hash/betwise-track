import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useCustos, useLeads, type Custo } from "@/hooks/useCpaData";
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

function CustoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const qc = useQueryClient();
  const { data: leads = [] } = useLeads();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (open) setForm({ lead_id: "", tipo: "deposito_incentivado", valor: "", observacao: "", data: new Date().toISOString().slice(0, 10) });
  }, [open]);

  async function save() {
    if (!form.valor) return toast.error("Valor obrigatório");
    const { error } = await supabase.from("custos").insert({
      lead_id: form.lead_id || null,
      tipo: form.tipo,
      valor: Number(form.valor),
      observacao: form.observacao || null,
      data: new Date(form.data).toISOString(),
    });
    if (error) return toast.error(error.message);
    toast.success("Custo registrado");
    qc.invalidateQueries({ queryKey: ["custos"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo custo</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Lead</Label>
              <Select value={form.lead_id ?? ""} onValueChange={(v) => setForm({ ...form, lead_id: v })}>
                <SelectTrigger><SelectValue placeholder="Opcional..." /></SelectTrigger>
                <SelectContent>{leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo ?? "outro"} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposito_incentivado">Depósito incentivado</SelectItem>
                  <SelectItem value="bonus">Bônus</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={form.valor ?? ""} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={form.data ?? ""} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
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

export default function CustosPage() {
  const { data: custos = [] } = useCustos();
  const { data: leads = [] } = useLeads();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const leadName = (id: string | null) => leads.find((l) => l.id === id)?.nome ?? "—";

  async function del(c: Custo) {
    if (!confirm("Excluir custo?")) return;
    await supabase.from("custos").delete().eq("id", c.id);
    qc.invalidateQueries({ queryKey: ["custos"] });
  }

  const total = custos.reduce((s, c) => s + c.valor, 0);

  return (
    <>
      <PageHeader title="Custos" subtitle={`${custos.length} registros · ${brl(total)} total`}>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Novo Custo</Button>
      </PageHeader>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/50 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Observação</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {custos.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">Nenhum custo.</td></tr>}
              {custos.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-surface-2/40">
                  <td className="px-4 py-2.5 font-mono text-xs tabular text-muted-foreground">{dt(c.data)}</td>
                  <td className="px-4 py-2.5">{leadName(c.lead_id)}</td>
                  <td className="px-4 py-2.5"><StatusPill status={c.tipo.replace("_", " ")} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.observacao ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular font-semibold text-loss">{brl(c.valor)}</td>
                  <td className="px-4 py-2.5 text-right"><button onClick={() => del(c)}><Trash2 className="h-3.5 w-3.5 text-loss" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CustoDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
