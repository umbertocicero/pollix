-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- USERS & PROFILES
-- ===========================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    locale TEXT DEFAULT 'en',
    notification_email BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ===========================================
-- POLLS
-- ===========================================

-- Poll types enum
CREATE TYPE poll_type AS ENUM ('single_choice', 'multiple_choice', 'calendar');

-- Poll status enum
CREATE TYPE poll_status AS ENUM ('draft', 'active', 'closed', 'expired');

-- Polls table
CREATE TABLE public.polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    short_id TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text), 1, 8),
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    poll_type poll_type NOT NULL,
    status poll_status DEFAULT 'active',
    
    -- Settings
    allow_anonymous BOOLEAN DEFAULT true,
    require_name BOOLEAN DEFAULT true,
    allow_multiple_votes BOOLEAN DEFAULT false,
    show_results_before_vote BOOLEAN DEFAULT true,
    password_hash TEXT,
    
    -- Multiple choice settings
    min_selections INTEGER DEFAULT 1,
    max_selections INTEGER,
    
    -- Calendar settings
    timezone TEXT DEFAULT 'UTC',
    
    -- Timestamps
    expires_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

-- Policies for polls
CREATE POLICY "Anyone can view active polls" ON public.polls
    FOR SELECT USING (status = 'active' OR status = 'closed');

CREATE POLICY "Creators can manage their polls" ON public.polls
    FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can create polls" ON public.polls
    FOR INSERT WITH CHECK (true);

-- ===========================================
-- POLL OPTIONS
-- ===========================================

CREATE TABLE public.poll_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    text TEXT,
    
    -- For calendar polls
    date DATE,
    start_time TIME,
    end_time TIME,
    
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

-- Policies for poll options
CREATE POLICY "Anyone can view poll options" ON public.poll_options
    FOR SELECT USING (true);

CREATE POLICY "Poll creators can manage options" ON public.poll_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = poll_options.poll_id 
            AND polls.creator_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can create poll options" ON public.poll_options
    FOR INSERT WITH CHECK (true);

-- ===========================================
-- VOTES
-- ===========================================

CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE,
    
    -- Voter info
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    voter_name TEXT,
    voter_fingerprint TEXT, -- For anonymous duplicate detection
    
    -- Not available flag (for "none of these work" responses)
    is_not_available BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: either option_id or is_not_available must be set
    CONSTRAINT votes_option_or_not_available CHECK (
        (option_id IS NOT NULL AND is_not_available = false) OR
        (option_id IS NULL AND is_not_available = true)
    )
);

-- Enable RLS
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Policies for votes
CREATE POLICY "Anyone can view votes" ON public.votes
    FOR SELECT USING (true);

CREATE POLICY "Anyone can vote" ON public.votes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own votes" ON public.votes
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can delete their own votes" ON public.votes
    FOR DELETE USING (voter_fingerprint IS NOT NULL AND user_id IS NULL);

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX idx_polls_creator_id ON public.polls(creator_id);
CREATE INDEX idx_polls_short_id ON public.polls(short_id);
CREATE INDEX idx_polls_status ON public.polls(status);
CREATE INDEX idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX idx_votes_poll_id ON public.votes(poll_id);
CREATE INDEX idx_votes_option_id ON public.votes(option_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
CREATE INDEX idx_votes_voter_fingerprint ON public.votes(voter_fingerprint);
CREATE INDEX idx_votes_not_available ON public.votes(poll_id, is_not_available) WHERE is_not_available = true;

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_polls_updated_at
    BEFORE UPDATE ON public.polls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- VIEWS FOR RESULTS
-- ===========================================

CREATE OR REPLACE VIEW public.poll_results AS
SELECT 
    p.id AS poll_id,
    p.short_id,
    p.title,
    p.poll_type,
    po.id AS option_id,
    po.text AS option_text,
    po.date AS option_date,
    po.start_time,
    po.end_time,
    COUNT(v.id) AS vote_count,
    ARRAY_AGG(DISTINCT v.voter_name) FILTER (WHERE v.voter_name IS NOT NULL) AS voter_names
FROM public.polls p
LEFT JOIN public.poll_options po ON p.id = po.poll_id
LEFT JOIN public.votes v ON po.id = v.option_id
GROUP BY p.id, p.short_id, p.title, p.poll_type, po.id, po.text, po.date, po.start_time, po.end_time
ORDER BY p.id, po.sort_order;

-- ===========================================
-- REALTIME
-- ===========================================

-- Enable Realtime for votes table (required for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- Set REPLICA IDENTITY to FULL for better change tracking
ALTER TABLE votes REPLICA IDENTITY FULL;
