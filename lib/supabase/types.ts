// Mirrors supabase/migrations/*_init.sql.
// Regenerate with: pnpm dlx supabase gen types typescript --linked > lib/supabase/types.ts

export type Database = {
  public: {
    Tables: {
      favorite_countries: {
        Row: { user_id: string; country_code: string; created_at: string }
        Insert: { user_id?: string; country_code: string; created_at?: string }
        Update: { user_id?: string; country_code?: string; created_at?: string }
        Relationships: []
      }
      saved_indicators: {
        Row: { user_id: string; indicator_code: string; position: number; created_at: string }
        Insert: { user_id?: string; indicator_code: string; position?: number; created_at?: string }
        Update: { user_id?: string; indicator_code?: string; position?: number; created_at?: string }
        Relationships: []
      }
      comparisons: {
        Row: {
          id: string
          user_id: string
          name: string
          country_codes: string[]
          indicator_code: string
          year_from: number | null
          year_to: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          country_codes: string[]
          indicator_code: string
          year_from?: number | null
          year_to?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          country_codes?: string[]
          indicator_code?: string
          year_from?: number | null
          year_to?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      country_notes: {
        Row: {
          id: string
          user_id: string
          country_code: string
          body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          country_code: string
          body: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          country_code?: string
          body?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type Tables = Database["public"]["Tables"]
export type FavoriteRow = Tables["favorite_countries"]["Row"]
export type SavedIndicatorRow = Tables["saved_indicators"]["Row"]
export type ComparisonRow = Tables["comparisons"]["Row"]
export type NoteRow = Tables["country_notes"]["Row"]
