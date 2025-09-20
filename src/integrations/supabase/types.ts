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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      anomalies: {
        Row: {
          bon_id: string | null
          chauffeur_id: string | null
          created_at: string
          description: string
          id: string
          notes: string | null
          severite: string
          statut: string
          type: string
          updated_at: string
          vehicule_id: string | null
        }
        Insert: {
          bon_id?: string | null
          chauffeur_id?: string | null
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          severite: string
          statut?: string
          type: string
          updated_at?: string
          vehicule_id?: string | null
        }
        Update: {
          bon_id?: string | null
          chauffeur_id?: string | null
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          severite?: string
          statut?: string
          type?: string
          updated_at?: string
          vehicule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anomalies_bon_id_fkey"
            columns: ["bon_id"]
            isOneToOne: false
            referencedRelation: "bons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anomalies_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anomalies_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "v_vehicule_km_current"
            referencedColumns: ["vehicule_id"]
          },
          {
            foreignKeyName: "anomalies_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      bons: {
        Row: {
          chauffeur_id: string
          closed_at_date: string | null
          closed_by_bon_id: string | null
          created_at: string
          date: string
          distance: number | null
          id: string
          km_final: number | null
          km_initial: number | null
          montant: number
          notes: string | null
          numero: string
          status: string
          type: string
          updated_at: string
          vehicule_id: string
        }
        Insert: {
          chauffeur_id: string
          closed_at_date?: string | null
          closed_by_bon_id?: string | null
          created_at?: string
          date: string
          distance?: number | null
          id?: string
          km_final?: number | null
          km_initial?: number | null
          montant: number
          notes?: string | null
          numero: string
          status?: string
          type: string
          updated_at?: string
          vehicule_id: string
        }
        Update: {
          chauffeur_id?: string
          closed_at_date?: string | null
          closed_by_bon_id?: string | null
          created_at?: string
          date?: string
          distance?: number | null
          id?: string
          km_final?: number | null
          km_initial?: number | null
          montant?: number
          notes?: string | null
          numero?: string
          status?: string
          type?: string
          updated_at?: string
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bons_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bons_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "v_vehicule_km_current"
            referencedColumns: ["vehicule_id"]
          },
          {
            foreignKeyName: "bons_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      carburant_parameters: {
        Row: {
          created_at: string
          prix: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          prix?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          prix?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      chauffeurs: {
        Row: {
          adresse: string
          cin: string
          created_at: string
          date_embauche: string
          date_naissance: string
          email: string | null
          id: string
          nom: string
          notes: string | null
          prenom: string
          salaire_base: number
          statut: string
          telephone: string
          updated_at: string
        }
        Insert: {
          adresse: string
          cin: string
          created_at?: string
          date_embauche: string
          date_naissance: string
          email?: string | null
          id?: string
          nom: string
          notes?: string | null
          prenom: string
          salaire_base: number
          statut?: string
          telephone: string
          updated_at?: string
        }
        Update: {
          adresse?: string
          cin?: string
          created_at?: string
          date_embauche?: string
          date_naissance?: string
          email?: string | null
          id?: string
          nom?: string
          notes?: string | null
          prenom?: string
          salaire_base?: number
          statut?: string
          telephone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicules: {
        Row: {
          annee: number | null
          capacite_reservoir: number | null
          couleur: string | null
          cout_acquisition: number | null
          cout_maintenance_annuel: number | null
          created_at: string
          date_mise_en_service: string | null
          id: string
          immatriculation: string
          marque: string | null
          modele: string | null
          notes: string | null
          statut: string
          type_carburant: string
          updated_at: string
        }
        Insert: {
          annee?: number | null
          capacite_reservoir?: number | null
          couleur?: string | null
          cout_acquisition?: number | null
          cout_maintenance_annuel?: number | null
          created_at?: string
          date_mise_en_service?: string | null
          id?: string
          immatriculation: string
          marque?: string | null
          modele?: string | null
          notes?: string | null
          statut?: string
          type_carburant: string
          updated_at?: string
        }
        Update: {
          annee?: number | null
          capacite_reservoir?: number | null
          couleur?: string | null
          cout_acquisition?: number | null
          cout_maintenance_annuel?: number | null
          created_at?: string
          date_mise_en_service?: string | null
          id?: string
          immatriculation?: string
          marque?: string | null
          modele?: string | null
          notes?: string | null
          statut?: string
          type_carburant?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_vehicule_daily_stats: {
        Row: {
          cout_tnd: number | null
          immatriculation: string | null
          jour: string | null
          km_total: number | null
          l_per_100km: number | null
          litres_total: number | null
          vehicule_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bons_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "v_vehicule_km_current"
            referencedColumns: ["vehicule_id"]
          },
          {
            foreignKeyName: "bons_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      v_vehicule_km_current: {
        Row: {
          current_km: number | null
          immatriculation: string | null
          vehicule_id: string | null
        }
        Relationships: []
      }
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
