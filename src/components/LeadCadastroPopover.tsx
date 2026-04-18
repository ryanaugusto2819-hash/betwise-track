import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCasas, type LeadCadastro } from "@/hooks/useCpaData";
import { Check, Loader2, Trash2, UserCheck } from "lucide-react";

interface Props {
  leadId: string;
  /** Casas onde o lead JÁ tem cadastro registrado (sem necessariamente ter depósito) */
  cadastros: LeadCadastro[];
  /** Casas que devem ser ocultadas do select (ex.: já tem depósito) */
  excludeCasaIds: string[];
  children: React.ReactNode;
}

export function LeadCadastroPopover({ leadId, cadastros, excludeCasaIds, children }: Props) {
  const qc = useQueryClient();
  const { data: casas = [] } = useCasas();
  const [open, setOpen] = useState(false);
  const [casaId, setCasaId] = useState("");
  const [saving, setSaving] = useState(false);

  const cadastrosCasaIds = new Set(cadastros.map((c) => c.casa_id));
  const opcoes = casas.filter(
    (c) => c.ativo && !excludeCasaIds.includes(c.id) && !cadastrosCasaIds.has(c.id)
  );

  async function adicionar() {
    if (!casaId) return toast.error("Escolha uma casa");
    setSaving(true);
    const { error } = await supabase.from("lead_cadastros").insert({
      lead_id: leadId,
      casa_id: casaId,
      status_cadastro: "feito",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Cadastro registrado");
    setCasaId("");
    qc.invalidateQueries({ queryKey: ["lead_cadastros"] });
  }

  async function remover(id: string) {
    const { error } = await supabase.from("lead_cadastros").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Cadastro removido");
    qc.invalidateQueries({ queryKey: ["lead_cadastros"] });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-accent" />
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider">Já tem cadastro em…</h4>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Select value={casaId} onValueChange={setCasaId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={opcoes.length ? "Escolha uma casa" : "Sem casas disponíveis"} />
                </SelectTrigger>
                <SelectContent>
                  {opcoes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={adicionar} disabled={saving || !casaId} className="gap-1">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Marcar
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Marque casas onde o lead já criou conta mesmo sem depósito.
            </p>
          </div>

          {cadastros.length > 0 && (
            <div className="space-y-1.5 border-t border-border pt-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Cadastros existentes
              </div>
              <ul className="space-y-1">
                {cadastros.map((cad) => {
                  const casa = casas.find((c) => c.id === cad.casa_id);
                  return (
                    <li
                      key={cad.id}
                      className="flex items-center justify-between rounded-md bg-surface-2/50 px-2 py-1"
                    >
                      <span className="text-xs font-semibold">{casa?.nome ?? "Casa removida"}</span>
                      <button
                        onClick={() => remover(cad.id)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-loss/10 hover:text-loss"
                        title="Remover cadastro"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
