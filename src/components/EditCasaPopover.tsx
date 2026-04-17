import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Save, Loader2 } from "lucide-react";
import type { Casa } from "@/hooks/useCpaData";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  casa: Casa;
  /** Quantos depósitos esse lead específico tem nessa casa (para confirmar exclusão em massa) */
  depositosCount?: number;
  /** Se true, o "Excluir" remove apenas os depósitos desse lead nessa casa, não a casa em si */
  leadIdScope?: string;
  children: React.ReactNode;
}

export function EditCasaPopover({ casa, depositosCount = 0, leadIdScope, children }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(casa.nome);
  const [tipo, setTipo] = useState<"CPA" | "RevShare" | "Hibrido">(casa.tipo as any);
  const [valorCpa, setValorCpa] = useState(String(casa.valor_cpa));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setNome(casa.nome);
      setTipo(casa.tipo as any);
      setValorCpa(String(casa.valor_cpa));
    }
  }, [open, casa]);

  async function save() {
    if (!nome.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    const { error } = await supabase
      .from("casas_de_aposta")
      .update({ nome: nome.trim(), tipo, valor_cpa: Number(valorCpa) || 0 })
      .eq("id", casa.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Casa atualizada");
    qc.invalidateQueries({ queryKey: ["casas"] });
    setOpen(false);
  }

  /** Remove TODOS os depósitos+CPA desse lead nessa casa (escopo do card) */
  async function removeFromLead() {
    if (!leadIdScope) return;
    setDeleting(true);
    const [d, c] = await Promise.all([
      supabase.from("depositos").delete().eq("lead_id", leadIdScope).eq("casa_id", casa.id),
      supabase.from("cpa_status").delete().eq("lead_id", leadIdScope).eq("casa_id", casa.id),
    ]);
    setDeleting(false);
    if (d.error) return toast.error(d.error.message);
    if (c.error) return toast.error(c.error.message);
    toast.success(`${casa.nome} removida do lead`);
    qc.invalidateQueries({ queryKey: ["depositos"] });
    qc.invalidateQueries({ queryKey: ["cpa_status"] });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 space-y-2 p-3" onClick={(e) => e.stopPropagation()}>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Editar casa
        </div>

        <div className="space-y-1">
          <Label className="text-[10px]">Nome</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} className="h-8" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CPA">CPA</SelectItem>
                <SelectItem value="RevShare">RevShare</SelectItem>
                <SelectItem value="Hibrido">Híbrido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Valor CPA</Label>
            <Input type="number" step="0.01" value={valorCpa} onChange={(e) => setValorCpa(e.target.value)} className="h-8" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {leadIdScope ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-loss hover:bg-loss/10 hover:text-loss">
                  <Trash2 className="h-3.5 w-3.5" /> Remover do lead
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover {casa.nome} deste lead?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso remove os {depositosCount} depósito(s) e registros de CPA dessa casa apenas para este lead.
                    A casa continua existindo no sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={removeFromLead} disabled={deleting} className="bg-loss text-loss-foreground hover:bg-loss/90">
                    {deleting ? "Removendo..." : "Remover"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : <div />}

          <Button size="sm" onClick={save} disabled={saving} className="h-8 gap-1">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
