import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimiting';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

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

export default router;
