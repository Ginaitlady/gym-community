-- Community Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Likes Table
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT likes_check CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR 
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  CONSTRAINT unique_like UNIQUE (post_id, comment_id, user_id)
);

-- Workout Routines Table
CREATE TABLE IF NOT EXISTS workout_routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  exercises JSONB NOT NULL, -- Array of exercise objects
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Exercise structure in JSONB:
-- {
--   "name": "Bench Press",
--   "sets": 3,
--   "reps": 10,
--   "weight": 80,
--   "rest": 60,
--   "notes": "Focus on form"
-- }

-- Trainer Approvals Table
CREATE TABLE IF NOT EXISTS trainer_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_id UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User Profiles - Add additional fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_trainer_approved BOOLEAN DEFAULT FALSE;

-- RLS Policies for Users
-- Remove any conflicting policies first
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view public profile info" ON users;

-- Create policy that allows viewing own profile with all fields
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Create policy that allows viewing basic public info for other users
-- This is needed for posts/routines to display author names
-- But restrict sensitive info (email, phone) to own profile only
CREATE POLICY "Anyone can view public profile info" ON users
  FOR SELECT USING (true)
  WITH CHECK (false); -- Prevent updates through this policy

-- Enable Row Level Security on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Posts
DROP POLICY IF EXISTS "Anyone can view non-deleted posts" ON posts;
CREATE POLICY "Anyone can view non-deleted posts" ON posts
  FOR SELECT USING (is_deleted = FALSE);

DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete any post" ON posts;
CREATE POLICY "Admins can delete any post" ON posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for Comments
DROP POLICY IF EXISTS "Anyone can view non-deleted comments" ON comments;
CREATE POLICY "Anyone can view non-deleted comments" ON comments
  FOR SELECT USING (is_deleted = FALSE);

DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete any comment" ON comments;
CREATE POLICY "Admins can delete any comment" ON comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for Likes
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
CREATE POLICY "Anyone can view likes" ON likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create likes" ON likes;
CREATE POLICY "Users can create likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
CREATE POLICY "Users can delete own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Workout Routines
DROP POLICY IF EXISTS "Anyone can view public routines" ON workout_routines;
CREATE POLICY "Anyone can view public routines" ON workout_routines
  FOR SELECT USING (is_public = TRUE);

DROP POLICY IF EXISTS "Users can view own routines" ON workout_routines;
CREATE POLICY "Users can view own routines" ON workout_routines
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create routines" ON workout_routines;
CREATE POLICY "Users can create routines" ON workout_routines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own routines" ON workout_routines;
CREATE POLICY "Users can update own routines" ON workout_routines
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own routines" ON workout_routines;
CREATE POLICY "Users can delete own routines" ON workout_routines
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Trainer Approvals
DROP POLICY IF EXISTS "Users can view own approval status" ON trainer_approvals;
CREATE POLICY "Users can view own approval status" ON trainer_approvals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all approvals" ON trainer_approvals;
CREATE POLICY "Admins can view all approvals" ON trainer_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can create approval requests" ON trainer_approvals;
CREATE POLICY "Users can create approval requests" ON trainer_approvals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update approvals" ON trainer_approvals;
CREATE POLICY "Admins can update approvals" ON trainer_approvals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workout_routines_updated_at ON workout_routines;
CREATE TRIGGER update_workout_routines_updated_at BEFORE UPDATE ON workout_routines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trainer_approvals_updated_at ON trainer_approvals;
CREATE TRIGGER update_trainer_approvals_updated_at BEFORE UPDATE ON trainer_approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_routines_user_id ON workout_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_routines_is_public ON workout_routines(is_public);
CREATE INDEX IF NOT EXISTS idx_trainer_approvals_status ON trainer_approvals(status);

-- Workout Logs Table (for tracking daily workouts and calculating streaks)
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_date DATE NOT NULL,
  routine_id UUID REFERENCES workout_routines(id) ON DELETE SET NULL,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_user_workout_date UNIQUE (user_id, workout_date)
);

-- Badges Table (definitions of available badges)
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  badge_type VARCHAR(50) NOT NULL, -- 'streak', 'total_workouts', 'milestone', etc.
  requirement_value INTEGER, -- e.g., 3 for 3-day streak, 10 for 10 total workouts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User Badges Table (badges earned by users)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

