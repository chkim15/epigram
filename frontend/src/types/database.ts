export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          document_id: string;
          school: string;
          course: string;
          problem_type: string;
          term: string;
          year: string;
          total_problems: number;
          total_images: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      topics: {
        Row: {
          id: number;
          subtopics: string | null;
          main_topics: string | null;
          course: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['topics']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['topics']['Insert']>;
      };
      problems: {
        Row: {
          id: string;
          problem_id: string;
          document_id: string;
          problem_text: string | null;
          correct_answer: string | null;
          hint: string | null;
          solution_text: string | null;
          math_approach: string[] | null;
          reasoning_type: string[] | null;
          difficulty: string | null;
          importance: string | null;
          comment: string | null;
          version: string;
          included: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['problems']['Row'], 'created_at' | 'updated_at' | 'included'> & { included?: boolean };
        Update: Partial<Database['public']['Tables']['problems']['Insert']>;
      };
      problem_topics: {
        Row: {
          problem_id: string;
          topic_id: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['problem_topics']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['problem_topics']['Insert']>;
      };
      subproblems: {
        Row: {
          id: string;
          problem_id: string;
          key: string;
          problem_text: string | null;
          correct_answer: string | null;
          hint: string | null;
          solution_text: string | null;
          comment: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subproblems']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['subproblems']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      user_answers: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          subproblem_id: string | null;
          answer_text: string;
          is_correct: boolean | null;
          attempt_number: number;
          submitted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_answers']['Row'], 'id' | 'created_at' | 'updated_at' | 'submitted_at'>;
        Update: Partial<Database['public']['Tables']['user_answers']['Insert']>;
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string | null;
          topic_id: number | null;
          session_id: string | null;
          role: 'user' | 'assistant';
          content: string;
          message_order: number | null;
          context_type: 'problem' | 'handout' | 'general' | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>;
      };
      user_problem_progress: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          is_completed: boolean;
          is_bookmarked: boolean;
          last_accessed: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_problem_progress']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_problem_progress']['Insert']>;
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          dark_mode: boolean;
          preferred_ai_model: string;
          active_learning_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_preferences']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_preferences']['Insert']>;
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          school: string | null;
          course: string | null;
          referral_source: string | null;
          referral_other: string | null;
          onboarding_completed: boolean | null;
          active_learning_mode: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
      solutions: {
        Row: {
          id: string;  // UUID
          problem_id: string | null;  // UUID reference to problems.id
          subproblem_id: string | null;  // UUID reference to subproblems.id
          solution_text: string;
          solution_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['solutions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['solutions']['Insert']>;
      };
      user_notes: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          note_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_notes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_notes']['Insert']>;
      };
      tutor_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          image_url: string;
          initial_text: string | null;
          is_bookmarked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tutor_sessions']['Row'], 'id' | 'created_at' | 'updated_at' | 'is_bookmarked'> & { is_bookmarked?: boolean };
        Update: Partial<Database['public']['Tables']['tutor_sessions']['Insert']>;
      };
      tutor_messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          message_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tutor_messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tutor_messages']['Insert']>;
      };
    };
  };
}

export type Topic = Database['public']['Tables']['topics']['Row'];
export type Problem = Database['public']['Tables']['problems']['Row'];
export type ProblemTopic = Database['public']['Tables']['problem_topics']['Row'];
export type Subproblem = Database['public']['Tables']['subproblems']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type UserAnswer = Database['public']['Tables']['user_answers']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type UserProblemProgress = Database['public']['Tables']['user_problem_progress']['Row'];
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type Solution = Database['public']['Tables']['solutions']['Row'];
export type UserNote = Database['public']['Tables']['user_notes']['Row'];
export type TutorSession = Database['public']['Tables']['tutor_sessions']['Row'];
export type TutorMessage = Database['public']['Tables']['tutor_messages']['Row'];