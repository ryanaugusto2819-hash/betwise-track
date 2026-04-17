import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type Lead } from "@/hooks/useCpaData";
import { X, Plus } from "lucide-react";

export function LeadDialog({ open, onOpenChange, lead }: { open: boolean; onOpenChange: (b: boolean) => void; lead: Lead | null }) {
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [origem, setOrigem] = useState("");
  const [status, setStatus] = useState<"ativo" | "pausado" | "bloqueado">("ativo");
  const [observacoes, setObservacoes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNome(lead?.nome ?? "");
      setTelefone(lead?.telefone ?? "");
      setOrigem(lead?.origem ?? "");
      setStatus(lead?.status ?? "ativo");
      setObservacoes(lead?.observacoes ?? "");
      setTags(lead?.tags ?? []);
      setTagInput("");
    }
  }, [open, lead]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  async function save() {
    if (!nome.trim() || !telefone.trim()) {
      toast.error("Nome e telefone são obrigatórios");
      return;
    }
    setSaving(true);
    const payload = { nome: nome.trim(), telefone: telefone.trim(), origem: origem || null, status, observacoes: observacoes || null, tags };
    const { error } = lead
      ? await supabase.from("leads").update(payload).eq("id", lead.id)
      : await supabase.from("leads").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(lead ? "Lead atualizado" : "Lead criado");
    qc.invalidateQueries({ queryKey: ["leads"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="João Silva" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone *</Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="11999999999" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Origem</Label>
              <Input value={origem} onChange={(e) => setOrigem(e.target.value)} placeholder="Campanha, fonte..." />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="bom pagador, top lead..."
              />
              <Button type="button" variant="secondary" size="icon" onClick={addTag}><Plus className="h-4 w-4" /></Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2 py-1 text-xs font-medium text-accent">
                    {t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
