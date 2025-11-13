-- Stars Corporate Database Schema
-- Complete PostgreSQL schema with all required tables

-- ==========================================
-- CORE TABLES
-- ==========================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL CHECK (length(username) >= 3),
    email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    password TEXT NOT NULL CHECK (length(password) >= 6),
    bio TEXT CHECK (length(bio) <= 500),
    profile_pic TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FOLLOWS TABLE (MISSING FROM ORIGINAL SCHEMA)
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id) -- prevent self-following
);

-- LIVE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 100),
    caption TEXT CHECK (length(caption) <= 500),
    poster_url TEXT,
    preview_video_url TEXT,
    genre TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    viewer_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LIKES TABLE
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, session_id) -- prevent duplicate likes
);

-- COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK (length(message) >= 1 AND length(message) <= 500),
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'reminded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, session_id) -- prevent duplicate bookings
);

-- GIFTS TABLE
CREATE TABLE IF NOT EXISTS gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
    gift_type TEXT NOT NULL CHECK (gift_type IN ('star', 'rose', 'crown', 'heart', 'diamond', 'gold', 'silver')),
    gift_value INTEGER DEFAULT 1 CHECK (gift_value > 0),
    message TEXT CHECK (length(message) <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GENRES TABLE
CREATE TABLE IF NOT EXISTS genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL CHECK (length(name) >= 2),
    description TEXT,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER SESSIONS (for tracking joined sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    watch_duration INTEGER DEFAULT 0, -- in seconds
    UNIQUE(user_id, session_id)
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES live_sessions(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('session_start', 'booking_reminder', 'like', 'comment', 'gift', 'follow', 'system')),
    title TEXT NOT NULL CHECK (length(title) <= 100),
    message TEXT NOT NULL CHECK (length(message) <= 500),
    data JSONB, -- for additional notification data
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER STATS TABLE
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_sessions INTEGER DEFAULT 0,
    total_viewers INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_gifts INTEGER DEFAULT 0,
    total_watch_time INTEGER DEFAULT 0, -- in seconds
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- SESSION STATS TABLE
CREATE TABLE IF NOT EXISTS session_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
    peak_viewers INTEGER DEFAULT 0,
    total_viewers INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_gifts INTEGER DEFAULT 0,
    total_watch_time INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id)
);

-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Follows indexes (CRITICAL FOR SESSIONS API)
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

-- Live sessions indexes
CREATE INDEX IF NOT EXISTS idx_live_sessions_user_id ON live_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_sessions_start_time ON live_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_live_sessions_genre ON live_sessions(genre);
CREATE INDEX IF NOT EXISTS idx_live_sessions_created_at ON live_sessions(created_at);

