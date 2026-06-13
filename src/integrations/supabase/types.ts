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
      booking_seats: {
        Row: {
          booking_id: string
          id: string
          price: number
          seat_id: string
        }
        Insert: {
          booking_id: string
          id?: string
          price: number
          seat_id: string
        }
        Update: {
          booking_id?: string
          id?: string
          price?: number
          seat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_seats_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_seats_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          coupon_code: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          discount: number
          gst: number
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          qr_token: string
          show_id: string
          status: Database["public"]["Enums"]["booking_status"]
          subtotal: number
          total: number
          updated_at: string
          upi_utr: string | null
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          gst?: number
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          qr_token?: string
          show_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          upi_utr?: string | null
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          gst?: number
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          qr_token?: string
          show_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          upi_utr?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          expires_at: string | null
          id: string
          max_uses: number | null
          min_amount: number
          updated_at: string
          used_count: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_amount?: number
          updated_at?: string
          used_count?: number
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_amount?: number
          updated_at?: string
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      movies: {
        Row: {
          backdrop_url: string | null
          created_at: string
          duration_min: number
          genres: string[]
          id: string
          is_active: boolean
          language: string
          poster_url: string | null
          rating: string
          release_date: string | null
          slug: string
          synopsis: string
          title: string
          trailer_url: string | null
          updated_at: string
        }
        Insert: {
          backdrop_url?: string | null
          created_at?: string
          duration_min?: number
          genres?: string[]
          id?: string
          is_active?: boolean
          language?: string
          poster_url?: string | null
          rating?: string
          release_date?: string | null
          slug: string
          synopsis?: string
          title: string
          trailer_url?: string | null
          updated_at?: string
        }
        Update: {
          backdrop_url?: string | null
          created_at?: string
          duration_min?: number
          genres?: string[]
          id?: string
          is_active?: boolean
          language?: string
          poster_url?: string | null
          rating?: string
          release_date?: string | null
          slug?: string
          synopsis?: string
          title?: string
          trailer_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seats: {
        Row: {
          id: string
          locked_by: string | null
          locked_until: string | null
          row_label: string
          seat_number: number
          seat_type: Database["public"]["Enums"]["seat_type"]
          show_id: string
          status: Database["public"]["Enums"]["seat_status"]
        }
        Insert: {
          id?: string
          locked_by?: string | null
          locked_until?: string | null
          row_label: string
          seat_number: number
          seat_type: Database["public"]["Enums"]["seat_type"]
          show_id: string
          status?: Database["public"]["Enums"]["seat_status"]
        }
        Update: {
          id?: string
          locked_by?: string | null
          locked_until?: string | null
          row_label?: string
          seat_number?: number
          seat_type?: Database["public"]["Enums"]["seat_type"]
          show_id?: string
          status?: Database["public"]["Enums"]["seat_status"]
        }
        Relationships: [
          {
            foreignKeyName: "seats_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      shows: {
        Row: {
          created_at: string
          id: string
          movie_id: string
          price_gold: number
          price_platinum: number
          price_silver: number
          rows_config: Json
          screen_name: string
          seats_per_row: number
          starts_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: string
          price_gold?: number
          price_platinum?: number
          price_silver?: number
          rows_config?: Json
          screen_name?: string
          seats_per_row?: number
          starts_at: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string
          price_gold?: number
          price_platinum?: number
          price_silver?: number
          rows_config?: Json
          screen_name?: string
          seats_per_row?: number
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shows_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      [_ in never]: never
    }
    Enums: {
      app_role: "user" | "admin"
      booking_status: "PENDING" | "CONFIRMED" | "CANCELLED"
      payment_status: "PENDING" | "PAID" | "FAILED"
      seat_status: "AVAILABLE" | "LOCKED" | "BOOKED"
      seat_type: "PLATINUM" | "GOLD" | "SILVER"
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
      app_role: ["user", "admin"],
      booking_status: ["PENDING", "CONFIRMED", "CANCELLED"],
      payment_status: ["PENDING", "PAID", "FAILED"],
      seat_status: ["AVAILABLE", "LOCKED", "BOOKED"],
      seat_type: ["PLATINUM", "GOLD", "SILVER"],
    },
  },
} as const
