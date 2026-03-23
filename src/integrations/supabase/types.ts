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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean
          button_bg_color: string | null
          button_link: string | null
          button_text: string | null
          button_text_color: string | null
          button_variant: Database["public"]["Enums"]["button_variant"] | null
          category_id: string | null
          created_at: string
          end_at: string | null
          id: string
          image_desktop: string
          image_mobile: string | null
          sort_order: number
          start_at: string | null
          subtitle: string | null
          title: string | null
          type: Database["public"]["Enums"]["banner_type"]
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          active?: boolean
          button_bg_color?: string | null
          button_link?: string | null
          button_text?: string | null
          button_text_color?: string | null
          button_variant?: Database["public"]["Enums"]["button_variant"] | null
          category_id?: string | null
          created_at?: string
          end_at?: string | null
          id?: string
          image_desktop: string
          image_mobile?: string | null
          sort_order?: number
          start_at?: string | null
          subtitle?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["banner_type"]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          active?: boolean
          button_bg_color?: string | null
          button_link?: string | null
          button_text?: string | null
          button_text_color?: string | null
          button_variant?: Database["public"]["Enums"]["button_variant"] | null
          category_id?: string | null
          created_at?: string
          end_at?: string | null
          id?: string
          image_desktop?: string
          image_mobile?: string | null
          sort_order?: number
          start_at?: string | null
          subtitle?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["banner_type"]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          rules: Json | null
          slug: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          rules?: Json | null
          slug: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rules?: Json | null
          slug?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          created_at: string
          customer_id: string | null
          discount_applied: number
          id: string
          order_id: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          customer_id?: string | null
          discount_applied: number
          id?: string
          order_id?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          customer_id?: string | null
          discount_applied?: number
          id?: string
          order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          applicable_categories: string[] | null
          applicable_products: string[] | null
          code: string
          created_at: string
          end_at: string | null
          id: string
          max_discount: number | null
          min_cart_value: number | null
          stackable: boolean
          start_at: string | null
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at: string
          usage_limit: number | null
          usage_per_customer: number | null
          used_count: number
          value: number
        }
        Insert: {
          active?: boolean
          applicable_categories?: string[] | null
          applicable_products?: string[] | null
          code: string
          created_at?: string
          end_at?: string | null
          id?: string
          max_discount?: number | null
          min_cart_value?: number | null
          stackable?: boolean
          start_at?: string | null
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          usage_limit?: number | null
          usage_per_customer?: number | null
          used_count?: number
          value: number
        }
        Update: {
          active?: boolean
          applicable_categories?: string[] | null
          applicable_products?: string[] | null
          code?: string
          created_at?: string
          end_at?: string | null
          id?: string
          max_discount?: number | null
          min_cart_value?: number | null
          stackable?: boolean
          start_at?: string | null
          type?: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          usage_limit?: number | null
          usage_per_customer?: number | null
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          label: string | null
          neighborhood: string
          number: string
          recipient_name: string
          state: string
          street: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          label?: string | null
          neighborhood: string
          number: string
          recipient_name: string
          state: string
          street: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          label?: string | null
          neighborhood?: string
          number?: string
          recipient_name?: string
          state?: string
          street?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          blocked: boolean
          blocked_reason: string | null
          cpf: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_order_at: string | null
          notes: string | null
          order_count: number
          phone: string | null
          tags: string[] | null
          total_spent: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          blocked?: boolean
          blocked_reason?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          last_order_at?: string | null
          notes?: string | null
          order_count?: number
          phone?: string | null
          tags?: string[] | null
          total_spent?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          blocked?: boolean
          blocked_reason?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_order_at?: string | null
          notes?: string | null
          order_count?: number
          phone?: string | null
          tags?: string[] | null
          total_spent?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      home_blocks: {
        Row: {
          active: boolean | null
          config: Json | null
          created_at: string | null
          id: string
          sort_order: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          config?: Json | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          config?: Json | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          total_price: number
          unit_price: number
          variant_attributes: Json | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          quantity: number
          total_price: number
          unit_price: number
          variant_attributes?: Json | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
          variant_attributes?: Json | null
          variant_id?: string | null
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
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
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
          notes: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          notes?: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          notes?: string | null
          order_id?: string
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
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          canceled_at: string | null
          carrier: string | null
          coupon_code: string | null
          created_at: string
          customer_id: string | null
          delivered_at: string | null
          discount: number
          id: string
          internal_notes: string | null
          mp_payment_id: string | null
          mp_payment_status: string | null
          notes: string | null
          order_number: string
          payment_data: Json | null
          payment_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          refunded_at: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_cost: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billing_address?: Json | null
          canceled_at?: string | null
          carrier?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          discount?: number
          id?: string
          internal_notes?: string | null
          mp_payment_id?: string | null
          mp_payment_status?: string | null
          notes?: string | null
          order_number: string
          payment_data?: Json | null
          payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          refunded_at?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billing_address?: Json | null
          canceled_at?: string | null
          carrier?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          discount?: number
          id?: string
          internal_notes?: string | null
          mp_payment_id?: string | null
          mp_payment_status?: string | null
          notes?: string | null
          order_number?: string
          payment_data?: Json | null
          payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          refunded_at?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          boleto_enabled: boolean
          boleto_timeout_hours: number
          created_at: string
          credit_card_enabled: boolean
          environment: string
          id: string
          installment_interest_rate: number
          installment_type: string
          max_installments: number
          min_installment_value: number
          mp_access_token: string | null
          mp_fee_boleto: number
          mp_fee_credit: number
          mp_fee_pix: number
          mp_public_key: string | null
          pix_enabled: boolean
          pix_timeout_minutes: number
          provider: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          boleto_enabled?: boolean
          boleto_timeout_hours?: number
          created_at?: string
          credit_card_enabled?: boolean
          environment?: string
          id?: string
          installment_interest_rate?: number
          installment_type?: string
          max_installments?: number
          min_installment_value?: number
          mp_access_token?: string | null
          mp_fee_boleto?: number
          mp_fee_credit?: number
          mp_fee_pix?: number
          mp_public_key?: string | null
          pix_enabled?: boolean
          pix_timeout_minutes?: number
          provider?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          boleto_enabled?: boolean
          boleto_timeout_hours?: number
          created_at?: string
          credit_card_enabled?: boolean
          environment?: string
          id?: string
          installment_interest_rate?: number
          installment_type?: string
          max_installments?: number
          min_installment_value?: number
          mp_access_token?: string | null
          mp_fee_boleto?: number
          mp_fee_credit?: number
          mp_fee_pix?: number
          mp_public_key?: string | null
          pix_enabled?: boolean
          pix_timeout_minutes?: number
          provider?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      pickup_locations: {
        Row: {
          active: boolean
          address: string
          city: string
          created_at: string
          hours: string | null
          id: string
          name: string
          phone: string | null
          state: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          active?: boolean
          address: string
          city: string
          created_at?: string
          hours?: string | null
          id?: string
          name: string
          phone?: string | null
          state: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          active?: boolean
          address?: string
          city?: string
          created_at?: string
          hours?: string | null
          id?: string
          name?: string
          phone?: string | null
          state?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: []
      }
      product_attribute_values: {
        Row: {
          attribute_id: string
          created_at: string
          id: string
          slug: string
          sort_order: number
          value: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          id?: string
          slug: string
          sort_order?: number
          value: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          id?: string
          slug?: string
          sort_order?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "product_attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          type?: string
        }
        Relationships: []
      }
      product_collections: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_collections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          active: boolean
          attributes: Json
          compare_at_price: number | null
          created_at: string
          id: string
          image_url: string | null
          payment_config: Json | null
          price: number | null
          product_id: string
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          attributes?: Json
          compare_at_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          payment_config?: Json | null
          price?: number | null
          product_id: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          attributes?: Json
          compare_at_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          payment_config?: Json | null
          price?: number | null
          product_id?: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          allow_backorder: boolean
          barcode: string | null
          bestseller: boolean
          category_id: string | null
          compare_at_price: number | null
          cost: number | null
          created_at: string
          description: string | null
          description_blocks: Json | null
          featured: boolean
          free_shipping: boolean
          has_variants: boolean
          id: string
          images: string[] | null
          is_digital: boolean
          main_image_index: number
          max_variant_price: number | null
          min_stock: number
          min_variant_price: number | null
          name: string
          og_image: string | null
          payment_config: Json | null
          price: number
          secondary_category_ids: string[] | null
          seo_description: string | null
          seo_title: string | null
          sku: string | null
          slug: string
          specifications: Json | null
          stock: number
          tags: string[] | null
          unlimited_stock: boolean
          updated_at: string
          weight: number | null
        }
        Insert: {
          active?: boolean
          allow_backorder?: boolean
          barcode?: string | null
          bestseller?: boolean
          category_id?: string | null
          compare_at_price?: number | null
          cost?: number | null
          created_at?: string
          description?: string | null
          description_blocks?: Json | null
          featured?: boolean
          free_shipping?: boolean
          has_variants?: boolean
          id?: string
          images?: string[] | null
          is_digital?: boolean
          main_image_index?: number
          max_variant_price?: number | null
          min_stock?: number
          min_variant_price?: number | null
          name: string
          og_image?: string | null
          payment_config?: Json | null
          price: number
          secondary_category_ids?: string[] | null
          seo_description?: string | null
          seo_title?: string | null
          sku?: string | null
          slug: string
          specifications?: Json | null
          stock?: number
          tags?: string[] | null
          unlimited_stock?: boolean
          updated_at?: string
          weight?: number | null
        }
        Update: {
          active?: boolean
          allow_backorder?: boolean
          barcode?: string | null
          bestseller?: boolean
          category_id?: string | null
          compare_at_price?: number | null
          cost?: number | null
          created_at?: string
          description?: string | null
          description_blocks?: Json | null
          featured?: boolean
          free_shipping?: boolean
          has_variants?: boolean
          id?: string
          images?: string[] | null
          is_digital?: boolean
          main_image_index?: number
          max_variant_price?: number | null
          min_stock?: number
          min_variant_price?: number | null
          name?: string
          og_image?: string | null
          payment_config?: Json | null
          price?: number
          secondary_category_ids?: string[] | null
          seo_description?: string | null
          seo_title?: string | null
          sku?: string | null
          slug?: string
          specifications?: Json | null
          stock?: number
          tags?: string[] | null
          unlimited_stock?: boolean
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      search_filters: {
        Row: {
          active: boolean
          category_ids: string[] | null
          config: Json | null
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          source: string
          source_key: string | null
          type: Database["public"]["Enums"]["filter_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_ids?: string[] | null
          config?: Json | null
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          source: string
          source_key?: string | null
          type: Database["public"]["Enums"]["filter_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_ids?: string[] | null
          config?: Json | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          source?: string
          source_key?: string | null
          type?: Database["public"]["Enums"]["filter_type"]
          updated_at?: string
        }
        Relationships: []
      }
      shipping_rules: {
        Row: {
          active: boolean
          created_at: string
          estimated_days_max: number | null
          estimated_days_min: number | null
          free_above: number | null
          id: string
          max_weight: number | null
          max_zip: string | null
          min_weight: number | null
          min_zip: string | null
          name: string
          price: number
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          free_above?: number | null
          id?: string
          max_weight?: number | null
          max_zip?: string | null
          min_weight?: number | null
          min_zip?: string | null
          name: string
          price?: number
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          free_above?: number | null
          id?: string
          max_weight?: number | null
          max_zip?: string | null
          min_weight?: number | null
          min_zip?: string | null
          name?: string
          price?: number
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      showcase_sections: {
        Row: {
          active: boolean
          created_at: string
          id: string
          max_products: number | null
          name: string
          product_ids: string[] | null
          slug: string
          sort_order: number
          subtitle: string | null
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          max_products?: number | null
          name: string
          product_ids?: string[] | null
          slug: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          max_products?: number | null
          name?: string
          product_ids?: string[] | null
          slug?: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          address: string | null
          announcement_active: boolean | null
          announcement_text: string | null
          city: string | null
          created_at: string | null
          email: string | null
          facebook_url: string | null
          favicon: string | null
          free_shipping_threshold: number | null
          ga4_id: string | null
          id: string
          instagram_url: string | null
          is_current: boolean | null
          max_installments: number | null
          meta_description: string | null
          meta_pixel_id: string | null
          meta_title: string | null
          phone: string | null
          pix_discount_percent: number | null
          state: string | null
          store_description: string | null
          store_logo: string | null
          store_name: string
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string | null
          updated_by: string | null
          whatsapp: string | null
          youtube_url: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          announcement_active?: boolean | null
          announcement_text?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          facebook_url?: string | null
          favicon?: string | null
          free_shipping_threshold?: number | null
          ga4_id?: string | null
          id?: string
          instagram_url?: string | null
          is_current?: boolean | null
          max_installments?: number | null
          meta_description?: string | null
          meta_pixel_id?: string | null
          meta_title?: string | null
          phone?: string | null
          pix_discount_percent?: number | null
          state?: string | null
          store_description?: string | null
          store_logo?: string | null
          store_name?: string
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp?: string | null
          youtube_url?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          announcement_active?: boolean | null
          announcement_text?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          facebook_url?: string | null
          favicon?: string | null
          free_shipping_threshold?: number | null
          ga4_id?: string | null
          id?: string
          instagram_url?: string | null
          is_current?: boolean | null
          max_installments?: number | null
          meta_description?: string | null
          meta_pixel_id?: string | null
          meta_title?: string | null
          phone?: string | null
          pix_discount_percent?: number | null
          state?: string | null
          store_description?: string | null
          store_logo?: string | null
          store_name?: string
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp?: string | null
          youtube_url?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          accent_color: string
          badge_free_shipping_color: string
          badge_oos_color: string
          badge_sale_color: string
          banner_cta_color: string
          border_radius: string
          button_style: string
          created_at: string
          favicon: string | null
          font_primary: string
          font_secondary: string
          ga4_id: string | null
          id: string
          is_current: boolean
          meta_description: string | null
          meta_pixel_id: string | null
          meta_title: string | null
          primary_color: string
          secondary_color: string
          store_logo: string | null
          store_name: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          accent_color?: string
          badge_free_shipping_color?: string
          badge_oos_color?: string
          badge_sale_color?: string
          banner_cta_color?: string
          border_radius?: string
          button_style?: string
          created_at?: string
          favicon?: string | null
          font_primary?: string
          font_secondary?: string
          ga4_id?: string | null
          id?: string
          is_current?: boolean
          meta_description?: string | null
          meta_pixel_id?: string | null
          meta_title?: string | null
          primary_color?: string
          secondary_color?: string
          store_logo?: string | null
          store_name?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          accent_color?: string
          badge_free_shipping_color?: string
          badge_oos_color?: string
          badge_sale_color?: string
          banner_cta_color?: string
          border_radius?: string
          button_style?: string
          created_at?: string
          favicon?: string | null
          font_primary?: string
          font_secondary?: string
          ga4_id?: string | null
          id?: string
          is_current?: boolean
          meta_description?: string | null
          meta_pixel_id?: string | null
          meta_title?: string | null
          primary_color?: string
          secondary_color?: string
          store_logo?: string | null
          store_name?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          provider: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_admin_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_manager_or_above: { Args: { _user_id: string }; Returns: boolean }
      is_support_or_above: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "support" | "viewer"
      banner_type: "home_slider" | "category" | "promo_bar" | "topbar"
      button_variant: "primary" | "outline" | "secondary"
      coupon_type: "percentage" | "fixed" | "free_shipping"
      filter_type: "checkbox" | "radio" | "slider" | "range" | "boolean"
      order_status:
        | "pending_payment"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "canceled"
        | "refunded"
      payment_method: "pix" | "credit_card" | "boleto"
      payment_status: "pending" | "approved" | "rejected" | "chargeback"
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
      app_role: ["admin", "manager", "support", "viewer"],
      banner_type: ["home_slider", "category", "promo_bar", "topbar"],
      button_variant: ["primary", "outline", "secondary"],
      coupon_type: ["percentage", "fixed", "free_shipping"],
      filter_type: ["checkbox", "radio", "slider", "range", "boolean"],
      order_status: [
        "pending_payment",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "canceled",
        "refunded",
      ],
      payment_method: ["pix", "credit_card", "boleto"],
      payment_status: ["pending", "approved", "rejected", "chargeback"],
    },
  },
} as const