-- Likes indexes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_session_id ON likes(session_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_session_id ON comments(session_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_session_id ON bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Gifts indexes
CREATE INDEX IF NOT EXISTS idx_gifts_user_id ON gifts(user_id);
CREATE INDEX IF NOT EXISTS idx_gifts_session_id ON gifts(session_id);
CREATE INDEX IF NOT EXISTS idx_gifts_created_at ON gifts(created_at);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_joined_at ON user_sessions(joined_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- User stats indexes
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- Session stats indexes
CREATE INDEX IF NOT EXISTS idx_session_stats_session_id ON session_stats(session_id);

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_sessions_updated_at ON live_sessions;
CREATE TRIGGER update_live_sessions_updated_at
    BEFORE UPDATE ON live_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at
    BEFORE UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_session_stats_updated_at ON session_stats;
CREATE TRIGGER update_session_stats_updated_at
    BEFORE UPDATE ON session_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update session stats when likes change
CREATE OR REPLACE FUNCTION update_session_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE live_sessions SET like_count = like_count + 1 WHERE id = NEW.session_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE live_sessions SET like_count = like_count - 1 WHERE id = OLD.session_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to update session stats when comments change
CREATE OR REPLACE FUNCTION update_session_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE live_sessions SET comment_count = comment_count + 1 WHERE id = NEW.session_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE live_sessions SET comment_count = comment_count - 1 WHERE id = OLD.session_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to update user stats and follower counts
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user_stats record
    INSERT INTO user_stats (user_id, total_sessions, total_viewers, total_likes, total_comments, total_gifts, total_watch_time, followers_count, following_count)
    SELECT 
        u.id,
        COUNT(DISTINCT ls.id),
        COALESCE(SUM(ls.viewer_count), 0),
        COALESCE(SUM(ls.like_count), 0),
        COALESCE(SUM(ls.comment_count), 0),
        COALESCE(SUM(g.gift_value), 0),
        COALESCE(SUM(us.watch_duration), 0),
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id),
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id)
    FROM users u
    LEFT JOIN live_sessions ls ON u.id = ls.user_id
    LEFT JOIN gifts g ON ls.id = g.session_id
    LEFT JOIN user_sessions us ON u.id = us.user_id
    WHERE u.id = NEW.user_id
    GROUP BY u.id
    ON CONFLICT (user_id) DO UPDATE SET
        total_sessions = EXCLUDED.total_sessions,
        total_viewers = EXCLUDED.total_viewers,
        total_likes = EXCLUDED.total_likes,
        total_comments = EXCLUDED.total_comments,
        total_gifts = EXCLUDED.total_gifts,
        total_watch_time = EXCLUDED.total_watch_time,
        followers_count = EXCLUDED.followers_count,
        following_count = EXCLUDED.following_count,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update follower counts when follows change
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update follower count for the followed user
        UPDATE user_stats SET followers_count = followers_count + 1 
        WHERE user_id = NEW.following_id;
        -- Update following count for the follower
        UPDATE user_stats SET following_count = following_count + 1 
        WHERE user_id = NEW.follower_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update follower count for the unfollowed user
        UPDATE user_stats SET followers_count = followers_count - 1 
        WHERE user_id = OLD.following_id;
        -- Update following count for the unfollower
        UPDATE user_stats SET following_count = following_count - 1 
        WHERE user_id = OLD.follower_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- ==========================================
-- TRIGGER SETUP
-- ==========================================

-- Triggers for like count updates
DROP TRIGGER IF EXISTS trigger_update_like_count ON likes;
CREATE TRIGGER trigger_update_like_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_session_like_count();

-- Triggers for comment count updates
DROP TRIGGER IF EXISTS trigger_update_comment_count ON comments;
CREATE TRIGGER trigger_update_comment_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_session_comment_count();

-- Triggers for user stats updates
DROP TRIGGER IF EXISTS trigger_update_user_stats ON live_sessions;
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT OR UPDATE ON live_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Triggers for follower count updates
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON follows;
CREATE TRIGGER trigger_update_follower_counts
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW
    EXECUTE FUNCTION update_follower_counts();

-- ==========================================
-- DEFAULT DATA
-- ==========================================

-- Insert default genres
INSERT INTO genres (name, description) VALUES 
    ('Comedy', 'Funny and entertaining content'),
    ('Music', 'Live music performances and covers'),
    ('Talk Show', 'Conversations and discussions'),
    ('Gaming', 'Video game streams and gameplay'),
    ('Education', 'Educational content and tutorials'),
    ('Fitness', 'Workout sessions and health tips'),
    ('Cooking', 'Culinary demonstrations and recipes'),
    ('Art', 'Creative content and artwork'),
    ('Technology', 'Tech reviews and tutorials'),
    ('Fashion', 'Style and beauty content'),
    ('Travel', 'Travel vlogs and destinations'),
    ('Sports', 'Sports commentary and analysis'),
    ('News', 'Current events and updates'),
    ('Entertainment', 'General entertainment content'),
    ('Business', 'Business and entrepreneurship')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================

-- Show completion message
DO $$ 
BEGIN
    RAISE NOTICE '🎉 Stars Corporate Database Schema Setup Complete!';
    RAISE NOTICE '📊 Database includes:';
    RAISE NOTICE '   - 12 tables with proper constraints';
    RAISE NOTICE '   - 25+ performance indexes';
    RAISE NOTICE '   - Automatic timestamp updates';
    RAISE NOTICE '   - Real-time stats tracking';
    RAISE NOTICE '   - Follower/following system';
    RAISE NOTICE '   - Data validation and integrity';
    RAISE NOTICE '✅ Ready for Stars Corporate application!';
END $$;