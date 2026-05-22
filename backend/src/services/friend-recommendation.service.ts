import { supabaseAdmin } from '../config/supabase';
import { BaseService } from './base.service';
import { Database } from '../types/database';
import { logger } from '../config/logger';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface RecommendationWeights {
  interestWeight: number;
  languageWeight: number;
  locationWeight: number;
  mutualWeight: number;
}

interface DepthScore {
  userId: string;
  depth: number;
  mutualFriendScore: number;
  interestScore: number;
  languageScore: number;
  locationScore: number;
  totalScore: number;
}

interface BFSResult {
  depth1: string[];
  depth2: string[];
  depth3: string[];
  depth4: string[];
}

export class FriendRecommendationService extends BaseService {
  private readonly DEFAULT_WEIGHTS: RecommendationWeights = {
    interestWeight: 5,
    languageWeight: 20,
    locationWeight: 30,
    mutualWeight: 80,
  };

  private readonly DEPTH_FACTORS = [4, 3, 2]; // For depth 2, 3, 4 respectively

  constructor() {
    super(supabaseAdmin, supabaseAdmin);
  }

  /**
   * Get friend recommendations for a user using BFS-based graph traversal
   */
  async getRecommendations(
    userId: string,
    numberOfSuggestions: number = 10,
    weights: Partial<RecommendationWeights> = {},
    useCache: boolean = true
  ): Promise<DepthScore[]> {
    try {
      const finalWeights = { ...this.DEFAULT_WEIGHTS, ...weights };
      
      // First, try to get cached recommendations if enabled
      if (useCache) {
        const cachedRecommendations = await this.getCachedRecommendations(userId, numberOfSuggestions);
        if (cachedRecommendations.length > 0) {
          logger.info('Returning cached recommendations:', { 
            userId, 
            count: cachedRecommendations.length 
          });
          return cachedRecommendations;
        }
      }

      // Clean up expired recommendations
      await this.cleanupExpiredRecommendations();
      
      // Get user connections graph using BFS
      const bfsResult = await this.performBFS(userId);
      
      // Calculate mutual friend scores
      const mutualScores = await this.calculateMutualFriendScores(
        userId, 
        bfsResult.depth1, 
        bfsResult.depth2
      );

      // Calculate interest scores
      const interestScores = await this.calculateInterestScores(
        userId,
        [...bfsResult.depth2, ...bfsResult.depth3, ...bfsResult.depth4]
      );

      // Calculate language scores
      const languageScores = await this.calculateLanguageScores(
        userId,
        [...bfsResult.depth2, ...bfsResult.depth3, ...bfsResult.depth4]
      );

      // Calculate location scores
      const locationScores = await this.calculateLocationScores(
        userId,
        [...bfsResult.depth2, ...bfsResult.depth3, ...bfsResult.depth4]
      );

      // Combine all scores
      const finalScores = this.combineScores(
        bfsResult,
        mutualScores,
        interestScores,
        languageScores,
        locationScores,
        finalWeights
      );

      // Sort and get top recommendations
      const topRecommendations = finalScores
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, numberOfSuggestions);

      // Cache the results for future use
      if (useCache && topRecommendations.length > 0) {
        await this.cacheRecommendations(userId, topRecommendations, finalWeights);
      }

      return topRecommendations;

    } catch (error) {
      logger.error('Error getting friend recommendations:', { userId, error });
      throw error;
    }
  }

  /**
   * Perform BFS traversal to get users at different depths
   */
  private async performBFS(sourceUserId: string): Promise<BFSResult> {
    try {
      // Get all connections for BFS traversal
      const { data: allConnections, error } = await this.adminDb!
        .from('user_connections')
        .select('user_a_id, user_b_id');

      if (error) {
        this.handleSupabaseError(error, 'Fetch connections for BFS');
      }

      // Build adjacency list
      const graph = new Map<string, Set<string>>();
      
      for (const connection of allConnections || []) {
        const { user_a_id, user_b_id } = connection;
        
        if (!graph.has(user_a_id)) graph.set(user_a_id, new Set());
        if (!graph.has(user_b_id)) graph.set(user_b_id, new Set());
        
        graph.get(user_a_id)!.add(user_b_id);
        graph.get(user_b_id)!.add(user_a_id);
      }

      // Perform BFS
      const visited = new Set<string>();
      const depth1 = new Set<string>();
      const depth2 = new Set<string>();
      const depth3 = new Set<string>();
      const depth4 = new Set<string>();

      const queue: Array<[string, number]> = [[sourceUserId, 0]];
      visited.add(sourceUserId);

      while (queue.length > 0) {
        const [currentUser, currentDepth] = queue.shift()!;

        if (currentDepth >= 4) continue;

        const neighbors = graph.get(currentUser) || new Set();
        
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            const newDepth = currentDepth + 1;
            
            if (newDepth === 1) depth1.add(neighbor);
            else if (newDepth === 2) depth2.add(neighbor);
            else if (newDepth === 3) depth3.add(neighbor);
            else if (newDepth === 4) depth4.add(neighbor);

            if (newDepth < 4) {
              queue.push([neighbor, newDepth]);
            }
          }
        }
      }

      return {
        depth1: Array.from(depth1),
        depth2: Array.from(depth2),
        depth3: Array.from(depth3),
        depth4: Array.from(depth4),
      };

    } catch (error) {
      logger.error('Error in BFS traversal:', { sourceUserId, error });
      throw error;
    }
  }

  /**
   * Calculate mutual friend scores for depth 2 users
   */
  private async calculateMutualFriendScores(
    sourceUserId: string,
    depth1Users: string[],
    depth2Users: string[]
  ): Promise<Map<string, number>> {
    const mutualScores = new Map<string, number>();

    if (depth1Users.length === 0 || depth2Users.length === 0) {
      return mutualScores;
    }

    try {
      // For each depth 2 user, find their direct connections (depth 1 from them)
      for (const depth2User of depth2Users) {
        const { data: connections, error } = await this.adminDb!
          .from('user_connections')
          .select('user_a_id, user_b_id')
          .or(`user_a_id.eq.${depth2User},user_b_id.eq.${depth2User}`);

        if (error) {
          logger.warn('Error fetching connections for mutual friend calculation:', { depth2User, error });
          mutualScores.set(depth2User, 0);
          continue;
        }

        // Get direct connections of depth2User
        const depth2UserConnections = new Set<string>();
        for (const conn of connections || []) {
          const otherUser = conn.user_a_id === depth2User ? conn.user_b_id : conn.user_a_id;
          depth2UserConnections.add(otherUser);
        }

        // Count mutual friends (intersection with source user's depth 1)
        let mutualCount = 0;
        for (const depth1User of depth1Users) {
          if (depth2UserConnections.has(depth1User)) {
            mutualCount++;
          }
        }

        mutualScores.set(depth2User, mutualCount);
      }

      return mutualScores;
    } catch (error) {
      logger.error('Error calculating mutual friend scores:', { sourceUserId, error });
      throw error;
    }
  }

  /**
   * Calculate interest similarity scores
   */
  private async calculateInterestScores(
    sourceUserId: string,
    targetUsers: string[]
  ): Promise<Map<string, number>> {
    const interestScores = new Map<string, number>();

    if (targetUsers.length === 0) {
      return interestScores;
    }

    try {
      // Get source user interests
      const { data: sourceProfile, error: sourceError } = await this.adminDb!
        .from('profiles')
        .select('interests')
        .eq('id', sourceUserId)
        .single();

      if (sourceError) {
        this.handleSupabaseError(sourceError, 'Fetch source user interests');
      }

      const sourceInterests = new Set(sourceProfile?.interests || []);

      // Get target users interests
      const { data: targetProfiles, error: targetError } = await this.adminDb!
        .from('profiles')
        .select('id, interests')
        .in('id', targetUsers);

      if (targetError) {
        this.handleSupabaseError(targetError, 'Fetch target users interests');
      }

      // Calculate interest intersection scores
      for (const profile of targetProfiles || []) {
        const targetInterests = new Set(profile.interests || []);
        const intersection = new Set([...sourceInterests].filter(x => targetInterests.has(x)));
        interestScores.set(profile.id, intersection.size);
      }

      // Set 0 score for users not found
      for (const userId of targetUsers) {
        if (!interestScores.has(userId)) {
          interestScores.set(userId, 0);
        }
      }

      return interestScores;
    } catch (error) {
      logger.error('Error calculating interest scores:', { sourceUserId, error });
      throw error;
    }
  }

  /**
   * Calculate language similarity scores
   */
  private async calculateLanguageScores(
    sourceUserId: string,
    targetUsers: string[]
  ): Promise<Map<string, number>> {
    const languageScores = new Map<string, number>();

    if (targetUsers.length === 0) {
      return languageScores;
    }

    try {
      // Get source user language
      const { data: sourceProfile, error: sourceError } = await this.adminDb!
        .from('profiles')
        .select('language')
        .eq('id', sourceUserId)
        .single();

      if (sourceError) {
        this.handleSupabaseError(sourceError, 'Fetch source user language');
      }

      const sourceLanguage = sourceProfile?.language?.toLowerCase().trim();

      if (!sourceLanguage) {
        // If source has no language, set all scores to 0
        for (const userId of targetUsers) {
          languageScores.set(userId, 0);
        }
        return languageScores;
      }

      // Get target users languages
      const { data: targetProfiles, error: targetError } = await this.adminDb!
        .from('profiles')
        .select('id, language')
        .in('id', targetUsers);

      if (targetError) {
        this.handleSupabaseError(targetError, 'Fetch target users languages');
      }

      // Calculate language match scores (1 for exact match, 0 for no match)
      for (const profile of targetProfiles || []) {
        const targetLanguage = profile.language?.toLowerCase().trim();
        const score = targetLanguage && targetLanguage === sourceLanguage ? 1 : 0;
        languageScores.set(profile.id, score);
      }

      // Set 0 score for users not found
      for (const userId of targetUsers) {
        if (!languageScores.has(userId)) {
          languageScores.set(userId, 0);
        }
      }

      return languageScores;
    } catch (error) {
      logger.error('Error calculating language scores:', { sourceUserId, error });
      throw error;
    }
  }

  /**
   * Calculate location similarity scores
   */
  private async calculateLocationScores(
    sourceUserId: string,
    targetUsers: string[]
  ): Promise<Map<string, number>> {
    const locationScores = new Map<string, number>();

    if (targetUsers.length === 0) {
      return locationScores;
    }

    try {
      // Get source user location
      const { data: sourceProfile, error: sourceError } = await this.adminDb!
        .from('profiles')
        .select('location')
        .eq('id', sourceUserId)
        .single();

      if (sourceError) {
        this.handleSupabaseError(sourceError, 'Fetch source user location');
      }

      const sourceLocation = sourceProfile?.location?.toLowerCase().trim();

      if (!sourceLocation) {
        // If source has no location, set all scores to 0
        for (const userId of targetUsers) {
          locationScores.set(userId, 0);
        }
        return locationScores;
      }

      // Get target users locations
      const { data: targetProfiles, error: targetError } = await this.adminDb!
        .from('profiles')
        .select('id, location')
        .in('id', targetUsers);

      if (targetError) {
        this.handleSupabaseError(targetError, 'Fetch target users locations');
      }

      // Calculate location match scores (1 for exact match, 0 for no match)
      for (const profile of targetProfiles || []) {
        const targetLocation = profile.location?.toLowerCase().trim();
        const score = targetLocation && targetLocation === sourceLocation ? 1 : 0;
        locationScores.set(profile.id, score);
      }

      // Set 0 score for users not found
      for (const userId of targetUsers) {
        if (!locationScores.has(userId)) {
          locationScores.set(userId, 0);
        }
      }

      return locationScores;
    } catch (error) {
      logger.error('Error calculating location scores:', { sourceUserId, error });
      throw error;
    }
  }

  /**
   * Combine all scores using the formula from the original algorithm
   */
  private combineScores(
    bfsResult: BFSResult,
    mutualScores: Map<string, number>,
    interestScores: Map<string, number>,
    languageScores: Map<string, number>,
    locationScores: Map<string, number>,
    weights: RecommendationWeights
  ): DepthScore[] {
    const finalScores: DepthScore[] = [];
    
    // Get all potential recommendation users (depth 2, 3, 4)
    const allCandidates = [
      ...bfsResult.depth2,
      ...bfsResult.depth3,
      ...bfsResult.depth4,
    ];

    for (const userId of allCandidates) {
      const mutualScore = mutualScores.get(userId) || 0;
      const interestScore = interestScores.get(userId) || 0;
      const languageScore = languageScores.get(userId) || 0;
      const locationScore = locationScores.get(userId) || 0;

      // Determine depth factor
      let depthFactor = 1;
      if (bfsResult.depth2.includes(userId)) {
        depthFactor = this.DEPTH_FACTORS[0]; // 4
      } else if (bfsResult.depth3.includes(userId)) {
        depthFactor = this.DEPTH_FACTORS[1]; // 3
      } else if (bfsResult.depth4.includes(userId)) {
        depthFactor = this.DEPTH_FACTORS[2]; // 2
      }

      // Calculate total score using the original formula:
      // Suggestion Score = Mutual Friends score + ((Interest + Language + Location Scores) * Depth Factor)
      let totalScore = 0;
      
      // First add weighted scores for interest, language, location
      totalScore += weights.interestWeight * interestScore;
      totalScore += weights.languageWeight * languageScore;
      totalScore += weights.locationWeight * locationScore;
      
      // Apply depth factor
      totalScore *= depthFactor;
      
      // Add mutual friend score (not affected by depth factor in original algorithm)
      totalScore += weights.mutualWeight * mutualScore;

      const depth = bfsResult.depth2.includes(userId) ? 2 :
                   bfsResult.depth3.includes(userId) ? 3 : 4;

      finalScores.push({
        userId,
        depth,
        mutualFriendScore: mutualScore,
        interestScore,
        languageScore,
        locationScore,
        totalScore,
      });
    }

    return finalScores;
  }

  /**
   * Get recommended users with full profile information
   */
  async getRecommendationsWithProfiles(
    userId: string,
    numberOfSuggestions: number = 10,
    weights: Partial<RecommendationWeights> = {}
  ): Promise<Array<DepthScore & { profile: Profile }>> {
    try {
      const recommendations = await this.getRecommendations(userId, numberOfSuggestions, weights);
      
      if (recommendations.length === 0) {
        return [];
      }

      const userIds = recommendations.map(r => r.userId);
      
      // Fetch full profiles
      const { data: profiles, error } = await this.adminDb!
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (error) {
        this.handleSupabaseError(error, 'Fetch recommended user profiles');
      }

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return recommendations
        .map(rec => ({
          ...rec,
          profile: profileMap.get(rec.userId)!
        }))
        .filter(rec => rec.profile); // Filter out any missing profiles

    } catch (error) {
      logger.error('Error getting recommendations with profiles:', { userId, error });
      throw error;
    }
  }

  /**
   * Get cached recommendations from database
   */
  private async getCachedRecommendations(
    userId: string, 
    limit: number
  ): Promise<DepthScore[]> {
    try {
      const { data, error } = await this.adminDb!
        .rpc('get_cached_recommendations', {
          input_user_id: userId,
          recommendation_limit: limit
        });

      if (error) {
        logger.warn('Error fetching cached recommendations:', { userId, error });
        return [];
      }

      return (data || []).map((row: any) => ({
        userId: row.recommended_user_id,
        depth: row.depth,
        mutualFriendScore: row.mutual_friend_score,
        interestScore: row.interest_score,
        languageScore: row.language_score,
        locationScore: row.location_score,
        totalScore: parseFloat(row.total_score),
      }));

    } catch (error) {
      logger.warn('Error in getCachedRecommendations:', { userId, error });
      return [];
    }
  }

  /**
   * Cache recommendations in database
   */
  private async cacheRecommendations(
    userId: string,
    recommendations: DepthScore[],
    weights: RecommendationWeights
  ): Promise<void> {
    try {
      // First, remove existing recommendations for this user
      await this.adminDb!
        .from('friend_recommendations')
        .delete()
        .eq('user_id', userId);

      // Prepare recommendation records for insertion
      const recommendationRecords = recommendations.map(rec => ({
        user_id: userId,
        recommended_user_id: rec.userId,
        depth: rec.depth,
        mutual_friend_score: rec.mutualFriendScore,
        interest_score: rec.interestScore,
        language_score: rec.languageScore,
        location_score: rec.locationScore,
        total_score: rec.totalScore,
        calculation_weights: weights,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      }));

      // Insert new recommendations
      const { error } = await this.adminDb!
        .from('friend_recommendations')
        .insert(recommendationRecords);

      if (error) {
        logger.warn('Error caching recommendations:', { userId, error });
      } else {
        logger.info('Recommendations cached successfully:', { 
          userId, 
          count: recommendationRecords.length 
        });
      }

    } catch (error) {
      logger.warn('Error in cacheRecommendations:', { userId, error });
    }
  }

  /**
   * Clean up expired recommendations
   */
  private async cleanupExpiredRecommendations(): Promise<void> {
    try {
      const { data, error } = await this.adminDb!
        .rpc('cleanup_expired_recommendations');

      if (error) {
        logger.warn('Error cleaning up expired recommendations:', error);
      } else {
        logger.info('Cleaned up expired recommendations:', { count: data });
      }

    } catch (error) {
      logger.warn('Error in cleanupExpiredRecommendations:', error);
    }
  }

  /**
   * Accept a friend recommendation
   */
  async acceptRecommendation(userId: string, recommendedUserId: string): Promise<void> {
    try {
      // Mark recommendation as accepted
      await this.adminDb!
        .from('friend_recommendations')
        .update({
          is_accepted: true,
          accepted_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('recommended_user_id', recommendedUserId);

      // Create the connection
      await this.createConnection(userId, recommendedUserId);

      logger.info('Friend recommendation accepted:', { userId, recommendedUserId });
    } catch (error) {
      logger.error('Error accepting recommendation:', { userId, recommendedUserId, error });
      throw error;
    }
  }

  /**
   * Dismiss a friend recommendation
   */
  async dismissRecommendation(userId: string, recommendedUserId: string): Promise<void> {
    try {
      await this.adminDb!
        .from('friend_recommendations')
        .update({
          is_dismissed: true,
          dismissed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('recommended_user_id', recommendedUserId);

      logger.info('Friend recommendation dismissed:', { userId, recommendedUserId });
    } catch (error) {
      logger.error('Error dismissing recommendation:', { userId, recommendedUserId, error });
      throw error;
    }
  }

  /**
   * Get connection details between two users
   */
  async getConnectionDetails(userAId: string, userBId: string): Promise<{
    isConnected: boolean;
    connectionType: 'contacts' | 'recommendation' | null;
    connectedAt: string | null;
  }> {
    try {
      // Ensure consistent ordering (smaller ID first)
      const minUserId = userAId < userBId ? userAId : userBId;
      const maxUserId = userAId > userBId ? userAId : userBId;

      const { data: connectionData, error } = await this.adminDb!
        .from('user_connections')
        .select('connected_via_contacts, created_at')
        .eq('user_a_id', minUserId)
        .eq('user_b_id', maxUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.warn('Error fetching connection details:', { userAId, userBId, error });
        return { isConnected: false, connectionType: null, connectedAt: null };
      }

      if (connectionData) {
        return {
          isConnected: true,
          connectionType: connectionData.connected_via_contacts ? 'contacts' : 'recommendation',
          connectedAt: connectionData.created_at,
        };
      }

      return { isConnected: false, connectionType: null, connectedAt: null };
    } catch (error) {
      logger.error('Error in getConnectionDetails:', { userAId, userBId, error });
      return { isConnected: false, connectionType: null, connectedAt: null };
    }
  }

  /**
   * Create a connection between two users (for accepting recommendations)
   */
  async createConnection(userAId: string, userBId: string): Promise<void> {
    try {
      // Ensure consistent ordering (smaller ID first)
      const minUserId = userAId < userBId ? userAId : userBId;
      const maxUserId = userAId > userBId ? userAId : userBId;

      // Check if connection already exists
      const { data: existingConnection, error: checkError } = await this.adminDb!
        .from('user_connections')
        .select('id')
        .eq('user_a_id', minUserId)
        .eq('user_b_id', maxUserId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        this.handleSupabaseError(checkError, 'Check existing connection');
      }

      if (existingConnection) {
        logger.info('Connection already exists:', { userAId, userBId });
        return;
      }

      // Create new connection
      const { error } = await this.adminDb!
        .from('user_connections')
        .insert({
          user_a_id: minUserId,
          user_b_id: maxUserId,
          connected_via_contacts: false, // This is a friend recommendation connection
        });

      if (error) {
        this.handleSupabaseError(error, 'Create connection');
      }

      logger.info('Friend recommendation connection created:', { userAId, userBId });
    } catch (error) {
      logger.error('Error creating connection:', { userAId, userBId, error });
      throw error;
    }
  }
}

// Export singleton instance
export const friendRecommendationService = new FriendRecommendationService();