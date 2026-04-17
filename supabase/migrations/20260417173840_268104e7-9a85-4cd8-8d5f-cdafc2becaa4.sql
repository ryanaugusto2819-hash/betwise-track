-- ENUMs
CREATE TYPE public.lead_status AS ENUM ('ativo','pausado','bloqueado');
CREATE TYPE public.casa_tipo AS ENUM ('CPA','RevShare','Hibrido');
CREATE TYPE public.cadastro_status AS ENUM ('feito','pendente','erro');
CREATE TYPE public.cpa_status_enum AS ENUM ('pendente','aprovado','pago','recusado');
CREATE TYPE public.deposito_origem AS ENUM ('lead','proprio');
CREATE TYPE public.custo_tipo AS ENUM ('deposito_incentivado','bonus','outro');

-- LEADS
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL UNIQUE,
  origem TEXT,
  status public.lead_status NOT NULL DEFAULT 'ativo',
  tags TEXT[] NOT NULL DEFAULT '{}',
  observacoes TEXT,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CASAS
CREATE TABLE public.casas_de_aposta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo public.casa_tipo NOT NULL DEFAULT 'CPA',
  valor_cpa NUMERIC(12,2) NOT NULL DEFAULT 0,
  regras_cpa TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PAINEIS
CREATE TABLE public.paineis_afiliado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  login_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LEAD_CADASTROS
CREATE TABLE public.lead_cadastros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  casa_id UUID NOT NULL REFERENCES public.casas_de_aposta(id) ON DELETE CASCADE,
  painel_id UUID REFERENCES public.paineis_afiliado(id) ON DELETE SET NULL,
  data_cadastro TIMESTAMPTZ NOT NULL DEFAULT now(),
  status_cadastro public.cadastro_status NOT NULL DEFAULT 'pendente',
  link_afiliado_usado TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lead_id, casa_id)
);

-- DEPOSITOS
CREATE TABLE public.depositos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  casa_id UUID NOT NULL REFERENCES public.casas_de_aposta(id) ON DELETE CASCADE,
  valor NUMERIC(12,2) NOT NULL,
  data_deposito TIMESTAMPTZ NOT NULL DEFAULT now(),
  numero_deposito INTEGER NOT NULL DEFAULT 1,
  origem public.deposito_origem NOT NULL DEFAULT 'lead',
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CPA_STATUS
CREATE TABLE public.cpa_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  casa_id UUID NOT NULL REFERENCES public.casas_de_aposta(id) ON DELETE CASCADE,
  painel_id UUID REFERENCES public.paineis_afiliado(id) ON DELETE SET NULL,
  valor_cpa NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.cpa_status_enum NOT NULL DEFAULT 'pendente',
  data_aprovacao TIMESTAMPTZ,
  data_pagamento TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CUSTOS
CREATE TABLE public.custos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo public.custo_tipo NOT NULL DEFAULT 'outro',
  valor NUMERIC(12,2) NOT NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_telefone ON public.leads(telefone);
CREATE INDEX idx_lead_cadastros_lead ON public.lead_cadastros(lead_id);
CREATE INDEX idx_lead_cadastros_casa ON public.lead_cadastros(casa_id);
CREATE INDEX idx_depositos_lead ON public.depositos(lead_id);
CREATE INDEX idx_depositos_casa ON public.depositos(casa_id);
CREATE INDEX idx_depositos_data ON public.depositos(data_deposito DESC);
CREATE INDEX idx_cpa_lead ON public.cpa_status(lead_id);
CREATE INDEX idx_cpa_casa ON public.cpa_status(casa_id);
CREATE INDEX idx_cpa_status ON public.cpa_status(status);
CREATE INDEX idx_custos_lead ON public.custos(lead_id);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_casas_updated BEFORE UPDATE ON public.casas_de_aposta FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_paineis_updated BEFORE UPDATE ON public.paineis_afiliado FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_lead_cadastros_updated BEFORE UPDATE ON public.lead_cadastros FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_depositos_updated BEFORE UPDATE ON public.depositos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cpa_status_updated BEFORE UPDATE ON public.cpa_status FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_custos_updated BEFORE UPDATE ON public.custos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS (sem auth no momento - acesso público para uso single-tenant)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casas_de_aposta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paineis_afiliado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_cadastros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depositos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpa_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos ENABLE ROW LEVEL SECURITY;

-- Policies abertas (single-tenant, sem auth)
CREATE POLICY "public all" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all" ON public.casas_de_aposta FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all" ON public.paineis_afiliado FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all" ON public.lead_cadastros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all" ON public.depositos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all" ON public.cpa_status FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all" ON public.custos FOR ALL USING (true) WITH CHECK (true);