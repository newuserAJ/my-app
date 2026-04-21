# My App Backend

A robust Node.js/Express.js backend API with TypeScript, Supabase integration, comprehensive error handling, and data validation.

## 🚀 Features

- **TypeScript** - Full type safety and modern JavaScript features
- **Express.js** - Fast, unopinionated web framework
- **Supabase Integration** - Authentication and database management
- **Comprehensive Error Handling** - Structured error responses with logging
- **Data Validation** - Input validation and sanitization using Zod
- **Security** - Helmet, CORS, rate limiting, and request sanitization
- **Logging** - Structured logging with Winston
- **Authentication** - JWT-based auth with multiple middleware options
- **Code Quality** - ESLint, Prettier, and TypeScript strict mode

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Supabase project with database and auth configured

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure your `.env` file:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Server Configuration
PORT=8080
NODE_ENV=development

# JWT Configuration (if using custom JWT)
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🏃‍♂️ Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Other Commands
```bash
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run format        # Format with Prettier
npm run type-check    # TypeScript type checking
npm test              # Run tests (when implemented)
```

## 📁 Project Structure

```
src/
├── config/          # Configuration files
│   ├── logger.ts    # Winston logger configuration
│   ├── supabase.ts  # Supabase client configuration
│   └── security.ts  # Security configuration constants
├── lib/             # Core business logic
│   └── database.ts  # Database service layer with typed queries
├── middleware/      # Express middleware
│   ├── auth.ts      # Authentication middleware (multiple strategies)
│   ├── errorHandler.ts # Comprehensive error handling
│   ├── rateLimiting.ts # Advanced rate limiting strategies
│   └── security.ts  # Security middleware collection
├── routes/          # API routes
│   ├── auth.ts      # Authentication & user management
│   ├── posts.ts     # Blog posts/content management
│   ├── comments.ts  # Comment system with threading
│   ├── users.ts     # User profiles & social features
│   ├── categories.ts # Content categorization
│   └── tags.ts      # Tagging system
├── types/           # TypeScript type definitions
│   ├── errors.ts    # Error classes and types
│   └── database.ts  # Full database schema types
├── utils/           # Utility functions
│   └── validation.ts # Zod validation schemas and sanitization
└── index.ts         # Main application file with security
database/
└── schema.sql       # Complete PostgreSQL schema with RLS
```

## 🛡️ API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration with validation
- `POST /login` - User login with rate limiting
- `POST /logout` - User logout
- `POST /refresh` - Refresh access token
- `POST /forgot-password` - Request password reset (rate limited)
- `POST /reset-password` - Reset password (rate limited)

### Users (`/api/users`)
- `GET /me` - Get current user profile
- `PUT /me` - Update current user profile
- `DELETE /me` - Delete user account
- `GET /search` - Search users by name/email
- `GET /:id` - Get user profile by ID
- `GET /:id/posts` - Get user's posts
- `POST /:id/follow` - Follow/unfollow user
- `GET /:id/followers` - Get user's followers
- `GET /:id/following` - Get users followed by user
- `GET /:id/stats` - Get user statistics

### Posts (`/api/posts`)
- `GET /` - Get all published posts (with filters)
- `GET /:id` - Get post by ID
- `GET /slug/:slug` - Get post by slug
- `POST /` - Create new post (authenticated)
- `PUT /:id` - Update post (owner only)
- `DELETE /:id` - Delete post (owner only)
- `POST /:id/like` - Toggle post like
- `GET /author/:authorId` - Get posts by author

### Comments (`/api/comments`)
- `GET /post/:postId` - Get comments for a post
- `GET /:id` - Get single comment
- `POST /` - Create new comment (authenticated)
- `PUT /:id` - Update comment (owner only)
- `DELETE /:id` - Delete comment (owner only)
- `POST /:id/like` - Toggle comment like
- `GET /:id/replies` - Get comment replies

### Categories (`/api/categories`)
- `GET /` - Get all active categories
- `GET /:slug` - Get category by slug
- `GET /:slug/posts` - Get posts in category

### Tags (`/api/tags`)
- `GET /` - Get all tags
- `GET /featured` - Get featured tags
- `GET /search` - Search tags

### Health Checks
- `GET /health` - Basic server health check
- `GET /health/supabase` - Supabase connection health check

## 🔒 Authentication

