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
          math_approach: string | null;
          reasoning_type: string | null;
          topic_id: number | null;
          difficulty: string | null;
          importance: string | null;
          comment: string | null;
          version: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['problems']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['problems']['Insert']>;
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
    };
  };
}

export type Topic = Database['public']['Tables']['topics']['Row'];
export type Problem = Database['public']['Tables']['problems']['Row'];
export type Subproblem = Database['public']['Tables']['subproblems']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];