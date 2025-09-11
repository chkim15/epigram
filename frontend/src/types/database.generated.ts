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
      documents: {
        Row: {
          course: string | null
          created_at: string | null
          document_id: string
          id: string
          problem_type: string | null
          school: string | null
          term: string | null
          total_problems: number | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          course?: string | null
          created_at?: string | null
          document_id: string
          id?: string
          problem_type?: string | null
          school?: string | null
          term?: string | null
          total_problems?: number | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          course?: string | null
          created_at?: string | null
          document_id?: string
          id?: string
          problem_type?: string | null
          school?: string | null
          term?: string | null
          total_problems?: number | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      hints: {
        Row: {
          created_at: string | null
          hint_order: number
          hint_text: string
          id: string
          problem_id: string | null
          subproblem_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hint_order?: number
          hint_text: string
          id?: string
          problem_id?: string | null
          subproblem_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hint_order?: number
          hint_text?: string
          id?: string
          problem_id?: string | null
          subproblem_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hints_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hints_subproblem_id_fkey"
            columns: ["subproblem_id"]
            isOneToOne: false
            referencedRelation: "subproblems"
            referencedColumns: ["id"]
          },
        ]
      }
      problem_topics: {
        Row: {
          created_at: string | null
          problem_id: string
          topic_id: number
        }
        Insert: {
          created_at?: string | null
          problem_id: string
          topic_id: number
        }
        Update: {
          created_at?: string | null
          problem_id?: string
          topic_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "problem_topics_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problem_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      problems: {
        Row: {
          comment: string | null
          correct_answer: string | null
          created_at: string | null
          difficulty: string | null
          document_id: string | null
          hint: string | null
          id: string
          importance: number | null
          included: boolean | null
          math_approach: string[] | null
          problem_id: string
          problem_text: string | null
          reasoning_type: string[] | null
          solution_text: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          comment?: string | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: string | null
          document_id?: string | null
          hint?: string | null
          id?: string
          importance?: number | null
          included?: boolean | null
          math_approach?: string[] | null
          problem_id: string
          problem_text?: string | null
          reasoning_type?: string[] | null
          solution_text?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          comment?: string | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: string | null
          document_id?: string | null
          hint?: string | null
          id?: string
          importance?: number | null
          included?: boolean | null
          math_approach?: string[] | null
          problem_id?: string
          problem_text?: string | null
          reasoning_type?: string[] | null
          solution_text?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "problems_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      solutions: {
        Row: {
          created_at: string | null
          id: string
          problem_id: string | null
          solution_order: number | null
          solution_text: string
          subproblem_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          problem_id?: string | null
          solution_order?: number | null
          solution_text: string
          subproblem_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          problem_id?: string | null
          solution_order?: number | null
          solution_text?: string
          subproblem_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solutions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solutions_subproblem_id_fkey"
            columns: ["subproblem_id"]
            isOneToOne: false
            referencedRelation: "subproblems"
            referencedColumns: ["id"]
          },
        ]
      }
      subproblems: {
        Row: {
          comment: string | null
          correct_answer: string | null
          created_at: string | null
          hint: string | null
          id: string
          key: string
          problem_id: string | null
          problem_text: string | null
          solution_text: string | null
        }
        Insert: {
          comment?: string | null
          correct_answer?: string | null
          created_at?: string | null
          hint?: string | null
          id?: string
          key: string
          problem_id?: string | null
          problem_text?: string | null
          solution_text?: string | null
        }
        Update: {
          comment?: string | null
          correct_answer?: string | null
          created_at?: string | null
          hint?: string | null
          id?: string
          key?: string
          problem_id?: string | null
          problem_text?: string | null
          solution_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subproblems_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_notes: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size_bytes: number | null
          file_url: string | null
          id: string
          page_count: number | null
          topic_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          page_count?: number | null
          topic_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          page_count?: number | null
          topic_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_notes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: true
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          course: string | null
          created_at: string | null
          id: number
          main_topics: string | null
          subtopics: string | null
        }
        Insert: {
          course?: string | null
          created_at?: string | null
          id: number
          main_topics?: string | null
          subtopics?: string | null
        }
        Update: {
          course?: string | null
          created_at?: string | null
          id?: number
          main_topics?: string | null
          subtopics?: string | null
        }
        Relationships: []
      }
      user_answers: {
        Row: {
          answer_text: string
          attempt_number: number
          created_at: string | null
          id: string
          is_correct: boolean | null
          problem_id: string
          submitted_at: string | null
          subproblem_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer_text: string
          attempt_number?: number
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          problem_id: string
          submitted_at?: string | null
          subproblem_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer_text?: string
          attempt_number?: number
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          problem_id?: string
          submitted_at?: string | null
          subproblem_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_subproblem_id_fkey"
            columns: ["subproblem_id"]
            isOneToOne: false
            referencedRelation: "subproblems"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bookmarks: {
        Row: {
          created_at: string
          id: string
          problem_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          problem_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          problem_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bookmarks_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      user_chat_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          model: string | null
          problem_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          model?: string | null
          problem_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          model?: string | null
          problem_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_chat_messages_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      user_completed_problems: {
        Row: {
          completed_at: string
          id: string
          problem_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          problem_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          problem_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_completed_problems_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notes: {
        Row: {
          created_at: string | null
          id: string
          note_text: string
          problem_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note_text?: string
          problem_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note_text?: string
          problem_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notes_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      user_practice_sessions: {
        Row: {
          created_at: string
          difficulties: string[]
          id: string
          name: string
          topic_ids: number[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulties: string[]
          id?: string
          name: string
          topic_ids: number[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulties?: string[]
          id?: string
          name?: string
          topic_ids?: number[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          active_learning_mode: boolean | null
          course: string | null
          created_at: string | null
          id: string
          onboarding_completed: boolean | null
          referral_other: string | null
          referral_source: string | null
          school: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_learning_mode?: boolean | null
          course?: string | null
          created_at?: string | null
          id?: string
          onboarding_completed?: boolean | null
          referral_other?: string | null
          referral_source?: string | null
          school?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_learning_mode?: boolean | null
          course?: string | null
          created_at?: string | null
          id?: string
          onboarding_completed?: boolean | null
          referral_other?: string | null
          referral_source?: string | null
          school?: string | null
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
      get_problem_hints: {
        Args: { p_problem_id: string }
        Returns: {
          hint_order: number
          hint_text: string
          id: string
        }[]
      }
      get_problem_solutions: {
        Args: { problem_id_param: string }
        Returns: {
          created_at: string
          id: string
          solution_order: number
          solution_text: string
          updated_at: string
        }[]
      }
      get_problems_with_topics: {
        Args: { doc_id?: string }
        Returns: {
          comment: string
          correct_answer: string
          created_at: string
          difficulty: string
          hint: string
          importance: number
          included: boolean
          math_approach: string[]
          problem_id: string
          problem_id_text: string
          problem_text: string
          reasoning_type: string[]
          solution_text: string
          topic_ids: number[]
          updated_at: string
          version: string
        }[]
      }
      get_subproblem_hints: {
        Args: { p_subproblem_id: string }
        Returns: {
          hint_order: number
          hint_text: string
          id: string
        }[]
      }
      get_subproblem_solutions: {
        Args: { subproblem_id_param: string }
        Returns: {
          created_at: string
          id: string
          solution_order: number
          solution_text: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]