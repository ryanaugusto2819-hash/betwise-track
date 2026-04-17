-- Cria enum para estágios do pipeline definidos pelo usuário
CREATE TYPE public.pipeline_stage AS ENUM (
  'cadastro_pendente',
  'cadastro_feito',
  'deposito_pendente',
  'deposito_feito',
  'aposta_realizada',
  'segundo_deposito',
  'terceiro_deposito',
  'quarto_deposito'
);

-- Adiciona coluna na tabela leads
ALTER TABLE public.leads
ADD COLUMN pipeline_stage public.pipeline_stage NOT NULL DEFAULT 'cadastro_pendente';

CREATE INDEX idx_leads_pipeline_stage ON public.leads(pipeline_stage);