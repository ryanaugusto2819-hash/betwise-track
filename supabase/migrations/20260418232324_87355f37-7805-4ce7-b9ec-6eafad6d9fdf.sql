-- 1. Renomear leads existentes nos estágios que serão removidos
-- Primeiro adicionar 'redeposito' ao enum
ALTER TYPE public.pipeline_stage ADD VALUE IF NOT EXISTS 'redeposito';
