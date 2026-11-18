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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      cases: {
        Row: {
          concept: string | null
          cover_url: string | null
          created_at: string
          fronts: string[]
          id: string
          identities: Json
          location: string | null
          logo_url: string
          name: string
          published: boolean
          segment: string
          slug: string
          sort_order: number
          summary: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          concept?: string | null
          cover_url?: string | null
          created_at?: string
          fronts?: string[]
          id?: string
          identities?: Json
          location?: string | null
          logo_url: string
          name: string
          published?: boolean
          segment: string
          slug: string
          sort_order?: number
          summary: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          concept?: string | null
          cover_url?: string | null
          created_at?: string
          fronts?: string[]
          id?: string
          identities?: Json
          location?: string | null
          logo_url?: string
          name?: string
          published?: boolean
          segment?: string
          slug?: string
          sort_order?: number
          summary?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          company: string
          created_at: string
          id: string
          name: string
          responsible_id: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          company: string
          created_at?: string
          id?: string
          name: string
          responsible_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          id?: string
          name?: string
          responsible_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          inquiry_type: string | null
          last_name: string | null
          message: string | null
          phone: string | null
          status: string
          website: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          inquiry_type?: string | null
          last_name?: string | null
          message?: string | null
          phone?: string | null
          status?: string
          website?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          inquiry_type?: string | null
          last_name?: string | null
          message?: string | null
          phone?: string | null
          status?: string
          website?: string | null
        }
        Relationships: []
      }
      employee_records: {
        Row: {
          additional_amount_cents: number | null
          commission_percent: number | null
          contract_type: string | null
          created_at: string
          created_by: string | null
          employment_status: string
          fixed_amount_cents: number | null
          hired_on: string | null
          payment_day: number | null
          payment_model: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          additional_amount_cents?: number | null
          commission_percent?: number | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          employment_status?: string
          fixed_amount_cents?: number | null
          hired_on?: string | null
          payment_day?: number | null
          payment_model?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          additional_amount_cents?: number | null
          commission_percent?: number | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          employment_status?: string
          fixed_amount_cents?: number | null
          hired_on?: string | null
          payment_day?: number | null
          payment_model?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_files: {
        Row: {
          created_at: string
          created_by: string | null
          demand_id: string
          id: string
          kind: string
          mime: string
          name: string
          path: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          demand_id: string
          id?: string
          kind: string
          mime: string
          name: string
          path: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          demand_id?: string
          id?: string
          kind?: string
          mime?: string
          name?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_files_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_files_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      demands: {
        Row: {
          briefing: string | null
          client_id: string
          created_at: string
          created_by: string | null
          description: string
          due_on: string | null
          feedback_type_id: string | null
          id: string
          kind: string
          priority: string
          responsible_id: string | null
          solution: string | null
          source_demand_id: string | null
          status: string
          title: string | null
          updated_at: string
          variation_note: string | null
        }
        Insert: {
          briefing?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          description: string
          due_on?: string | null
          feedback_type_id?: string | null
          id?: string
          kind: string
          priority?: string
          responsible_id?: string | null
          solution?: string | null
          source_demand_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          variation_note?: string | null
        }
        Update: {
          briefing?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          due_on?: string | null
          feedback_type_id?: string | null
          id?: string
          kind?: string
          priority?: string
          responsible_id?: string | null
          solution?: string | null
          source_demand_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          variation_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demands_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_feedback_type_id_fkey"
            columns: ["feedback_type_id"]
            isOneToOne: false
            referencedRelation: "feedback_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_source_demand_id_fkey"
            columns: ["source_demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_types: {
        Row: {
          created_at: string
          id: string
          name: string
          solution: string
          sort_order: number
          spawns_creator: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          solution?: string
          sort_order?: number
          spawns_creator?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          solution?: string
          sort_order?: number
          spawns_creator?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available: boolean
          avatar_url: string | null
          cargo: string | null
          company: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_completed: boolean
          phone: string | null
          role: string | null
          status_id: string | null
          updated_at: string
        }
        Insert: {
          available?: boolean
          avatar_url?: string | null
          cargo?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          role?: string | null
          status_id?: string | null
          updated_at?: string
        }
        Update: {
          available?: boolean
          avatar_url?: string | null
          cargo?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          role?: string | null
          status_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "team_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      team_statuses: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_profile_onboarding: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      employee_access_is_active: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      profile_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      profile_is_ops: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      communication_begin_idempotency: { Args: { p_operation: string; p_key: string; p_body_hash: string }; Returns: Json }
      communication_complete_idempotency: { Args: { p_id: string; p_response: Json }; Returns: Json }
      communication_create_room: { Args: { p_name: string; p_description: string; p_access: string; p_invitee_ids: string[] }; Returns: Json }
      communication_update_room: { Args: Record<string, unknown>; Returns: Json }
      communication_archive_room: { Args: Record<string, unknown>; Returns: Json }
      communication_invite_to_room: { Args: Record<string, unknown>; Returns: Json }
      communication_respond_room_invite: { Args: Record<string, unknown>; Returns: Json }
      communication_remove_member: { Args: Record<string, unknown>; Returns: Json }
      communication_patch_member_role: { Args: Record<string, unknown>; Returns: Json }
      communication_transfer_room: { Args: Record<string, unknown>; Returns: Json }
      communication_create_call: { Args: Record<string, unknown>; Returns: Json }
      communication_invite_to_call: { Args: Record<string, unknown>; Returns: Json }
      communication_respond_call_invite: { Args: Record<string, unknown>; Returns: Json }
      communication_cancel_call: { Args: Record<string, unknown>; Returns: Json }
      communication_join: { Args: Record<string, unknown>; Returns: Json }
      communication_takeover: { Args: Record<string, unknown>; Returns: Json }
      communication_mark_joined: { Args: Record<string, unknown>; Returns: Json }
      communication_leave: { Args: Record<string, unknown>; Returns: Json }
      communication_renew: { Args: Record<string, unknown>; Returns: Json }
      communication_reserve_publication: { Args: Record<string, unknown>; Returns: Json }
      communication_release_publication: { Args: Record<string, unknown>; Returns: Json }
      communication_publish_ok: { Args: Record<string, unknown>; Returns: Json }
      communication_moderate: { Args: Record<string, unknown>; Returns: Json }
      communication_end_session: { Args: Record<string, unknown>; Returns: Json }
      communication_list_people: { Args: Record<PropertyKey, never>; Returns: Json }
      communication_read_notification: { Args: Record<string, unknown>; Returns: Json }
      communication_tick: { Args: Record<PropertyKey, never>; Returns: Json }
      communication_record_provider_event: { Args: Record<string, unknown>; Returns: Json }
      communication_finish_provider_event: { Args: Record<string, unknown>; Returns: undefined }
      communication_confirm_joined_service: { Args: Record<string, unknown>; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