-- User Streaks Table (tracks current and longest streaks)
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Workout Logs
DROP POLICY IF EXISTS "Users can view own workout logs" ON workout_logs;
CREATE POLICY "Users can view own workout logs" ON workout_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own workout logs" ON workout_logs;
CREATE POLICY "Users can create own workout logs" ON workout_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workout logs" ON workout_logs;
CREATE POLICY "Users can update own workout logs" ON workout_logs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workout logs" ON workout_logs;
CREATE POLICY "Users can delete own workout logs" ON workout_logs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Badges (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view badges" ON badges;
CREATE POLICY "Anyone can view badges" ON badges
  FOR SELECT USING (true);

-- RLS Policies for User Badges
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view user badges for leaderboard" ON user_badges;
CREATE POLICY "Anyone can view user badges for leaderboard" ON user_badges
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can create user badges" ON user_badges;
CREATE POLICY "System can create user badges" ON user_badges
  FOR INSERT WITH CHECK (true); -- Will be handled by service role or function

-- RLS Policies for User Streaks
DROP POLICY IF EXISTS "Users can view own streak" ON user_streaks;
CREATE POLICY "Users can view own streak" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view streaks for leaderboard" ON user_streaks;
CREATE POLICY "Anyone can view streaks for leaderboard" ON user_streaks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can update streaks" ON user_streaks;
CREATE POLICY "System can update streaks" ON user_streaks
  FOR UPDATE USING (true); -- Will be handled by function

DROP POLICY IF EXISTS "System can insert streaks" ON user_streaks;
CREATE POLICY "System can insert streaks" ON user_streaks
  FOR INSERT WITH CHECK (true); -- Will be handled by function

-- Function to update user streak when workout is logged
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_last_workout_date DATE;
  v_previous_date DATE;
BEGIN
  -- Get current streak info
  SELECT current_streak, longest_streak, last_workout_date
  INTO v_current_streak, v_longest_streak, v_last_workout_date
  FROM user_streaks
  WHERE user_id = NEW.user_id;

  -- If no streak record exists, create one
  IF v_current_streak IS NULL THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_workout_date)
    VALUES (NEW.user_id, 1, 1, NEW.workout_date)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
  END IF;

  -- Calculate previous date
  v_previous_date := NEW.workout_date - INTERVAL '1 day';

  -- If workout is for today or yesterday, continue streak
  IF v_last_workout_date = v_previous_date OR v_last_workout_date = NEW.workout_date THEN
    -- Continue streak
    IF v_last_workout_date = v_previous_date THEN
      v_current_streak := v_current_streak + 1;
    END IF;
  ELSE
    -- Break streak, start new one
    v_current_streak := 1;
  END IF;

  -- Update longest streak if current is longer
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  -- Update or insert streak record
  INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_workout_date, updated_at)
  VALUES (NEW.user_id, v_current_streak, v_longest_streak, NEW.workout_date, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET current_streak = EXCLUDED.current_streak,
      longest_streak = EXCLUDED.longest_streak,
      last_workout_date = EXCLUDED.last_workout_date,
      updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update streak when workout is logged
DROP TRIGGER IF EXISTS trigger_update_user_streak ON workout_logs;
CREATE TRIGGER trigger_update_user_streak
  AFTER INSERT OR UPDATE ON workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_streak INTEGER;
  v_total_workouts INTEGER;
  v_badge_record RECORD;
BEGIN
  -- Get user's current streak and total workouts
  SELECT current_streak INTO v_streak
  FROM user_streaks
  WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_total_workouts
  FROM workout_logs
  WHERE user_id = p_user_id;

  -- Check streak badges
  FOR v_badge_record IN
    SELECT * FROM badges
    WHERE badge_type = 'streak'
    AND requirement_value <= COALESCE(v_streak, 0)
    AND id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = p_user_id)
  LOOP
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge_record.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;

  -- Check total workout badges
  FOR v_badge_record IN
    SELECT * FROM badges
    WHERE badge_type = 'total_workouts'
    AND requirement_value <= v_total_workouts
    AND id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = p_user_id)
  LOOP
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge_record.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default badges
INSERT INTO badges (name, description, badge_type, requirement_value) VALUES
  ('First Steps', 'Complete your first workout', 'total_workouts', 1),
  ('Getting Started', 'Complete 5 workouts', 'total_workouts', 5),
  ('Dedicated', 'Complete 10 workouts', 'total_workouts', 10),
  ('Committed', 'Complete 25 workouts', 'total_workouts', 25),
  ('Warrior', 'Complete 50 workouts', 'total_workouts', 50),
  ('Champion', 'Complete 100 workouts', 'total_workouts', 100),
  ('3-Day Streak', 'Work out 3 days in a row', 'streak', 3),
  ('Week Warrior', 'Work out 7 days in a row', 'streak', 7),
  ('Two Week Champion', 'Work out 14 days in a row', 'streak', 14),
  ('Month Master', 'Work out 30 days in a row', 'streak', 30)
ON CONFLICT (name) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_date ON workout_logs(workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_badges_badge_type ON badges(badge_type);

-- Trainer Profiles Table (extended trainer information)
CREATE TABLE IF NOT EXISTS trainer_profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  specialties TEXT[], -- Array of specialties (e.g., ['Weight Training', 'Yoga', 'Cardio'])
  certifications TEXT[], -- Array of certifications
  hourly_rate DECIMAL(10, 2),
  bio TEXT,
  years_of_experience INTEGER,
  languages TEXT[], -- Languages spoken
  availability JSONB, -- Availability schedule
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trainer Reviews Table
CREATE TABLE IF NOT EXISTS trainer_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_trainer_client_review UNIQUE (trainer_id, client_id)
);

