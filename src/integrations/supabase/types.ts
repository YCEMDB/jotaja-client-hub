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
      app_plans: {
        Row: {
          features: Json
          id: string
          is_active: boolean
          name: string
          position: number
          price_monthly: number
          updated_at: string
        }
        Insert: {
          features?: Json
          id: string
          is_active?: boolean
          name: string
          position?: number
          price_monthly?: number
          updated_at?: string
        }
        Update: {
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          price_monthly?: number
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          actor_type: string
          category: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip: unknown
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          reason: string | null
          restaurant_id: string | null
          support_session_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          actor_type?: string
          category?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: unknown
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          reason?: string | null
          restaurant_id?: string | null
          support_session_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          actor_type?: string
          category?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: unknown
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          reason?: string | null
          restaurant_id?: string | null
          support_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_support_session_id_fkey"
            columns: ["support_session_id"]
            isOneToOne: false
            referencedRelation: "support_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          order_id: string | null
          restaurant_id: string
          session_id: string
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          restaurant_id: string
          session_id: string
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          restaurant_id?: string
          session_id?: string
          type?: Database["public"]["Enums"]["cash_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_amount: number | null
          created_at: string
          difference: number | null
          expected_amount: number | null
          id: string
          notes: string | null
          opened_at: string
          opened_by: string | null
          opening_amount: number
          origin: string
          restaurant_id: string
          status: Database["public"]["Enums"]["cash_session_status"]
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          created_at?: string
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          opening_amount?: number
          origin?: string
          restaurant_id: string
          status?: Database["public"]["Enums"]["cash_session_status"]
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          created_at?: string
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          opening_amount?: number
          origin?: string
          restaurant_id?: string
          status?: Database["public"]["Enums"]["cash_session_status"]
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          position: number | null
          restaurant_id: string
          station_id: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          position?: number | null
          restaurant_id: string
          station_id?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          position?: number | null
          restaurant_id?: string
          station_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "kitchen_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_event_bindings: {
        Row: {
          channel: Database["public"]["Enums"]["comm_channel"]
          conditions: Json
          created_at: string
          event_name: string
          id: string
          is_active: boolean
          restaurant_id: string
          settings_id: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["comm_channel"]
          conditions?: Json
          created_at?: string
          event_name: string
          id?: string
          is_active?: boolean
          restaurant_id: string
          settings_id?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["comm_channel"]
          conditions?: Json
          created_at?: string
          event_name?: string
          id?: string
          is_active?: boolean
          restaurant_id?: string
          settings_id?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_event_bindings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_event_bindings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_event_bindings_settings_id_fkey"
            columns: ["settings_id"]
            isOneToOne: false
            referencedRelation: "communication_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_event_bindings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "communication_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_logs: {
        Row: {
          attempt: number
          created_at: string
          direction: Database["public"]["Enums"]["comm_log_direction"]
          error: string | null
          id: number
          latency_ms: number | null
          queue_id: string | null
          raw_request: Json | null
          raw_response: Json | null
          restaurant_id: string
          settings_id: string | null
          status: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          direction: Database["public"]["Enums"]["comm_log_direction"]
          error?: string | null
          id?: number
          latency_ms?: number | null
          queue_id?: string | null
          raw_request?: Json | null
          raw_response?: Json | null
          restaurant_id: string
          settings_id?: string | null
          status: string
        }
        Update: {
          attempt?: number
          created_at?: string
          direction?: Database["public"]["Enums"]["comm_log_direction"]
          error?: string | null
          id?: number
          latency_ms?: number | null
          queue_id?: string | null
          raw_request?: Json | null
          raw_response?: Json | null
          restaurant_id?: string
          settings_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "communication_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_settings_id_fkey"
            columns: ["settings_id"]
            isOneToOne: false
            referencedRelation: "communication_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_providers: {
        Row: {
          capabilities: Json
          channel: Database["public"]["Enums"]["comm_channel"]
          code: string
          created_at: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          capabilities?: Json
          channel: Database["public"]["Enums"]["comm_channel"]
          code: string
          created_at?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          capabilities?: Json
          channel?: Database["public"]["Enums"]["comm_channel"]
          code?: string
          created_at?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      communication_queue: {
        Row: {
          attempts: number
          channel: Database["public"]["Enums"]["comm_channel"]
          created_at: string
          error_code: string | null
          error_message: string | null
          event_name: string | null
          id: string
          idempotency_key: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          next_retry_at: string | null
          payload: Json
          provider_message_id: string | null
          rendered_body: string | null
          rendered_subject: string | null
          restaurant_id: string
          sent_at: string | null
          settings_id: string | null
          status: Database["public"]["Enums"]["comm_status"]
          template_code: string | null
          template_id: string | null
          to_address: string
          updated_at: string
          variables: Json
        }
        Insert: {
          attempts?: number
          channel: Database["public"]["Enums"]["comm_channel"]
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          event_name?: string | null
          id?: string
          idempotency_key?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          next_retry_at?: string | null
          payload?: Json
          provider_message_id?: string | null
          rendered_body?: string | null
          rendered_subject?: string | null
          restaurant_id: string
          sent_at?: string | null
          settings_id?: string | null
          status?: Database["public"]["Enums"]["comm_status"]
          template_code?: string | null
          template_id?: string | null
          to_address: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          attempts?: number
          channel?: Database["public"]["Enums"]["comm_channel"]
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          event_name?: string | null
          id?: string
          idempotency_key?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          next_retry_at?: string | null
          payload?: Json
          provider_message_id?: string | null
          rendered_body?: string | null
          rendered_subject?: string | null
          restaurant_id?: string
          sent_at?: string | null
          settings_id?: string | null
          status?: Database["public"]["Enums"]["comm_status"]
          template_code?: string | null
          template_id?: string | null
          to_address?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "communication_queue_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_queue_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_queue_settings_id_fkey"
            columns: ["settings_id"]
            isOneToOne: false
            referencedRelation: "communication_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "communication_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_secrets: {
        Row: {
          api_key: string | null
          extra: Json
          settings_id: string
          token: string | null
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          extra?: Json
          settings_id: string
          token?: string | null
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          extra?: Json
          settings_id?: string
          token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_secrets_settings_id_fkey"
            columns: ["settings_id"]
            isOneToOne: true
            referencedRelation: "communication_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_settings: {
        Row: {
          channel: Database["public"]["Enums"]["comm_channel"]
          config: Json
          created_at: string
          deleted_at: string | null
          display_name: string
          health: Database["public"]["Enums"]["comm_health"]
          id: string
          is_active: boolean
          last_error: string | null
          last_latency_ms: number | null
          last_sync_at: string | null
          provider_code: string
          restaurant_id: string
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          channel: Database["public"]["Enums"]["comm_channel"]
          config?: Json
          created_at?: string
          deleted_at?: string | null
          display_name: string
          health?: Database["public"]["Enums"]["comm_health"]
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_latency_ms?: number | null
          last_sync_at?: string | null
          provider_code: string
          restaurant_id: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["comm_channel"]
          config?: Json
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          health?: Database["public"]["Enums"]["comm_health"]
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_latency_ms?: number | null
          last_sync_at?: string | null
          provider_code?: string
          restaurant_id?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_settings_provider_code_fkey"
            columns: ["provider_code"]
            isOneToOne: false
            referencedRelation: "communication_providers"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "communication_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["comm_category"]
          channel: Database["public"]["Enums"]["comm_channel"]
          code: string
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          restaurant_id: string | null
          subject: string | null
          updated_at: string
          variables: string[]
          version: number
        }
        Insert: {
          body: string
          category: Database["public"]["Enums"]["comm_category"]
          channel: Database["public"]["Enums"]["comm_channel"]
          code: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          restaurant_id?: string | null
          subject?: string | null
          updated_at?: string
          variables?: string[]
          version?: number
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["comm_category"]
          channel?: Database["public"]["Enums"]["comm_channel"]
          code?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          restaurant_id?: string | null
          subject?: string | null
          updated_at?: string
          variables?: string[]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "communication_templates_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "communication_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_templates_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_templates_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_automation_fires: {
        Row: {
          conversation_id: string
          fired_at: string
          id: string
          queue_id: string | null
          restaurant_id: string
          rule_id: string
        }
        Insert: {
          conversation_id: string
          fired_at?: string
          id?: string
          queue_id?: string | null
          restaurant_id: string
          rule_id: string
        }
        Update: {
          conversation_id?: string
          fired_at?: string
          id?: string
          queue_id?: string | null
          restaurant_id?: string
          rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_automation_fires_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_automation_fires_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "communication_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_automation_fires_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_automation_fires_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_automation_fires_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "conversation_automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_automation_rules: {
        Row: {
          code: string | null
          cooldown_seconds: number
          created_at: string
          handoff: boolean
          id: string
          is_active: boolean
          match_mode: string
          name: string
          priority: number
          response_body: string | null
          response_template_id: string | null
          restaurant_id: string
          trigger_type: string
          trigger_value: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          cooldown_seconds?: number
          created_at?: string
          handoff?: boolean
          id?: string
          is_active?: boolean
          match_mode?: string
          name: string
          priority?: number
          response_body?: string | null
          response_template_id?: string | null
          restaurant_id: string
          trigger_type?: string
          trigger_value: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          cooldown_seconds?: number
          created_at?: string
          handoff?: boolean
          id?: string
          is_active?: boolean
          match_mode?: string
          name?: string
          priority?: number
          response_body?: string | null
          response_template_id?: string | null
          restaurant_id?: string
          trigger_type?: string
          trigger_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_automation_rules_response_template_id_fkey"
            columns: ["response_template_id"]
            isOneToOne: false
            referencedRelation: "communication_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_automation_rules_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_automation_rules_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          author_user_id: string | null
          body: string
          caption: string | null
          conversation_id: string
          created_at: string
          direction: string
          id: string
          media_mime: string | null
          media_type: string
          media_url: string | null
          order_id: string | null
          payload_normalized: Json | null
          payload_raw: Json | null
          provider_message_id: string | null
          queue_id: string | null
          received_at: string
          restaurant_id: string
          source: string
          status: string
        }
        Insert: {
          author_user_id?: string | null
          body: string
          caption?: string | null
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          media_mime?: string | null
          media_type?: string
          media_url?: string | null
          order_id?: string | null
          payload_normalized?: Json | null
          payload_raw?: Json | null
          provider_message_id?: string | null
          queue_id?: string | null
          received_at?: string
          restaurant_id: string
          source?: string
          status?: string
        }
        Update: {
          author_user_id?: string | null
          body?: string
          caption?: string | null
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          media_mime?: string | null
          media_type?: string
          media_url?: string | null
          order_id?: string | null
          payload_normalized?: Json | null
          payload_raw?: Json | null
          provider_message_id?: string | null
          queue_id?: string | null
          received_at?: string
          restaurant_id?: string
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "communication_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel: Database["public"]["Enums"]["comm_channel"]
          created_at: string
          customer_id: string | null
          id: string
          last_direction: string | null
          last_message_at: string | null
          last_message_preview: string | null
          order_id: string | null
          peer_address: string
          peer_name: string | null
          provider_code: string
          restaurant_id: string
          settings_id: string | null
          status: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["comm_channel"]
          created_at?: string
          customer_id?: string | null
          id?: string
          last_direction?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          order_id?: string | null
          peer_address: string
          peer_name?: string | null
          provider_code?: string
          restaurant_id: string
          settings_id?: string | null
          status?: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["comm_channel"]
          created_at?: string
          customer_id?: string | null
          id?: string
          last_direction?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          order_id?: string | null
          peer_address?: string
          peer_name?: string | null
          provider_code?: string
          restaurant_id?: string
          settings_id?: string | null
          status?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_settings_id_fkey"
            columns: ["settings_id"]
            isOneToOne: false
            referencedRelation: "communication_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_uses: {
        Row: {
          coupon_id: string
          customer_id: string | null
          discount: number
          id: string
          order_id: string | null
          restaurant_id: string
          used_at: string
        }
        Insert: {
          coupon_id: string
          customer_id?: string | null
          discount?: number
          id?: string
          order_id?: string | null
          restaurant_id: string
          used_at?: string
        }
        Update: {
          coupon_id?: string
          customer_id?: string | null
          discount?: number
          id?: string
          order_id?: string | null
          restaurant_id?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_uses_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          first_purchase_only: boolean
          id: string
          is_active: boolean | null
          max_uses: number | null
          max_uses_per_customer: number | null
          min_order: number | null
          restaurant_id: string
          starts_at: string | null
          type: Database["public"]["Enums"]["coupon_type"]
          uses_count: number | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          first_purchase_only?: boolean
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_customer?: number | null
          min_order?: number | null
          restaurant_id: string
          starts_at?: string | null
          type?: Database["public"]["Enums"]["coupon_type"]
          uses_count?: number | null
          value?: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          first_purchase_only?: boolean
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_customer?: number | null
          min_order?: number | null
          restaurant_id?: string
          starts_at?: string | null
          type?: Database["public"]["Enums"]["coupon_type"]
          uses_count?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          addresses: Json | null
          avg_ticket: number | null
          cpf: string | null
          created_at: string
          email: string | null
          email_opt_in: boolean
          first_order_at: string | null
          id: string
          is_blocked: boolean
          last_order_at: string | null
          loyalty_points: number
          name: string
          notes: string | null
          phone: string
          restaurant_id: string
          source: string
          tags: Json
          total_orders: number | null
          total_spent: number | null
          updated_at: string
          whatsapp_opt_in: boolean
        }
        Insert: {
          addresses?: Json | null
          avg_ticket?: number | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          email_opt_in?: boolean
          first_order_at?: string | null
          id?: string
          is_blocked?: boolean
          last_order_at?: string | null
          loyalty_points?: number
          name: string
          notes?: string | null
          phone: string
          restaurant_id: string
          source?: string
          tags?: Json
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
          whatsapp_opt_in?: boolean
        }
        Update: {
          addresses?: Json | null
          avg_ticket?: number | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          email_opt_in?: boolean
          first_order_at?: string | null
          id?: string
          is_blocked?: boolean
          last_order_at?: string | null
          loyalty_points?: number
          name?: string
          notes?: string | null
          phone?: string
          restaurant_id?: string
          source?: string
          tags?: Json
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
          whatsapp_opt_in?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_areas: {
        Row: {
          city: string | null
          estimated_minutes: number | null
          fee: number
          id: string
          is_active: boolean | null
          min_order: number | null
          neighborhood: string
          restaurant_id: string
        }
        Insert: {
          city?: string | null
          estimated_minutes?: number | null
          fee?: number
          id?: string
          is_active?: boolean | null
          min_order?: number | null
          neighborhood: string
          restaurant_id: string
        }
        Update: {
          city?: string | null
          estimated_minutes?: number | null
          fee?: number
          id?: string
          is_active?: boolean | null
          min_order?: number | null
          neighborhood?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_areas_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_areas_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_drivers: {
        Row: {
          commission_percent: number
          created_at: string
          current_latitude: number | null
          current_longitude: number | null
          email: string | null
          fee_per_delivery: number
          id: string
          is_active: boolean | null
          last_location_at: string | null
          license_plate: string | null
          name: string
          phone: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["driver_status"]
          updated_at: string
          user_id: string | null
          vehicle: string | null
        }
        Insert: {
          commission_percent?: number
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          email?: string | null
          fee_per_delivery?: number
          id?: string
          is_active?: boolean | null
          last_location_at?: string | null
          license_plate?: string | null
          name: string
          phone?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          user_id?: string | null
          vehicle?: string | null
        }
        Update: {
          commission_percent?: number
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          email?: string | null
          fee_per_delivery?: number
          id?: string
          is_active?: boolean | null
          last_location_at?: string | null
          license_plate?: string | null
          name?: string
          phone?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          user_id?: string | null
          vehicle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_drivers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_drivers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_neighborhoods: {
        Row: {
          city: string
          created_at: string
          id: string
          name: string
          state: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          name: string
          state?: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          name?: string
          state?: string
        }
        Relationships: []
      }
      driver_locations: {
        Row: {
          accuracy: number | null
          driver_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          order_id: string | null
          recorded_at: string
          restaurant_id: string
          speed: number | null
        }
        Insert: {
          accuracy?: number | null
          driver_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          order_id?: string | null
          recorded_at?: string
          restaurant_id: string
          speed?: number | null
        }
        Update: {
          accuracy?: number | null
          driver_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          order_id?: string | null
          recorded_at?: string
          restaurant_id?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      finance_categories: {
        Row: {
          color: string | null
          created_at: string
          direction: Database["public"]["Enums"]["finance_direction"]
          id: string
          is_active: boolean
          name: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["finance_direction"]
          id?: string
          is_active?: boolean
          name: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["finance_direction"]
          id?: string
          is_active?: boolean
          name?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_cost_centers: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_cost_centers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_cost_centers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_entries: {
        Row: {
          amount: number
          amount_paid: number
          cash_session_id: string | null
          category_id: string | null
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          customer: string | null
          description: string
          direction: Database["public"]["Enums"]["finance_direction"]
          document: string | null
          due_date: string
          id: string
          is_fixed: boolean
          issue_date: string
          notes: string | null
          order_id: string | null
          paid_at: string | null
          payment_method:
            | Database["public"]["Enums"]["finance_pay_method"]
            | null
          recurrence: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["finance_status"]
          supplier: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          amount_paid?: number
          cash_session_id?: string | null
          category_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          customer?: string | null
          description: string
          direction: Database["public"]["Enums"]["finance_direction"]
          document?: string | null
          due_date: string
          id?: string
          is_fixed?: boolean
          issue_date?: string
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_method?:
            | Database["public"]["Enums"]["finance_pay_method"]
            | null
          recurrence?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["finance_status"]
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_paid?: number
          cash_session_id?: string | null
          category_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          customer?: string | null
          description?: string
          direction?: Database["public"]["Enums"]["finance_direction"]
          document?: string | null
          due_date?: string
          id?: string
          is_fixed?: boolean
          issue_date?: string
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_method?:
            | Database["public"]["Enums"]["finance_pay_method"]
            | null
          recurrence?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["finance_status"]
          supplier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_entries_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_entries_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "finance_cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_entries_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_entries_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_reconciliations: {
        Row: {
          created_at: string
          difference: number | null
          expected_amount: number
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          period_from: string
          period_to: string
          received_amount: number
          reconciled_at: string
          reconciled_by: string | null
          restaurant_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          difference?: number | null
          expected_amount?: number
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          period_from: string
          period_to: string
          received_amount?: number
          reconciled_at?: string
          reconciled_by?: string | null
          restaurant_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          difference?: number | null
          expected_amount?: number
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          period_from?: string
          period_to?: string
          received_amount?: number
          reconciled_at?: string
          reconciled_by?: string | null
          restaurant_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_reconciliations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_reconciliations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      global_announcements: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          variant: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          variant?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          variant?: string
        }
        Relationships: []
      }
      kitchen_stations: {
        Row: {
          color: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          position: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          position?: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_stations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_stations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_webhook_events: {
        Row: {
          attempts: number
          created_at: string
          event_id: string
          id: number
          last_error: string | null
          next_retry_at: string | null
          order_id: string | null
          payload: Json
          processed_at: string | null
          restaurant_id: string | null
          status: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          event_id: string
          id?: number
          last_error?: string | null
          next_retry_at?: string | null
          order_id?: string | null
          payload: Json
          processed_at?: string | null
          restaurant_id?: string | null
          status?: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          event_id?: string
          id?: number
          last_error?: string | null
          next_retry_at?: string | null
          order_id?: string | null
          payload?: Json
          processed_at?: string | null
          restaurant_id?: string | null
          status?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      operations_settings: {
        Row: {
          auto_print_on_confirmed: boolean
          auto_print_on_preparing: boolean
          auto_print_on_ready: boolean
          created_at: string
          default_driver: string
          printer_name: string | null
          restaurant_id: string
          sla_green_minutes: number
          sla_red_minutes: number
          sla_yellow_minutes: number
          sound_enabled: boolean
          updated_at: string
        }
        Insert: {
          auto_print_on_confirmed?: boolean
          auto_print_on_preparing?: boolean
          auto_print_on_ready?: boolean
          created_at?: string
          default_driver?: string
          printer_name?: string | null
          restaurant_id: string
          sla_green_minutes?: number
          sla_red_minutes?: number
          sla_yellow_minutes?: number
          sound_enabled?: boolean
          updated_at?: string
        }
        Update: {
          auto_print_on_confirmed?: boolean
          auto_print_on_preparing?: boolean
          auto_print_on_ready?: boolean
          created_at?: string
          default_driver?: string
          printer_name?: string | null
          restaurant_id?: string
          sla_green_minutes?: number
          sla_red_minutes?: number
          sla_yellow_minutes?: number
          sound_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operations_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operations_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          notes: string | null
          options: Json | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          id?: string
          notes?: string | null
          options?: Json | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          subtotal: number
          unit_price: number
        }
        Update: {
          id?: string
          notes?: string | null
          options?: Json | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: string
          order_id: string
          reason: string | null
          restaurant_id: string
          source: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          order_id: string
          reason?: string | null
          restaurant_id: string
          source?: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          order_id?: string
          reason?: string | null
          restaurant_id?: string
          source?: string
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          change_for: number | null
          coupon_code: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_address: Json | null
          delivery_fee: number
          discount: number
          driver_accepted_at: string | null
          driver_assigned_at: string | null
          driver_commission_amount: number | null
          driver_delivered_at: string | null
          driver_id: string | null
          driver_picked_up_at: string | null
          driver_reject_reason: string | null
          driver_rejected_at: string | null
          estimated_minutes: number | null
          id: string
          mp_payment_id: string | null
          notes: string | null
          order_number: number
          paid_at: string | null
          payment: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          pix_expires_at: string | null
          pix_qr_code: string | null
          pix_qr_code_base64: string | null
          pix_txid: string | null
          restaurant_id: string
          source: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_command_id: string | null
          table_number: number | null
          table_session_id: string | null
          total: number
          type: Database["public"]["Enums"]["order_type"]
          updated_at: string
        }
        Insert: {
          change_for?: number | null
          coupon_code?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivery_address?: Json | null
          delivery_fee?: number
          discount?: number
          driver_accepted_at?: string | null
          driver_assigned_at?: string | null
          driver_commission_amount?: number | null
          driver_delivered_at?: string | null
          driver_id?: string | null
          driver_picked_up_at?: string | null
          driver_reject_reason?: string | null
          driver_rejected_at?: string | null
          estimated_minutes?: number | null
          id?: string
          mp_payment_id?: string | null
          notes?: string | null
          order_number?: number
          paid_at?: string | null
          payment?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          pix_txid?: string | null
          restaurant_id: string
          source?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_command_id?: string | null
          table_number?: number | null
          table_session_id?: string | null
          total?: number
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
        }
        Update: {
          change_for?: number | null
          coupon_code?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: Json | null
          delivery_fee?: number
          discount?: number
          driver_accepted_at?: string | null
          driver_assigned_at?: string | null
          driver_commission_amount?: number | null
          driver_delivered_at?: string | null
          driver_id?: string | null
          driver_picked_up_at?: string | null
          driver_reject_reason?: string | null
          driver_rejected_at?: string | null
          estimated_minutes?: number | null
          id?: string
          mp_payment_id?: string | null
          notes?: string | null
          order_number?: number
          paid_at?: string | null
          payment?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          pix_txid?: string | null
          restaurant_id?: string
          source?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_command_id?: string | null
          table_number?: number | null
          table_session_id?: string | null
          total?: number
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_command_id_fkey"
            columns: ["table_command_id"]
            isOneToOne: false
            referencedRelation: "table_commands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_session_id_fkey"
            columns: ["table_session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      print_jobs: {
        Row: {
          attempts: number
          created_at: string
          driver: string
          event: string
          id: string
          last_error: string | null
          order_id: string | null
          payload: Json
          printed_at: string | null
          requested_by: string | null
          restaurant_id: string
          station_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          driver?: string
          event: string
          id?: string
          last_error?: string | null
          order_id?: string | null
          payload?: Json
          printed_at?: string | null
          requested_by?: string | null
          restaurant_id: string
          station_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          driver?: string
          event?: string
          id?: string
          last_error?: string | null
          order_id?: string | null
          payload?: Json
          printed_at?: string | null
          requested_by?: string | null
          restaurant_id?: string
          station_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_jobs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_jobs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_jobs_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "kitchen_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_groups: {
        Row: {
          archived_at: string | null
          id: string
          is_required: boolean
          max_select: number
          min_select: number
          name: string
          position: number
          product_id: string
        }
        Insert: {
          archived_at?: string | null
          id?: string
          is_required?: boolean
          max_select?: number
          min_select?: number
          name: string
          position?: number
          product_id: string
        }
        Update: {
          archived_at?: string | null
          id?: string
          is_required?: boolean
          max_select?: number
          min_select?: number
          name?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_items: {
        Row: {
          archived_at: string | null
          extra_price: number
          group_id: string
          id: string
          is_available: boolean
          name: string
          position: number
        }
        Insert: {
          archived_at?: string | null
          extra_price?: number
          group_id: string
          id?: string
          is_available?: boolean
          name: string
          position?: number
        }
        Update: {
          archived_at?: string | null
          extra_price?: number
          group_id?: string
          id?: string
          is_available?: boolean
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_option_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "product_option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recipes: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          notes: string | null
          product_id: string
          quantity: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          notes?: string | null
          product_id: string
          quantity: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recipes_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "stock_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          archived_at: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          position: number | null
          price: number
          promo_price: number | null
          restaurant_id: string
          station_id: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          position?: number | null
          price: number
          promo_price?: number | null
          restaurant_id: string
          station_id?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          position?: number | null
          price?: number
          promo_price?: number | null
          restaurant_id?: string
          station_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "kitchen_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          position: string | null
          restaurant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          position?: string | null
          restaurant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          position?: string | null
          restaurant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_restaurant_fk"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_restaurant_fk"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_replies: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          position: number
          restaurant_id: string
          shortcut: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          restaurant_id: string
          shortcut?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          restaurant_id?: string
          shortcut?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_replies_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_replies_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_events: {
        Row: {
          bucket_key: string
          created_at: string
          endpoint: string
          id: number
          ip: string | null
          restaurant_id: string | null
          user_id: string | null
        }
        Insert: {
          bucket_key: string
          created_at?: string
          endpoint: string
          id?: number
          ip?: string | null
          restaurant_id?: string | null
          user_id?: string | null
        }
        Update: {
          bucket_key?: string
          created_at?: string
          endpoint?: string
          id?: number
          ip?: string | null
          restaurant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      restaurant_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          restaurant_id: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          restaurant_id: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          restaurant_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_invites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_invites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          method: string | null
          notes: string | null
          paid_at: string
          period_end: string
          period_start: string
          plan: string
          restaurant_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string
          period_end: string
          period_start?: string
          plan: string
          restaurant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string
          period_end?: string
          period_start?: string
          plan?: string
          restaurant_id?: string
        }
        Relationships: []
      }
      restaurant_secrets: {
        Row: {
          mp_access_token: string | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          mp_access_token?: string | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          mp_access_token?: string | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_secrets_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_secrets_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          area: string | null
          capacity: number
          created_at: string
          height: number
          id: string
          is_active: boolean
          name: string | null
          notes: string | null
          number: number
          position_x: number | null
          position_y: number | null
          qr_token: string
          restaurant_id: string
          rotation: number
          shape: string
          updated_at: string
          width: number
        }
        Insert: {
          area?: string | null
          capacity?: number
          created_at?: string
          height?: number
          id?: string
          is_active?: boolean
          name?: string | null
          notes?: string | null
          number: number
          position_x?: number | null
          position_y?: number | null
          qr_token?: string
          restaurant_id: string
          rotation?: number
          shape?: string
          updated_at?: string
          width?: number
        }
        Update: {
          area?: string | null
          capacity?: number
          created_at?: string
          height?: number
          id?: string
          is_active?: boolean
          name?: string | null
          notes?: string | null
          number?: number
          position_x?: number | null
          position_y?: number | null
          qr_token?: string
          restaurant_id?: string
          rotation?: number
          shape?: string
          updated_at?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          accent_color: string | null
          accept_card_on_delivery: boolean
          accept_cash_on_delivery: boolean
          accept_pix_online: boolean
          accepts_delivery: boolean | null
          accepts_dine_in: boolean | null
          accepts_pickup: boolean | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          admin_notes: string | null
          auto_print_copies: number
          auto_print_enabled: boolean
          cnpj: string | null
          cover_url: string | null
          created_at: string
          custom_domain: string | null
          custom_domain_verified: boolean
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_open: boolean | null
          logo_url: string | null
          min_order_value: number | null
          month_reset_at: string
          monthly_order_count: number
          mp_public_key: string | null
          name: string
          open_mode: string
          opening_hours: Json | null
          order_number_seq: number
          owner_id: string
          phone: string | null
          pickup_instructions: string | null
          pickup_time_minutes: number | null
          plan: Database["public"]["Enums"]["restaurant_plan"] | null
          plan_id: string | null
          primary_color: string | null
          slug: string
          stock_auto_debit_status: string
          stock_reverse_on_cancel: boolean
          subscription_ends_at: string | null
          timezone: string
          trial_ends_at: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          accent_color?: string | null
          accept_card_on_delivery?: boolean
          accept_cash_on_delivery?: boolean
          accept_pix_online?: boolean
          accepts_delivery?: boolean | null
          accepts_dine_in?: boolean | null
          accepts_pickup?: boolean | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          admin_notes?: string | null
          auto_print_copies?: number
          auto_print_enabled?: boolean
          cnpj?: string | null
          cover_url?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_domain_verified?: boolean
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_open?: boolean | null
          logo_url?: string | null
          min_order_value?: number | null
          month_reset_at?: string
          monthly_order_count?: number
          mp_public_key?: string | null
          name: string
          open_mode?: string
          opening_hours?: Json | null
          order_number_seq?: number
          owner_id: string
          phone?: string | null
          pickup_instructions?: string | null
          pickup_time_minutes?: number | null
          plan?: Database["public"]["Enums"]["restaurant_plan"] | null
          plan_id?: string | null
          primary_color?: string | null
          slug: string
          stock_auto_debit_status?: string
          stock_reverse_on_cancel?: boolean
          subscription_ends_at?: string | null
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          accent_color?: string | null
          accept_card_on_delivery?: boolean
          accept_cash_on_delivery?: boolean
          accept_pix_online?: boolean
          accepts_delivery?: boolean | null
          accepts_dine_in?: boolean | null
          accepts_pickup?: boolean | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          admin_notes?: string | null
          auto_print_copies?: number
          auto_print_enabled?: boolean
          cnpj?: string | null
          cover_url?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_domain_verified?: boolean
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_open?: boolean | null
          logo_url?: string | null
          min_order_value?: number | null
          month_reset_at?: string
          monthly_order_count?: number
          mp_public_key?: string | null
          name?: string
          open_mode?: string
          opening_hours?: Json | null
          order_number_seq?: number
          owner_id?: string
          phone?: string | null
          pickup_instructions?: string | null
          pickup_time_minutes?: number | null
          plan?: Database["public"]["Enums"]["restaurant_plan"] | null
          plan_id?: string | null
          primary_color?: string | null
          slug?: string
          stock_auto_debit_status?: string
          stock_reverse_on_cancel?: boolean
          subscription_ends_at?: string | null
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "app_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string
          restaurant_id: string | null
          restaurant_name: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          restaurant_id?: string | null
          restaurant_name: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          restaurant_id?: string | null
          restaurant_name?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: []
      }
      stock_ingredients: {
        Row: {
          avg_cost: number
          created_at: string
          current_qty: number
          id: string
          is_active: boolean
          min_qty: number
          name: string
          notes: string | null
          restaurant_id: string
          sku: string | null
          supplier_id: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          avg_cost?: number
          created_at?: string
          current_qty?: number
          id?: string
          is_active?: boolean
          min_qty?: number
          name: string
          notes?: string | null
          restaurant_id: string
          sku?: string | null
          supplier_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          avg_cost?: number
          created_at?: string
          current_qty?: number
          id?: string
          is_active?: boolean
          min_qty?: number
          name?: string
          notes?: string | null
          restaurant_id?: string
          sku?: string | null
          supplier_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_ingredients_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ingredients_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ingredients_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "stock_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ingredients_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "stock_units"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          ingredient_id: string
          metadata: Json
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          order_id: string | null
          qty_after: number
          qty_before: number
          quantity: number
          reason: string | null
          restaurant_id: string
          supplier_id: string | null
          total_cost: number | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          ingredient_id: string
          metadata?: Json
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          order_id?: string | null
          qty_after: number
          qty_before: number
          quantity: number
          reason?: string | null
          restaurant_id: string
          supplier_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          ingredient_id?: string
          metadata?: Json
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          order_id?: string | null
          qty_after?: number
          qty_before?: number
          quantity?: number
          reason?: string | null
          restaurant_id?: string
          supplier_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "stock_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "stock_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_suppliers: {
        Row: {
          contact: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_suppliers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_suppliers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_units: {
        Row: {
          created_at: string
          id: string
          name: string
          restaurant_id: string
          symbol: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          restaurant_id: string
          symbol: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          restaurant_id?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_units_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_units_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      support_sessions: {
        Row: {
          access_level: string
          admin_id: string
          created_at: string
          end_reason: string | null
          ended_at: string | null
          ended_by: string | null
          expires_at: string
          id: string
          reason: string
          restaurant_id: string
          started_at: string
        }
        Insert: {
          access_level?: string
          admin_id: string
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          ended_by?: string | null
          expires_at: string
          id?: string
          reason: string
          restaurant_id: string
          started_at?: string
        }
        Update: {
          access_level?: string
          admin_id?: string
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          ended_by?: string | null
          expires_at?: string
          id?: string
          reason?: string
          restaurant_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      table_commands: {
        Row: {
          closed_at: string | null
          created_at: string
          holder_name: string | null
          id: string
          label: string
          restaurant_id: string
          session_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          holder_name?: string | null
          id?: string
          label: string
          restaurant_id: string
          session_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          holder_name?: string | null
          id?: string
          label?: string
          restaurant_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_commands_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_commands_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_commands_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      table_session_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          id: string
          kind: string
          payload: Json
          restaurant_id: string
          session_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          restaurant_id: string
          session_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          restaurant_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_session_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_session_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_session_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      table_sessions: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          customer_name: string | null
          id: string
          merged_into_session_id: string | null
          notes: string | null
          opened_at: string
          opened_by: string | null
          party_size: number | null
          restaurant_id: string
          status: Database["public"]["Enums"]["table_session_status"]
          table_id: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          merged_into_session_id?: string | null
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          party_size?: number | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["table_session_status"]
          table_id: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          merged_into_session_id?: string | null
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          party_size?: number | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["table_session_status"]
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_sessions_merged_into_session_id_fkey"
            columns: ["merged_into_session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      table_split_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          payer_label: string | null
          restaurant_id: string
          session_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: string
          payer_label?: string | null
          restaurant_id: string
          session_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          payer_label?: string | null
          restaurant_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_split_payments_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_split_payments_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_split_payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_restaurant_fk"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_restaurant_fk"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_team_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      restaurants_team_view: {
        Row: {
          accent_color: string | null
          accept_card_on_delivery: boolean | null
          accept_cash_on_delivery: boolean | null
          accept_pix_online: boolean | null
          accepts_delivery: boolean | null
          accepts_dine_in: boolean | null
          accepts_pickup: boolean | null
          cover_url: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          is_open: boolean | null
          logo_url: string | null
          min_order_value: number | null
          mp_public_key: string | null
          name: string | null
          opening_hours: Json | null
          owner_id: string | null
          pickup_instructions: string | null
          pickup_time_minutes: number | null
          primary_color: string | null
          slug: string | null
          whatsapp: string | null
        }
        Insert: {
          accent_color?: string | null
          accept_card_on_delivery?: boolean | null
          accept_cash_on_delivery?: boolean | null
          accept_pix_online?: boolean | null
          accepts_delivery?: boolean | null
          accepts_dine_in?: boolean | null
          accepts_pickup?: boolean | null
          cover_url?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          is_open?: boolean | null
          logo_url?: string | null
          min_order_value?: number | null
          mp_public_key?: string | null
          name?: string | null
          opening_hours?: Json | null
          owner_id?: string | null
          pickup_instructions?: string | null
          pickup_time_minutes?: number | null
          primary_color?: string | null
          slug?: string | null
          whatsapp?: string | null
        }
        Update: {
          accent_color?: string | null
          accept_card_on_delivery?: boolean | null
          accept_cash_on_delivery?: boolean | null
          accept_pix_online?: boolean | null
          accepts_delivery?: boolean | null
          accepts_dine_in?: boolean | null
          accepts_pickup?: boolean | null
          cover_url?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          is_open?: boolean | null
          logo_url?: string | null
          min_order_value?: number | null
          mp_public_key?: string | null
          name?: string | null
          opening_hours?: Json | null
          owner_id?: string | null
          pickup_instructions?: string | null
          pickup_time_minutes?: number | null
          primary_color?: string | null
          slug?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _apply_stock_sale: {
        Args: { p_order_id: string; p_reverse: boolean }
        Returns: undefined
      }
      _log_order_event: {
        Args: { p_event: string; p_meta?: Json; p_order_id: string }
        Returns: undefined
      }
      _tables_can_manage: { Args: { _rid: string }; Returns: boolean }
      _tables_max_for: { Args: { _rid: string }; Returns: number }
      accept_team_invite: { Args: { p_token: string }; Returns: Json }
      apply_inventory_adjustment: {
        Args: {
          p_ingredient_id: string
          p_physical_qty: number
          p_reason?: string
        }
        Returns: string
      }
      archive_category: {
        Args: { p_id: string; p_reason?: string }
        Returns: undefined
      }
      archive_product: {
        Args: { p_id: string; p_reason?: string }
        Returns: undefined
      }
      assign_driver: {
        Args: { p_driver_id: string; p_order_id: string }
        Returns: undefined
      }
      attach_order_to_session: {
        Args: {
          p_command_id?: string
          p_order_id: string
          p_session_id: string
        }
        Returns: undefined
      }
      block_table: {
        Args: { p_reason?: string; p_table_id: string }
        Returns: undefined
      }
      cancel_table_session: {
        Args: { p_reason?: string; p_session_id: string }
        Returns: undefined
      }
      cancel_team_invite: { Args: { p_invite_id: string }; Returns: undefined }
      cash_session_add_movement: {
        Args: {
          p_amount: number
          p_description?: string
          p_reason?: string
          p_session_id: string
          p_type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Returns: Json
      }
      cash_session_close: {
        Args: {
          p_closing_amount: number
          p_notes?: string
          p_reason?: string
          p_session_id: string
        }
        Returns: Json
      }
      cash_session_open: {
        Args: {
          p_opening_amount: number
          p_reason?: string
          p_restaurant_id: string
        }
        Returns: Json
      }
      check_driver_limit: {
        Args: { _restaurant_id: string }
        Returns: undefined
      }
      check_ingredient_limit: {
        Args: { _restaurant_id: string }
        Returns: undefined
      }
      claim_communication_batch: {
        Args: { p_lock_seconds?: number; p_size?: number; p_worker_id: string }
        Returns: {
          attempts: number
          channel: Database["public"]["Enums"]["comm_channel"]
          created_at: string
          error_code: string | null
          error_message: string | null
          event_name: string | null
          id: string
          idempotency_key: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          next_retry_at: string | null
          payload: Json
          provider_message_id: string | null
          rendered_body: string | null
          rendered_subject: string | null
          restaurant_id: string
          sent_at: string | null
          settings_id: string | null
          status: Database["public"]["Enums"]["comm_status"]
          template_code: string | null
          template_id: string | null
          to_address: string
          updated_at: string
          variables: Json
        }[]
        SetofOptions: {
          from: "*"
          to: "communication_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cleanup_expired_invites: { Args: never; Returns: number }
      close_command: { Args: { p_command_id: string }; Returns: undefined }
      close_table_session: {
        Args: { p_force?: boolean; p_session_id: string; p_splits?: Json }
        Returns: Json
      }
      create_category: {
        Args: {
          p_description?: string
          p_name: string
          p_position?: number
          p_reason?: string
          p_restaurant_id: string
          p_station_id?: string
        }
        Returns: string
      }
      create_driver: {
        Args: {
          p_commission_percent?: number
          p_email?: string
          p_fee_per_delivery?: number
          p_license_plate?: string
          p_name: string
          p_phone?: string
          p_restaurant_id: string
          p_vehicle?: string
        }
        Returns: string
      }
      create_product: {
        Args: {
          p_category_id?: string
          p_description?: string
          p_image_url?: string
          p_is_available?: boolean
          p_name: string
          p_position?: number
          p_price: number
          p_promo_price?: number
          p_reason?: string
          p_restaurant_id: string
          p_station_id?: string
        }
        Returns: string
      }
      create_public_order: {
        Args: {
          p_change_for: number
          p_coupon_code: string
          p_customer_id: string
          p_customer_name: string
          p_customer_phone: string
          p_delivery_address: Json
          p_delivery_fee: number
          p_discount: number
          p_estimated_minutes: number
          p_items: Json
          p_notes: string
          p_payment: string
          p_restaurant_id: string
          p_subtotal: number
          p_total: number
          p_type: string
        }
        Returns: Json
      }
      create_public_table_command: {
        Args: { p_holder_name?: string; p_label: string; p_token: string }
        Returns: string
      }
      create_public_table_order: {
        Args: {
          p_command_id: string
          p_customer_name: string
          p_customer_phone: string
          p_items: Json
          p_notes: string
          p_token: string
        }
        Returns: Json
      }
      create_reconciliation: {
        Args: {
          p_expected_amount: number
          p_from: string
          p_method: Database["public"]["Enums"]["payment_method"]
          p_notes?: string
          p_received_amount: number
          p_restaurant_id: string
          p_to: string
        }
        Returns: {
          created_at: string
          difference: number | null
          expected_amount: number
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          period_from: string
          period_to: string
          received_amount: number
          reconciled_at: string
          reconciled_by: string | null
          restaurant_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "finance_reconciliations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_stock_ingredient: {
        Args: {
          p_initial_cost?: number
          p_initial_qty?: number
          p_min_qty?: number
          p_name: string
          p_notes?: string
          p_reason?: string
          p_restaurant_id: string
          p_sku?: string
          p_supplier_id?: string
          p_unit_id?: string
        }
        Returns: string
      }
      create_table: {
        Args: {
          p_area?: string
          p_capacity?: number
          p_name?: string
          p_notes?: string
          p_number: number
          p_restaurant_id: string
        }
        Returns: string
      }
      create_team_invite: {
        Args: {
          p_email: string
          p_restaurant_id: string
          p_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      delete_table: { Args: { p_table_id: string }; Returns: undefined }
      driver_accept_order: { Args: { p_order_id: string }; Returns: undefined }
      driver_complete_delivery: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      driver_pickup_order: { Args: { p_order_id: string }; Returns: undefined }
      driver_reject_order: {
        Args: { p_order_id: string; p_reason?: string }
        Returns: undefined
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      end_support_session: { Args: { p_session_id?: string }; Returns: Json }
      enqueue_communication: {
        Args: {
          p_channel?: Database["public"]["Enums"]["comm_channel"]
          p_event: string
          p_idempotency_key?: string
          p_restaurant_id: string
          p_to: string
          p_variables: Json
        }
        Returns: string
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      enqueue_print_job: {
        Args: {
          p_driver?: string
          p_event?: string
          p_order_id: string
          p_station_id?: string
        }
        Returns: Json
      }
      extend_trial: {
        Args: { p_days: number; p_reason: string; p_restaurant_id: string }
        Returns: Json
      }
      finance_entry_cancel:
        | {
            Args: { p_entry_id: string }
            Returns: {
              amount: number
              amount_paid: number
              cash_session_id: string | null
              category_id: string | null
              cost_center_id: string | null
              created_at: string
              created_by: string | null
              customer: string | null
              description: string
              direction: Database["public"]["Enums"]["finance_direction"]
              document: string | null
              due_date: string
              id: string
              is_fixed: boolean
              issue_date: string
              notes: string | null
              order_id: string | null
              paid_at: string | null
              payment_method:
                | Database["public"]["Enums"]["finance_pay_method"]
                | null
              recurrence: string | null
              restaurant_id: string
              status: Database["public"]["Enums"]["finance_status"]
              supplier: string | null
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "finance_entries"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | { Args: { p_id: string; p_reason?: string }; Returns: undefined }
      finance_entry_pay: {
        Args: {
          p_amount: number
          p_cash_session_id?: string
          p_entry_id: string
          p_notes?: string
          p_payment_method?: Database["public"]["Enums"]["finance_pay_method"]
        }
        Returns: {
          amount: number
          amount_paid: number
          cash_session_id: string | null
          category_id: string | null
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          customer: string | null
          description: string
          direction: Database["public"]["Enums"]["finance_direction"]
          document: string | null
          due_date: string
          id: string
          is_fixed: boolean
          issue_date: string
          notes: string | null
          order_id: string | null
          paid_at: string | null
          payment_method:
            | Database["public"]["Enums"]["finance_pay_method"]
            | null
          recurrence: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["finance_status"]
          supplier: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "finance_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      find_or_create_conversation: {
        Args: {
          p_channel: Database["public"]["Enums"]["comm_channel"]
          p_peer_address: string
          p_peer_name?: string
          p_provider_code?: string
          p_restaurant_id: string
          p_settings_id?: string
        }
        Returns: string
      }
      get_active_support_session: { Args: never; Returns: Json }
      get_conversations_dashboard: {
        Args: { p_restaurant_id: string }
        Returns: Json
      }
      get_customer_conversation_timeline: {
        Args: { p_customer_id: string }
        Returns: Json
      }
      get_dashboard_summary: {
        Args: {
          p_from: string
          p_prev_from: string
          p_prev_to: string
          p_restaurant_id: string
          p_to: string
        }
        Returns: Json
      }
      get_delivery_dashboard: {
        Args: { p_restaurant_id: string }
        Returns: Json
      }
      get_delivery_financial_summary: {
        Args: {
          p_driver_id?: string
          p_from: string
          p_restaurant_id: string
          p_to: string
        }
        Returns: Json
      }
      get_delivery_metrics: {
        Args: { p_from: string; p_restaurant_id: string; p_to: string }
        Returns: Json
      }
      get_driver_assigned_orders: { Args: never; Returns: Json }
      get_driver_last_locations: {
        Args: { p_restaurant_id: string }
        Returns: Json
      }
      get_finance_by_payment_method: {
        Args: { p_from?: string; p_restaurant_id: string; p_to?: string }
        Returns: Json
      }
      get_finance_cashflow: {
        Args: { p_from?: string; p_restaurant_id: string; p_to?: string }
        Returns: Json
      }
      get_finance_dashboard: {
        Args: { p_from?: string; p_restaurant_id: string; p_to?: string }
        Returns: Json
      }
      get_finance_dre: {
        Args: {
          p_cost_center_id?: string
          p_from?: string
          p_restaurant_id: string
          p_to?: string
        }
        Returns: Json
      }
      get_finance_final_report: {
        Args: { p_from?: string; p_restaurant_id: string; p_to?: string }
        Returns: Json
      }
      get_kds_orders: {
        Args: { p_restaurant_id: string; p_station_id?: string }
        Returns: Json
      }
      get_order_communication_timeline: {
        Args: { p_order_id: string }
        Returns: {
          body: string
          caption: string
          created_at: string
          direction: string
          id: string
          media_type: string
          media_url: string
          rule_code: string
          source: string
          status: string
        }[]
      }
      get_order_history: {
        Args: { p_order_id: string }
        Returns: {
          actor_email: string
          actor_name: string
          changed_by: string
          created_at: string
          from_status: Database["public"]["Enums"]["order_status"]
          id: string
          reason: string
          source: string
          to_status: Database["public"]["Enums"]["order_status"]
        }[]
      }
      get_product_recipe: { Args: { p_product_id: string }; Returns: Json }
      get_products_profitability_report: {
        Args: { p_from: string; p_restaurant_id: string; p_to: string }
        Returns: Json
      }
      get_public_categories: {
        Args: { p_slug: string }
        Returns: {
          id: string
          is_active: boolean
          name: string
          position: number
        }[]
      }
      get_public_order: { Args: { p_id: string }; Returns: Json }
      get_public_products: {
        Args: { p_slug: string }
        Returns: {
          category_id: string
          description: string
          id: string
          image_url: string
          is_available: boolean
          name: string
          price: number
          promo_price: number
        }[]
      }
      get_public_restaurant: { Args: { p_slug: string }; Returns: Json }
      get_public_table_by_qr: { Args: { p_token: string }; Returns: Json }
      get_public_table_session: { Args: { p_token: string }; Returns: Json }
      get_purchase_suggestions: {
        Args: { p_restaurant_id: string }
        Returns: Json
      }
      get_reconciliation_summary: {
        Args: { p_from?: string; p_restaurant_id: string; p_to?: string }
        Returns: Json
      }
      get_session_detail: { Args: { p_session_id: string }; Returns: Json }
      get_stock_consumption_report: {
        Args: { p_from: string; p_restaurant_id: string; p_to: string }
        Returns: Json
      }
      get_stock_losses_report: {
        Args: { p_from: string; p_restaurant_id: string; p_to: string }
        Returns: Json
      }
      get_stock_overview: { Args: { p_restaurant_id: string }; Returns: Json }
      get_table_map: { Args: { p_restaurant_id: string }; Returns: Json }
      is_restaurant_driver: {
        Args: { _restaurant_id: string; _uid: string }
        Returns: boolean
      }
      is_restaurant_open_now: {
        Args: { p_restaurant_id: string }
        Returns: boolean
      }
      is_team_owner: {
        Args: { _restaurant_id: string; _uid: string }
        Returns: boolean
      }
      link_driver_user: {
        Args: { p_driver_id: string; p_user_id: string }
        Returns: undefined
      }
      list_audit_logs: {
        Args: {
          p_action?: string
          p_actor_id?: string
          p_category?: string
          p_from?: string
          p_limit?: number
          p_offset?: number
          p_restaurant_id?: string
          p_search?: string
          p_to?: string
        }
        Returns: Json
      }
      list_owner_audit: {
        Args: {
          p_from?: string
          p_limit?: number
          p_offset?: number
          p_to?: string
        }
        Returns: Json
      }
      list_products_recipe_status: {
        Args: { p_restaurant_id: string }
        Returns: Json
      }
      list_team_members: {
        Args: { p_restaurant_id: string }
        Returns: {
          created_at: string
          email: string
          full_name: string
          is_owner: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      mark_communication_failed: {
        Args: {
          p_error_code: string
          p_error_message: string
          p_id: string
          p_retryable: boolean
        }
        Returns: undefined
      }
      mark_communication_sent: {
        Args: {
          p_id: string
          p_latency_ms: number
          p_provider_message_id: string
        }
        Returns: undefined
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      merge_commands: {
        Args: { p_source_command_id: string; p_target_command_id: string }
        Returns: undefined
      }
      merge_sessions: {
        Args: { p_source_session_id: string; p_target_session_id: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      open_command: {
        Args: { p_holder_name?: string; p_label: string; p_session_id: string }
        Returns: string
      }
      open_table_session: {
        Args: {
          p_customer_name?: string
          p_notes?: string
          p_party_size?: number
          p_table_id: string
        }
        Returns: string
      }
      process_inbound_automation: {
        Args: { p_conversation_id: string; p_inbound_body: string }
        Returns: string
      }
      rate_limit_check: {
        Args: {
          p_bucket_key: string
          p_endpoint: string
          p_ip?: string
          p_max_hits: number
          p_restaurant_id?: string
          p_window_seconds: number
        }
        Returns: boolean
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      regen_table_qr: { Args: { p_table_id: string }; Returns: string }
      register_stock_movement: {
        Args: {
          p_ingredient_id: string
          p_quantity: number
          p_reason?: string
          p_supplier_id?: string
          p_type: Database["public"]["Enums"]["stock_movement_type"]
          p_unit_cost?: number
        }
        Returns: Json
      }
      remove_team_member: {
        Args: { p_restaurant_id: string; p_user_id: string }
        Returns: undefined
      }
      resend_team_invite: { Args: { p_invite_id: string }; Returns: Json }
      restore_category: {
        Args: { p_id: string; p_reason?: string }
        Returns: undefined
      }
      restore_product: {
        Args: { p_id: string; p_reason?: string }
        Returns: undefined
      }
      seed_default_automation_rules: {
        Args: { p_restaurant_id: string }
        Returns: number
      }
      send_manual_conversation_message: {
        Args: { p_body: string; p_conversation_id: string }
        Returns: string
      }
      set_driver_status: {
        Args: {
          p_driver_id: string
          p_status: Database["public"]["Enums"]["driver_status"]
        }
        Returns: undefined
      }
      set_product_availability: {
        Args: { p_id: string; p_is_available: boolean; p_reason?: string }
        Returns: Json
      }
      set_product_price: {
        Args: {
          p_expected_current_price?: number
          p_expected_current_promo_price?: number
          p_expected_provided?: boolean
          p_id: string
          p_price: number
          p_promo_price?: number
          p_reason?: string
        }
        Returns: Json
      }
      set_product_recipe: {
        Args: { p_items: Json; p_product_id: string; p_reason?: string }
        Returns: number
      }
      set_settings_health: {
        Args: {
          p_error: string
          p_health: Database["public"]["Enums"]["comm_health"]
          p_latency_ms: number
          p_settings_id: string
        }
        Returns: undefined
      }
      start_support_session: {
        Args: {
          p_access_level?: string
          p_minutes?: number
          p_reason: string
          p_restaurant_id: string
        }
        Returns: Json
      }
      transfer_orders: {
        Args: {
          p_order_ids: string[]
          p_target_command_id?: string
          p_target_session_id: string
        }
        Returns: number
      }
      unaccent_safe: { Args: { t: string }; Returns: string }
      unassign_driver: {
        Args: { p_order_id: string; p_reason?: string }
        Returns: undefined
      }
      unblock_table: { Args: { p_table_id: string }; Returns: undefined }
      update_category: {
        Args: {
          p_description?: string
          p_id: string
          p_is_active?: boolean
          p_name?: string
          p_position?: number
          p_reason?: string
          p_station_id?: string
        }
        Returns: undefined
      }
      update_driver: {
        Args: {
          p_commission_percent?: number
          p_driver_id: string
          p_email?: string
          p_fee_per_delivery?: number
          p_is_active?: boolean
          p_license_plate?: string
          p_name?: string
          p_phone?: string
          p_vehicle?: string
        }
        Returns: undefined
      }
      update_driver_location: {
        Args: {
          p_accuracy?: number
          p_heading?: number
          p_latitude: number
          p_longitude: number
          p_order_id?: string
          p_speed?: number
        }
        Returns: undefined
      }
      update_order_status: {
        Args: {
          p_new_status: Database["public"]["Enums"]["order_status"]
          p_order_id: string
          p_reason?: string
          p_source?: string
        }
        Returns: Json
      }
      update_product: {
        Args: {
          p_category_id?: string
          p_clear_image?: boolean
          p_description?: string
          p_id: string
          p_image_url?: string
          p_name?: string
          p_position?: number
          p_reason?: string
          p_station_id?: string
        }
        Returns: undefined
      }
      update_stock_ingredient: {
        Args: {
          p_id: string
          p_is_active?: boolean
          p_min_qty?: number
          p_name?: string
          p_notes?: string
          p_reason?: string
          p_sku?: string
          p_supplier_id?: string
          p_unit_id?: string
        }
        Returns: undefined
      }
      update_table: {
        Args: { p_patch: Json; p_table_id: string }
        Returns: undefined
      }
      update_table_layout: {
        Args: { p_restaurant_id: string; p_updates: Json }
        Returns: number
      }
      upsert_public_customer: {
        Args: {
          p_email?: string
          p_name: string
          p_phone: string
          p_restaurant_id: string
          p_source?: string
        }
        Returns: string
      }
      upsert_stock_supplier: {
        Args: {
          p_contact?: string
          p_email?: string
          p_id?: string
          p_is_active?: boolean
          p_name: string
          p_notes?: string
          p_phone?: string
          p_reason?: string
          p_restaurant_id: string
        }
        Returns: string
      }
      upsert_stock_unit: {
        Args: {
          p_id?: string
          p_name: string
          p_reason?: string
          p_restaurant_id: string
          p_symbol: string
        }
        Returns: string
      }
      validate_public_coupon: {
        Args: {
          p_code: string
          p_customer_id?: string
          p_phone?: string
          p_restaurant_id: string
          p_subtotal?: number
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "super_admin" | "owner" | "employee" | "manager" | "driver"
      cash_movement_type: "sale" | "reinforcement" | "withdrawal" | "expense"
      cash_session_status: "open" | "closed"
      comm_category:
        | "orders"
        | "payment"
        | "delivery"
        | "marketing"
        | "crm"
        | "system"
      comm_channel:
        | "whatsapp"
        | "sms"
        | "email"
        | "push"
        | "telegram"
        | "instagram"
        | "messenger"
        | "voice"
      comm_health: "healthy" | "degraded" | "down" | "unknown"
      comm_log_direction: "outbound" | "inbound"
      comm_status:
        | "pending"
        | "processing"
        | "sent"
        | "failed"
        | "retrying"
        | "dead_letter"
        | "cancelled"
      coupon_type: "percentage" | "fixed" | "free_shipping"
      driver_status: "offline" | "available" | "busy"
      finance_direction: "payable" | "receivable"
      finance_pay_method:
        | "cash"
        | "pix"
        | "credit"
        | "debit"
        | "transfer"
        | "boleto"
        | "other"
      finance_status: "pending" | "paid" | "partial" | "overdue" | "cancelled"
      lead_status: "new" | "contacted" | "approved" | "rejected"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
      order_type: "delivery" | "pickup" | "dine_in"
      payment_method: "cash" | "pix" | "credit_card" | "debit_card" | "online"
      payment_status: "pending" | "paid" | "failed" | "refunded" | "expired"
      restaurant_plan: "trial" | "essential" | "professional"
      stock_movement_type:
        | "entry"
        | "exit"
        | "loss"
        | "adjust"
        | "sale"
        | "reversal"
      table_session_status:
        | "open"
        | "closing"
        | "closed"
        | "cancelled"
        | "blocked"
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
      app_role: ["super_admin", "owner", "employee", "manager", "driver"],
      cash_movement_type: ["sale", "reinforcement", "withdrawal", "expense"],
      cash_session_status: ["open", "closed"],
      comm_category: [
        "orders",
        "payment",
        "delivery",
        "marketing",
        "crm",
        "system",
      ],
      comm_channel: [
        "whatsapp",
        "sms",
        "email",
        "push",
        "telegram",
        "instagram",
        "messenger",
        "voice",
      ],
      comm_health: ["healthy", "degraded", "down", "unknown"],
      comm_log_direction: ["outbound", "inbound"],
      comm_status: [
        "pending",
        "processing",
        "sent",
        "failed",
        "retrying",
        "dead_letter",
        "cancelled",
      ],
      coupon_type: ["percentage", "fixed", "free_shipping"],
      driver_status: ["offline", "available", "busy"],
      finance_direction: ["payable", "receivable"],
      finance_pay_method: [
        "cash",
        "pix",
        "credit",
        "debit",
        "transfer",
        "boleto",
        "other",
      ],
      finance_status: ["pending", "paid", "partial", "overdue", "cancelled"],
      lead_status: ["new", "contacted", "approved", "rejected"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      order_type: ["delivery", "pickup", "dine_in"],
      payment_method: ["cash", "pix", "credit_card", "debit_card", "online"],
      payment_status: ["pending", "paid", "failed", "refunded", "expired"],
      restaurant_plan: ["trial", "essential", "professional"],
      stock_movement_type: [
        "entry",
        "exit",
        "loss",
        "adjust",
        "sale",
        "reversal",
      ],
      table_session_status: [
        "open",
        "closing",
        "closed",
        "cancelled",
        "blocked",
      ],
    },
  },
} as const
