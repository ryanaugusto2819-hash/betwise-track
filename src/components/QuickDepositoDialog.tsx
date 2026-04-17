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
import { useCasas } from "@/hooks/useCpaData";
import { Plus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  leadId: string;
  leadNome: string;
  defaultCasaId?: string;
  /** Próximo número de depósito sugerido para essa casa */
  suggestedNumero?: number;
}

export function QuickDepositoDialog({ open, onOpenChange, leadId, leadNome, defaultCasaId, suggestedNumero = 1 }: Props) {
  const qc = useQueryClient();
  const { data: casas = [] } = useCasas();

  const [casaId, setCasaId] = useState(defaultCasaId ?? "");
  const [valor, setValor] = useState("");
  const [numero, setNumero] = useState(String(suggestedNumero));
  const [origem, setOrigem] = useState<"lead" | "proprio">("lead");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);

  // Modo "cadastrar nova casa" inline
  const [novaCasa, setNovaCasa] = useState(false);
  const [novaCasaNome, setNovaCasaNome] = useState("");
  const [novaCasaTipo, setNovaCasaTipo] = useState<"CPA" | "RevShare" | "Hibrido">("CPA");
  const [novaCasaValor, setNovaCasaValor] = useState("");

  useEffect(() => {
    if (open) {
      setCasaId(defaultCasaId ?? "");
      setValor("");
      setNumero(String(suggestedNumero));
      setOrigem("lead");
      setData(new Date().toISOString().slice(0, 10));
      setObservacao("");
      setNovaCasa(false);
      setNovaCasaNome("");
      setNovaCasaValor("");
      setNovaCasaTipo("CPA");
    }
  }, [open, defaultCasaId, suggestedNumero]);

  async function save() {
    if (!valor || Number(valor) <= 0) return toast.error("Informe um valor válido");

    setSaving(true);
    let finalCasaId = casaId;

    // Se está cadastrando casa nova, cria primeiro
    if (novaCasa) {
      if (!novaCasaNome.trim()) {
        setSaving(false);
        return toast.error("Informe o nome da nova casa");
      }
      const { data: created, error } = await supabase
        .from("casas_de_aposta")
        .insert({
          nome: novaCasaNome.trim(),
          tipo: novaCasaTipo,
          valor_cpa: Number(novaCasaValor) || 0,
        })
        .select("id")
        .single();
      if (error || !created) {
        setSaving(false);
        return toast.error(error?.message ?? "Erro ao criar casa");
      }
      finalCasaId = created.id;
      qc.invalidateQueries({ queryKey: ["casas"] });
    }

    if (!finalCasaId) {
      setSaving(false);
      return toast.error("Selecione ou crie uma casa");
    }

    const { error } = await supabase.from("depositos").insert({
      lead_id: leadId,
      casa_id: finalCasaId,
      valor: Number(valor),
      numero_deposito: Number(numero) || 1,
      origem,
      observacao: observacao || null,
      data_deposito: new Date(data).toISOString(),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Depósito registrado");
    qc.invalidateQueries({ queryKey: ["depositos"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo depósito · {leadNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Casa */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Casa *</Label>
              <button
                type="button"
                onClick={() => setNovaCasa((v) => !v)}
                className="font-mono text-[10px] uppercase tracking-wider text-primary hover:underline"
              >
                {novaCasa ? "← Escolher existente" : "+ Nova casa"}
              </button>
            </div>

            {!novaCasa ? (
              <Select value={casaId} onValueChange={setCasaId}>
                <SelectTrigger><SelectValue placeholder="Selecione a casa..." /></SelectTrigger>
                <SelectContent>
                  {casas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-2">
                <Input
                  placeholder="Nome da casa (ex: Bet365)"
                  value={novaCasaNome}
                  onChange={(e) => setNovaCasaNome(e.target.value)}
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={novaCasaTipo} onValueChange={(v) => setNovaCasaTipo(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPA">CPA</SelectItem>
                      <SelectItem value="RevShare">RevShare</SelectItem>
                      <SelectItem value="Hibrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Valor CPA"
                    value={novaCasaValor}
                    onChange={(e) => setNovaCasaValor(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="100,00" />
            </div>
            <div className="space-y-1.5">
              <Label>Nº</Label>
              <Input type="number" min="1" value={numero} onChange={(e) => setNumero(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Origem</Label>
              <Select value={origem} onValueChange={(v) => setOrigem(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="proprio">Próprio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Textarea rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="opcional" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            <Plus className="h-4 w-4" />{saving ? "Salvando..." : "Registrar depósito"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
