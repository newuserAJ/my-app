import { z } from 'zod';

// Friend recommendation request query schema
export const friendRecommendationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  interestWeight: z.coerce.number().min(0).max(100).default(5).optional(),
  languageWeight: z.coerce.number().min(0).max(100).default(20).optional(),
  locationWeight: z.coerce.number().min(0).max(100).default(30).optional(),
  mutualWeight: z.coerce.number().min(0).max(100).default(80).optional(),
});

// Connection creation request schema
export const createConnectionSchema = z.object({
  targetUserId: z.string().uuid('Invalid target user ID'),
});

// Friend recommendation response type
export const friendRecommendationResponseSchema = z.object({
  userId: z.string().uuid(),
  depth: z.number().min(1).max(4),
  mutualFriendScore: z.number().min(0),
  interestScore: z.number().min(0),
  languageScore: z.number().min(0),
  locationScore: z.number().min(0),
  totalScore: z.number().min(0),
  profile: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    phone_number: z.string().nullable(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    full_name: z.string().nullable(),
    avatar_url: z.string().nullable(),
    bio: z.string().nullable(),
    date_of_birth: z.string().nullable(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable(),
    location: z.string().nullable(),
    language: z.string().nullable(),
    occupation: z.string().nullable(),
    school: z.string().nullable(),
    company: z.string().nullable(),
    interests: z.array(z.string()).default([]),
    age: z.number().nullable(),
    website: z.string().nullable(),
    is_verified: z.boolean().default(false),
    is_active: z.boolean().default(true),
    created_at: z.string(),
    updated_at: z.string(),
  }),
});

// Bulk recommendation request schema (for getting recommendations for all users)
export const bulkRecommendationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(5),
  interestWeight: z.coerce.number().min(0).max(100).default(5).optional(),
  languageWeight: z.coerce.number().min(0).max(100).default(20).optional(),
  locationWeight: z.coerce.number().min(0).max(100).default(30).optional(),
  mutualWeight: z.coerce.number().min(0).max(100).default(80).optional(),
  userIds: z.array(z.string().uuid()).max(100).optional(), // Limit to specific users
});

// Connection status response schema
export const connectionStatusResponseSchema = z.object({
  isConnected: z.boolean(),
  connectionType: z.enum(['contacts', 'recommendation', 'mutual_follow']).nullable(),
  connectedAt: z.string().nullable(),
});

// Mutual friends response schema
export const mutualFriendsResponseSchema = z.object({
  mutualFriends: z.array(z.object({
    id: z.string().uuid(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    full_name: z.string().nullable(),
    avatar_url: z.string().nullable(),
  })),
  count: z.number().min(0),
});

// Recommendation stats response schema
export const recommendationStatsResponseSchema = z.object({
  totalPotentialConnections: z.number().min(0),
  depth2Count: z.number().min(0),
  depth3Count: z.number().min(0),
  depth4Count: z.number().min(0),
  averageScore: z.number().min(0),
  topScoreRanges: z.object({
    high: z.number().min(0), // Score threshold for high recommendations
    medium: z.number().min(0), // Score threshold for medium recommendations
    low: z.number().min(0), // Score threshold for low recommendations
  }),
});

// Export type definitions
export type FriendRecommendationQuery = z.infer<typeof friendRecommendationQuerySchema>;
export type CreateConnectionRequest = z.infer<typeof createConnectionSchema>;
export type FriendRecommendationResponse = z.infer<typeof friendRecommendationResponseSchema>;
export type BulkRecommendationQuery = z.infer<typeof bulkRecommendationQuerySchema>;
export type ConnectionStatusResponse = z.infer<typeof connectionStatusResponseSchema>;
export type MutualFriendsResponse = z.infer<typeof mutualFriendsResponseSchema>;
export type RecommendationStatsResponse = z.infer<typeof recommendationStatsResponseSchema>;