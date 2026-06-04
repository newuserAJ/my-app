import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimiting';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

interface ConnectionEdge {
  user_a_id: string;
  user_b_id: string;
}

function buildAdjacency(connections: ConnectionEdge[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const conn of connections) {
    if (!map.has(conn.user_a_id)) map.set(conn.user_a_id, new Set());
    if (!map.has(conn.user_b_id)) map.set(conn.user_b_id, new Set());
    map.get(conn.user_a_id)!.add(conn.user_b_id);
    map.get(conn.user_b_id)!.add(conn.user_a_id);
  }
  return map;
}

function getMutualIds(
  adjacencyMap: Map<string, Set<string>>,
  sourceUserId: string,
  targetUserId: string
): string[] {
  const sourceConnections = adjacencyMap.get(sourceUserId) || new Set<string>();
  const targetConnections = adjacencyMap.get(targetUserId) || new Set<string>();
  return [...sourceConnections].filter((id) => targetConnections.has(id));
}

/**
 * GET /api/graph/network
 * Get the user's social network graph data
 * Returns nodes (users) and edges (connections) for visualization
 */
router.get('/network', generalRateLimit, async (req, res) => {
  try {
    const userId = req.user!.id;
    const depth = Math.min(parseInt(req.query.depth as string) || 3, 4);

    // Get current user
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, phone_number')
      .eq('id', userId)
      .single();

    if (userError || !currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get all connections for the user
    const { data: connections, error: connError } = await supabaseAdmin
      .from('user_connections')
      .select('user_a_id, user_b_id, connected_via_contacts, created_at')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

    if (connError) {
      throw connError;
    }

    // Build graph using BFS to determine depths
    const nodes = new Map();
    const edges = [];
    const visited = new Set<string>();
    const queue: [string, number][] = [[userId, 0]];

    nodes.set(userId, {
      id: userId,
      label: `${currentUser.first_name} ${currentUser.last_name}`,
      depth: 0,
      avatar: currentUser.avatar_url,
      isCurrentUser: true,
    });
    visited.add(userId);

    // Process connections
    const connectionMap = new Map<string, Set<string>>();
    for (const conn of connections || []) {
      const other = conn.user_a_id === userId ? conn.user_b_id : conn.user_a_id;
      if (!connectionMap.has(userId)) {
        connectionMap.set(userId, new Set());
      }
      connectionMap.get(userId)!.add(other);

      if (!connectionMap.has(other)) {
        connectionMap.set(other, new Set());
      }
      connectionMap.get(other)!.add(userId);

      edges.push({
        source: conn.user_a_id,
        target: conn.user_b_id,
        connected_via_contacts: conn.connected_via_contacts,
      });
    }

    // BFS to get all connected users up to specified depth
    const userIds = new Set<string>();
    userIds.add(userId);

    while (queue.length > 0) {
      const [currentId, currentDepth] = queue.shift()!;

      if (currentDepth >= depth) continue;

      const connected = connectionMap.get(currentId) || new Set();
      for (const nextId of connected) {
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push([nextId, currentDepth + 1]);
          userIds.add(nextId);
        }
      }
    }

    // Fetch profile data for all users in the graph
    const userArray = Array.from(userIds);
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, phone_number')
      .in('id', userArray);

    if (profileError) {
      throw profileError;
    }

    // Calculate depths using BFS
    const depthMap = new Map<string, number>();
    depthMap.set(userId, 0);
    const depthQueue: [string, number][] = [[userId, 0]];
    const depthVisited = new Set<string>();

    while (depthQueue.length > 0) {
      const [id, d] = depthQueue.shift()!;
      if (depthVisited.has(id)) continue;
      depthVisited.add(id);

      const neighbors = connectionMap.get(id) || new Set();
      for (const neighbor of neighbors) {
        if (!depthMap.has(neighbor) && d < depth) {
          depthMap.set(neighbor, d + 1);
          depthQueue.push([neighbor, d + 1]);
        }
      }
    }

    // Add profiles to nodes
    for (const profile of profiles || []) {
      if (profile.id !== userId) {
        nodes.set(profile.id, {
          id: profile.id,
          label: `${profile.first_name} ${profile.last_name}`,
          depth: depthMap.get(profile.id) || depth,
          avatar: profile.avatar_url,
          isCurrentUser: false,
        });
      }
    }

    // Filter edges to only include nodes in the graph
    const filteredEdges = edges.filter(
      edge => nodes.has(edge.source) && nodes.has(edge.target)
    );

    const response = {
      nodes: Array.from(nodes.values()),
      edges: filteredEdges,
      stats: {
        totalNodes: nodes.size,
        totalEdges: filteredEdges.length,
        depthReached: Math.max(...Array.from(depthMap.values()), 0),
        depthCounts: {
          depth0: Array.from(nodes.values()).filter(n => n.depth === 0).length,
          depth1: Array.from(nodes.values()).filter(n => n.depth === 1).length,
          depth2: Array.from(nodes.values()).filter(n => n.depth === 2).length,
          depth3: Array.from(nodes.values()).filter(n => n.depth === 3).length,
          depth4: Array.from(nodes.values()).filter(n => n.depth === 4).length,
        },
      },
    };

    logger.info('Graph network fetched:', {
      userId,
      nodes: response.nodes.length,
      edges: response.edges.length,
    });

    return res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Error fetching graph network:', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : error,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch graph network',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

/**
 * GET /api/graph/depth-analysis
 * Get depth analysis of the social network
 */
router.get('/depth-analysis', generalRateLimit, async (req, res) => {
  try {
    const userId = req.user!.id;

    const { data: connections, error: connError } = await supabaseAdmin
      .from('user_connections')
      .select('user_a_id, user_b_id')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

    if (connError) {
      throw connError;
    }

    // Build adjacency map
    const adjMap = new Map<string, Set<string>>();
    for (const conn of connections || []) {
      const a = conn.user_a_id;
      const b = conn.user_b_id;

      if (!adjMap.has(a)) adjMap.set(a, new Set());
      if (!adjMap.has(b)) adjMap.set(b, new Set());

      adjMap.get(a)!.add(b);
      adjMap.get(b)!.add(a);
    }

    // BFS to calculate depths
    const depthMap = new Map<string, number>();
    const queue: [string, number][] = [[userId, 0]];
    depthMap.set(userId, 0);

    while (queue.length > 0) {
      const [id, d] = queue.shift()!;
      const neighbors = adjMap.get(id) || new Set();

      for (const neighbor of neighbors) {
        if (!depthMap.has(neighbor)) {
          depthMap.set(neighbor, d + 1);
          if (d + 1 < 4) {
            queue.push([neighbor, d + 1]);
          }
        }
      }
    }

    // Count by depth
    const depthCounts = {
      0: 1,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
    };

    for (const [, depth] of depthMap) {
      if (depth in depthCounts) {
        depthCounts[depth as keyof typeof depthCounts]++;
      }
    }

    const analysis = {
      totalUsers: depthMap.size,
      directConnections: depthCounts[1],
      secondDegree: depthCounts[2],
      thirdDegree: depthCounts[3],
      fourthDegree: depthCounts[4],
      depthCounts,
      averageConnectionsPerUser: depthMap.size > 0 ? (connections || []).length * 2 / depthMap.size : 0,
    };

    logger.info('Depth analysis calculated:', { userId, analysis });

    return res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    logger.error('Error calculating depth analysis:', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : error,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to calculate depth analysis',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

/**
 * GET /api/graph/mutuals/:targetUserId
 * Get mutual connections between the authenticated user and target user
 */
router.get('/mutuals/:targetUserId', generalRateLimit, async (req, res) => {
  try {
    const sourceUserId = req.user!.id;
    const { targetUserId } = req.params;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId is required',
      });
    }

    if (sourceUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot fetch mutuals with yourself',
      });
    }

    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found',
      });
    }

    const { data: allConnections, error: connError } = await supabaseAdmin
      .from('user_connections')
      .select('user_a_id, user_b_id');

    if (connError) {
      throw connError;
    }

    const adjacencyMap = buildAdjacency((allConnections || []) as ConnectionEdge[]);
    const mutualIds = getMutualIds(adjacencyMap, sourceUserId, targetUserId);

    if (mutualIds.length === 0) {
      return res.json({
        success: true,
        data: {
          count: 0,
          mutuals: [],
        },
      });
    }

    const { data: mutualProfiles, error: mutualError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, full_name, avatar_url, location, company')
      .in('id', mutualIds.slice(0, limit))
      .eq('is_active', true);

    if (mutualError) {
      throw mutualError;
    }

    return res.json({
      success: true,
      data: {
        count: mutualIds.length,
        mutuals: mutualProfiles || [],
      },
    });
  } catch (error) {
    logger.error('Error fetching mutuals:', {
      userId: req.user?.id,
      targetUserId: req.params.targetUserId,
      error: error instanceof Error ? error.message : error,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch mutuals',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

/**
 * GET /api/graph/suggestions
 * Get people-you-may-know suggestions with mutual-based scoring
 */
router.get('/suggestions', generalRateLimit, async (req, res) => {
  try {
    const sourceUserId = req.user!.id;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);

    const [{ data: sourceProfile, error: sourceError }, { data: allConnections, error: connError }] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('id, interests, location, company, school, language')
        .eq('id', sourceUserId)
        .single(),
      supabaseAdmin
        .from('user_connections')
        .select('user_a_id, user_b_id'),
    ]);

    if (sourceError || !sourceProfile) {
      return res.status(404).json({
        success: false,
        message: 'Source user not found',
      });
    }

    if (connError) {
      throw connError;
    }

    const adjacencyMap = buildAdjacency((allConnections || []) as ConnectionEdge[]);
    const sourceDirect = adjacencyMap.get(sourceUserId) || new Set<string>();

    // Candidate pool: friends-of-friends (2nd degree), excluding self and direct connections.
    const candidates = new Set<string>();
    for (const directId of sourceDirect) {
      const secondHop = adjacencyMap.get(directId) || new Set<string>();
      for (const candidateId of secondHop) {
        if (candidateId !== sourceUserId && !sourceDirect.has(candidateId)) {
          candidates.add(candidateId);
        }
      }
    }

    if (candidates.size === 0) {
      return res.json({
        success: true,
        data: {
          suggestions: [],
          count: 0,
        },
      });
    }

    const candidateIds = [...candidates];
    const { data: candidateProfiles, error: candidatesError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, full_name, avatar_url, interests, location, company, school, language')
      .in('id', candidateIds)
      .eq('is_active', true);

    if (candidatesError) {
      throw candidatesError;
    }

    const sourceInterests = new Set(sourceProfile.interests || []);
    const ranked = (candidateProfiles || []).map((candidate) => {
      const mutualCount = getMutualIds(adjacencyMap, sourceUserId, candidate.id).length;
      const candidateInterests = new Set(candidate.interests || []);
      const commonInterests = [...sourceInterests].filter((interest) =>
        candidateInterests.has(interest)
      ).length;
      const sameLocation = sourceProfile.location && candidate.location && sourceProfile.location === candidate.location ? 1 : 0;
      const sameCompany = sourceProfile.company && candidate.company && sourceProfile.company === candidate.company ? 1 : 0;
      const sameSchool = sourceProfile.school && candidate.school && sourceProfile.school === candidate.school ? 1 : 0;
      const sameLanguage = sourceProfile.language && candidate.language && sourceProfile.language === candidate.language ? 1 : 0;

      // Mutuals-first score (Instagram/LinkedIn style):
      // mutuals dominate; profile affinity adds tie-break quality.
      const score =
        mutualCount * 100 +
        commonInterests * 20 +
        sameLocation * 25 +
        sameCompany * 20 +
        sameSchool * 15 +
        sameLanguage * 10;

      const reasons: string[] = [];
      if (mutualCount > 0) reasons.push(`${mutualCount} mutual connection${mutualCount > 1 ? 's' : ''}`);
      if (sameCompany) reasons.push('same company');
      if (sameSchool) reasons.push('same school');
      if (sameLocation) reasons.push('same location');
      if (commonInterests > 0) reasons.push(`${commonInterests} shared interest${commonInterests > 1 ? 's' : ''}`);

      return {
        user: {
          id: candidate.id,
          first_name: candidate.first_name,
          last_name: candidate.last_name,
          full_name: candidate.full_name,
          avatar_url: candidate.avatar_url,
          location: candidate.location,
          company: candidate.company,
          school: candidate.school,
        },
        mutualCount,
        score,
        reasons,
      };
    });

    const suggestions = ranked
      .sort((a, b) => b.score - a.score || b.mutualCount - a.mutualCount)
      .slice(0, limit);

    return res.json({
      success: true,
      data: {
        suggestions,
        count: suggestions.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching suggestions:', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : error,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestions',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

export default router;
