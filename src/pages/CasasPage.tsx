import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCasas, type Casa } from "@/hooks/useCpaData";
import { brl } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function CasaDialog({ open, onOpenChange, casa }: { open: boolean; onOpenChange: (b: boolean) => void; casa: Casa | null }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({});

  // initialize when opening
  useState(() => {});
  if (open && Object.keys(form).length === 0) {
    setForm({
      nome: casa?.nome ?? "",
      tipo: casa?.tipo ?? "CPA",
      valor_cpa: casa?.valor_cpa ?? 0,
      regras_cpa: casa?.regras_cpa ?? "",
      ativo: casa?.ativo ?? true,
    });
  }
  if (!open && Object.keys(form).length > 0) setForm({});

  async function save() {
    if (!form.nome) return toast.error("Nome obrigatório");
    const payload = {
      nome: form.nome,
      tipo: form.tipo,
      valor_cpa: Number(form.valor_cpa) || 0,
      regras_cpa: form.regras_cpa || null,
      ativo: form.ativo,
    };
    const { error } = casa
      ? await supabase.from("casas_de_aposta").update(payload).eq("id", casa.id)
      : await supabase.from("casas_de_aposta").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(casa ? "Casa atualizada" : "Casa criada");
    qc.invalidateQueries({ queryKey: ["casas"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{casa ? "Editar casa" : "Nova casa"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo ?? "CPA"} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPA">CPA</SelectItem>
                  <SelectItem value="RevShare">RevShare</SelectItem>
                  <SelectItem value="Hibrido">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Valor CPA padrão (R$)</Label><Input type="number" step="0.01" value={form.valor_cpa ?? 0} onChange={(e) => setForm({ ...form, valor_cpa: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Regras CPA</Label><Textarea rows={3} value={form.regras_cpa ?? ""} onChange={(e) => setForm({ ...form, regras_cpa: e.target.value })} placeholder="Depósito mínimo, rollover..." /></div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2">
            <Label>Ativa</Label>
            <Switch checked={!!form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
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

export default function CasasPage() {
  const { data: casas = [] } = useCasas();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Casa | null>(null);

  async function del(c: Casa) {
    if (!confirm(`Excluir casa ${c.nome}?`)) return;
    const { error } = await supabase.from("casas_de_aposta").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Casa excluída");
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader title="Casas de Aposta" subtitle={`${casas.length} casas cadastradas`}>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Nova Casa</Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {casas.length === 0 && (
          <div className="glass-card col-span-full p-10 text-center text-sm text-muted-foreground">Nenhuma casa cadastrada.</div>
        )}
        {casas.map((c) => (
          <div key={c.id} className="glass-card flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">{c.nome}</div>
                <div className="mt-1 flex items-center gap-2"><StatusPill status={c.tipo} />{!c.ativo && <StatusPill status="bloqueado" />}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">CPA</div>
                <div className="font-mono text-xl font-bold tabular text-profit">{brl(c.valor_cpa)}</div>
              </div>
            </div>
            {c.regras_cpa && <div className="rounded-md bg-surface-2 p-2 text-xs text-muted-foreground">{c.regras_cpa}</div>}
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" size="sm" className="flex-1 gap-2" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-3.5 w-3.5" />Editar</Button>
              <Button variant="ghost" size="sm" onClick={() => del(c)}><Trash2 className="h-3.5 w-3.5 text-loss" /></Button>
            </div>
          </div>
        ))}
      </div>

      <CasaDialog open={open} onOpenChange={setOpen} casa={editing} />
    </>
  );
}
