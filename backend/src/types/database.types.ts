// =========================================================================
// 🗄️ DAKSHORA 2.0: Comprehensive Database Types (Generated from Schema)
// =========================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: 'starter' | 'growth' | 'enterprise';
          status: 'active' | 'trial' | 'suspended' | 'archived';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: 'starter' | 'growth' | 'enterprise';
          status?: 'active' | 'trial' | 'suspended' | 'archived';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan?: 'starter' | 'growth' | 'enterprise';
          status?: 'active' | 'trial' | 'suspended' | 'archived';
          created_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      permissions: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      role_permissions: {
        Row: {
          id: string;
          role_id: string;
          permission_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          permission_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          role_id?: string;
          permission_id?: string;
          created_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role_id?: string | null;
          created_at?: string;
        };
      };
      erp_students: {
        Row: {
          id: string;
          organization_id: string;
          admission_number: string;
          first_name: string;
          last_name: string;
          class_id: string;
          section_id: string;
          roll_number: string | null;
          gender: string | null;
          dob: string | null;
          father_name: string | null;
          mother_name: string | null;
          primary_phone: string | null;
          email: string | null;
          status: 'active' | 'inactive' | 'transferred' | 'graduated';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          admission_number: string;
          first_name: string;
          last_name: string;
          class_id: string;
          section_id: string;
          roll_number?: string | null;
          gender?: string | null;
          dob?: string | null;
          father_name?: string | null;
          mother_name?: string | null;
          primary_phone?: string | null;
          email?: string | null;
          status?: 'active' | 'inactive' | 'transferred' | 'graduated';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['erp_students']['Insert']>;
      };
      erp_staff: {
        Row: {
          id: string;
          organization_id: string;
          employee_code: string;
          first_name: string;
          last_name: string;
          designation: string;
          department: string;
          email: string;
          phone: string | null;
          role: string;
          status: 'active' | 'on_leave' | 'resigned' | 'terminated';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          employee_code: string;
          first_name: string;
          last_name: string;
          designation: string;
          department: string;
          email: string;
          phone?: string | null;
          role?: string;
          status?: 'active' | 'on_leave' | 'resigned' | 'terminated';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['erp_staff']['Insert']>;
      };
      erp_attendance_records: {
        Row: {
          id: string;
          organization_id: string;
          entity_type: 'student' | 'staff';
          entity_id: string;
          date: string;
          status: 'present' | 'absent' | 'late' | 'half_day' | 'leave';
          remarks: string | null;
          marked_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          entity_type: 'student' | 'staff';
          entity_id: string;
          date: string;
          status: 'present' | 'absent' | 'late' | 'half_day' | 'leave';
          remarks?: string | null;
          marked_by: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['erp_attendance_records']['Insert']>;
      };
      erp_academic_sessions: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          code: string;
          start_date: string;
          end_date: string;
          is_current: boolean;
          status: 'active' | 'archived';
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          code: string;
          start_date: string;
          end_date: string;
          is_current?: boolean;
          status?: 'active' | 'archived';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['erp_academic_sessions']['Insert']>;
      };
      erp_classes: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          code: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          code: string;
          display_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['erp_classes']['Insert']>;
      };
      erp_sections: {
        Row: {
          id: string;
          organization_id: string;
          class_id: string;
          name: string;
          capacity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          class_id: string;
          name: string;
          capacity?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['erp_sections']['Insert']>;
      };
      erp_subjects: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          code: string;
          type: 'theory' | 'practical' | 'both';
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          code: string;
          type?: 'theory' | 'practical' | 'both';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['erp_subjects']['Insert']>;
      };
      erp_exams: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          session: string;
          start_date: string;
          end_date: string;
          status: 'scheduled' | 'in_progress' | 'completed' | 'published';
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          session?: string;
          start_date: string;
          end_date: string;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'published';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['erp_exams']['Insert']>;
      };
      erp_marks_records: {
        Row: {
          id: string;
          organization_id: string;
          exam_id: string;
          subject_id: string;
          student_id: string;
          marks_obtained: number;
          max_marks: number;
          grade: string | null;
          status: 'draft' | 'verified' | 'published';
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          exam_id: string;
          subject_id: string;
          student_id: string;
          marks_obtained: number;
          max_marks?: number;
          grade?: string | null;
          status?: 'draft' | 'verified' | 'published';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['erp_marks_records']['Insert']>;
      };
      erp_fee_structures: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          class_id: string;
          frequency: 'monthly' | 'quarterly' | 'annual' | 'one_time';
          amount: number;
          due_day: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          class_id: string;
          frequency?: 'monthly' | 'quarterly' | 'annual' | 'one_time';
          amount: number;
          due_day?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['erp_fee_structures']['Insert']>;
      };
      erp_fee_demands: {
        Row: {
          id: string;
          organization_id: string;
          student_id: string;
          fee_structure_id: string;
          amount_due: number;
          amount_paid: number;
          due_date: string;
          status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          student_id: string;
          fee_structure_id: string;
          amount_due: number;
          amount_paid?: number;
          due_date: string;
          status?: 'pending' | 'partially_paid' | 'paid' | 'overdue';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['erp_fee_demands']['Insert']>;
      };
      erp_fee_payments: {
        Row: {
          id: string;
          organization_id: string;
          demand_id: string;
          student_id: string;
          amount: number;
          payment_method: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque';
          transaction_ref: string | null;
          payment_date: string;
          receipt_number: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          demand_id: string;
          student_id: string;
          amount: number;
          payment_method: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque';
          transaction_ref?: string | null;
          payment_date?: string;
          receipt_number: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['erp_fee_payments']['Insert']>;
      };
      responsibility_types: {
        Row: {
          id: string;
          organization_id: string | null;
          code: string;
          name: string;
          description: string | null;
          category: string;
          default_scope_type: string;
          is_system: boolean;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          code: string;
          name: string;
          description?: string | null;
          category?: string;
          default_scope_type?: string;
          is_system?: boolean;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['responsibility_types']['Insert']>;
      };
      staff_responsibilities: {
        Row: {
          id: string;
          organization_id: string;
          school_id: string;
          staff_id: string;
          responsibility_type_id: string;
          responsibility_code: string;
          scope_type: string;
          scope_id: string;
          scope_name: string | null;
          academic_session_id: string;
          is_primary: boolean;
          start_date: string;
          end_date: string | null;
          status: 'active' | 'inactive' | 'expired' | 'historical';
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          school_id?: string;
          staff_id: string;
          responsibility_type_id: string;
          responsibility_code: string;
          scope_type: string;
          scope_id: string;
          scope_name?: string | null;
          academic_session_id?: string;
          is_primary?: boolean;
          start_date: string;
          end_date?: string | null;
          status?: 'active' | 'inactive' | 'expired' | 'historical';
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['staff_responsibilities']['Insert']>;
      };
      platform_support_sessions: {
        Row: {
          id: string;
          admin_user_id: string;
          admin_email: string;
          target_organization_id: string;
          target_school_name: string | null;
          reason: string;
          status: 'active' | 'ended' | 'expired';
          session_token: string;
          started_at: string;
          ended_at: string | null;
          expires_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id: string;
          admin_email: string;
          target_organization_id: string;
          target_school_name?: string | null;
          reason: string;
          status?: 'active' | 'ended' | 'expired';
          session_token: string;
          started_at?: string;
          ended_at?: string | null;
          expires_at: string;
        };
        Update: Partial<Database['public']['Tables']['platform_support_sessions']['Insert']>;
      };
      platform_support_tickets: {
        Row: {
          id: string;
          organization_id: string;
          organization_name: string;
          subject: string;
          description: string;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
          assigned_to: string | null;
          created_by: string;
          resolution_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          organization_name: string;
          subject: string;
          description: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
          assigned_to?: string | null;
          created_by: string;
          resolution_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['platform_support_tickets']['Insert']>;
      };
      platform_settings: {
        Row: {
          id: string;
          maintenance_mode: boolean;
          maintenance_message: string | null;
          feature_flags: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          maintenance_mode?: boolean;
          maintenance_message?: string | null;
          feature_flags?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['platform_settings']['Insert']>;
      };
      saas_subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          plan_id: string;
          status: 'active' | 'trial' | 'past_due' | 'canceled';
          amount_inr: number;
          billing_cycle: 'monthly' | 'annual';
          current_period_start: string;
          current_period_end: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          plan_id: string;
          status?: 'active' | 'trial' | 'past_due' | 'canceled';
          amount_inr: number;
          billing_cycle?: 'monthly' | 'annual';
          current_period_start: string;
          current_period_end: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['saas_subscriptions']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          actor_email: string;
          actor_id: string | null;
          ip_address: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          actor_email: string;
          actor_id?: string | null;
          ip_address?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
    };
  };
}
