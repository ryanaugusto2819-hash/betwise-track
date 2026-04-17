import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Save, Loader2 } from "lucide-react";
import type { Deposito } from "@/hooks/useCpaData";
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
  deposito: Deposito;
  children: React.ReactNode;
}

export function EditDepositoPopover({ deposito, children }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState(String(deposito.valor));
  const [numero, setNumero] = useState(String(deposito.numero_deposito));
  const [origem, setOrigem] = useState<"lead" | "proprio">(deposito.origem);
  const [data, setData] = useState(deposito.data_deposito.slice(0, 10));
  const [observacao, setObservacao] = useState(deposito.observacao ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setValor(String(deposito.valor));
      setNumero(String(deposito.numero_deposito));
      setOrigem(deposito.origem);
      setData(deposito.data_deposito.slice(0, 10));
      setObservacao(deposito.observacao ?? "");
    }
  }, [open, deposito]);

  async function save() {
    if (!valor || Number(valor) <= 0) return toast.error("Valor inválido");
    setSaving(true);
    const { error } = await supabase
      .from("depositos")
      .update({
        valor: Number(valor),
        numero_deposito: Number(numero) || 1,
        origem,
        observacao: observacao || null,
        data_deposito: new Date(data).toISOString(),
      })
      .eq("id", deposito.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Depósito atualizado");
    qc.invalidateQueries({ queryKey: ["depositos"] });
    setOpen(false);
  }

  async function remove() {
    setDeleting(true);
    const { error } = await supabase.from("depositos").delete().eq("id", deposito.id);
    setDeleting(false);
    if (error) return toast.error(error.message);
    toast.success("Depósito removido");
    qc.invalidateQueries({ queryKey: ["depositos"] });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 space-y-2 p-3" onClick={(e) => e.stopPropagation()}>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Editar depósito
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1">
            <Label className="text-[10px]">Valor (R$)</Label>
            <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className="h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Nº</Label>
            <Input type="number" min="1" value={numero} onChange={(e) => setNumero(e.target.value)} className="h-8" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Data</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Origem</Label>
            <Select value={origem} onValueChange={(v) => setOrigem(v as any)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="proprio">Próprio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px]">Observação</Label>
          <Textarea rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)} className="text-xs" />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-loss hover:bg-loss/10 hover:text-loss">
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover depósito?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação não pode ser desfeita. O depósito será removido permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={remove} disabled={deleting} className="bg-loss text-loss-foreground hover:bg-loss/90">
                  {deleting ? "Removendo..." : "Remover"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button size="sm" onClick={save} disabled={saving} className="h-8 gap-1">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
