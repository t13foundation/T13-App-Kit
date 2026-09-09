/** Schema-aligned draft. Replace with `supabase gen types typescript --local` after applying the first migration. */
export type Database = {
  public: {
    Tables: {
      notes: {
        Row: { id: string; owner_id: string; title: string; body: string; created_at: string; updated_at: string };
        Insert: { id?: string; owner_id?: string; title: string; body?: string; created_at?: string; updated_at?: string };
        Update: { id?: string; owner_id?: string; title?: string; body?: string; created_at?: string; updated_at?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
