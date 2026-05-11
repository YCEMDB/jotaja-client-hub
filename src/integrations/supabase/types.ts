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
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          position: number | null
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          position?: number | null
          restaurant_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          position?: number | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order: number | null
          restaurant_id: string
          type: Database["public"]["Enums"]["coupon_type"]
          uses_count: number | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order?: number | null
          restaurant_id: string
          type?: Database["public"]["Enums"]["coupon_type"]
          uses_count?: number | null
          value?: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order?: number | null
          restaurant_id?: string
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
        ]
      }
      customers: {
        Row: {
          addresses: Json | null
          created_at: string
          email: string | null
          id: string
          last_order_at: string | null
          name: string
          phone: string
          restaurant_id: string
          total_orders: number | null
          total_spent: number | null
        }
        Insert: {
          addresses?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          last_order_at?: string | null
          name: string
          phone: string
          restaurant_id: string
          total_orders?: number | null
          total_spent?: number | null
        }
        Update: {
          addresses?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          last_order_at?: string | null
          name?: string
          phone?: string
          restaurant_id?: string
          total_orders?: number | null
          total_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
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
        ]
      }
      delivery_drivers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          license_plate: string | null
          name: string
          phone: string | null
          restaurant_id: string
          user_id: string | null
          vehicle: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          license_plate?: string | null
          name: string
          phone?: string | null
          restaurant_id: string
          user_id?: string | null
          vehicle?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          license_plate?: string | null
          name?: string
          phone?: string | null
          restaurant_id?: string
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
          driver_id: string | null
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
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
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
          driver_id?: string | null
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
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
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
          driver_id?: string | null
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
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
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
        ]
      }
      product_option_groups: {
        Row: {
          id: string
          is_required: boolean | null
          max_select: number | null
          min_select: number | null
          name: string
          position: number | null
          product_id: string
        }
        Insert: {
          id?: string
          is_required?: boolean | null
          max_select?: number | null
          min_select?: number | null
          name: string
          position?: number | null
          product_id: string
        }
        Update: {
          id?: string
          is_required?: boolean | null
          max_select?: number | null
          min_select?: number | null
          name?: string
          position?: number | null
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
          extra_price: number | null
          group_id: string
          id: string
          is_available: boolean | null
          name: string
          position: number | null
        }
        Insert: {
          extra_price?: number | null
          group_id: string
          id?: string
          is_available?: boolean | null
          name: string
          position?: number | null
        }
        Update: {
          extra_price?: number | null
          group_id?: string
          id?: string
          is_available?: boolean | null
          name?: string
          position?: number | null
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
      products: {
        Row: {
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
          updated_at: string
        }
        Insert: {
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
          updated_at?: string
        }
        Update: {
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
      restaurants: {
        Row: {
          accent_color: string | null
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
          cnpj: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_open: boolean | null
          logo_url: string | null
          min_order_value: number | null
          mp_access_token: string | null
          mp_public_key: string | null
          name: string
          opening_hours: Json | null
          owner_id: string
          phone: string | null
          plan: Database["public"]["Enums"]["restaurant_plan"] | null
          primary_color: string | null
          slug: string
          subscription_ends_at: string | null
          trial_ends_at: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          accent_color?: string | null
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
          cnpj?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_open?: boolean | null
          logo_url?: string | null
          min_order_value?: number | null
          mp_access_token?: string | null
          mp_public_key?: string | null
          name: string
          opening_hours?: Json | null
          owner_id: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["restaurant_plan"] | null
          primary_color?: string | null
          slug: string
          subscription_ends_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          accent_color?: string | null
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
          cnpj?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_open?: boolean | null
          logo_url?: string | null
          min_order_value?: number | null
          mp_access_token?: string | null
          mp_public_key?: string | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["restaurant_plan"] | null
          primary_color?: string | null
          slug?: string
          subscription_ends_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "super_admin" | "owner" | "employee"
      coupon_type: "percentage" | "fixed" | "free_shipping"
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
      app_role: ["super_admin", "owner", "employee"],
      coupon_type: ["percentage", "fixed", "free_shipping"],
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
    },
  },
} as const
