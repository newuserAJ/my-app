-- =============================================
-- Sample Data for My App Database
-- =============================================
-- This file contains sample user profiles based on the provided data
-- Run this after ensuring the database schema is properly set up

-- Note: This script assumes you're using Supabase and that you need to create
-- auth users first. In a real scenario, users would register through your app.

-- For this script to work, you'll need to:
-- 1. Either create auth users first through Supabase Dashboard or API
-- 2. Or use the Node.js seeder script which handles auth user creation

-- =============================================
-- SAMPLE PROFILES
-- =============================================

-- Insert sample profiles (you'll need to replace the UUIDs with actual auth user IDs)
-- This is a template - the actual UUIDs need to come from auth.users table

INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    location,
    language,
    occupation,
    school,
    company,
    interests,
    age_group,
    bio,
    is_active,
    role
) VALUES
-- User 1: Aishvarya
(
    '00000000-0000-0000-0000-000000000001'::uuid, -- Replace with actual UUID
    'aishvarya@example.com',
    'Aishvarya',
    NULL,
    'Coimbatore',
    'Tamil',
    'Software Engineer',
    'PSG',
    'Microsoft',
    ARRAY['Orator', 'Movies'],
    '18-24',
    'Software Engineer at Microsoft, passionate about public speaking and cinema.',
    true,
    'user'
),
-- User 2: Bianca
(
    '00000000-0000-0000-0000-000000000002'::uuid, -- Replace with actual UUID
    'bianca@example.com',
    'Bianca',
    NULL,
    'Chennai',
    'Tamil',
    'Software Engineer',
    'PSG',
    'Wipro',
    ARRAY['Music', 'Books'],
    '18-24',
    'Software Engineer at Wipro, passionate about music and reading.',
    true,
    'user'
),
-- User 3: Deepthi
(
    '00000000-0000-0000-0000-000000000003'::uuid, -- Replace with actual UUID
    'deepthi@example.com',
    'Deepthi',
    NULL,
    'Madurai',
    'Tamil',
    'Software Engineer',
    'PSG',
    'Deloitte',
    ARRAY['Movies', 'Music'],
    '18-24',
    'Software Engineer at Deloitte, passionate about movies and music.',
    true,
    'user'
),
-- User 4: Dhilip
(
    '00000000-0000-0000-0000-000000000004'::uuid, -- Replace with actual UUID
    'dhilip@example.com',
    'Dhilip',
    NULL,
    'Coimbatore',
    'Telugu',
    'Software Engineer',
    'PSG',
    'JPMC',
    ARRAY['Tech', 'Quotes'],
    '18-24',
    'Software Engineer at JPMC, passionate about technology and inspirational quotes.',
    true,
    'user'
),
-- User 5: Harshini
(
    '00000000-0000-0000-0000-000000000005'::uuid, -- Replace with actual UUID
    'harshini@example.com',
    'Harshini',
    NULL,
    'Ramanathapuram',
    'Tamil',
    'Software Engineer',
    'PSG',
    'Oracle',
    ARRAY['Movies', 'Cooking'],
    '18-24',
    'Software Engineer at Oracle, passionate about movies and cooking.',
    true,
    'user'
),
-- User 6: Indrajit
(
    '00000000-0000-0000-0000-000000000006'::uuid, -- Replace with actual UUID
    'indrajit@example.com',
    'Indrajit',
    NULL,
    'Coimbatore',
    'Tamil',
    'Software Engineer',
    'PSG',
    'Microsoft',
    ARRAY['Music', 'Movies'],
    '18-24',
    'Software Engineer at Microsoft, passionate about music and movies.',
    true,
    'user'
),
-- User 7: Iswaryaa
(
    '00000000-0000-0000-0000-000000000007'::uuid, -- Replace with actual UUID
    'iswaryaa@example.com',
    'Iswaryaa',
    NULL,
    'Erode',
    'Tamil',
    'Software Engineer',
    'PSG',
    'Deloitte',
    ARRAY['Movies', 'Orator'],
    '18-24',
    'Software Engineer at Deloitte, passionate about movies and public speaking.',
    true,
    'user'
),
-- User 8: Jenitha
(
    '00000000-0000-0000-0000-000000000008'::uuid, -- Replace with actual UUID
    'jenitha@example.com',
    'Jenitha',
    NULL,
    'Chittoor',
    'Telugu',
    'Software Engineer',
    'PSG',
    'Morgan Stanley',
    ARRAY['Movies', 'Books'],
    '18-24',
    'Software Engineer at Morgan Stanley, passionate about movies and reading.',
    true,
    'user'
),
-- User 9: Keerthi
(
    '00000000-0000-0000-0000-000000000009'::uuid, -- Replace with actual UUID
    'keerthi@example.com',
    'Keerthi',
    NULL,
    'Coimbatore',
    'Tamil',
    'Software Engineer',
    'PSG',
    'Walmart',
    ARRAY['Cricket', 'Music'],
    '18-24',
    'Software Engineer at Walmart, passionate about cricket and music.',
    true,
    'user'
),
-- User 10: Mokshith
(
    '00000000-0000-0000-0000-000000000010'::uuid, -- Replace with actual UUID
    'mokshith@example.com',
    'Mokshith',
    NULL,
    'Hosur',
    'Telugu',
    'Software Engineer',
    'PSG',
    'Cisco',
    ARRAY['Books', 'Orator'],
    '18-24',
    'Software Engineer at Cisco, passionate about reading and public speaking.',
    true,
    'user'
),
-- User 11: Preetham
(
    '00000000-0000-0000-0000-000000000011'::uuid, -- Replace with actual UUID
    'preetham@example.com',
    'Preetham',
    NULL,
    'Salem',
    'Tamil',
    'Software Engineer',
    'PSG',
    'Astra Zeneca',
    ARRAY['Football', 'Cricket', 'Gaming'],
    '18-24',
    'Software Engineer at Astra Zeneca, passionate about sports and gaming.',
    true,
    'user'
),
-- User 12: Rishitha
(
    '00000000-0000-0000-0000-000000000012'::uuid, -- Replace with actual UUID
    'rishitha@example.com',
    'Rishitha',
    NULL,
    'Kolkata',
    'Hindi',
    'Software Engineer',
    'PSG',
    'Societe Generale',
    ARRAY['Books', 'Art'],
    '18-24',
    'Software Engineer at Societe Generale, passionate about books and art.',
    true,
    'user'
),
-- User 13: Roshini
(
    '00000000-0000-0000-0000-000000000013'::uuid, -- Replace with actual UUID
    'roshini@example.com',
    'Roshini',
    NULL,
    'Salem',
    'Tamil',
    'Software Engineer',
    'PSG',
    'Cisco',
    ARRAY['Movies', 'Books'],
    '18-24',
    'Software Engineer at Cisco, passionate about movies and reading.',
    true,
    'user'
),
-- User 14: Sneha
(
    '00000000-0000-0000-0000-000000000014'::uuid, -- Replace with actual UUID
    'sneha@example.com',
    'Sneha',
    NULL,
    'Coimbatore',
    'Tamil',
    'Software Engineer',
    'PSG',
    'Medibuddy',
    ARRAY['Art', 'Craft'],
    '18-24',
    'Software Engineer at Medibuddy, passionate about art and crafts.',
    true,
    'user'
),
-- User 15: Swetha
(
    '00000000-0000-0000-0000-000000000015'::uuid, -- Replace with actual UUID
    'swetha@example.com',
    'Swetha',
    NULL,
    'Coimbatore',
    'Tamil',
    'Software Engineer',
    'PSG',
    'Microsoft',
    ARRAY['Books', 'Cricket'],
    '18-24',
    'Software Engineer at Microsoft, passionate about reading and cricket.',
    true,
    'user'
);