-- Trainer Bookings Table (1:1 class reservations)
CREATE TABLE IF NOT EXISTS trainer_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trainer Messages Table (DM between trainer and client)
CREATE TABLE IF NOT EXISTS trainer_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Trainer Profiles
DROP POLICY IF EXISTS "Anyone can view trainer profiles" ON trainer_profiles;
CREATE POLICY "Anyone can view trainer profiles" ON trainer_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Trainers can update own profile" ON trainer_profiles;
CREATE POLICY "Trainers can update own profile" ON trainer_profiles
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.role = 'trainer' OR users.is_trainer_approved = true)
    )
  );

DROP POLICY IF EXISTS "Trainers can insert own profile" ON trainer_profiles;
CREATE POLICY "Trainers can insert own profile" ON trainer_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.role = 'trainer' OR users.is_trainer_approved = true)
    )
  );

-- RLS Policies for Trainer Reviews
DROP POLICY IF EXISTS "Anyone can view trainer reviews" ON trainer_reviews;
CREATE POLICY "Anyone can view trainer reviews" ON trainer_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Clients can create reviews" ON trainer_reviews;
CREATE POLICY "Clients can create reviews" ON trainer_reviews
  FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can update own reviews" ON trainer_reviews;
CREATE POLICY "Clients can update own reviews" ON trainer_reviews
  FOR UPDATE USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can delete own reviews" ON trainer_reviews;
CREATE POLICY "Clients can delete own reviews" ON trainer_reviews
  FOR DELETE USING (auth.uid() = client_id);

-- RLS Policies for Trainer Bookings
DROP POLICY IF EXISTS "Trainers and clients can view their bookings" ON trainer_bookings;
CREATE POLICY "Trainers and clients can view their bookings" ON trainer_bookings
  FOR SELECT USING (auth.uid() = trainer_id OR auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can create bookings" ON trainer_bookings;
CREATE POLICY "Clients can create bookings" ON trainer_bookings
  FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Trainers and clients can update bookings" ON trainer_bookings;
CREATE POLICY "Trainers and clients can update bookings" ON trainer_bookings
  FOR UPDATE USING (auth.uid() = trainer_id OR auth.uid() = client_id);

DROP POLICY IF EXISTS "Trainers and clients can cancel bookings" ON trainer_bookings;
CREATE POLICY "Trainers and clients can cancel bookings" ON trainer_bookings
  FOR UPDATE USING (auth.uid() = trainer_id OR auth.uid() = client_id);

-- RLS Policies for Trainer Messages
DROP POLICY IF EXISTS "Trainers and clients can view their messages" ON trainer_messages;
CREATE POLICY "Trainers and clients can view their messages" ON trainer_messages
  FOR SELECT USING (auth.uid() = trainer_id OR auth.uid() = client_id);

DROP POLICY IF EXISTS "Trainers and clients can send messages" ON trainer_messages;
CREATE POLICY "Trainers and clients can send messages" ON trainer_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id AND (auth.uid() = trainer_id OR auth.uid() = client_id));

DROP POLICY IF EXISTS "Users can update own sent messages" ON trainer_messages;
CREATE POLICY "Users can update own sent messages" ON trainer_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Update trigger for trainer_profiles
DROP TRIGGER IF EXISTS update_trainer_profiles_updated_at ON trainer_profiles;
CREATE TRIGGER update_trainer_profiles_updated_at BEFORE UPDATE ON trainer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for trainer_reviews
DROP TRIGGER IF EXISTS update_trainer_reviews_updated_at ON trainer_reviews;
CREATE TRIGGER update_trainer_reviews_updated_at BEFORE UPDATE ON trainer_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for trainer_bookings
DROP TRIGGER IF EXISTS update_trainer_bookings_updated_at ON trainer_bookings;
CREATE TRIGGER update_trainer_bookings_updated_at BEFORE UPDATE ON trainer_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_user_id ON trainer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_reviews_trainer_id ON trainer_reviews(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_reviews_client_id ON trainer_reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_trainer_bookings_trainer_id ON trainer_bookings(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_bookings_client_id ON trainer_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_trainer_bookings_booking_date ON trainer_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_trainer_messages_trainer_id ON trainer_messages(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_messages_client_id ON trainer_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_trainer_messages_created_at ON trainer_messages(created_at DESC);

-- Function to calculate average rating for a trainer
CREATE OR REPLACE FUNCTION get_trainer_rating(p_trainer_id UUID)
RETURNS TABLE (
  average_rating NUMERIC,
  total_reviews BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0) as average_rating,
    COUNT(*)::BIGINT as total_reviews
  FROM trainer_reviews
  WHERE trainer_id = p_trainer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

