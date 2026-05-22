-- =============================================
-- My App Database Schema
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE comment_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE like_target_type AS ENUM ('post', 'comment');
CREATE TYPE gender AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE age_group AS ENUM ('13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+');

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
            THEN first_name || ' ' || last_name
            WHEN first_name IS NOT NULL 
            THEN first_name
            WHEN last_name IS NOT NULL 
            THEN last_name
            ELSE NULL
        END
    ) STORED,
    avatar_url TEXT,
    bio TEXT CHECK (char_length(bio) <= 500),
    date_of_birth DATE,
    gender gender DEFAULT 'prefer_not_to_say',
    location TEXT CHECK (char_length(location) <= 100),
    language TEXT CHECK (char_length(language) <= 50),
    occupation TEXT CHECK (char_length(occupation) <= 100),
    school TEXT CHECK (char_length(school) <= 100),
    company TEXT CHECK (char_length(company) <= 100),
    interests TEXT[] DEFAULT '{}',
    age INTEGER CHECK (age >= 13 AND age <= 120),
    age_group age_group,
    website TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    role user_role DEFAULT 'user',
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (char_length(name) <= 100),
    slug TEXT UNIQUE NOT NULL CHECK (char_length(slug) <= 100),
    description TEXT,
    color TEXT CHECK (color ~ '^#[0-9A-Fa-f]{6}$'), -- Hex color validation
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TAGS TABLE
-- =============================================
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (char_length(name) <= 50),
    slug TEXT UNIQUE NOT NULL CHECK (char_length(slug) <= 50),
    description TEXT,
    color TEXT CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    is_featured BOOLEAN DEFAULT FALSE,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- POSTS TABLE
-- =============================================
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) <= 200),
    content TEXT NOT NULL,
    excerpt TEXT CHECK (char_length(excerpt) <= 500),
    slug TEXT UNIQUE NOT NULL CHECK (char_length(slug) <= 200),
    status post_status DEFAULT 'draft',
    featured_image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    seo_title TEXT CHECK (char_length(seo_title) <= 70),
    seo_description TEXT CHECK (char_length(seo_description) <= 160),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COMMENTS TABLE
-- =============================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 1000),
    status comment_status DEFAULT 'pending',
    like_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LIKES TABLE
-- =============================================
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL,
    target_type like_target_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, target_id, target_type)
);

-- =============================================
-- FOLLOWS TABLE
-- =============================================
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- =============================================
-- CONTACTS TABLE
-- =============================================
CREATE TABLE user_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    matched_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, contact_phone)
);

-- =============================================
-- USER CONNECTIONS TABLE (for mutual connections)
-- =============================================
CREATE TABLE user_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    connected_via_contacts BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_a_id, user_b_id),
    CHECK (user_a_id < user_b_id)
);

-- =============================================
-- FRIEND RECOMMENDATIONS TABLE (for caching)
-- =============================================
CREATE TABLE friend_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recommended_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    depth INTEGER NOT NULL CHECK (depth >= 1 AND depth <= 4),
    mutual_friend_score INTEGER DEFAULT 0,
    interest_score INTEGER DEFAULT 0,
    language_score INTEGER DEFAULT 0,
    location_score INTEGER DEFAULT 0,
    total_score DECIMAL(10,2) DEFAULT 0,
    calculation_weights JSONB DEFAULT '{}',
    is_accepted BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    accepted_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    
    UNIQUE(user_id, recommended_user_id),
    CHECK (user_id != recommended_user_id)
);

-- =============================================
-- INDEXES
-- =============================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_phone_number ON profiles(phone_number);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_profiles_occupation ON profiles(occupation);
CREATE INDEX idx_profiles_school ON profiles(school);
CREATE INDEX idx_profiles_company ON profiles(company);
CREATE INDEX idx_profiles_age ON profiles(age);
CREATE INDEX idx_profiles_age_group ON profiles(age_group);
CREATE INDEX idx_profiles_interests ON profiles USING GIN(interests);

-- Posts indexes
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_featured ON posts(is_featured);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- Comments indexes
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_status ON comments(status);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Likes indexes
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_target_id ON likes(target_id);
CREATE INDEX idx_likes_target_type ON likes(target_type);
CREATE INDEX idx_likes_created_at ON likes(created_at);

-- Follows indexes
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_follows_created_at ON follows(created_at);

