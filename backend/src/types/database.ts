export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          full_name: string | null
          avatar_url: string | null
          phone_number: string | null
          bio: string | null
          date_of_birth: string | null
          location: string | null
          website: string | null
          is_verified: boolean
          is_active: boolean
          role: 'user' | 'admin' | 'moderator'
          preferences: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone_number?: string | null
          bio?: string | null
          date_of_birth?: string | null
          location?: string | null
          website?: string | null
          is_verified?: boolean
          is_active?: boolean
          role?: 'user' | 'admin' | 'moderator'
          preferences?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone_number?: string | null
          bio?: string | null
          date_of_birth?: string | null
          location?: string | null
          website?: string | null
          is_verified?: boolean
          is_active?: boolean
          role?: 'user' | 'admin' | 'moderator'
          preferences?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string
          title: string
          content: string
          excerpt: string | null
          slug: string
          status: 'draft' | 'published' | 'archived'
          featured_image_url: string | null
          tags: string[] | null
          category: string | null
          view_count: number
          like_count: number
          comment_count: number
          is_featured: boolean
          seo_title: string | null
          seo_description: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          content: string
          excerpt?: string | null
          slug: string
          status?: 'draft' | 'published' | 'archived'
          featured_image_url?: string | null
          tags?: string[] | null
          category?: string | null
          view_count?: number
          like_count?: number
          comment_count?: number
          is_featured?: boolean
          seo_title?: string | null
          seo_description?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          content?: string
          excerpt?: string | null
          slug?: string
          status?: 'draft' | 'published' | 'archived'
          featured_image_url?: string | null
          tags?: string[] | null
          category?: string | null
          view_count?: number
          like_count?: number
          comment_count?: number
          is_featured?: boolean
          seo_title?: string | null
          seo_description?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          parent_id: string | null
          content: string
          status: 'pending' | 'approved' | 'rejected'
          like_count: number
          is_edited: boolean
          edited_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          parent_id?: string | null
          content: string
          status?: 'pending' | 'approved' | 'rejected'
          like_count?: number
          is_edited?: boolean
          edited_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          parent_id?: string | null
          content?: string
          status?: 'pending' | 'approved' | 'rejected'
          like_count?: number
          is_edited?: boolean
          edited_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          target_id: string
          target_type: 'post' | 'comment'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_id: string
          target_type: 'post' | 'comment'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_id?: string
          target_type?: 'post' | 'comment'
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string | null
          icon: string | null
          is_active: boolean
          sort_order: number
          parent_id: string | null
          post_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          color?: string | null
          icon?: string | null
          is_active?: boolean
          sort_order?: number
          parent_id?: string | null
          post_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          is_active?: boolean
          sort_order?: number
          parent_id?: string | null
          post_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string | null
          is_featured: boolean
          post_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          color?: string | null
          is_featured?: boolean
          post_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          color?: string | null
          is_featured?: boolean
          post_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_view_count: {
        Args: {
          post_id: string
        }
        Returns: undefined
      }
      increment_like_count: {
        Args: {
          target_id: string
          target_type: 'post' | 'comment'
        }
        Returns: undefined
      }
      decrement_like_count: {
        Args: {
          target_id: string
          target_type: 'post' | 'comment'
        }
        Returns: undefined
      }
    }
    Enums: {
      user_role: 'user' | 'admin' | 'moderator'
      post_status: 'draft' | 'published' | 'archived'
      comment_status: 'pending' | 'approved' | 'rejected'
      like_target_type: 'post' | 'comment'
    }
  }
}