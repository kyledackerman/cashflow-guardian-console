export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_loan_repayments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          employee_id: string | null
          employee_name: string
          id: string
          notes: string | null
          payroll_date: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          employee_name: string
          id?: string
          notes?: string | null
          payroll_date: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          employee_name?: string
          id?: string
          notes?: string | null
          payroll_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_loan_repayments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_loan_repayments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_loan_requests: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string | null
          employee_name: string
          id: string
          notes: string | null
          purpose: string
          request_date: string
          requested_amount: number
          status: Database["public"]["Enums"]["loan_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          employee_name: string
          id?: string
          notes?: string | null
          purpose: string
          request_date?: string
          requested_amount: number
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          employee_name?: string
          id?: string
          notes?: string | null
          purpose?: string
          request_date?: string
          requested_amount?: number
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_loan_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_loan_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_loan_withdrawals: {
        Row: {
          amount: number
          approved_by: string | null
          approved_by_name: string | null
          created_at: string
          created_by: string | null
          date: string
          due_date: string
          employee_id: string | null
          employee_name: string
          id: string
          notes: string | null
          requires_interest: boolean | null
          status: Database["public"]["Enums"]["loan_status"]
          total_outstanding_at_time: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          approved_by_name?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          due_date: string
          employee_id?: string | null
          employee_name: string
          id?: string
          notes?: string | null
          requires_interest?: boolean | null
          status?: Database["public"]["Enums"]["loan_status"]
          total_outstanding_at_time?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          approved_by_name?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          due_date?: string
          employee_id?: string | null
          employee_name?: string
          id?: string
          notes?: string | null
          requires_interest?: boolean | null
          status?: Database["public"]["Enums"]["loan_status"]
          total_outstanding_at_time?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_loan_withdrawals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_loan_withdrawals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_loan_withdrawals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          permissions:
            | Database["public"]["Enums"]["employee_permission"][]
            | null
          role: Database["public"]["Enums"]["employee_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          permissions?:
            | Database["public"]["Enums"]["employee_permission"][]
            | null
          role?: Database["public"]["Enums"]["employee_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          permissions?:
            | Database["public"]["Enums"]["employee_permission"][]
            | null
          role?: Database["public"]["Enums"]["employee_role"]
          updated_at?: string
        }
        Relationships: []
      }
      garnishment_documents: {
        Row: {
          description: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          installment_id: string | null
          profile_id: string | null
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          description?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          installment_id?: string | null
          profile_id?: string | null
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          description?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          installment_id?: string | null
          profile_id?: string | null
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "garnishment_documents_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "garnishment_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garnishment_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "garnishment_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garnishment_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      garnishment_installments: {
        Row: {
          amount: number
          check_number: string | null
          created_at: string
          employee_id: string | null
          employee_name: string
          id: string
          installment_number: number
          notes: string | null
          payroll_date: string
          profile_id: string
          recorded_by: string | null
          recorded_by_name: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          check_number?: string | null
          created_at?: string
          employee_id?: string | null
          employee_name: string
          id?: string
          installment_number: number
          notes?: string | null
          payroll_date: string
          profile_id: string
          recorded_by?: string | null
          recorded_by_name?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          check_number?: string | null
          created_at?: string
          employee_id?: string | null
          employee_name?: string
          id?: string
          installment_number?: number
          notes?: string | null
          payroll_date?: string
          profile_id?: string
          recorded_by?: string | null
          recorded_by_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "garnishment_installments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garnishment_installments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "garnishment_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garnishment_installments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      garnishment_profiles: {
        Row: {
          amount_paid_so_far: number
          balance_remaining: number | null
          case_number: string
          court_district: string
          created_at: string
          created_by: string | null
          creditor: string
          employee_id: string | null
          employee_name: string
          id: string
          law_firm: string
          notes: string | null
          total_amount_owed: number
          updated_at: string
        }
        Insert: {
          amount_paid_so_far?: number
          balance_remaining?: number | null
          case_number: string
          court_district: string
          created_at?: string
          created_by?: string | null
          creditor: string
          employee_id?: string | null
          employee_name: string
          id?: string
          law_firm: string
          notes?: string | null
          total_amount_owed: number
          updated_at?: string
        }
        Update: {
          amount_paid_so_far?: number
          balance_remaining?: number | null
          case_number?: string
          court_district?: string
          created_at?: string
          created_by?: string | null
          creditor?: string
          employee_id?: string | null
          employee_name?: string
          id?: string
          law_firm?: string
          notes?: string | null
          total_amount_owed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "garnishment_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garnishment_profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      petty_cash_transactions: {
        Row: {
          amount: number
          approved: boolean
          created_at: string
          created_by: string | null
          date: string
          employee_id: string | null
          employee_name: string | null
          id: string
          notes: string | null
          purpose: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          approved?: boolean
          created_at?: string
          created_by?: string | null
          date?: string
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          approved?: boolean
          created_at?: string
          created_by?: string | null
          date?: string
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "petty_cash_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petty_cash_transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_user_login: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["employee_role"]
      }
      log_admin_action: {
        Args: {
          action_type: string
          table_name: string
          record_id?: string
          old_data?: Json
          new_data?: Json
        }
        Returns: undefined
      }
      user_has_permission: {
        Args: {
          permission_name: Database["public"]["Enums"]["employee_permission"]
        }
        Returns: boolean
      }
    }
    Enums: {
      employee_permission:
        | "VIEW_FINANCES"
        | "EDIT_TRANSACTIONS"
        | "DELETE_RECORDS"
        | "MANAGE_EMPLOYEES"
        | "APPROVE_TRANSACTIONS"
        | "APPROVE_LARGE_LOANS"
      employee_role: "employee" | "manager" | "admin"
      loan_status:
        | "pending"
        | "approved_manager"
        | "approved_admin"
        | "rejected"
      transaction_type: "credit" | "debit"
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
      employee_permission: [
        "VIEW_FINANCES",
        "EDIT_TRANSACTIONS",
        "DELETE_RECORDS",
        "MANAGE_EMPLOYEES",
        "APPROVE_TRANSACTIONS",
        "APPROVE_LARGE_LOANS",
      ],
      employee_role: ["employee", "manager", "admin"],
      loan_status: [
        "pending",
        "approved_manager",
        "approved_admin",
        "rejected",
      ],
      transaction_type: ["credit", "debit"],
    },
  },
} as const