-- Contacts indexes
CREATE INDEX idx_user_contacts_user_id ON user_contacts(user_id);
CREATE INDEX idx_user_contacts_phone ON user_contacts(contact_phone);
CREATE INDEX idx_user_contacts_matched_user_id ON user_contacts(matched_user_id);
CREATE INDEX idx_user_contacts_is_registered ON user_contacts(is_registered);

-- Connections indexes
CREATE INDEX idx_user_connections_user_a_id ON user_connections(user_a_id);
CREATE INDEX idx_user_connections_user_b_id ON user_connections(user_b_id);
CREATE INDEX idx_user_connections_created_at ON user_connections(created_at);

-- Friend recommendations indexes
CREATE INDEX idx_friend_recommendations_user_id ON friend_recommendations(user_id);
CREATE INDEX idx_friend_recommendations_recommended_user_id ON friend_recommendations(recommended_user_id);
CREATE INDEX idx_friend_recommendations_total_score ON friend_recommendations(total_score DESC);
CREATE INDEX idx_friend_recommendations_expires_at ON friend_recommendations(expires_at);
CREATE INDEX idx_friend_recommendations_created_at ON friend_recommendations(created_at DESC);
CREATE INDEX idx_friend_recommendations_is_accepted ON friend_recommendations(is_accepted);
CREATE INDEX idx_friend_recommendations_is_dismissed ON friend_recommendations(is_dismissed);

-- Categories indexes
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- Tags indexes
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_is_featured ON tags(is_featured);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE posts SET view_count = view_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment like count
CREATE OR REPLACE FUNCTION increment_like_count(target_id UUID, target_type like_target_type)
RETURNS VOID AS $$
BEGIN
    IF target_type = 'post' THEN
        UPDATE posts SET like_count = like_count + 1 WHERE id = target_id;
    ELSIF target_type = 'comment' THEN
        UPDATE comments SET like_count = like_count + 1 WHERE id = target_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement like count
CREATE OR REPLACE FUNCTION decrement_like_count(target_id UUID, target_type like_target_type)
RETURNS VOID AS $$
BEGIN
    IF target_type = 'post' THEN
        UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = target_id;
    ELSIF target_type = 'comment' THEN
        UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = target_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment count
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update tag and category post counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle category counts
    IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
        IF NEW.category IS NOT NULL THEN
            UPDATE categories SET post_count = post_count + 1 WHERE slug = NEW.category;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'published' THEN
        IF OLD.category IS NOT NULL THEN
            UPDATE categories SET post_count = GREATEST(post_count - 1, 0) WHERE slug = OLD.category;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status = 'published' AND NEW.status != 'published' THEN
            IF OLD.category IS NOT NULL THEN
                UPDATE categories SET post_count = GREATEST(post_count - 1, 0) WHERE slug = OLD.category;
            END IF;
        ELSIF OLD.status != 'published' AND NEW.status = 'published' THEN
            IF NEW.category IS NOT NULL THEN
                UPDATE categories SET post_count = post_count + 1 WHERE slug = NEW.category;
            END IF;
        END IF;
        
        -- Handle category changes for published posts
        IF NEW.status = 'published' AND OLD.category != NEW.category THEN
            IF OLD.category IS NOT NULL THEN
                UPDATE categories SET post_count = GREATEST(post_count - 1, 0) WHERE slug = OLD.category;
            END IF;
            IF NEW.category IS NOT NULL THEN
                UPDATE categories SET post_count = post_count + 1 WHERE slug = NEW.category;
            END IF;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to get user connections efficiently