-- =============================================
-- SAMPLE POSTS (Optional)
-- =============================================
-- You can uncomment this section if you want some sample posts as well

/*
INSERT INTO posts (
    author_id,
    title,
    content,
    excerpt,
    slug,
    status,
    category,
    tags,
    published_at
) VALUES
(
    '00000000-0000-0000-0000-000000000001'::uuid, -- Aishvarya
    'The Art of Public Speaking in Tech',
    'Public speaking is a crucial skill for software engineers. Here are my top tips for presenting technical concepts effectively...',
    'Tips for effective technical presentations and public speaking.',
    'art-of-public-speaking-tech',
    'published',
    'technology',
    ARRAY['tips', 'public-speaking', 'career'],
    NOW()
),
(
    '00000000-0000-0000-0000-000000000002'::uuid, -- Bianca
    'My Favorite Tech Books of 2026',
    'Reading is fundamental to staying current in technology. Here are the books that shaped my thinking this year...',
    'A curated list of must-read tech books for software engineers.',
    'favorite-tech-books-2026',
    'published',
    'technology',
    ARRAY['books', 'learning', 'technology'],
    NOW()
),
(
    '00000000-0000-0000-0000-000000000003'::uuid, -- Deepthi
    'Work-Life Balance as a Software Engineer',
    'Balancing a demanding tech career with personal interests like movies and music requires intentional planning...',
    'Tips for maintaining work-life balance in the tech industry.',
    'work-life-balance-software-engineer',
    'published',
    'lifestyle',
    ARRAY['work-life-balance', 'career', 'lifestyle'],
    NOW()
);
*/

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these queries to verify the data was inserted correctly

-- Check profile count by company
-- SELECT company, COUNT(*) as employee_count FROM profiles GROUP BY company ORDER BY employee_count DESC;

-- Check profiles by location
-- SELECT location, COUNT(*) as user_count FROM profiles GROUP BY location ORDER BY user_count DESC;

-- Check interests distribution
-- SELECT unnest(interests) as interest, COUNT(*) as frequency FROM profiles GROUP BY interest ORDER BY frequency DESC;

-- View all created profiles
-- SELECT first_name, location, language, occupation, company, interests FROM profiles ORDER BY first_name;