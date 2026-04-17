export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      casas_de_aposta: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          regras_cpa: string | null
          tipo: Database["public"]["Enums"]["casa_tipo"]
          updated_at: string
          valor_cpa: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          regras_cpa?: string | null
          tipo?: Database["public"]["Enums"]["casa_tipo"]
          updated_at?: string
          valor_cpa?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          regras_cpa?: string | null
          tipo?: Database["public"]["Enums"]["casa_tipo"]
          updated_at?: string
          valor_cpa?: number
        }
        Relationships: []
      }
      cpa_status: {
        Row: {
          casa_id: string
          created_at: string
          data_aprovacao: string | null
          data_pagamento: string | null
          id: string
          lead_id: string
          painel_id: string | null
          status: Database["public"]["Enums"]["cpa_status_enum"]
          updated_at: string
          valor_cpa: number
        }
        Insert: {
          casa_id: string
          created_at?: string
          data_aprovacao?: string | null
          data_pagamento?: string | null
          id?: string
          lead_id: string
          painel_id?: string | null
          status?: Database["public"]["Enums"]["cpa_status_enum"]
          updated_at?: string
          valor_cpa?: number
        }
        Update: {
          casa_id?: string
          created_at?: string
          data_aprovacao?: string | null
          data_pagamento?: string | null
          id?: string
          lead_id?: string
          painel_id?: string | null
          status?: Database["public"]["Enums"]["cpa_status_enum"]
          updated_at?: string
          valor_cpa?: number
        }
        Relationships: [
          {
            foreignKeyName: "cpa_status_casa_id_fkey"
            columns: ["casa_id"]
            isOneToOne: false
            referencedRelation: "casas_de_aposta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpa_status_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpa_status_painel_id_fkey"
            columns: ["painel_id"]
            isOneToOne: false
            referencedRelation: "paineis_afiliado"
            referencedColumns: ["id"]
          },
        ]
      }
      custos: {
        Row: {
          created_at: string
          data: string
          id: string
          lead_id: string | null
          observacao: string | null
          tipo: Database["public"]["Enums"]["custo_tipo"]
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          lead_id?: string | null
          observacao?: string | null
          tipo?: Database["public"]["Enums"]["custo_tipo"]
          updated_at?: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          lead_id?: string | null
          observacao?: string | null
          tipo?: Database["public"]["Enums"]["custo_tipo"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "custos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      depositos: {
        Row: {
          casa_id: string
          created_at: string
          data_deposito: string
          id: string
          lead_id: string
          numero_deposito: number
          observacao: string | null
          origem: Database["public"]["Enums"]["deposito_origem"]
          updated_at: string
          valor: number
        }
        Insert: {
          casa_id: string
          created_at?: string
          data_deposito?: string
          id?: string
          lead_id: string
          numero_deposito?: number
          observacao?: string | null
          origem?: Database["public"]["Enums"]["deposito_origem"]
          updated_at?: string
          valor: number
        }
        Update: {
          casa_id?: string
          created_at?: string
          data_deposito?: string
          id?: string
          lead_id?: string
          numero_deposito?: number
          observacao?: string | null
          origem?: Database["public"]["Enums"]["deposito_origem"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "depositos_casa_id_fkey"
            columns: ["casa_id"]
            isOneToOne: false
            referencedRelation: "casas_de_aposta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depositos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_cadastros: {
        Row: {
          casa_id: string
          created_at: string
          data_cadastro: string
          id: string
          lead_id: string
          link_afiliado_usado: string | null
          painel_id: string | null
          status_cadastro: Database["public"]["Enums"]["cadastro_status"]
          updated_at: string
        }
        Insert: {
          casa_id: string
          created_at?: string
          data_cadastro?: string
          id?: string
          lead_id: string
          link_afiliado_usado?: string | null
          painel_id?: string | null
          status_cadastro?: Database["public"]["Enums"]["cadastro_status"]
          updated_at?: string
        }
        Update: {
          casa_id?: string
          created_at?: string
          data_cadastro?: string
          id?: string
          lead_id?: string
          link_afiliado_usado?: string | null
          painel_id?: string | null
          status_cadastro?: Database["public"]["Enums"]["cadastro_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_cadastros_casa_id_fkey"
            columns: ["casa_id"]
            isOneToOne: false
            referencedRelation: "casas_de_aposta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_cadastros_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_cadastros_painel_id_fkey"
            columns: ["painel_id"]
            isOneToOne: false
            referencedRelation: "paineis_afiliado"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          data_criacao: string
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[]
          telefone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_criacao?: string
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          telefone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_criacao?: string
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      paineis_afiliado: {
        Row: {
          created_at: string
          id: string
          login_url: string | null
          nome: string
          observacoes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          login_url?: string | null
          nome: string
          observacoes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          login_url?: string | null
          nome?: string
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cadastro_status: "feito" | "pendente" | "erro"
      casa_tipo: "CPA" | "RevShare" | "Hibrido"
      cpa_status_enum: "pendente" | "aprovado" | "pago" | "recusado"
      custo_tipo: "deposito_incentivado" | "bonus" | "outro"
      deposito_origem: "lead" | "proprio"
      lead_status: "ativo" | "pausado" | "bloqueado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cadastro_status: ["feito", "pendente", "erro"],
      casa_tipo: ["CPA", "RevShare", "Hibrido"],
      cpa_status_enum: ["pendente", "aprovado", "pago", "recusado"],
      custo_tipo: ["deposito_incentivado", "bonus", "outro"],
      deposito_origem: ["lead", "proprio"],
      lead_status: ["ativo", "pausado", "bloqueado"],
    },
  },
} as const
