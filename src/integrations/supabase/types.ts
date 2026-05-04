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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          balance_after: number | null
          created_at: string
          created_by: string | null
          delta: number
          id: string
          metadata: Json
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          delta: number
          id?: string
          metadata?: Json
          source_id?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          delta?: number
          id?: string
          metadata?: Json
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      delegation_leads: {
        Row: {
          created_at: string
          diagnostic_answers: Json | null
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          recommendation: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          diagnostic_answers?: Json | null
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          recommendation?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          diagnostic_answers?: Json | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          recommendation?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      edge_rate_limits: {
        Row: {
          function_name: string
          id: string
          ip_address: string
          request_count: number
          window_start: string
        }
        Insert: {
          function_name?: string
          id?: string
          ip_address: string
          request_count?: number
          window_start?: string
        }
        Update: {
          function_name?: string
          id?: string
          ip_address?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      generated_sites: {
        Row: {
          business_name: string
          business_type: string | null
          city: string | null
          colors: string | null
          content_json: Json | null
          created_at: string
          cta: string | null
          custom_domain: string | null
          description: string | null
          domain_status: string
          generated_content: Json | null
          id: string
          objective: string | null
          published_at: string | null
          services: string | null
          slug: string | null
          status: string
          style: string | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          business_name: string
          business_type?: string | null
          city?: string | null
          colors?: string | null
          content_json?: Json | null
          created_at?: string
          cta?: string | null
          custom_domain?: string | null
          description?: string | null
          domain_status?: string
          generated_content?: Json | null
          id?: string
          objective?: string | null
          published_at?: string | null
          services?: string | null
          slug?: string | null
          status?: string
          style?: string | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          business_name?: string
          business_type?: string | null
          city?: string | null
          colors?: string | null
          content_json?: Json | null
          created_at?: string
          cta?: string | null
          custom_domain?: string | null
          description?: string | null
          domain_status?: string
          generated_content?: Json | null
          id?: string
          objective?: string | null
          published_at?: string | null
          services?: string | null
          slug?: string | null
          status?: string
          style?: string | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_page_views: {
        Row: {
          created_at: string
          generated_site_id: string
          hostname: string | null
          id: string
          path: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          generated_site_id: string
          hostname?: string | null
          id?: string
          path?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          generated_site_id?: string
          hostname?: string | null
          id?: string
          path?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_page_views_generated_site_id_fkey"
            columns: ["generated_site_id"]
            isOneToOne: false
            referencedRelation: "generated_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          id: string
          payload: Json | null
          processed_at: string
          type: string
        }
        Insert: {
          id: string
          payload?: Json | null
          processed_at?: string
          type: string
        }
        Update: {
          id?: string
          payload?: Json | null
          processed_at?: string
          type?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits: number
          id: string
          total_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          id?: string
          total_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          total_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_credits: {
        Args: {
          p_delta: number
          p_reason?: string | null
          p_user_id: string
        }
        Returns: Json
      }
      admin_apply_credit_transaction: {
        Args: {
          p_delta: number
          p_metadata?: Json
          p_source_id?: string | null
          p_source_type: string
          p_user_id: string
        }
        Returns: Json
      }
      apply_credit_transaction: {
        Args: {
          p_created_by?: string | null
          p_delta: number
          p_metadata?: Json
          p_source_id?: string | null
          p_source_type: string
          p_user_id: string
        }
        Returns: Json
      }
      can_update_generated_site: {
        Args: {
          p_custom_domain: string | null
          p_domain_status: string | null
          p_site_id: string
          p_status: string | null
          p_user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