CREATE OR REPLACE FUNCTION get_user_connections(input_user_id UUID)
RETURNS TABLE(connected_user_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN uc.user_a_id = input_user_id THEN uc.user_b_id
            ELSE uc.user_a_id
        END as connected_user_id
    FROM user_connections uc
    WHERE uc.user_a_id = input_user_id OR uc.user_b_id = input_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get mutual connections between two users
CREATE OR REPLACE FUNCTION get_mutual_connections(user_a UUID, user_b UUID)
RETURNS TABLE(mutual_user_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT connections_a.connected_user_id
    FROM get_user_connections(user_a) connections_a
    INNER JOIN get_user_connections(user_b) connections_b 
        ON connections_a.connected_user_id = connections_b.connected_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate interest similarity score
CREATE OR REPLACE FUNCTION calculate_interest_score(user_a_interests TEXT[], user_b_interests TEXT[])
RETURNS INTEGER AS $$
BEGIN
    -- Return the number of common interests
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM unnest(user_a_interests) AS interest_a
        WHERE interest_a = ANY(user_b_interests)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate location similarity score
CREATE OR REPLACE FUNCTION calculate_location_score(user_a_location TEXT, user_b_location TEXT)
RETURNS INTEGER AS $$
BEGIN
    -- Return 1 if locations match (case-insensitive), 0 otherwise
    IF user_a_location IS NULL OR user_b_location IS NULL THEN
        RETURN 0;
    END IF;
    
    IF LOWER(TRIM(user_a_location)) = LOWER(TRIM(user_b_location)) THEN
        RETURN 1;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate language similarity score
CREATE OR REPLACE FUNCTION calculate_language_score(user_a_language TEXT, user_b_language TEXT)
RETURNS INTEGER AS $$
BEGIN
    -- Return 1 if languages match (case-insensitive), 0 otherwise
    IF user_a_language IS NULL OR user_b_language IS NULL THEN
        RETURN 0;
    END IF;
    
    IF LOWER(TRIM(user_a_language)) = LOWER(TRIM(user_b_language)) THEN
        RETURN 1;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired recommendations
CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM friend_recommendations 
    WHERE expires_at < NOW() 
      AND is_accepted = FALSE 
      AND is_dismissed = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get cached recommendations for a user
CREATE OR REPLACE FUNCTION get_cached_recommendations(
    input_user_id UUID,
    recommendation_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    recommended_user_id UUID,
    depth INTEGER,
    mutual_friend_score INTEGER,
    interest_score INTEGER,
    language_score INTEGER,
    location_score INTEGER,
    total_score DECIMAL(10,2),
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fr.recommended_user_id,
        fr.depth,
        fr.mutual_friend_score,
        fr.interest_score,
        fr.language_score,
        fr.location_score,
        fr.total_score,
        fr.created_at
    FROM friend_recommendations fr
    WHERE fr.user_id = input_user_id
      AND fr.expires_at > NOW()
      AND fr.is_dismissed = FALSE
      AND fr.is_accepted = FALSE
    ORDER BY fr.total_score DESC, fr.created_at DESC
    LIMIT recommendation_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friend_recommendations_updated_at BEFORE UPDATE ON friend_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment count triggers
CREATE TRIGGER trigger_update_comment_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Post count triggers
CREATE TRIGGER trigger_update_post_counts
    AFTER INSERT OR UPDATE OR DELETE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts policies
CREATE POLICY "Anyone can view published posts" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY "Users can view own posts" ON posts FOR SELECT USING (author_id = auth.uid());
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (author_id = auth.uid());

-- Comments policies
CREATE POLICY "Anyone can view approved comments" ON comments FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view own comments" ON comments FOR SELECT USING (author_id = auth.uid());
CREATE POLICY "Users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (author_id = auth.uid());

-- Likes policies
CREATE POLICY "Users can view all likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE USING (user_id = auth.uid());

-- Follows policies
CREATE POLICY "Users can view all follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can insert own follows" ON follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Users can delete own follows" ON follows FOR DELETE USING (follower_id = auth.uid());

-- Categories policies (read-only for regular users)
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true);

-- Tags policies (read-only for regular users)
CREATE POLICY "Anyone can view tags" ON tags FOR SELECT USING (true);

-- =============================================
-- SAMPLE DATA (Optional)
-- =============================================

-- Insert sample categories
INSERT INTO categories (name, slug, description, color, is_active, sort_order) VALUES
('Technology', 'technology', 'Posts about technology and programming', '#3B82F6', true, 1),
('Lifestyle', 'lifestyle', 'Posts about lifestyle and personal development', '#10B981', true, 2),
('Travel', 'travel', 'Travel guides and experiences', '#F59E0B', true, 3),
('Food', 'food', 'Recipes and food reviews', '#EF4444', true, 4),
('Health', 'health', 'Health and wellness tips', '#8B5CF6', true, 5);

-- Insert sample tags
INSERT INTO tags (name, slug, description, is_featured) VALUES
('JavaScript', 'javascript', 'JavaScript programming language', true),
('React', 'react', 'React framework', true),
('Node.js', 'nodejs', 'Node.js runtime', true),
('TypeScript', 'typescript', 'TypeScript language', false),
('Web Development', 'web-development', 'Web development topics', true),
('Tutorial', 'tutorial', 'Educational tutorials', false),
('Tips', 'tips', 'Helpful tips and tricks', false);

-- Note: Sample users and posts should be created through the application
-- to ensure proper authentication and profile creation.