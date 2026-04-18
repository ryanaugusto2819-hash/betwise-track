import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PipelineStage =
  | "cadastro_pendente"
  | "cadastro_feito"
  | "deposito_pendente"
  | "deposito_feito"
  | "aposta_realizada"
  | "segundo_deposito"
  | "redeposito";

export type LeadCadastro = {
  id: string;
  lead_id: string;
  casa_id: string;
  painel_id: string | null;
  data_cadastro: string;
  status_cadastro: "feito" | "pendente" | "erro";
  link_afiliado_usado: string | null;
};

export type Lead = {
  id: string;
  nome: string;
  telefone: string;
  origem: string | null;
  status: "ativo" | "pausado" | "bloqueado";
  tags: string[];
  observacoes: string | null;
  data_criacao: string;
  pipeline_stage: PipelineStage;
};

export type Casa = {
  id: string;
  nome: string;
  tipo: "CPA" | "RevShare" | "Hibrido";
  valor_cpa: number;
  regras_cpa: string | null;
  ativo: boolean;
};

export type Painel = {
  id: string;
  nome: string;
  login_url: string | null;
  observacoes: string | null;
};

export type Deposito = {
  id: string;
  lead_id: string;
  casa_id: string;
  valor: number;
  data_deposito: string;
  numero_deposito: number;
  origem: "lead" | "proprio";
  observacao: string | null;
};

export type CpaRow = {
  id: string;
  lead_id: string;
  casa_id: string;
  painel_id: string | null;
  valor_cpa: number;
  status: "pendente" | "aprovado" | "pago" | "recusado";
  data_aprovacao: string | null;
  data_pagamento: string | null;
};

export type Custo = {
  id: string;
  lead_id: string | null;
  tipo: "deposito_incentivado" | "bonus" | "outro";
  valor: number;
  data: string;
  observacao: string | null;
};

export const useLeads = () =>
  useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("data_criacao", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

export const useCasas = () =>
  useQuery({
    queryKey: ["casas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("casas_de_aposta").select("*").order("nome");
      if (error) throw error;
      return data as Casa[];
    },
  });

export const usePaineis = () =>
  useQuery({
    queryKey: ["paineis"],
    queryFn: async () => {
      const { data, error } = await supabase.from("paineis_afiliado").select("*").order("nome");
      if (error) throw error;
      return data as Painel[];
    },
  });

export const useDepositos = () =>
  useQuery({
    queryKey: ["depositos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("depositos").select("*").order("data_deposito", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((d) => ({ ...d, valor: Number(d.valor) })) as Deposito[];
    },
  });

export const useCpaStatus = () =>
  useQuery({
    queryKey: ["cpa_status"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cpa_status").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((c) => ({ ...c, valor_cpa: Number(c.valor_cpa) })) as CpaRow[];
    },
  });

export const useCustos = () =>
  useQuery({
    queryKey: ["custos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("custos").select("*").order("data", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((c) => ({ ...c, valor: Number(c.valor) })) as Custo[];
    },
  });

export const useCadastros = () =>
  useQuery({
    queryKey: ["lead_cadastros"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lead_cadastros").select("*").order("data_cadastro", { ascending: false });
      if (error) throw error;
      return data as LeadCadastro[];
    },
  });
