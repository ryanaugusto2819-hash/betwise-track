import type { PipelineStage } from "@/hooks/useCpaData";

export type StageMeta = {
  id: PipelineStage;
  label: string;
  short: string;
  description: string;
  accent: string;
  dot: string;
  text: string;
};

export const STAGES: StageMeta[] = [
  { id: "cadastro_pendente", label: "Cadastro Pendente", short: "Cad. Pend.", description: "Aguardando cadastro", accent: "from-muted-foreground/20 to-transparent", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  { id: "cadastro_feito", label: "Cadastro Feito", short: "Cad. Feito", description: "Cadastrado, sem dep.", accent: "from-info/30 to-transparent", dot: "bg-info", text: "text-info" },
  { id: "deposito_pendente", label: "Depósito Pendente", short: "Dep. Pend.", description: "Aguardando 1º dep.", accent: "from-warning/30 to-transparent", dot: "bg-warning", text: "text-warning" },
  { id: "deposito_feito", label: "Depósito Feito", short: "Dep. Feito", description: "1º depósito ok", accent: "from-accent/30 to-transparent", dot: "bg-accent", text: "text-accent" },
  { id: "aposta_realizada", label: "Aposta Realizada", short: "Apostou", description: "Apostou após dep.", accent: "from-primary/30 to-transparent", dot: "bg-primary", text: "text-primary" },
  { id: "segundo_deposito", label: "2º Depósito", short: "2º Dep.", description: "Recompra confirmada", accent: "from-info/40 to-transparent", dot: "bg-info", text: "text-info" },
  { id: "terceiro_deposito", label: "3º Depósito", short: "3º Dep.", description: "Lead recorrente", accent: "from-profit/30 to-transparent", dot: "bg-profit", text: "text-profit" },
  { id: "quarto_deposito", label: "4º Depósito", short: "4º Dep.", description: "Lead consolidado", accent: "from-profit/50 to-transparent", dot: "bg-profit", text: "text-profit" },
];

export const stageById = (id: PipelineStage) => STAGES.find((s) => s.id === id) ?? STAGES[0];
