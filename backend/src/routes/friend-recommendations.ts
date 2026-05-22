import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { generalRateLimit, authRateLimit } from '../middleware/rateLimiting';
import { friendRecommendationService } from '../services/friend-recommendation.service';
import { ContactsService } from '../services/contacts.service';
import {
  friendRecommendationQuerySchema,
  createConnectionSchema,
} from '../schemas/friend-recommendation.schemas';
import { logger } from '../config/logger';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

/**
 * GET /api/friend-recommendations
 * Get friend recommendations for the authenticated user
 */
router.get('/', generalRateLimit, async (req, res) => {
  try {
    const userId = req.user!.id;
    const query = friendRecommendationQuerySchema.parse(req.query);

    const recommendations = await friendRecommendationService.getRecommendationsWithProfiles(
      userId,
      query.limit,
      {
        ...(query.interestWeight !== undefined && { interestWeight: query.interestWeight }),
        ...(query.languageWeight !== undefined && { languageWeight: query.languageWeight }),
        ...(query.locationWeight !== undefined && { locationWeight: query.locationWeight }),
        ...(query.mutualWeight !== undefined && { mutualWeight: query.mutualWeight }),
      }
    );

    logger.info('Friend recommendations fetched:', {
      userId,
      count: recommendations.length,
      limit: query.limit,
    });

    return res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
        weights: {
          interestWeight: query.interestWeight || 5,
          languageWeight: query.languageWeight || 20,
          locationWeight: query.locationWeight || 30,
          mutualWeight: query.mutualWeight || 80,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching friend recommendations:', { 
      userId: req.user?.id, 
      error: error instanceof Error ? error.message : error 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch friend recommendations',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

/**
 * POST /api/friend-recommendations/connect
 * Create a connection with a recommended user
 */
router.post('/connect', generalRateLimit, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { targetUserId } = createConnectionSchema.parse(req.body);

    // Prevent self-connection
    if (userId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot connect to yourself',
      });
    }

    await friendRecommendationService.createConnection(userId, targetUserId);

    logger.info('Friend recommendation connection created:', {
      sourceUserId: userId,
      targetUserId,
    });

    return res.json({
      success: true,
      message: 'Connection created successfully',
    });
  } catch (error) {
    logger.error('Error creating friend recommendation connection:', {
      userId: req.user?.id,
      body: req.body,
      error: error instanceof Error ? error.message : error,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to create connection',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

/**
 * GET /api/friend-recommendations/stats
 * Get recommendation statistics for the authenticated user
 */
router.get('/stats', generalRateLimit, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get basic recommendations to calculate stats
    const recommendations = await friendRecommendationService.getRecommendations(userId, 100);
    
    const depth2Count = recommendations.filter(r => r.depth === 2).length;
    const depth3Count = recommendations.filter(r => r.depth === 3).length;
    const depth4Count = recommendations.filter(r => r.depth === 4).length;
    
    const scores = recommendations.map(r => r.totalScore);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    // Calculate score thresholds
    const sortedScores = scores.sort((a, b) => b - a);
    const highThreshold = sortedScores[Math.floor(sortedScores.length * 0.2)] || 0;
    const mediumThreshold = sortedScores[Math.floor(sortedScores.length * 0.5)] || 0;
    const lowThreshold = sortedScores[Math.floor(sortedScores.length * 0.8)] || 0;

    const stats = {
      totalPotentialConnections: recommendations.length,
      depth2Count,
      depth3Count,
      depth4Count,
      averageScore,
      topScoreRanges: {
        high: highThreshold,
        medium: mediumThreshold,
        low: lowThreshold,
      },
    };

    logger.info('Friend recommendation stats calculated:', { userId, stats });

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error calculating recommendation stats:', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : error,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to calculate recommendation stats',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

/**
 * GET /api/friend-recommendations/mutual/:targetUserId
 * Get mutual friends with a specific user
 */
router.get('/mutual/:targetUserId', generalRateLimit, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { targetUserId } = req.params;

    // Validate target user ID
    if (!targetUserId || targetUserId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target user ID',
      });
    }

    // Get connections for both users
    const [sourceConnections, targetConnections] = await Promise.all([
      ContactsService.getUserConnections(userId),
      ContactsService.getUserConnections(targetUserId),
    ]);

    // Find mutual connections
    const mutualConnectionIds = sourceConnections.filter(id => 
      targetConnections.includes(id)
    );

    // Get profile information for mutual friends
    const mutualFriends = await ContactsService.getConnectedUsers(userId);
    const filteredMutualFriends = mutualFriends.filter(friend => 
      mutualConnectionIds.includes(friend.id)
    );

    const response = {
      mutualFriends: filteredMutualFriends.map(friend => ({
        id: friend.id,
        first_name: friend.first_name,
        last_name: friend.last_name,
        full_name: friend.full_name,
        avatar_url: friend.avatar_url,
      })),
      count: filteredMutualFriends.length,
    };

    logger.info('Mutual friends fetched:', {
      userId,
      targetUserId,
      mutualCount: response.count,
    });

    return res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Error fetching mutual friends:', {
      userId: req.user?.id,
      targetUserId: req.params.targetUserId,
      error: error instanceof Error ? error.message : error,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch mutual friends',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

/**
 * GET /api/friend-recommendations/connection-status/:targetUserId
 * Check connection status with a specific user
 */
router.get('/connection-status/:targetUserId', generalRateLimit, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { targetUserId } = req.params;

    if (!targetUserId || targetUserId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target user ID',
      });
    }

    // Get connection details
    const connectionDetails = await friendRecommendationService.getConnectionDetails(userId, targetUserId);

    const response = connectionDetails;

    return res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Error checking connection status:', {
      userId: req.user?.id,
      targetUserId: req.params.targetUserId,
      error: error instanceof Error ? error.message : error,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to check connection status',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

/**
 * POST /api/friend-recommendations/accept
 * Accept a friend recommendation
 */
router.post('/accept', generalRateLimit, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { targetUserId } = createConnectionSchema.parse(req.body);

    if (userId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot accept recommendation for yourself',
      });
    }

    await friendRecommendationService.acceptRecommendation(userId, targetUserId);

    logger.info('Friend recommendation accepted:', {
      userId,
      targetUserId,
    });

    return res.json({
      success: true,
      message: 'Friend recommendation accepted successfully',
    });
  } catch (error) {
    logger.error('Error accepting friend recommendation:', {
      userId: req.user?.id,
      body: req.body,
      error: error instanceof Error ? error.message : error,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to accept friend recommendation',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

/**
 * POST /api/friend-recommendations/dismiss
 * Dismiss a friend recommendation
 */
router.post('/dismiss', generalRateLimit, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { targetUserId } = createConnectionSchema.parse(req.body);

    if (userId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot dismiss recommendation for yourself',
      });
    }

    await friendRecommendationService.dismissRecommendation(userId, targetUserId);

    logger.info('Friend recommendation dismissed:', {
      userId,
      targetUserId,
    });

    return res.json({
      success: true,
      message: 'Friend recommendation dismissed successfully',
    });
  } catch (error) {
    logger.error('Error dismissing friend recommendation:', {
      userId: req.user?.id,
      body: req.body,
      error: error instanceof Error ? error.message : error,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to dismiss friend recommendation',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

/**
 * POST /api/friend-recommendations/bulk
 * Get recommendations for multiple users (admin/batch processing)
 */
router.post('/bulk', authRateLimit, async (req, res) => {
  try {
    // This is a more resource-intensive operation, so we might want to restrict it
    // const query = bulkRecommendationQuerySchema.parse(req.body);
    
    // For now, limit this to admin users or specific use cases
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions for bulk recommendations',
      });
    }

    // Implementation for bulk recommendations would go here
    // This could be useful for analytics or batch processing
    
    return res.json({
      success: true,
      message: 'Bulk recommendation processing started',
      data: {
        message: 'Feature not yet implemented - contact admin',
      },
    });
  } catch (error) {
    logger.error('Error processing bulk recommendations:', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : error,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to process bulk recommendations',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

export default router;