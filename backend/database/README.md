# Database Setup Guide

## Prerequisites

1. **Supabase Project**: Create a new project at [supabase.com](https://supabase.com)
2. **Database Access**: Get your project URL and keys from Supabase dashboard

## Setup Instructions

### 1. Run the Schema

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire content of `schema.sql`
4. Click **Run** to execute the schema

### 2. Verify Installation

After running the schema, you should see these tables in your database:

- `profiles` - User profiles (extends auth.users)
- `posts` - Blog posts and content
- `comments` - Comment system with threading
- `likes` - Polymorphic likes for posts/comments
- `follows` - User following relationships
- `categories` - Content categories
- `tags` - Content tags

### 3. Row Level Security (RLS)

The schema automatically sets up RLS policies for:

- **User profiles**: Users can view all, but only edit their own
- **Posts**: Public can view published posts, authors can manage their own
- **Comments**: Public can view approved comments, users can manage their own
- **Likes/Follows**: Users can manage their own interactions
- **Categories/Tags**: Read-only for regular users

### 4. Sample Data

The schema includes sample categories and tags to get you started:

**Categories:**
- Technology
- Lifestyle 
- Travel
- Food
- Health

**Tags:**
- JavaScript, React, Node.js, TypeScript
- Web Development, Tutorial, Tips

### 5. Database Functions

The schema includes optimized PostgreSQL functions for:

- `increment_view_count(post_id)` - Safely increment post views
- `increment_like_count(target_id, target_type)` - Update like counts
- `decrement_like_count(target_id, target_type)` - Update like counts
- Auto-updating `updated_at` timestamps
- Auto-updating post/category counts

## Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Testing the Setup

1. Start your backend server: `npm run dev`
2. Check health endpoint: `GET http://localhost:8080/health/supabase`
3. Register a new user via API
4. The user profile will be automatically created in the `profiles` table

## Schema Updates

To update the schema:

1. Make changes to `schema.sql`
2. Run migrations in Supabase SQL Editor
3. Update TypeScript types in `src/types/database.ts` if needed

## Troubleshooting

### Common Issues:

1. **RLS Blocking Queries**: Make sure you're using the service role key for admin operations
2. **Function Errors**: Ensure all functions are created before adding triggers
3. **Permission Issues**: Check that your Supabase keys have the correct permissions

### Useful Queries:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- View sample data
SELECT * FROM categories;
SELECT * FROM tags;
```

## Advanced Configuration

### Custom Enums

The schema defines these PostgreSQL enums:
- `user_role`: 'user', 'admin', 'moderator'
- `post_status`: 'draft', 'published', 'archived'
- `comment_status`: 'pending', 'approved', 'rejected'
- `like_target_type`: 'post', 'comment'

### Indexes

The schema includes optimized indexes for:
- User lookups (email, role, status)
- Post queries (author, status, publish date, category, tags)
- Comment queries (post, author, status, parent)
- Social features (likes, follows)
- Search operations (GIN indexes for arrays)

### Performance Considerations

- Use `SELECT` with specific columns instead of `SELECT *`
- Leverage the database service layer for type-safe queries
- Use pagination for large result sets
- Consider adding more indexes based on your query patterns

## Monitoring

Monitor your database performance in the Supabase dashboard:

1. **Database** tab for table statistics
2. **Logs** tab for query performance
3. **Settings** tab for connection limits and extensions