export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bcv_rates: {
        Row: {
          bcv_rate: number | null
          created_at: string | null
          id: number
        }
        Insert: {
          bcv_rate?: number | null
          created_at?: string | null
          id?: number
        }
        Update: {
          bcv_rate?: number | null
          created_at?: string | null
          id?: number
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          binance_rate: number
          created_at: string | null
          eldorado_rate: number
          id: number
          syklo_rate: number
          total_rate: number
          yadio_rate: number
        }
        Insert: {
          binance_rate: number
          created_at?: string | null
          eldorado_rate: number
          id?: number
          syklo_rate: number
          total_rate: number
          yadio_rate: number
        }
        Update: {
          binance_rate?: number
          created_at?: string | null
          eldorado_rate?: number
          id?: number
          syklo_rate?: number
          total_rate?: number
          yadio_rate?: number
        }
        Relationships: []
      }
      monitor_rates: {
        Row: {
          airtm_rate: number
          avg_rate: number | null
          billeterap2p_rate: number
          cambiosrya_rate: number
          created_at: string | null
          datetime: string | null
          eldorado_rate: number
          exchange_rate_id: number | null
          id: number
          mkfrontera_rate: number
          syklo_rate: number
          total_rate: number
          usdtbnbvzla_rate: number
          yadio_rate: number
        }
        Insert: {
          airtm_rate: number
          avg_rate?: number | null
          billeterap2p_rate: number
          cambiosrya_rate: number
          created_at?: string | null
          datetime?: string | null
          eldorado_rate: number
          exchange_rate_id?: number | null
          id?: number
          mkfrontera_rate: number
          syklo_rate: number
          total_rate: number
          usdtbnbvzla_rate: number
          yadio_rate: number
        }
        Update: {
          airtm_rate?: number
          avg_rate?: number | null
          billeterap2p_rate?: number
          cambiosrya_rate?: number
          created_at?: string | null
          datetime?: string | null
          eldorado_rate?: number
          exchange_rate_id?: number | null
          id?: number
          mkfrontera_rate?: number
          syklo_rate?: number
          total_rate?: number
          usdtbnbvzla_rate?: number
          yadio_rate?: number
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
