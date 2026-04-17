import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2, Eye, EyeOff, Copy, KeyRound } from "lucide-react";

interface Props {
  leadId: string;
  observacoes: string | null;
  children?: React.ReactNode;
}

export function LeadObservacoesPopover({ leadId, observacoes, children }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(observacoes ?? "");
  const [reveal, setReveal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(observacoes ?? "");
      setReveal(false);
    }
  }, [open, observacoes]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("leads")
      .update({ observacoes: value || null })
      .eq("id", leadId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Observações salvas");
    qc.invalidateQueries({ queryKey: ["leads"] });
    setOpen(false);
  }

  async function copyAll() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success("Copiado");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 space-y-2 p-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <KeyRound className="h-3 w-3" /> Logins / Observações
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setReveal((r) => !r)}
              title={reveal ? "Ocultar" : "Mostrar"}
            >
              {reveal ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={copyAll}
              disabled={!value}
              title="Copiar tudo"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Textarea
          rows={8}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={"Bet365\nlogin: usuario@email.com\nsenha: ******\n\nBetano\nlogin: ...\nsenha: ..."}
          className={`font-mono text-xs ${!reveal && value ? "[-webkit-text-security:disc] [text-security:disc]" : ""}`}
          spellCheck={false}
          autoComplete="off"
        />

        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] text-muted-foreground">
            {reveal ? "Visível" : "Mascarado"} · {value.length} chars
          </span>
          <Button size="sm" onClick={save} disabled={saving} className="h-8 gap-1">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
