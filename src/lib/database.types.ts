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
      analytics_events: {
        Row: {
          created_at: string
          customer_name: string | null
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id: string
          metadata: Json
          order_items: Json | null
          order_value: number | null
          product_id: string | null
          session_id: string | null
          store_id: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id?: string
          metadata?: Json
          order_items?: Json | null
          order_value?: number | null
          product_id?: string | null
          session_id?: string | null
          store_id: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          event_type?: Database["public"]["Enums"]["analytics_event_type"]
          id?: string
          metadata?: Json
          order_items?: Json | null
          order_value?: number | null
          product_id?: string | null
          session_id?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          store_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          store_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          gallery: Json
          id: string
          is_active: boolean
          is_featured: boolean
          long_description: string | null
          main_image: string | null
          name: string
          price: number
          short_description: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          gallery?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          long_description?: string | null
          main_image?: string | null
          name: string
          price: number
          short_description?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          gallery?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          long_description?: string | null
          main_image?: string | null
          name?: string
          price?: number
          short_description?: string | null
          store_id?: string
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
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          accept_bank_transfer: boolean
          accept_cash: boolean
          allow_delivery: boolean
          allow_pickup: boolean
          bank_details: string | null
          body_font: string
          border_radius: number
          color_palette: string
          created_at: string
          currency: string
          delivery_cost: number
          delivery_zone: string | null
          description: string | null
          facebook_url: string | null
          heading_font: string
          id: string
          include_comments_in_message: boolean
          include_phone_in_message: boolean
          instagram_url: string | null
          logo: string | null
          message_closing: string
          message_greeting: string
          message_introduction: string
          name: string
          products_per_page: number
          show_social_in_catalog: boolean
          slug: string
          theme_mode: Database["public"]["Enums"]["theme_mode"]
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          accept_bank_transfer?: boolean
          accept_cash?: boolean
          allow_delivery?: boolean
          allow_pickup?: boolean
          bank_details?: string | null
          body_font?: string
          border_radius?: number
          color_palette?: string
          created_at?: string
          currency?: string
          delivery_cost?: number
          delivery_zone?: string | null
          description?: string | null
          facebook_url?: string | null
          heading_font?: string
          id?: string
          include_comments_in_message?: boolean
          include_phone_in_message?: boolean
          instagram_url?: string | null
          logo?: string | null
          message_closing?: string
          message_greeting?: string
          message_introduction?: string
          name: string
          products_per_page?: number
          show_social_in_catalog?: boolean
          slug: string
          theme_mode?: Database["public"]["Enums"]["theme_mode"]
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          accept_bank_transfer?: boolean
          accept_cash?: boolean
          allow_delivery?: boolean
          allow_pickup?: boolean
          bank_details?: string | null
          body_font?: string
          border_radius?: number
          color_palette?: string
          created_at?: string
          currency?: string
          delivery_cost?: number
          delivery_zone?: string | null
          description?: string | null
          facebook_url?: string | null
          heading_font?: string
          id?: string
          include_comments_in_message?: boolean
          include_phone_in_message?: boolean
          instagram_url?: string | null
          logo?: string | null
          message_closing?: string
          message_greeting?: string
          message_introduction?: string
          name?: string
          products_per_page?: number
          show_social_in_catalog?: boolean
          slug?: string
          theme_mode?: Database["public"]["Enums"]["theme_mode"]
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          dark_mode_enabled: boolean
          email_notifications: boolean
          id: string
          marketing_emails: boolean
          preferred_language: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dark_mode_enabled?: boolean
          email_notifications?: boolean
          id?: string
          marketing_emails?: boolean
          preferred_language?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dark_mode_enabled?: boolean
          email_notifications?: boolean
          id?: string
          marketing_emails?: boolean
          preferred_language?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar: string | null
          bio: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          location: string | null
          name: string
          payment_method: string | null
          phone: string | null
          plan: Database["public"]["Enums"]["user_plan"]
          subscription_canceled_at: string | null
          subscription_end_date: string | null
          subscription_id: string | null
          subscription_start_date: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"] | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          location?: string | null
          name: string
          payment_method?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          subscription_canceled_at?: string | null
          subscription_end_date?: string | null
          subscription_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          location?: string | null
          name?: string
          payment_method?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          subscription_canceled_at?: string | null
          subscription_end_date?: string | null
          subscription_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_plan_limits: {
        Args: {
          plan_type: Database["public"]["Enums"]["user_plan"]
        }
        Returns: Json
      }
      get_user_stats: {
        Args: {
          user_uuid: string
        }
        Returns: Json
      }
    }
    Enums: {
      analytics_event_type: "visit" | "order" | "product_view"
      subscription_status: "active" | "canceled" | "expired"
      theme_mode: "light" | "dark" | "system"
      user_plan: "gratuito" | "emprendedor" | "profesional"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never