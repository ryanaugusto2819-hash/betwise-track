import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { usePaineis, type Painel } from "@/hooks/useCpaData";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function PainelDialog({ open, onOpenChange, painel }: { open: boolean; onOpenChange: (b: boolean) => void; painel: Painel | null }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (open) setForm({ nome: painel?.nome ?? "", login_url: painel?.login_url ?? "", observacoes: painel?.observacoes ?? "" });
  }, [open, painel]);

  async function save() {
    if (!form.nome) return toast.error("Nome obrigatório");
    const payload = { nome: form.nome, login_url: form.login_url || null, observacoes: form.observacoes || null };
    const { error } = painel
      ? await supabase.from("paineis_afiliado").update(payload).eq("id", painel.id)
      : await supabase.from("paineis_afiliado").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(painel ? "Painel atualizado" : "Painel criado");
    qc.invalidateQueries({ queryKey: ["paineis"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{painel ? "Editar painel" : "Novo painel"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Tropa Partners, MMA Bet..." /></div>
          <div className="space-y-1.5"><Label>URL de login</Label><Input value={form.login_url ?? ""} onChange={(e) => setForm({ ...form, login_url: e.target.value })} placeholder="https://" /></div>
          <div className="space-y-1.5"><Label>Observações</Label><Textarea rows={3} value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PaineisPage() {
  const { data: paineis = [] } = usePaineis();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Painel | null>(null);

  async function del(p: Painel) {
    if (!confirm(`Excluir painel ${p.nome}?`)) return;
    const { error } = await supabase.from("paineis_afiliado").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Painel excluído");
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader title="Painéis de Afiliado" subtitle={`${paineis.length} painéis`}>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Novo Painel</Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {paineis.length === 0 && (
          <div className="glass-card col-span-full p-10 text-center text-sm text-muted-foreground">Nenhum painel cadastrado.</div>
        )}
        {paineis.map((p) => (
          <div key={p.id} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div className="font-semibold">{p.nome}</div>
              {p.login_url && (
                <a href={p.login_url} target="_blank" rel="noreferrer" className="text-info hover:text-primary"><ExternalLink className="h-4 w-4" /></a>
              )}
            </div>
            {p.observacoes && <p className="mt-2 text-xs text-muted-foreground">{p.observacoes}</p>}
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1 gap-2" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-3.5 w-3.5" />Editar</Button>
              <Button variant="ghost" size="sm" onClick={() => del(p)}><Trash2 className="h-3.5 w-3.5 text-loss" /></Button>
            </div>
          </div>
        ))}
      </div>

      <PainelDialog open={open} onOpenChange={setOpen} painel={editing} />
    </>
  );
}
