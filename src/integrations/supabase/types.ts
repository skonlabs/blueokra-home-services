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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      admin_notification: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          notification_type: string
          selected_user_ids: string[] | null
          target_audience: string
          target_criteria: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          notification_type: string
          selected_user_ids?: string[] | null
          target_audience: string
          target_criteria?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          notification_type?: string
          selected_user_ids?: string[] | null
          target_audience?: string
          target_criteria?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_support_ticket: {
        Row: {
          content: string | null
          created_at: string
          id: string
          sender_email: string | null
          subject: string | null
          ticket_status: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          sender_email?: string | null
          subject?: string | null
          ticket_status?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          sender_email?: string | null
          subject?: string | null
          ticket_status?: string
        }
        Relationships: []
      }
      booking_appointment: {
        Row: {
          appointment_date: string
          appointment_status: string
          cancellation_reason: string | null
          created_at: string
          customer_amount: number | null
          customer_status: Database["public"]["Enums"]["participant_status"]
          customer_user_id: string | null
          id: string
          notes: string | null
          platform_amount: number | null
          provider_amount: number | null
          provider_status: Database["public"]["Enums"]["participant_status"]
          provider_user_id: string | null
          reschedule_count: number | null
          service_id: string | null
        }
        Insert: {
          appointment_date: string
          appointment_status?: string
          cancellation_reason?: string | null
          created_at?: string
          customer_amount?: number | null
          customer_status?: Database["public"]["Enums"]["participant_status"]
          customer_user_id?: string | null
          id?: string
          notes?: string | null
          platform_amount?: number | null
          provider_amount?: number | null
          provider_status?: Database["public"]["Enums"]["participant_status"]
          provider_user_id?: string | null
          reschedule_count?: number | null
          service_id?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_status?: string
          cancellation_reason?: string | null
          created_at?: string
          customer_amount?: number | null
          customer_status?: Database["public"]["Enums"]["participant_status"]
          customer_user_id?: string | null
          id?: string
          notes?: string | null
          platform_amount?: number | null
          provider_amount?: number | null
          provider_status?: Database["public"]["Enums"]["participant_status"]
          provider_user_id?: string | null
          reschedule_count?: number | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_homeowner_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "appointments_provider_id_fkey"
            columns: ["provider_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_service"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_appointment_proposal: {
        Row: {
          appointment_id: string
          created_at: string | null
          id: string
          proposed_by: string
          proposed_date: string
          response_notes: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string | null
          id?: string
          proposed_by: string
          proposed_date: string
          response_notes?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string | null
          id?: string
          proposed_by?: string
          proposed_date?: string
          response_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_proposals_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "booking_appointment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduling_proposals_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "booking_appointment"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_assignment: {
        Row: {
          created_at: string | null
          id: string
          provider_quote_amount: number | null
          provider_user_id: string
          service_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          provider_quote_amount?: number | null
          provider_user_id: string
          service_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          provider_quote_amount?: number | null
          provider_user_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_assignment_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_service"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_lead: {
        Row: {
          created_at: string | null
          id: string
          lead_status: string
          provider_user_id: string
          service_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_status?: string
          provider_user_id: string
          service_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_status?: string
          provider_user_id?: string
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_provider_id_fkey"
            columns: ["provider_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leads_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_service"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_notification: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          recipient_user_id: string
          service_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          recipient_user_id: string
          service_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          recipient_user_id?: string
          service_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_notifications_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_service"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_provider_response: {
        Row: {
          created_at: string | null
          id: string
          provider_user_id: string
          response_type: string
          service_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          provider_user_id: string
          response_type: string
          service_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          provider_user_id?: string
          response_type?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_responses_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_service"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_qr_verification: {
        Row: {
          appointment_id: string
          expires_at: string
          generated_at: string | null
          id: string
          is_verified: boolean | null
          qr_code: string
          scan_location: Json | null
          scanned_at: string | null
          scanned_by: string | null
        }
        Insert: {
          appointment_id: string
          expires_at: string
          generated_at?: string | null
          id?: string
          is_verified?: boolean | null
          qr_code: string
          scan_location?: Json | null
          scanned_at?: string | null
          scanned_by?: string | null
        }
        Update: {
          appointment_id?: string
          expires_at?: string
          generated_at?: string | null
          id?: string
          is_verified?: boolean | null
          qr_code?: string
          scan_location?: Json | null
          scanned_at?: string | null
          scanned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_verifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "booking_appointment"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_service: {
        Row: {
          admin_notes: string | null
          booking_status: string
          completed_at: string | null
          created_at: string
          customer_user_id: string
          customizations: Json | null
          frequency: string | null
          home_id: string | null
          id: string
          images: Json | null
          is_completed: boolean | null
          notes: string | null
          package_name: string
          payment_method: string | null
          pricing_migrated: boolean | null
          quantity: number
          revenue: number | null
          service_type: string
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          booking_status?: string
          completed_at?: string | null
          created_at?: string
          customer_user_id: string
          customizations?: Json | null
          frequency?: string | null
          home_id?: string | null
          id?: string
          images?: Json | null
          is_completed?: boolean | null
          notes?: string | null
          package_name: string
          payment_method?: string | null
          pricing_migrated?: boolean | null
          quantity?: number
          revenue?: number | null
          service_type: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          booking_status?: string
          completed_at?: string | null
          created_at?: string
          customer_user_id?: string
          customizations?: Json | null
          frequency?: string | null
          home_id?: string | null
          id?: string
          images?: Json | null
          is_completed?: boolean | null
          notes?: string | null
          package_name?: string
          payment_method?: string | null
          pricing_migrated?: boolean | null
          quantity?: number
          revenue?: number | null
          service_type?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          appointment_id: string | null
          attachments: Json | null
          created_at: string | null
          id: string
          image_url: string | null
          lead_id: string | null
          message: string | null
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          appointment_id?: string | null
          attachments?: Json | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          lead_id?: string | null
          message?: string | null
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          appointment_id?: string | null
          attachments?: Json | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          lead_id?: string | null
          message?: string | null
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "booking_appointment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "booking_lead"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          appointment_id: string | null
          created_at: string
          description: string | null
          dispute_status: string
          dispute_type: string
          evidence_urls: Json | null
          filed_against: string | null
          filed_by: string
          id: string
          refund_amount: number | null
          resolution_notes: string | null
          resolution_type: string | null
          resolved_at: string | null
          resolved_by: string | null
          service_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          description?: string | null
          dispute_status?: string
          dispute_type: string
          evidence_urls?: Json | null
          filed_against?: string | null
          filed_by: string
          id?: string
          refund_amount?: number | null
          resolution_notes?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          service_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          description?: string | null
          dispute_status?: string
          dispute_type?: string
          evidence_urls?: Json | null
          filed_against?: string | null
          filed_by?: string
          id?: string
          refund_amount?: number | null
          resolution_notes?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "booking_appointment"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_point_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          points: number
          service_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          points: number
          service_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          service_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          created_at: string
          id: string
          lifetime_points: number
          points_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lifetime_points?: number
          points_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lifetime_points?: number
          points_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transaction: {
        Row: {
          admin_amount: number | null
          admin_approved_at: string | null
          admin_approved_by: string | null
          created_at: string
          customer_user_id: string | null
          days_delayed: number | null
          due_date: string | null
          id: string
          is_admin_approved: boolean | null
          is_payment_request_submitted: boolean | null
          is_qr_verified: boolean | null
          is_refunded: boolean | null
          paid_date: string | null
          payment_method_type: string | null
          payment_request_notes: string | null
          payment_status: string
          provider_amount: number | null
          provider_user_id: string | null
          refund_amount: number | null
          refunded_at: string | null
          refunded_by: string | null
          service_id: string | null
          stripe_payment_intent_id: string | null
          total_amount: number
        }
        Insert: {
          admin_amount?: number | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          created_at?: string
          customer_user_id?: string | null
          days_delayed?: number | null
          due_date?: string | null
          id?: string
          is_admin_approved?: boolean | null
          is_payment_request_submitted?: boolean | null
          is_qr_verified?: boolean | null
          is_refunded?: boolean | null
          paid_date?: string | null
          payment_method_type?: string | null
          payment_request_notes?: string | null
          payment_status?: string
          provider_amount?: number | null
          provider_user_id?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          refunded_by?: string | null
          service_id?: string | null
          stripe_payment_intent_id?: string | null
          total_amount: number
        }
        Update: {
          admin_amount?: number | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          created_at?: string
          customer_user_id?: string | null
          days_delayed?: number | null
          due_date?: string | null
          id?: string
          is_admin_approved?: boolean | null
          is_payment_request_submitted?: boolean | null
          is_qr_verified?: boolean | null
          is_refunded?: boolean | null
          paid_date?: string | null
          payment_method_type?: string | null
          payment_request_notes?: string | null
          payment_status?: string
          provider_amount?: number | null
          provider_user_id?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          refunded_by?: string | null
          service_id?: string | null
          stripe_payment_intent_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_service"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_vendor_payout: {
        Row: {
          created_at: string
          id: string
          payment_date: string | null
          payout_amount: number
          provider_user_id: string | null
          service_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payment_date?: string | null
          payout_amount: number
          provider_user_id?: string | null
          service_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payment_date?: string | null
          payout_amount?: number
          provider_user_id?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_service"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_wallet: {
        Row: {
          balance: number
          created_at: string
          currency: string
          escrow_balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          escrow_balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          escrow_balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_wallet_transaction: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          payment_id: string | null
          payment_method_type: string | null
          service_id: string | null
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          transaction_amount: number
          transaction_status: string
          transaction_type: string
          updated_at: string
          wallet_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          payment_method_type?: string | null
          service_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          transaction_amount: number
          transaction_status?: string
          transaction_type: string
          updated_at?: string
          wallet_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          payment_method_type?: string | null
          service_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          transaction_amount?: number
          transaction_status?: string
          transaction_type?: string
          updated_at?: string
          wallet_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      pricing_surcharges: {
        Row: {
          condition_key: string | null
          condition_value: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          service_type: string
          surcharge_name: string
          surcharge_type: string
          updated_at: string | null
          value: number
        }
        Insert: {
          condition_key?: string | null
          condition_value?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          service_type: string
          surcharge_name: string
          surcharge_type: string
          updated_at?: string | null
          value: number
        }
        Update: {
          condition_key?: string | null
          condition_value?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          service_type?: string
          surcharge_name?: string
          surcharge_type?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          bond_number: string | null
          business_license: string | null
          city: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          is_blocked: boolean | null
          last_name: string | null
          phone: string | null
          phone_verified: boolean | null
          profile_photo_url: string | null
          service_areas: string[] | null
          services_offered: string[] | null
          state: string | null
          updated_at: string
          user_id: string
          venmo_phone: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bond_number?: string | null
          business_license?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          is_blocked?: boolean | null
          last_name?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          profile_photo_url?: string | null
          service_areas?: string[] | null
          services_offered?: string[] | null
          state?: string | null
          updated_at?: string
          user_id: string
          venmo_phone?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bond_number?: string | null
          business_license?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          is_blocked?: boolean | null
          last_name?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          profile_photo_url?: string | null
          service_areas?: string[] | null
          services_offered?: string[] | null
          state?: string | null
          updated_at?: string
          user_id?: string
          venmo_phone?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      property_appliances: {
        Row: {
          appliance_name: string
          brand: string | null
          created_at: string
          home_id: string
          id: string
          installed_date: string | null
          model: string | null
          next_service_date: string | null
          notes: string | null
          serial_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appliance_name: string
          brand?: string | null
          created_at?: string
          home_id: string
          id?: string
          installed_date?: string | null
          model?: string | null
          next_service_date?: string | null
          notes?: string | null
          serial_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appliance_name?: string
          brand?: string | null
          created_at?: string
          home_id?: string
          id?: string
          installed_date?: string | null
          model?: string | null
          next_service_date?: string | null
          notes?: string | null
          serial_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_appliances_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "user_homes"
            referencedColumns: ["id"]
          },
        ]
      }
      property_warranties: {
        Row: {
          appliance_id: string | null
          coverage_type: string | null
          created_at: string
          document_url: string | null
          expiry_date: string | null
          home_id: string
          id: string
          item_name: string
          notes: string | null
          start_date: string | null
          updated_at: string
          user_id: string
          warranty_provider: string | null
          warranty_status: string
        }
        Insert: {
          appliance_id?: string | null
          coverage_type?: string | null
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          home_id: string
          id?: string
          item_name: string
          notes?: string | null
          start_date?: string | null
          updated_at?: string
          user_id: string
          warranty_provider?: string | null
          warranty_status?: string
        }
        Update: {
          appliance_id?: string | null
          coverage_type?: string | null
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          home_id?: string
          id?: string
          item_name?: string
          notes?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
          warranty_provider?: string | null
          warranty_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_warranties_appliance_id_fkey"
            columns: ["appliance_id"]
            isOneToOne: false
            referencedRelation: "property_appliances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_warranties_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "user_homes"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          appointment_id: string | null
          comments: string | null
          created_at: string | null
          homeowner_id: string
          id: string
          provider_id: string
          rating: number
          reviewed_by: string
          service_photos: Json | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          comments?: string | null
          created_at?: string | null
          homeowner_id: string
          id?: string
          provider_id: string
          rating: number
          reviewed_by: string
          service_photos?: Json | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          comments?: string | null
          created_at?: string | null
          homeowner_id?: string
          id?: string
          provider_id?: string
          rating?: number
          reviewed_by?: string
          service_photos?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "booking_appointment"
            referencedColumns: ["id"]
          },
        ]
      }
      service_addons: {
        Row: {
          addon_name: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          price: number
          pricing_key: string | null
          service_type: string
          updated_at: string | null
        }
        Insert: {
          addon_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          price: number
          pricing_key?: string | null
          service_type: string
          updated_at?: string | null
        }
        Update: {
          addon_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          price?: number
          pricing_key?: string | null
          service_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_base_pricing: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          package_name: string
          price: number
          pricing_key: string | null
          service_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          package_name: string
          price: number
          pricing_key?: string | null
          service_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          package_name?: string
          price?: number
          pricing_key?: string | null
          service_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_frequencies: {
        Row: {
          created_at: string | null
          frequency_key: string
          frequency_label: string
          id: string
          is_active: boolean | null
          services_per_year: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          frequency_key: string
          frequency_label: string
          id?: string
          is_active?: boolean | null
          services_per_year: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          frequency_key?: string
          frequency_label?: string
          id?: string
          is_active?: boolean | null
          services_per_year?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      size_multipliers: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          multiplier: number
          size_key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          multiplier: number
          size_key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          multiplier?: number
          size_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string | null
          created_at: string
          details: Json | null
          error_message: string | null
          id: string
          log_type: string
          severity: string
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          log_type: string
          severity?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          log_type?: string
          severity?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      unsubscribe_list: {
        Row: {
          created_at: string | null
          email: string
          id: string
          ip_address: string | null
          reason: string | null
          unsubscribed_at: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          unsubscribed_at?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          unsubscribed_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      user_homes: {
        Row: {
          address: string
          address_place_id: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          created_at: string
          flooring: string | null
          has_basement: boolean | null
          has_fireplace: boolean | null
          heating_type: string | null
          house_type: string | null
          id: string
          is_primary: boolean | null
          lot_size_sqft: number | null
          nickname: string | null
          parcel_number: string | null
          roof_type: string | null
          sqft: number | null
          state: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address: string
          address_place_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          flooring?: string | null
          has_basement?: boolean | null
          has_fireplace?: boolean | null
          heating_type?: string | null
          house_type?: string | null
          id?: string
          is_primary?: boolean | null
          lot_size_sqft?: number | null
          nickname?: string | null
          parcel_number?: string | null
          roof_type?: string | null
          sqft?: number | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string
          address_place_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          flooring?: string | null
          has_basement?: boolean | null
          has_fireplace?: boolean | null
          heating_type?: string | null
          house_type?: string | null
          id?: string
          is_primary?: boolean | null
          lot_size_sqft?: number | null
          nickname?: string | null
          parcel_number?: string | null
          roof_type?: string | null
          sqft?: number | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      user_phone_verification: {
        Row: {
          attempts: number | null
          created_at: string | null
          expires_at: string
          id: string
          is_verified: boolean | null
          otp_code: string
          phone: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          is_verified?: boolean | null
          otp_code: string
          phone: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          is_verified?: boolean | null
          otp_code?: string
          phone?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      user_settings: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          sms_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_appointment_date: {
        Args: { _appointment_id: string; _user_id: string }
        Returns: Json
      }
      add_user_role: {
        Args: { _role: string; _user_id: string }
        Returns: Json
      }
      admin_approve_payment: {
        Args: {
          _admin_id: string
          _approved: boolean
          _notes?: string
          _payment_id: string
        }
        Returns: Json
      }
      admin_manage_user: {
        Args: {
          _action: string
          _admin_id: string
          _updates?: Json
          _user_id: string
        }
        Returns: Json
      }
      admin_search_users: {
        Args: { _admin_id: string; _query: string }
        Returns: Json
      }
      approve_service_request: {
        Args: {
          _admin_id: string
          _admin_notes?: string
          _approved: boolean
          _service_id: string
        }
        Returns: Json
      }
      confirm_appointment: {
        Args: { _appointment_id: string; _user_id: string; _user_type?: string }
        Returns: Json
      }
      delete_user_home: {
        Args: { _home_id: string; _user_id: string }
        Returns: boolean
      }
      generate_qr_code: {
        Args: { _appointment_id: string; _user_id: string }
        Returns: Json
      }
      get_user_conversations: {
        Args: { _user_id: string }
        Returns: {
          conversation_user_id: string
          conversation_user_name: string
          last_message: string
          last_message_time: string
          unread_count: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_service_assigned_to_provider: {
        Args: { p_provider_id: string; p_service_id: string }
        Returns: boolean
      }
      is_service_owner: {
        Args: { p_service_id: string; p_user_id: string }
        Returns: boolean
      }
      log_error: {
        Args: {
          _action: string
          _details?: Json
          _error_message: string
          _user_id: string
        }
        Returns: Json
      }
      manage_chat: {
        Args: { _action: string; _chat_data: Json; _user_id: string }
        Returns: Json
      }
      manage_review: {
        Args: { _action: string; _review_data: Json; _user_id: string }
        Returns: Json
      }
      mark_notification_read: {
        Args: {
          _mark_all?: boolean
          _notification_id?: string
          _user_id: string
        }
        Returns: number
      }
      propose_appointment_date: {
        Args: {
          _appointment_id: string
          _notes?: string
          _proposed_date: string
          _user_id: string
        }
        Returns: Json
      }
      provider_has_lead_for_service: {
        Args: { p_provider_id: string; p_service_id: string }
        Returns: boolean
      }
      provider_respond_service: {
        Args: {
          _decline_reason?: string
          _proposed_date?: string
          _response_type: string
          _service_id: string
          _user_id: string
        }
        Returns: Json
      }
      rpc_create_stripe_payment: {
        Args: {
          _amount: number
          _description: string
          _origin_url: string
          _service_id: string
          _stripe_secret_key: string
          _user_id: string
        }
        Returns: Json
      }
      rpc_get_property_data: {
        Args: { _address: string; _attom_api_key: string; _place_id: string }
        Returns: Json
      }
      rpc_handle_stripe_webhook: {
        Args: { _event_data: Json; _event_type: string }
        Returns: Json
      }
      rpc_send_notifications: {
        Args: {
          _frequency: string
          _package_name: string
          _resend_api_key: string
          _service_id: string
          _service_name: string
          _twilio_account_sid?: string
          _twilio_auth_token?: string
          _twilio_phone_number?: string
          _user_email: string
          _user_name: string
          _user_phone: string
        }
        Returns: Json
      }
      save_profile:
        | {
            Args: {
              _address?: string
              _approval_status?: string
              _business_license?: string
              _city?: string
              _company_name?: string
              _display_name?: string
              _first_name?: string
              _last_name?: string
              _phone?: string
              _phone_verified?: boolean
              _profile_photo_url?: string
              _services_offered?: string[]
              _state?: string
              _user_id: string
              _zip?: string
            }
            Returns: Json
          }
        | {
            Args: {
              _address?: string
              _approval_status?: string
              _business_license?: string
              _city?: string
              _company_name?: string
              _display_name?: string
              _first_name?: string
              _last_name?: string
              _phone?: string
              _phone_verified?: boolean
              _profile_photo_url?: string
              _services_offered?: string[]
              _state?: string
              _user_id: string
              _venmo_phone?: string
              _zip?: string
            }
            Returns: Json
          }
      save_user_home: {
        Args: {
          _address?: string
          _city?: string
          _home_id?: string
          _is_primary?: boolean
          _state?: string
          _user_id: string
          _zip_code?: string
        }
        Returns: Json
      }
      save_user_profile: {
        Args: {
          _address: string
          _city: string
          _phone: string
          _state: string
          _zip: string
        }
        Returns: boolean
      }
      scan_qr_code: {
        Args: { _location?: string; _qr_code: string; _user_id: string }
        Returns: Json
      }
      send_otp: { Args: { _phone: string }; Returns: Json }
      service_has_assignment: {
        Args: { p_service_id: string }
        Returns: boolean
      }
      update_appointment_status: {
        Args: {
          _appointment_date?: string
          _appointment_id: string
          _cancellation_reason?: string
          _customer_status?: string
          _provider_status?: string
          _status?: string
          _user_id: string
        }
        Returns: Json
      }
      update_lead_status: {
        Args: { _lead_id: string; _provider_id: string; _status: string }
        Returns: Json
      }
      urlencode: { Args: { in_str: string }; Returns: string }
      user_has_appointment_for_service: {
        Args: { p_service_id: string; p_user_id: string }
        Returns: boolean
      }
      verify_otp: { Args: { _otp_code: string; _phone: string }; Returns: Json }
    }
    Enums: {
      app_role: "homeowner" | "provider" | "admin"
      appointment_status:
        | "new"
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "declined"
      participant_status:
        | "pending"
        | "confirmed"
        | "declined"
        | "cancelled"
        | "completed"
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
      app_role: ["homeowner", "provider", "admin"],
      appointment_status: [
        "new",
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "declined",
      ],
      participant_status: [
        "pending",
        "confirmed",
        "declined",
        "cancelled",
        "completed",
      ],
    },
  },
} as const
