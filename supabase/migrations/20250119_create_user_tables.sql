-- Create users table that extends Supabase Auth
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_answers table for storing problem and subproblem answers
CREATE TABLE IF NOT EXISTS public.user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    subproblem_id UUID REFERENCES public.subproblems(id) ON DELETE CASCADE,
    answer_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, problem_id, subproblem_id)
);

-- Create user_chats table for storing user messages
CREATE TABLE IF NOT EXISTS public.user_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_problem_progress table for tracking bookmarks and completion
CREATE TABLE IF NOT EXISTS public.user_problem_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, problem_id)
);

-- Create user_preferences table for user settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dark_mode BOOLEAN DEFAULT FALSE,
    preferred_ai_model TEXT DEFAULT 'gemini-2.0-flash-exp',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_answers_user_problem ON public.user_answers(user_id, problem_id);
CREATE INDEX IF NOT EXISTS idx_user_chats_user_problem ON public.user_chats(user_id, problem_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_problem_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_bookmarked ON public.user_problem_progress(user_id, is_bookmarked) WHERE is_bookmarked = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON public.user_problem_progress(user_id, is_completed) WHERE is_completed = TRUE;

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_problem_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for user_answers table
CREATE POLICY "Users can view own answers" ON public.user_answers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers" ON public.user_answers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers" ON public.user_answers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own answers" ON public.user_answers
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_chats table
CREATE POLICY "Users can view own chats" ON public.user_chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats" ON public.user_chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_problem_progress table
CREATE POLICY "Users can view own progress" ON public.user_problem_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_problem_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_problem_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for user_preferences table
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle user creation on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Also create default preferences for the user
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_answers_updated_at BEFORE UPDATE ON public.user_answers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_problem_progress_updated_at BEFORE UPDATE ON public.user_problem_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();