The API uses Supabase authentication with JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Authentication Middleware Options:
- `requireAuth` - Requires valid authentication
- `optionalAuth` - Optional authentication (doesn't fail if no token)
- `requireAdmin` - Requires admin role
- `requireRole(role)` - Requires specific role
- `requireOwnership(userIdPath)` - Requires resource ownership

## ✅ Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {},
    "requestId": "unique-request-id"
  }
}
```

### Error Codes:
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access forbidden
- `VALIDATION_ERROR` - Input validation failed
- `RECORD_NOT_FOUND` - Resource not found
- `INTERNAL_SERVER_ERROR` - Server error
- And more...

## 📊 Logging

The application uses Winston for structured logging:

- **Development**: Console output with colors
- **Production**: File-based logging in `logs/` directory
  - `error.log` - Error level logs
  - `combined.log` - All logs

## 🛡️ Advanced Security Features

### Multi-Layer Security
- **Helmet** - Comprehensive security headers
- **CORS** - Configurable cross-origin resource sharing
- **Content Security Policy** - XSS protection
- **Request Sanitization** - Input cleaning and validation
- **Suspicious Request Detection** - Malicious pattern detection
- **User Agent Validation** - Bot and crawler detection

### Advanced Rate Limiting
- **General Rate Limiting** - 100 requests per 15 minutes
- **Auth Rate Limiting** - 5 login attempts per 15 minutes
- **Content Creation Limits** - 10 posts/comments per minute
- **Password Reset Limits** - 3 attempts per hour
- **Dynamic Rate Limiting** - Role-based limits (admin/user)
- **Sliding Window Algorithm** - More sophisticated limiting

### Security Middleware
- **IP Whitelisting** - Restrict access by IP address
- **Request Size Limits** - Prevent DoS via large payloads
- **Method Restrictions** - Allow only specified HTTP methods
- **API Versioning Enforcement** - Version compatibility checks
- **Security Logging** - Detailed security event logging
- **Honeypot Traps** - Detect and log malicious bots

## 📝 Data Validation

Uses Zod for runtime type checking and validation:

- Request body validation
- Query parameter validation
- Route parameter validation
- Automatic sanitization

## 🗄️ Database Schema

Comprehensive PostgreSQL schema with:

### Core Tables
- **profiles** - Extended user profiles with metadata
- **posts** - Blog posts with SEO, categorization, and analytics
- **comments** - Threaded comment system with moderation
- **likes** - Polymorphic likes for posts and comments
- **follows** - Social following system
- **categories** - Hierarchical content categorization
- **tags** - Flexible tagging system

### Advanced Features
- **Row Level Security (RLS)** - Database-level access control
- **Database Functions** - Performance optimized operations
- **Automatic Triggers** - Count updates and timestamp management
- **Comprehensive Indexing** - Optimized query performance
- **Generated Columns** - Computed full names and derived data

## 🧪 Business Logic Features

### Content Management System
- **Draft/Published Workflow** - Content lifecycle management
- **SEO Optimization** - Title, description, and slug management
- **View Tracking** - Automatic view count increments
- **Featured Content** - Highlight important posts
- **Rich Categorization** - Categories with hierarchies and colors

### Social Features
- **User Profiles** - Comprehensive user information
- **Following System** - Social connections between users
- **Like System** - Engagement tracking for posts and comments
- **Comment Threading** - Nested comment conversations
- **User Search** - Find users by name and email

### Content Discovery
- **Full-Text Search** - Search posts by title, content, and excerpt
- **Category Filtering** - Browse content by category
- **Tag-Based Discovery** - Find content by tags
- **Author Pages** - View all posts by specific authors
- **Pagination** - Efficient data loading with limits and offsets

## 🚀 What's Next?

The backend is now production-ready! Next steps:

1. **✅ Database Schema** - Complete PostgreSQL schema implemented
2. **✅ Business Logic APIs** - Full REST API with social features
3. **File Upload** - Add image/file upload capabilities
4. **Email Services** - Integrate email notifications
5. **Testing** - Add unit and integration tests
6. **API Documentation** - Add Swagger/OpenAPI docs
7. **Real-time Features** - WebSocket for live comments/notifications
8. **Search Enhancement** - Add Elasticsearch for advanced search
9. **Caching Layer** - Redis for performance optimization
10. **Deployment** - Docker containers and CI/CD pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.